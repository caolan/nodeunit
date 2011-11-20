#!/usr/bin/env node

/*
 * Expresso
 * Copyright(c) TJ Holowaychuk <tj@vision-media.ca>
 * (MIT Licensed)
 */

/**
 * Module dependencies.
 */

var assert = require('assert'),
    childProcess = require('child_process'),
    http = require('http'),
    path = require('path'),
    util = require('util'),
    cwd = process.cwd(),
    fs = require('fs'),
    defer;

/**
 * Set the node env to test if it hasn't already been set
 */

if( !process.env.NODE_ENV ) process.env.NODE_ENV = 'test';

/**
 * Setup the regex which is used to match test files.
 * Adjust it to include coffeescript files if CS is available
 */
var file_matcher = /\.js$/;
try {
  require('coffee-script');
  file_matcher = /\.(js|coffee)$/;
} catch (e) {}

/**
 * Expresso version.
 */

var version = '0.9.2';

/**
 * Failure count.
 */

var failures = 0;

/**
 * Indicates whether all test files have been loaded.
 */

var suites = 0;
var suitesRun = 0;

/**
 * Number of tests executed.
 */

var testcount = 0;

/**
 * Whitelist of tests to run.
 */

var only = [];

/**
 * Regex expression filtering tests to run.
 */

var match = '';

/**
 * Boring output.
 */

var boring = false;

/**
 * Growl notifications.
 */

var growl = false;

/**
 * Server port.
 */

var port = 5555;

/**
 * Execute serially.
 */

var serial = false;

/**
 * Default timeout.
 */

var timeout = 2000;

/**
 * Quiet output.
 */

var quiet = false;

/**
 * JSON code coverage report
 */
var jsonCoverage = false;
var jsonFile;

/**
 * Usage documentation.
 */

var usage = ''
    + '[bold]{Usage}: expresso [options] <file ...>'
    + '\n'
    + '\n[bold]{Options}:'
    + '\n  -g, --growl          Enable growl notifications'
    + '\n  -c, --coverage       Generate and report test coverage'
    + '\n  -j, --json PATH      Used in conjunction with --coverage, ouput JSON coverage to PATH'
    + '\n  -q, --quiet          Suppress coverage report if 100%'
    + '\n  -t, --timeout MS     Timeout in milliseconds, defaults to 2000'
    + '\n  -r, --require PATH   Require the given module path'
    + '\n  -o, --only TESTS     Execute only the comma sperated TESTS (can be set several times)'
    + '\n  -m, --match EXP      Execute only tests matching a given regular expression (can be set several times)'
    + '\n  -p, --port NUM       Port number for test servers, starts at 5555'
    + '\n  -s, --serial         Execute tests serially'
    + '\n  -b, --boring         Suppress ansi-escape colors'
    + '\n  -v, --version        Output version number'
    + '\n  -h, --help           Display help information'
    + '\n';

// Parse arguments

var files = [],
    args = process.argv.slice(2);

while (args.length) {
    var arg = args.shift();
    switch (arg) {
        case '-h':
        case '--help':
            print(usage + '\n');
            process.exit(1);
            break;
        case '-v':
        case '--version':
            console.log(version);
            process.exit(1);
            break;
        case '-o':
        case '--only':
            if (arg = args.shift()) {
                only = only.concat(arg.split(/ *, */));
            } else {
                throw new Error('--only requires comma-separated test names');
            }
            break;
        case '-m':
        case '--match':
            if (arg = args.shift()) {
                match += (match.length > 0 ? '|' : '') + arg;
            } else {
                throw new Error('--match requires argument');
            }
            break;
        case '-p':
        case '--port':
            if (arg = args.shift()) {
                port = parseInt(arg, 10);
            } else {
                throw new Error('--port requires a number');
            }
            break;
        case '-r':
        case '--require':
            if (arg = args.shift()) {
                require(arg);
            } else {
                throw new Error('--require requires a path');
            }
            break;
        case '-t':
        case '--timeout':
          if (arg = args.shift()) {
            timeout = parseInt(arg, 10);
          } else {
            throw new Error('--timeout requires an argument');
          }
          break;
        // case '-c':
        // case '--cov':
        // case '--coverage':
        //     defer = true;
        //     childProcess.exec('rm -fr lib-cov && node-jscoverage lib lib-cov', function(err){
        //         if (err) throw err;
        //         require.paths.unshift('lib-cov');
        //         run(files);
        //     })
        //     break;
        case '-q':
        case '--quiet':
            quiet = true;
            break;
        case '-b':
        case '--boring':
            boring = true;
            break;
        case '-g':
        case '--growl':
            growl = true;
            break;
        case '-s':
        case '--serial':
            serial = true;
            break;
        case '-j':
        case '--json':
            jsonCoverage = true;
            if (arg = args.shift()) {
                jsonFile = path.normalize(arg);
            } else {
                throw new Error('--json requires file to write to');
            }
            break;
        default:
            if (file_matcher.test(arg)) {
                files.push(arg);
            }
            break;
    }
}

