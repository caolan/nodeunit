/*!
 * Nodeunit
 * Copyright (c) 2010 Caolan McMahon
 * MIT Licensed
 */

/**
 * Module dependencies
 */

var nodeunit = require('./nodeunit'),
    sys = require('sys'),
    path = require('path');


/**
 * Run all tests within each module, reporting the results to the command-line.
 *
 * @param {Array} files
 * @api public
 */

exports.run = function (files) {

    var red   = function (str) {
        return "\u001B[31m" + str + "\u001B[39m";
    };
    var green = function (str) {
        return "\u001B[32m" + str + "\u001B[39m";
    };
    var bold  = function (str) {
        return "\u001B[1m" + str + "\u001B[22m";
    };

    var start = new Date().getTime();
    var paths = files.map(function (p) {
        return path.join(process.cwd(), p);
    });

    nodeunit.runFiles(paths, {
        moduleStart: function (name) {
            sys.puts('\n' + bold(name));
        },
        testDone: function (name, assertions) {
            if (!assertions.failures) {
                sys.puts('✔ ' + name);
            }
            else {
                sys.puts(red('✖ ' + name) + '\n');
                assertions.forEach(function (assertion) {
                    if (assertion.failed()) {
                        sys.puts(assertion.error.stack + '\n');
                    }
                });
            }
        },
        done: function (assertions) {
            var end = new Date().getTime();
            var duration = end - start;
            if (assertions.failures) {
                sys.puts(
                    '\n' + bold(red('FAILURES: ')) + assertions.failures +
                    '/' + assertions.length + ' assertions failed (' +
                    assertions.duration + 'ms)'
                );
            }
            else {
                sys.puts(
                    '\n' + bold(green('OK: ')) + assertions.length +
                    ' assertions (' + assertions.duration + 'ms)'
                );
            }
            process.reallyExit(assertions.failures);
        }
    });
};
