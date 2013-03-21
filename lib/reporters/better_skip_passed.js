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
    path = require('path'),
    AssertionError = require('assert').AssertionError;

/**
 * Reporter info string
 */

exports.info = "Skip passed tests output";

/**
 * Run all tests within each module, reporting the results to the command-line.
 *
 * @param {Array} files
 * @api public
 */

exports.run = function (files, options, callback) {

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
    var paths = files.map(function (p) {
        return path.join(process.cwd(), p);
    });

    var out = "";
    nodeunit.runFiles(paths, {
        testspec: options.testspec,
        testFullSpec: options.testFullSpec,
        moduleStart: function (name) {
            name = ("               " + bold(name) + ": ").slice(-30)
            process.stdout.write(name);
        },
        testDone: function (name, assertions) {
            if (assertions.failures()) {
                out += "\n    " + error('✖ ' + name);
                assertions.forEach(function (a) {
                    if (a.failed()) {
                        a = utils.betterErrors(a);
                        if (a.error instanceof AssertionError && a.message) {
                            out += 'Assertion Message: ' + assertion_message(a.message);
                        }
                        out += "\n"
                            + a.error.message.replace(/\[bold\](.*)\n/g, options.bold_prefix+"$1"+options.bold_suffix+"\n")
                                             .replace(/\[yellow\](.*)\n/g, "[33m$1[39m "+"\n");
                    }
                });
            }
        },
        moduleDone: function (name, assertions) {
            if (!assertions.failures()) {
                console.log(options.ok_prefix+'✔ all tests passed'+options.ok_suffix);
            }
            else {
                console.log(error('✖ some tests failed'));
                console.log(out);
            }
            out = "";
        },
        done: function (assertions) {
            var end = new Date().getTime();
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

            if (callback) callback(assertions.failures() ? new Error('We have got test failures.') : undefined);
        }
    });
};