/**
 * Colorized console.error().
 *
 * @param {String} str
 */

function print(str){
    console.error(colorize(str));
}

/**
 * Colorize the given string using ansi-escape sequences.
 * Disabled when --boring is set.
 *
 * @param {String} str
 * @return {String}
 */

function colorize(str) {
    var colors = { bold: 1, red: 31, green: 32, yellow: 33 };
    return str.replace(/\[(\w+)\]\{([^]*?)\}/g, function(_, color, str) {
        return boring
            ? str
            : '\x1B[' + colors[color] + 'm' + str + '\x1B[0m';
    });
}

// Alias deepEqual as eql for complex equality

assert.eql = assert.deepEqual;

/**
 * Assert that `val` is null.
 *
 * @param {Mixed} val
 * @param {String} msg
 */

assert.isNull = function(val, msg) {
    assert.strictEqual(null, val, msg);
};

/**
 * Assert that `val` is not null.
 *
 * @param {Mixed} val
 * @param {String} msg
 */

assert.isNotNull = function(val, msg) {
    assert.notStrictEqual(null, val, msg);
};

/**
 * Assert that `val` is undefined.
 *
 * @param {Mixed} val
 * @param {String} msg
 */

assert.isUndefined = function(val, msg) {
    assert.strictEqual(undefined, val, msg);
};

/**
 * Assert that `val` is not undefined.
 *
 * @param {Mixed} val
 * @param {String} msg
 */

assert.isDefined = function(val, msg) {
    assert.notStrictEqual(undefined, val, msg);
};

/**
 * Assert that `obj` is `type`.
 *
 * @param {Mixed} obj
 * @param {String} type
 * @api public
 */

assert.type = function(obj, type, msg) {
    var real = typeof obj;
    msg = msg || 'typeof ' + util.inspect(obj) + ' is ' + real + ', expected ' + type;
    assert.ok(type === real, msg);
};

/**
 * Assert that `str` matches `regexp`.
 *
 * @param {String} str
 * @param {RegExp} regexp
 * @param {String} msg
 */

assert.match = function(str, regexp, msg) {
    msg = msg || util.inspect(str) + ' does not match ' + util.inspect(regexp);
    assert.ok(regexp.test(str), msg);
};

/**
 * Assert that `val` is within `obj`.
 *
 * Examples:
 *
 *    assert.includes('foobar', 'bar');
 *    assert.includes(['foo', 'bar'], 'foo');
 *
 * @param {String|Array} obj
 * @param {Mixed} val
 * @param {String} msg
 */

assert.includes = function(obj, val, msg) {
    msg = msg || util.inspect(obj) + ' does not include ' + util.inspect(val);
    assert.ok(obj.indexOf(val) >= 0, msg);
};

/**
 * Assert length of `val` is `n`.
 *
 * @param {Mixed} val
 * @param {Number} n
 * @param {String} msg
 */

assert.length = function(val, n, msg) {
    msg = msg || util.inspect(val) + ' has length of ' + val.length + ', expected ' + n;
    assert.equal(n, val.length, msg);
};

/**
 * Assert response from `server` with
 * the given `req` object and `res` assertions object.
 *
 * @param {Server} server
 * @param {Object} req
 * @param {Object|Function} res
 * @param {String} msg
 */
