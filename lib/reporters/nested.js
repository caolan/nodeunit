/*!
 * Nodeunit
 * Copyright (c) 2010 Caolan McMahon
 * MIT Licensed
 */

/**
 * Module dependencies
 */

var nodeunit = require('../nodeunit'),
    utils = require('../utils'),
    fs = require('fs'),
    track = require('../track'),
    path = require('path'),
    AssertionError = require('../assert').AssertionError;

/**
 * Reporter info string
 */

exports.info = "Nested test reporter";


/**
 * Run all tests within each module, reporting the results to the command-line.
 *
 * @param {Array} files
 * @api public
 */

exports.run = function (files, options) {

    if (!options) {
        // load default options
        var content = fs.readFileSync(
            __dirname + '/../../bin/nodeunit.json',
            'utf8'
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
    var paths = files.map(function (p) {
        return path.join(process.cwd(), p);
    });
    var tracker = track.createTracker(function (tracker) {
        var i, names;
        if (tracker.unfinished()) {
            console.log('');
            console.log(error(bold(
                'FAILURES: Undone tests (or their setups/teardowns): '
            )));
            names = tracker.names();
            for (i = 0; i < names.length; i += 1) {
                console.log('- ' + names[i]);
            }
            console.log('');
            console.log('To fix this, make sure all tests call test.done()');
            process.reallyExit(tracker.unfinished());
        }
    });

    // Object to hold status of each 'part' of the testCase/name array,
    // i.e., whether this part has been printed yet.
    tracker.already_printed = {};

    var print_status = function (status, name_arr) {
        var txt   = '';
        var space = "    ";
        var part, i, k;
        for (i = 0; i < name_arr.length; i++) {
            part = name_arr.slice(0, i + 1).join(",");
            // Only print the part if it hasn't already been printed.
            if (!tracker.already_printed[part]) {
                // Indent once for each nested level
                for (k = 0; k < i; k++) {
                    txt += space;
                }
                if (i === name_arr.length - 1) {
                    // Print the actual test name in bold/ok green.
                    if (status === 'pass') {
                        txt += bold(ok(name_arr[i] + " (pass)"));
                    } else {
                        txt += bold(error(name_arr[i] + " (fail) ✖ "));
                    }
                } else {
                    // This is a testCase, just print the testCase name
                    // and a newline.
                    txt += name_arr[i];
                    txt += "\n";
                }
                tracker.already_printed[part] = true;
            }
        }
        console.log(txt);
    };

    nodeunit.runFiles(paths, {
        testspec: options.testspec,
        moduleStart: function (name) {
            console.log('\n' + bold(name));
        },
        testDone: function (name, assertions) {
            tracker.remove(name);

            if (!assertions.failures()) {
                print_status('pass', name);
            } else {
                print_status('fail', name);
                assertions.forEach(function (a) {
                    if (a.failed()) {
                        a = utils.betterErrors(a);
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
            end = end || new Date().getTime();
            var duration = end - start;
            if (assertions.failures()) {
                console.log(
                    '\n' + bold(error('FAILURES: ')) + assertions.failures() +
                        '/' + assertions.length + ' assertions failed (' +
                        assertions.duration + 'ms)'
                );
            } else {
                console.log(
                    '\n' + bold(ok('OK: ')) + assertions.length +
                        ' assertions (' + assertions.duration + 'ms)'
                );
            }
        },
        testStart: function (name) {
            tracker.put(name);
        }
    });
};
