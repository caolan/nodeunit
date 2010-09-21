Nodeunit
========

A simple unit testing tool based on the node.js assert module.

* Simple to use
* Just export the tests from a module
* Helps you avoid common pitfalls when testing asynchronous code
* Easy to add test cases with setUp and tearDown functions if you wish
* Allows the use of mocks and stubs

__Contributors__

* [sstephenson](http://github.com/sstephenson) - coffee-script support
* and thanks to [cjohansen](http://github.com/cjohansen) for input and advice
  on implementing setUp and tearDown functions. See
  [cjohansen's fork](http://github.com/cjohansen/nodeunit).

Also, check out gerad's [nodeunit-dsl](http://github.com/gerad/nodeunit-dsl)
project, which implements a 'pretty dsl on top of nodeunit'.

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

Installation
------------

There are two options for installing nodeunit:

1. Clone / download nodeunit from [github](http://github.com/caolan/nodeunit),
   then:

    make && sudo make install

2. Install via npm:

    npm install nodeunit

API Documentation
-----------------

Nodeunit uses the functions available in the node.js
[assert module](http://nodejs.org/api.html#assert-280):

* __ok(value, [message])__ - Tests if value is a true value.
* __equal(actual, expected, [message])__ - Tests shallow, coercive equality
  with the equal comparison operator ( == ).
* __notEqual(actual, expected, [message])__ - Tests shallow, coercive
  non-equality with the not equal comparison operator ( != ).
* __deepEqual(actual, expected, [message])__ - Tests for deep equality.
* __notDeepEqual(actual, expected, [message])__ - Tests for any deep
  inequality.
* __strictEqual(actual, expected, [message])__ - Tests strict equality, as
  determined by the strict equality operator ( === )
* __notStrictEqual(actual, expected, [message])__ - Tests strict non-equality,
  as determined by the strict not equal operator ( !== )
* __throws(block, [error], [message])__ - Expects block to throw an error.
* __doesNotThrow(block, [error], [message])__ - Expects block not to throw an
  error.
* __ifError(value)__ - Tests if value is not a false value, throws if it is a
  true value. Useful when testing the first argument, error in callbacks.

Nodeunit also provides the following functions within tests:

* __expect(amount)__ - Specify how many assertions are expected to run within a
  test. Very useful for ensuring that all your callbacks and assertions are
  run.
* __done()__ - Finish the current test function, and move on to the next. ALL
  tests should call this!

Nodeunit aims to be simple and easy to learn. This is achieved through using
existing structures (such as node.js modules) to maximum effect, and reducing
the API where possible, to make it easier to digest.

Tests are simply exported from a module, but they are still run in the order
they are defined.

__Note:__ Users of old nodeunit versions may remember using ok, equals and same
in the style of qunit, instead of the assert functions above. These functions
still exist for backwards compatibility, and are simply aliases to their assert
module counterparts.


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


Groups, setUp and tearDown
--------------------------

Nodeunit allows the nesting of test functions:

    exports.test1 = function (test) {
        ...
    }

    exports.group = {
        test2: function (test) {
            ...
        },
        test3: function (test) {
            ...
        }
    }

This would be run as:

    test1
    group - test2
    group - test3

Using these groups its possible to add setUp and tearDown functions to your
tests. Nodeunit has a utility function called testCase which allows you to
define a setUp function, which is run before each test, and a tearDown
function, which is run after each test calls test.done():

    var testCase = require('nodeunit').testCase;

    module.exports = testCase({
        setUp: function () {
            this.foo = 'bar';
        },
        tearDown: function () {
            // clean up
        },
        test1: function (test) {
            test.equals(this.foo, 'bar');
            test.done();
        }
    });

In this way, its possible to have multiple groups of tests in a module, each
group with its own setUp and tearDown functions.


Running Tests
-------------

Nodeunit comes with a basic command-line test runner, which can be installed
using 'sudo make install'. Example usage:

    nodeunit testmodule1.js testfolder [...]

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
available to all your projects by copying it to ~/.node-libraries or installing
it via npm.

When using the included test runner, it will exit using the failed number of
assertions as the exit code. Exiting with 0 when all tests pass.


Adding nodeunit to Your Projects
--------------------------------

If you don't want people to have to install the nodeunit command-line tool,
you'll want to create a script that runs the tests for your project with the
correct require paths set up. Here's an example test script, with deps, lib and
test directories:

    #!/usr/bin/env node

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

    #!/usr/bin/env node

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

Nodeunit exports runTest(fn, options), runModule(mod, options) and
runFiles(paths, options). You'll most likely want to run test suites from
files, which can be done using the latter function. The _options_ argument can
contain callbacks which run during testing. Nodeunit provides the following
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

The __assertionList__ object:

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

To run the nodeunit tests do:
    
    make test

__Note:__ There was a bug in node v0.2.0 causing the tests to hang, upgrading
to v0.2.1 fixes this.