assert.response = function(server, req, res, msg) {
    var test = assert._test;

    // Callback as third or fourth arg
    var callback = typeof res === 'function'
        ? res
        : typeof msg === 'function'
            ? msg
            : function() {};

    // Default messate to test title
    if (typeof msg === 'function') msg = null;
    msg = msg || test.title;
    msg += '. ';

    // Add a unique token for this call to assert.response(). We'll move it to
    // succeeded/failed when done
    var token = new Error('Response not completed: ' + msg);
    test._pending.push(token);

    function check() {
        try {
            server.__port = server.address().port;
            server.__listening = true;
        } catch (err) {
            process.nextTick(check);
            return;
        }
        if (server.__deferred) {
            server.__deferred.forEach(function(fn) { fn(); });
            server.__deferred = null;
        }
    }

    // Pending responses
    server.__pending = server.__pending || 0;
    server.__pending++;

    // Check that the server is ready or defer
    if (!server.fd) {
        server.__deferred = server.__deferred || [];
        server.listen(server.__port = port++, '127.0.0.1', check);
    } else if (!server.__port) {
        server.__deferred = server.__deferred || [];
        process.nextTick(check);
    }

    // The socket was created but is not yet listening, so keep deferring
    if (!server.__listening) {
        server.__deferred.push(issue);
        return;
    } else {
        issue();
    }

    function issue() {
        // Issue request
        var timer,
            method = req.method || 'GET',
            status = res.status || res.statusCode,
            data = req.data || req.body,
            requestTimeout = req.timeout || 0,
            encoding = req.encoding || 'utf8';

        var request = http.request({
            host: '127.0.0.1',
            port: server.__port,
            path: req.url,
            method: method,
            headers: req.headers
        });

        var check = function() {
            if (--server.__pending === 0) {
                server.close();
                server.__listening = false;
            }
        };

        // Timeout
        if (requestTimeout) {
            timer = setTimeout(function() {
                check();
                delete req.timeout;
                test.failure(new Error(msg + 'Request timed out after ' + requestTimeout + 'ms.'));
            }, requestTimeout);
        }

        if (data) request.write(data);

        request.on('response', function(response) {
            response.body = '';
            response.setEncoding(encoding);
            response.on('data', function(chunk) { response.body += chunk; });
            response.on('end', function() {
                if (timer) clearTimeout(timer);
                try {
                    // Assert response body
                    if (res.body !== undefined) {
                        var eql = res.body instanceof RegExp
                          ? res.body.test(response.body)
                          : res.body === response.body;
                        assert.ok(
                            eql,
                            msg + 'Invalid response body.\n'
                                + '    Expected: ' + util.inspect(res.body) + '\n'
                                + '    Got: ' + util.inspect(response.body)
                        );
                    }

                    // Assert response status
                    if (typeof status === 'number') {
                        assert.equal(
                            response.statusCode,
                            status,
                            msg + colorize('Invalid response status code.\n'
                                + '    Expected: [green]{' + status + '}\n'
                                + '    Got: [red]{' + response.statusCode + '}')
                        );
                    }

                    // Assert response headers
                    if (res.headers) {
                        var keys = Object.keys(res.headers);
                        for (var i = 0, len = keys.length; i < len; ++i) {
                            var name = keys[i],
                                actual = response.headers[name.toLowerCase()],
                                expected = res.headers[name],
                                eql = expected instanceof RegExp
                                  ? expected.test(actual)
                                  : expected == actual;
                            assert.ok(
                                eql,
                                msg + colorize('Invalid response header [bold]{' + name + '}.\n'
                                    + '    Expected: [green]{' + expected + '}\n'
                                    + '    Got: [red]{' + actual + '}')
                            );
                        }
                    }

                    // Callback
                    callback(response);

                    // Add this to the succeeded bin.
                    test.success(msg);
                } catch (err) {
                    test.failure(err);
                    test.callback();
                } finally {
                    // Remove our token.
                    var idx = test._pending.indexOf(token);
                    if (idx >= 0) {
                        test._pending.splice(idx, 1);
                    } else {
                        // Someone else took our token. This is an error.
                        test.failure(new Error('Request succeeded, but token vanished: ' + msg));
                    }

                    // Potentially shut down the server.
                    check();
                }
            });
        });

        request.end();
      }
};

