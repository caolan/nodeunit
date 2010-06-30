nodeunit
========

If you're looking for a full-featured and descriptive specification framework
you might want to checkout a project like the excellent
[jspec](http://github.com/visionmedia/jspec). If, like me, you just want to
dive into writing some code and don't want to learn an extensive framework
before writing tests, then nodeunit could be for you.

nodeunit offers easy unit testing based on a simplified version of the
[QUnit](http://docs.jquery.com/QUnit) API. However, unlike QUnit, it assumes
all your tests are asynchronous, and plays nicely with the existing module
system. Because of these assumptions, the already minimal API offered by QUnit
can be further reduced.

__nodeunit is available as an npm package:__

    npm install nodeunit


Usage
-----

Here is an example unit test module:

    exports.testSomething = function(test){
        test.expect(1);
        test.ok(true, "this assertion should pass");
        test.done();
    };

    exports.testSomethingElse = function(test){
        test.ok(false, "this assertion should fail");
        test.done();
    };

When run using the included testrunner, this will output the following:

<img src="http://github.com/caolan/nodeunit/raw/master/img/example_fail.png" />


API Documentation
-----------------

* __expect(amount)__ - Specify how many assertions are expected to run within a
  test.
* __ok(state, message)__ - A boolean assertion, equivalent to [assert.ok](http://nodejs.org/api.html#_assert_module)
* __equals(actual, expected, message)__ - A comparison assertion, equivalent
  to [assert.equal](http://nodejs.org/api.html#_assert_module)
* __same(actual, expected, message)__ - A deep recursive comparison, equivalent
  to [assert.deepEquals](http://nodejs.org/api.html#_assert_module)
* __done()__ - Finish this test function, and move on to the next. ALL tests
  should call this!

These 5 functions are all you need to know!


nodeunit aims to be simple and easy to learn. This is achieved through using
existing structures (such as node.js modules) to maximum effect, and reducing
the API where possible, to make it easier to digest.

Tests are simply exported from a module, but they are still run in the order
they are defined. The module() call from QUnit can be omitted, since it is
inside a module file, and we can refer to it by filename.


Asynchronous Testing
--------------------

When testing asynchronous code, there are a number of sharp edges to watch out
for. Thankfully, nodeunit is designed to help you avoid as many of these
pitfalls as possible. For the most part, testing asynchronous code in nodeunit
_just works_.


### Tests run in series

While running tests in parallel seems like a good idea for speeding up your
test suite, in practice I've found it means writing much more complicated
tests. Because of node's module cache, running tests in parallel means mocking
and stubbing is pretty much impossible. One of the nicest things about testing
in javascript is the ease of doing stubs:

    var _readFile = fs.readFile;
    fs.readFile = function(path, callback){
        // its a stub!
    };
    // test function that uses fs.readFile

    // we're done
    fs.readFile = _readFile;

You cannot do this when running tests in parallel. In order to keep testing as
simple as possible, nodeunit avoids it. Thankfully, most unit-test suites run
fast anyway.


### Explicit ending of tests

When testing async code its important that tests end at the correct point, not
just after a given number of assertions. Otherwise your tests can run short,
ending before all assertions have completed. Its important to detect too
many assertions as well as too few. Combining explicit ending of tests with
an expected number of assertions helps to avoid false test passes, so be sure
to use the test.expect() method at the start of your test functions, and
test.done() when finished.


Running Tests
-------------

nodeunit comes with a basic command-line test runner, which exists in the lib
folder. Example usage:

    node nodeunit/lib/testrunner.js testmodule1.js testfolder [...]

The testrunner uses color output, because I think that's more fun :) I intend
to add a no-color option in future. To give you a feeling of the fun you'll be
having writing tests, lets fix the example at the start of the README:

<img src="http://github.com/caolan/nodeunit/raw/master/img/example_pass.png" />

Ahhh, Doesn't that feel better?

You can also add some code to the bottom of your test modules so they can be
run directly from the command-line:

    if(module.id == '.'){
        var testrunner = require('nodeunit').testrunner;
        testrunner.run([__filename]);
    }

NOTE: this requires nodeunit to be in your require paths. You can make nodeunit
available to all your projects by copying it to ~/.node-libraries

When using the included test runner, it will exit using the failed number of
assertions as the exit code. Exiting with 0 when all tests pass.


Adding nodeunit to Your Projects
--------------------------------

Usually, you'll want to create a script that runs the tests for your project
with the correct require paths set up. Here's an example test script, with
deps, lib and test directories:

    #!/usr/local/bin/node

    require.paths.push(__dirname);
    require.paths.push(__dirname + '/deps');
    require.paths.push(__dirname + '/lib');
    var testrunner = require('nodeunit').testrunner;

    process.chdir(__dirname);
    testrunner.run(['test']);

If you're using git, you might find it useful to include nodeunit as a
submodule. Using submodules makes it easy for developers to download nodeunit
and run your test suite, without cluttering up your repository with
the source code. To add nodeunit as a git submodule do the following:

    git submodule add git://github.com/caolan/nodeunit.git deps/nodeunit

This will add nodeunit to the deps folder of your project. Now, when cloning
the repository, nodeunit can be downloaded by doing the following:

    git submodule init
    git submodule update

Let's update the test script above with a helpful hint on how to get nodeunit,
if its missing:

    #!/usr/local/bin/node

    require.paths.push(__dirname);
    require.paths.push(__dirname + '/deps');
    require.paths.push(__dirname + '/lib');

    try {
        var testrunner = require('nodeunit').testrunner;
    }
    catch(e) {
        var sys = require('sys');
        sys.puts("Cannot find nodeunit module.");
        sys.puts("You can download submodules for this project by doing:");
        sys.puts("");
        sys.puts("    git submodule init");
        sys.puts("    git submodule update");
        sys.puts("");
        process.exit();
    }

    process.chdir(__dirname);
    testrunner.run(['test']);

Now if someone attempts to run your test suite without nodeunit installed they
will be prompted to download the submodules for your project.


Writing a Test Runner
---------------------

nodeunit exports runTest(fn, options), runModule(mod, options) and
runFiles(paths, options). You'll most likely want to run test suites from
files, which can be done using the latter function. The _options_ argument can
contain callbacks which run during testing. nodeunit provides the following
callbacks:

* __moduleStart(name)__ - called before a module is tested
* __moduleDone(name, assertions)__ - called once all test functions within the
  module have completed (see assertions object reference below)
  ALL tests within the module
* __testStart(name)__ - called before a test function is run
* __testDone(name, assertions)__ - called once a test function has completed
  (by calling test.done())
* __log(assertion)__ - called whenever an assertion is made (see assertion
  object reference below)
* __done(assertions)__ - called after all tests/modules are complete

The __assertion__ object:

* __passed()__ - did the assertion pass?
* __failed()__ - did the assertion fail?
* __error__ - the AssertionError if the assertion failed
* __method__ - the nodeunit assertion method used (ok, same, equals...)
* __message__ - the message the assertion method was called with (optional)

The __assertions__ object:

* An array-like object with the following new attributes:
  * __failures__ - the number of assertions which failed
  * __duration__ - the time taken for the test to complete in msecs

For a reference implementation of a test runner, see lib/testrunner.js in the
nodeunit project directory.


Running the nodeunit Tests
--------------------------

The tests for nodeunit are written using nodeunit itself as the test framework.
However, the module test-base.js first does some basic tests using the assert
module to ensure that test functions are actually run, and a basic level of
nodeunit functionality is available.

To run the nodeunit tests do: node test.js
