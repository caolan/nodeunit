
[Expresso](http://github.com/visionmedia/expresso) is a JavaScript [TDD](http://en.wikipedia.org/wiki/Test-driven_development) framework written for [nodejs](http://nodejs.org). Expresso is extremely fast, and is packed with features such as additional assertion methods, code coverage reporting, CI support, and more.

## Features

- light-weight
- intuitive async support
- intuitive test runner executable
- test coverage support and reporting via [node-jscoverage](http://github.com/visionmedia/node-jscoverage)
- uses and extends the core `assert` module
- `assert.eql()` alias of `assert.deepEqual()`
- `assert.response()` http response utility
- `assert.includes()`
- `assert.isNull()`
- `assert.isUndefined()`
- `assert.isNotNull()`
- `assert.isDefined()`
- `assert.match()`
- `assert.length()`

## Installation

To install both expresso _and_ node-jscoverage run
the command below, which will first compile node-jscoverage:

    $ make install

To install expresso alone without coverage reporting run:

    $ make install-expresso

Install via npm:

    $ npm install expresso

## Examples

To define tests we simply export several functions:

    exports['test String#length'] = function(){
        assert.equal(6, 'foobar'.length);
    };

Alternatively for large numbers of tests you may want to
export your own object containing the tests, however this
is essentially the as above:

    module.exports = {
        'test String#length': function(beforeExit, assert) {
          assert.equal(6, 'foobar'.length);
        }
    };

If you prefer not to use quoted keys:

    exports.testsStringLength = function(beforeExit, assert) {
        assert.equal(6, 'foobar'.length);
    };

The argument passed to each callback is `beforeExit` and `assert`.
The context ("`this`") of each test function is a _Test_ object. You can pass a function to `beforeExit` to make sure the assertions are run before the tests exit. This is can be used to verify that tests have indeed been run. `beforeExit` is a shortcut for listening to the `exit` event on `this`. The second parameter `assert` is the `assert` object localized to that test. It makes sure that assertions in asynchronous callbacks are associated with the correct test.

    exports.testAsync = function(beforeExit, assert) {
        var n = 0;
        setTimeout(function() {
            ++n;
            assert.ok(true);
        }, 200);
        setTimeout(function() {
            ++n;
            assert.ok(true);
        }, 200);

        // When the tests are finished, the exit event is emitted.
        this.on('exit', function() {
            assert.equal(2, n, 'Ensure both timeouts are called');
        });

        // Alternatively, you can use the beforeExit shortcut.
        beforeExit(function() {
            assert.equal(2, n, 'Ensure both timeouts are called');
        });
    };

## Assert Utilities

### assert.isNull(val[, msg])

Asserts that the given `val` is `null`.

    assert.isNull(null);

### assert.isNotNull(val[, msg])

Asserts that the given `val` is not `null`.

    assert.isNotNull(undefined);
    assert.isNotNull(false);

### assert.isUndefined(val[, msg])

Asserts that the given `val` is `undefined`.

    assert.isUndefined(undefined);

### assert.isDefined(val[, msg])

Asserts that the given `val` is not `undefined`.

    assert.isDefined(null);
    assert.isDefined(false);

### assert.match(str, regexp[, msg])

Asserts that the given `str` matches `regexp`.

    assert.match('foobar', /^foo(bar)?/);
    assert.match('foo', /^foo(bar)?/);

### assert.length(val, n[, msg])

Assert that the given `val` has a length of `n`.

    assert.length([1,2,3], 3);
    assert.length('foo', 3);

### assert.type(obj, type[, msg])

Assert that the given `obj` is typeof `type`.

    assert.type(3, 'number');

### assert.eql(a, b[, msg])

Assert that object `b` is equal to object `a`. This is an
alias for the core `assert.deepEqual()` method which does complex
comparisons, opposed to `assert.equal()` which uses `==`.

    assert.eql('foo', 'foo');
    assert.eql([1,2], [1,2]);
    assert.eql({ foo: 'bar' }, { foo: 'bar' });

### assert.includes(obj, val[, msg])

Assert that `obj` is within `val`. This method supports `Array`s
and `Strings`s.

    assert.includes([1,2,3], 3);
    assert.includes('foobar', 'foo');
    assert.includes('foobar', 'bar');

### assert.response(server, req, res|fn[, msg|fn])

Performs assertions on the given `server`, which should _not_ call
`listen()`, as this is handled internally by expresso and the server
is killed after all responses have completed. This method works with
any `http.Server` instance, so _Connect_ and _Express_ servers will work
as well.

The **`req`** object may contain:

- `url`: request url
- `timeout`: timeout in milliseconds
- `method`: HTTP method
- `data`: request body
- `headers`: headers object

The **`res`** object may be a callback function which
receives the response for assertions, or an object
which is then used to perform several assertions
on the response with the following properties:

- `body`: assert response body (regexp or string)
- `status`: assert response status code
- `header`: assert that all given headers match (unspecified are ignored, use a regexp or string)

When providing `res` you may then also pass a callback function
as the fourth argument for additional assertions.

Below are some examples:

    assert.response(server, {
        url: '/', timeout: 500
    }, {
        body: 'foobar'
    });

    assert.response(server, {
        url: '/',
        method: 'GET'
    }, {
        body: '{"name":"tj"}',
        status: 200,
        headers: {
            'Content-Type': 'application/json; charset=utf8',
            'X-Foo': 'bar'
        }
    });

    assert.response(server, {
        url: '/foo',
        method: 'POST',
        data: 'bar baz'
    }, {
        body: '/foo bar baz',
        status: 200
    }, 'Test POST');

    assert.response(server, {
        url: '/foo',
        method: 'POST',
        data: 'bar baz'
    }, {
        body: '/foo bar baz',
        status: 200
    }, function(res){
        // All done, do some more tests if needed
    });

    assert.response(server, {
        url: '/'
    }, function(res){
        assert.ok(res.body.indexOf('tj') >= 0, 'Test assert.response() callback');
    });

This function will fail when it receives no response or when the timeout (default is 30 seconds) expires.


## expresso(1)

To run a single test suite (file) run:

    $ expresso test/a.test.js

To run several suites we may simply append another:

    $ expresso test/a.test.js test/b.test.js

We can also pass a whitelist of tests to run within all suites:

    $ expresso --only "foo()" --only "bar()"

Or several with one call:

    $ expresso --only "foo(), bar()"

Globbing is of course possible as well:

    $ expresso test/*

When expresso is called without any files, _test/*_ is the default,
so the following is equivalent to the command above:

    $ expresso

If you wish to unshift a path to `require.paths` before
running tests, you may use the `-I` or `--include` flag.

    $ expresso --include lib test/*

The previous example is typically what I would recommend, since expresso
supports test coverage via [node-jscoverage](http://github.com/visionmedia/node-jscoverage) (bundled with expresso),
so you will need to expose an instrumented version of you library.

To instrument your library, simply run [node-jscoverage](http://github.com/visionmedia/node-jscoverage),
passing the _src_ and _dest_ directories:

    $ node-jscoverage lib lib-cov

Now we can run our tests again, using the _lib-cov_ directory that has been
instrumented with coverage statements:

    $ expresso -I lib-cov test/*

The output will look similar to below, depending on your test coverage of course :)

![node coverage](http://dl.dropbox.com/u/6396913/cov.png)

To make this process easier expresso has the `-c` or `--cov` which essentially
does the same as the two commands above. The following two commands will
run the same tests, however one will auto-instrument, and unshift `lib-cov`,
and the other will run tests normally:

    $ expresso -I lib test/*
    $ expresso -I lib --cov test/*

Currently coverage is bound to the `lib` directory, however in the
future `--cov` will most likely accept a path.

If you would like code coverage reports suitable for automated parsing, pass the `--json [output file]` option:

    $ expresso -I lib test/*
    $ expresso -I lib --cov --json coverage.json test/*

You should then see the json coverage details in the file you specified:

    {
        "LOC": 20,
        "SLOC": 7,
        "coverage": "71.43",
        "files": {
            "bar.js": {
                "LOC": 4,
                "SLOC": 2,
                "coverage": "100.00",
                "totalMisses": 0
            },
            "foo.js": {
                "LOC": 16,
                "SLOC": 5,
                "coverage": "60.00",
                "totalMisses": 2
            }
        },
        "totalMisses": 2
    }

## Async Exports

Sometimes it is useful to postpone running of tests until a callback or event has fired, currently the `exports.foo = function() {};` syntax is supported for this:

    setTimeout(function() {
        exports['test async exports'] = function(){
            assert.ok('wahoo');
        };
    }, 100);

Note that you only have one "shot" at exporting. You have to export all of your test functions in the same loop as the first one. That means you can't progressively add more test functions to the `exports` object.