/**
 * Pad the given string to the maximum width provided.
 *
 * @param  {String} str
 * @param  {Number} width
 * @return {String}
 */

function lpad(str, width) {
    str = String(str);
    var n = width - str.length;
    if (n < 1) return str;
    while (n--) str = ' ' + str;
    return str;
}

/**
 * Pad the given string to the maximum width provided.
 *
 * @param  {String} str
 * @param  {Number} width
 * @return {String}
 */

function rpad(str, width) {
    str = String(str);
    var n = width - str.length;
    if (n < 1) return str;
    while (n--) str = str + ' ';
    return str;
}

/**
 * Report test coverage in tabular format
 *
 * @param  {Object} cov
 */

function reportCoverageTable(cov) {
    // Stats
    print('\n   [bold]{Test Coverage}\n');
    var sep = '   +------------------------------------------+----------+------+------+--------+',
        lastSep = '                                              +----------+------+------+--------+';
    console.log(sep);
    console.log('   | filename                                 | coverage | LOC  | SLOC | missed |');
    console.log(sep);
    for (var name in cov) {
        var file = cov[name];
        if (Array.isArray(file)) {
            process.stdout.write('   | ' + rpad(name, 40));
            process.stdout.write(' | ' + lpad(file.coverage.toFixed(2), 8));
            process.stdout.write(' | ' + lpad(file.LOC, 4));
            process.stdout.write(' | ' + lpad(file.SLOC, 4));
            process.stdout.write(' | ' + lpad(file.totalMisses, 6));
            process.stdout.write(' |\n');
        }
    }
    console.log(sep);
    process.stdout.write('     ' + rpad('', 40));
    process.stdout.write(' | ' + lpad(cov.coverage.toFixed(2), 8));
    process.stdout.write(' | ' + lpad(cov.LOC, 4));
    process.stdout.write(' | ' + lpad(cov.SLOC, 4));
    process.stdout.write(' | ' + lpad(cov.totalMisses, 6));
    process.stdout.write(' |\n');
    console.log(lastSep);
    // Source
    for (var name in cov) {
        if (name.match(file_matcher)) {
            var file = cov[name];
            if ((file.coverage < 100) || !quiet) {
               print('\n   [bold]{' + name + '}:');
               print(file.source);
               process.stdout.write('\n');
            }
        }
    }
}

/**
 * Report test coverage in raw json format
 *
 * @param {Object} cov
 */

function reportCoverageJson(cov) {
    var report = {
        "coverage" : cov.coverage.toFixed(2),
        "LOC" : cov.LOC,
        "SLOC" : cov.SLOC,
        "totalMisses" : cov.totalMisses,
        "files" : {}
    };

    for (var name in cov) {
        var file = cov[name];
        if (Array.isArray(file)) {
            report.files[name] = {
                "coverage" : file.coverage.toFixed(2),
                "LOC" : file.LOC,
                "SLOC" : file.SLOC,
                "totalMisses" : file.totalMisses
            };
        }
    }

    fs.writeFileSync(jsonFile, JSON.stringify(report), "utf8");
}

/**
 * Populate code coverage data.
 *
 * @param  {Object} cov
 */

function populateCoverage(cov) {
    cov.LOC =
    cov.SLOC =
    cov.totalFiles =
    cov.totalHits =
    cov.totalMisses =
    cov.coverage = 0;
    for (var name in cov) {
        var file = cov[name];
        if (Array.isArray(file)) {
            // Stats
            ++cov.totalFiles;
            cov.totalHits += file.totalHits = coverage(file, true);
            cov.totalMisses += file.totalMisses = coverage(file, false);
            file.totalLines = file.totalHits + file.totalMisses;
            cov.SLOC += file.SLOC = file.totalLines;
            if (!file.source) file.source = [];
            cov.LOC += file.LOC = file.source.length;
            file.coverage = (file.totalHits / file.totalLines) * 100;
            // Source
            var width = file.source.length.toString().length;
            file.source = file.source.map(function(line, i) {
                ++i;
                var hits = file[i] === 0 ? 0 : (file[i] || ' ');
                if (!boring) {
                    if (hits === 0) {
                        hits = '\x1b[31m' + hits + '\x1b[0m';
                        line = '\x1b[41m' + line + '\x1b[0m';
                    } else {
                        hits = '\x1b[32m' + hits + '\x1b[0m';
                    }
                }
                return '\n     ' + lpad(i, width) + ' | ' + hits + ' | ' + line;
            }).join('');
        }
    }
    cov.coverage = (cov.totalHits / cov.SLOC) * 100;
}

