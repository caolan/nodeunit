/*!
 * Nodeunit
 * Copyright (c) 2010 Caolan McMahon
 * MIT Licensed
 */

/**
 * Module dependencies
 */

var nodeunit = require('../nodeunit'),
    util = require('util'),
    utils = require('../utils'),
    fs = require('fs'),
    track = require('../track'),
    path = require('path');
    AssertionError = require('../assert').AssertionError;


/**
 * Determines if `nodeunit` is running.
 */
var isNodeUnitRunning = function () {
    var arg;
    // silently return if being run by nodeunit
    for (var i = 0; i < process.argv.length; i++) {
        arg = process.argv[i];
        // path ends with nodeunit
        if (arg.lastIndexOf('nodeunit') === (arg.length - 'nodeunit'.length)) {
            return true;
        }
    }

    return false;
}

/**
 * Removes nodeunit specic line trace from stack and colors any
 * line form current test module.
 *
 * @param {String} stack Error stack.
 * @param {Object} mod The test module.
 * @param {Function} errorColorFn Function which colors an error message.
 * @returns Returns a better stack with nodeunit specific lines removed.
 */
var betterStack = function (stack, mod, errorColorFn) {
  var line, lines = stack.split('\n').slice(1);
  var result = [];
  for (var i = 0; i < lines.length; i++) {
    line = lines[i];
    if (line.indexOf('nodeunit/') < 0) {
      if (line.indexOf(mod.filename) >= 0) {
        result.push(errorColorFn(line));
      }
      else {
        result.push(line);
      }
    }
  }

  return result.join('\n');
}


/**
 * Improves formatting of AssertionError messages to make deepEqual etc more
 * readable.
 *
 * @param {Object} assertion
 * @param {Object} mod The test module.
 * @param {Function} errorColorFn Function which colors an error message.
 * @return {Object}
 * @api public
 */

var betterErrors = function (assertion, mod, errorColorFn) {
    if (!assertion.error) return;

    var e = assertion.error;
    // deepEqual error message is a bit sucky, lets improve it!
    // e.actual and e.expected could be null or undefined, so
    // using getOwnPropertyDescriptor to see if they exist:
    if (Object.getOwnPropertyDescriptor(e, 'actual') &&
        Object.getOwnPropertyDescriptor(e, 'expected')) {

        // alexgorbatchev 2010-10-22 :: Added a bit of depth to inspection
        var actual = util.inspect(e.actual, false, 10).replace(/\n$/, '');
        var expected = util.inspect(e.expected, false, 10).replace(/\n$/, '');
        var multiline = (
            actual.indexOf('\n') !== -1 ||
            expected.indexOf('\n') !== -1
        );
        var spacing = (multiline ? '\n' : ' ');
        e._message = e.message;
        e.stack = (
            e.name + ':' + spacing +
            actual + spacing + e.operator + spacing +
            expected + '\n' +
            betterStack(e.stack, mod, errorColorFn)
        );
    }
    return assertion;
};

/**
 * Reporter info string
 */

exports.info = "Inline tests reporter";


/**
 * Run all tests from the module which invoked this function.
 *
 * @api public
 */

exports.run = function(options) {
    if (isNodeUnitRunning()) {
        return;
    }

    var current = module;
    while (current && current.id !== '.') {
       current = current.parent;
    }
    if (require.main != current) {
       // silently return when being run by nodeunit
       return;
    }

    var name = path.basename(current.filename).split('.')[0];
    var modules = {};
    modules[name] = current.exports;


    if (!options) {
        // load default options
        var content = fs.readFileSync(
            __dirname + '/../../bin/nodeunit.json', 'utf8'
        );
        options = JSON.parse(content);
    }

    var error = function (str) {
        return options.error_prefix + str + options.error_suffix;
    };
    var ok    = function (str) {
        return options.ok_prefix + str + options.ok_suffix;
    };
    var bold  = function (str) {
        return options.bold_prefix + str + options.bold_suffix;
    };
    var assertion_message = function (str) {
        return options.assertion_prefix + str + options.assertion_suffix;
    };

    var start = new Date().getTime();
    var tracker = track.createTracker(function (tracker) {
        if (tracker.unfinished()) {
            console.log('');
            console.log(error(bold(
                'FAILURES: Undone tests (or their setups/teardowns): '
            )));
            var names = tracker.names();
            for (var i = 0; i < names.length; i += 1) {
                console.log('- ' + names[i]);
            }
            console.log('');
            console.log('To fix this, make sure all tests call test.done()');
            process.reallyExit(tracker.unfinished());
        }
    });

    nodeunit.runModules(modules, {
        testspec: options.testspec,
        moduleStart: function (name) {
            console.log('\n' + bold(name));
        },
        testDone: function (name, assertions) {
            tracker.remove(name);

            if (!assertions.failures()) {
                console.log('✔ ' + name);
            }
            else {
                console.log(error('✖ ' + name) + '\n');
                assertions.forEach(function (a) {
                    if (a.failed()) {
                        a = betterErrors(a, current, error);
                        if (a.error instanceof AssertionError && a.message) {
                            console.log(
                                'Assertion Message: ' +
                                assertion_message(a.message)
                            );
                        }
                        console.log(a.error.stack + '\n');
                    }
                });
            }
        },
        done: function (assertions, end) {
            var end = end || new Date().getTime();
            var duration = end - start;
            if (assertions.failures()) {
                console.log(
                    '\n' + bold(error('FAILURES: ')) + assertions.failures() +
                    '/' + assertions.length + ' assertions failed (' +
                    assertions.duration + 'ms)'
                );
            }
            else {
                console.log(
                   '\n' + bold(ok('OK: ')) + assertions.length +
                   ' assertions (' + assertions.duration + 'ms)'
                );
            }
        },
        testStart: function(name) {
            tracker.put(name);
        }
    });
};