/**
 * Total coverage for the given file data.
 *
 * @param  {Array} data
 * @return {Type}
 */

function coverage(data, val) {
    var n = 0;
    for (var i = 0, len = data.length; i < len; ++i) {
        if (data[i] !== undefined && data[i] == val) ++n;
    }
    return n;
}

/**
 * Test if all files have 100% coverage
 *
 * @param  {Object} cov
 * @return {Boolean}
 */

function hasFullCoverage(cov) {
  for (var name in cov) {
    var file = cov[name];
    if (file instanceof Array) {
      if (file.coverage !== 100) {
          return false;
      }
    }
  }
  return true;
}

/**
 * Run the given test `files`, or try _test/*_.
 *
 * @param  {Array} files
 */

function run(files) {
    cursor(false);
    if (!files.length) {
        try {
            files = fs.readdirSync('test').map(function(file) {
                return 'test/' + file;
            }).filter(function(file) {
                return !(/(^\.)|(\/\.)/.test(file));
            });
        } catch (err) {
            print('\n  failed to load tests in [bold]{./test}\n');
            ++failures;
            process.exit(1);
        }
    }
    runFiles(files);
}

/**
 * Show the cursor when `show` is true, otherwise hide it.
 *
 * @param {Boolean} show
 */

function cursor(show) {
    if (boring) return;
    if (show) {
        process.stdout.write('\x1b[?25h');
    } else {
        process.stdout.write('\x1b[?25l');
    }
}

/**
 * Run the given test `files`.
 *
 * @param {Array} files
 */

function runFiles(files) {
    files = files.filter(function(file) {
        return file.match(file_matcher);
    });
    suites = files.length;

    if (serial) {
        (function next() {
            if (files.length) {
                runFile(files.shift(), next);
            }
        })();
    } else {
        files.forEach(runFile);
    }
}

/**
 * Run tests for the given `file`, callback `fn()` when finished.
 *
 * @param {String} file
 * @param {Function} fn
 */

function runFile(file, fn) {
    var title = path.basename(file),
        file = path.join(cwd, file),
        mod = require(file.replace(file_matcher,''));
    (function check() {
       var len = Object.keys(mod).length;
       if (len) {
           runSuite(title, mod, fn);
           suitesRun++;
       } else {
           setTimeout(check, 20);
       }
    })();
}

/**
 * Run the given tests, callback `fn()` when finished.
 *
 * @param  {String} title
 * @param  {Object} tests
 * @param  {Function} fn
 */

var dots = 0;
function runSuite(title, tests, callback) {
    // Keys
    var keys = only.length
        ? only.slice(0)
        : Object.keys(tests);
    
    // Regular expression test filter
    var filter = new RegExp('(?:' + (match.length == 0 ? '.' : match) + ')');
    
    // Setup
    var setup = tests.setup || function(fn, assert) { fn(); };
    var teardown = tests.teardown || function(fn, assert) { fn(); };

    process.setMaxListeners(10 + process.listeners('beforeExit').length  + keys.length);

    // Iterate tests
    (function next() {
        if (keys.length) {
            var key,
                fn = tests[key = keys.shift()];
            
            // Filter
            if (filter.test(key) === false) return next();
            
            // Non-tests
            if (key === 'setup' || key === 'teardown') return next();

            // Run test
            if (fn) {
                var test = new Test({
                    fn: fn,
                    suite: title,
                    title: key,
                    setup: setup,
                    teardown: teardown
                })
                test.run(next);
            } else {
                // @TODO: Add warning message that there's no test.
                next();
            }
        } else if (serial) {
            callback();
        }
    })();
}

require('util').inherits(Test, require('events').EventEmitter);
function Test(options) {
    for (var key in options) {
        this[key] = options[key];
    }
    this._succeeded = [];
    this._failed = [];
    this._pending = [];
    this._beforeExit = [];
    this.assert = { __proto__: assert, _test: this };

    var test = this;
    process.on('beforeExit', function() {
        try {
            test.emit('exit');
        } catch (err) {
            test.failure(err);
        }
        test.report();
    });
}

Test.prototype.success = function(err) {
    this._succeeded.push(err);
};

Test.prototype.failure = function(err) {
    this._failed.push(err);
    this.error(err);
};

Test.prototype.report = function() {
    for (var i = 0; i < this._pending.length; i++) {
        this.error(this._pending[i]);
    }
};

Test.prototype.run = function(callback) {
    try {
        ++testcount;
        assert._test = this;

        if (serial) {
            this.runSerial(callback);
        } else {
            // @TODO: find a way to run setup/tearDown.
            this.runParallel();
            callback();
        }
    } catch (err) {
        this.failure(err);
        this.report();
    }
};

Test.prototype.runSerial = function(callback) {
    var test = this;
    process.stdout.write('.');
    if (++dots % 25 === 0) console.log();
    test.setup(function() {
        if (test.fn.length < 1) {
            test.fn();
            test.teardown(callback);
        } else {
            var id = setTimeout(function() {
                throw new Error("'" + test.title + "' timed out");
            }, timeout);
            test.callback = function() {
                clearTimeout(id);
                test.teardown(callback);
                process.nextTick(function() {
                    test.report();
                });
            };
            test.fn(test.callback);
        }
    });
};

Test.prototype.runParallel = function() {
    var test = this;
    test.fn(function(fn) {
        test.on('exit', function() {
            fn(test.assert);
        });
    }, test.assert);
};

/**
 * Report `err` for the given `test` and `suite`.
 *
 * @param {String} suite
 * @param {String} test
 * @param {Error} err
 */
Test.prototype.error = function(err) {
    if (!err._reported) {
        ++failures;
        var name = err.name,
            stack = err.stack ? err.stack.replace(err.name, '') : '',
            label = this.title === 'uncaught'
                ? this.title
                : this.suite + ' ' + this.title;
        print('\n   [bold]{' + label + '}: [red]{' + name + '}' + stack + '\n');
        err._reported = true;
    }
}

/**
* Report exceptions.
 */

function report() {
    cursor(true);
    process.emit('beforeExit');
    if (suitesRun < suites) {
        print('\n   [bold]{Failure}: [red]{Only ' + suitesRun + ' of ' + suites + ' suites have been started}\n\n');
    }
    else if (failures) {
        print('\n   [bold]{Failures}: [red]{' + failures + '}\n\n');
        notify('Failures: ' + failures);
    } else {
        if (serial) print('');
        print('\n   [green]{100%} ' + testcount + ' tests\n');
        notify('100% ok');
    }
    if (typeof _$jscoverage === 'object') {
        populateCoverage(_$jscoverage);
        if (!hasFullCoverage(_$jscoverage) || !quiet) {
            (jsonCoverage ? reportCoverageJson(_$jscoverage) : reportCoverageTable(_$jscoverage));
        }
    }
}

/**
 * Growl notify the given `msg`.
 *
 * @param {String} msg
 */

function notify(msg) {
    if (growl) {
        childProcess.exec('growlnotify -name Expresso -m "' + msg + '"');
    }
}

// Report uncaught exceptions
var unknownTest = new Test({
    suite: 'uncaught',
    test: 'uncaught'
});

process.on('uncaughtException', function(err) {
    unknownTest.error(err);
});

// Show cursor

['INT', 'TERM', 'QUIT'].forEach(function(sig) {
    process.on('SIG' + sig, function() {
        cursor(true);
        process.exit(1);
    });
});

// Report test coverage when available
// and emit "beforeExit" event to perform
// final assertions

var orig = process.emit;
process.emit = function(event) {
    if (event === 'exit') {
        report();
        process.reallyExit(failures);
    }
    orig.apply(this, arguments);
};

// Run test files

if (!defer) run(files);
