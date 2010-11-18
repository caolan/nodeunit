/*!
 * Nodeunit
 * Copyright (c) 2010 Caolan McMahon
 * MIT Licensed
 */

/**
 * Module dependencies
 */

var nodeunit = require('../nodeunit'),
    fs = require('fs'),
    sys = require('sys'),
    path = require('path'),
    AssertionError = require('assert').AssertionError,
    ejs = require('../../deps/ejs');

/**
 * Reporter info string
 */

exports.info = "jUnit tests reporter";

/**
 * Run all tests within each module, reporting the results to the command-line.
 *
 * @param {Array} files
 * @api public
 */

exports.run = function (files, opts, callback) {
    opts.outputDirectory = opts.outputDirectory;
    var options;
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

    var modules = {}
    var curModule;

    if (typeof StopIteration == "undefined") {
        StopIteration = new Error("StopIteration");
    }

    nodeunit.runFiles(paths, {
        moduleStart: function (name) {
          curModule = { errorCount: 0
                      , failureCount: 0
                      , tests: 0
                      , testcases: []
                      , name: name
                      };
          modules[name] = curModule;
        },
        testDone: function (name, assertions) {
            var testcase = {
                name: name
            };
            curModule.tests++;
            if (!assertions.failures) {
                sys.puts('✔ ' + name);
            }
            else {
                sys.puts(error('✖ ' + name) + '\n');

                // wrap in a try/catch block so we can 'break'
                try {
                  assertions.forEach(function (a) {
                      if (!a.failed())
                         return;

                      testcase.failure = {
                          message: a.message,
                          backtrace: a.error.stack
                      };

                      if (a.error instanceof AssertionError) {
                        curModule.failureCount++;
                      }
                      else {
                        curModule.errorCount++;
                      }

                      // Sadly, the jUnit schema doesn't seem to allow for
                      // multiple assertion failures per testcase, so here
                      // we abort after the first one.
                      throw StopIteration;
                  });
                }
                catch (error) {
                    if (error != StopIteration) throw error;
                }
            }
            curModule.testcases.push(testcase);
        },
        done: function (assertions) {
            var end = new Date().getTime();
            var duration = end - start;
            if (assertions.failures) {
                sys.puts(
                    '\n' + bold(error('FAILURES: ')) + assertions.failures +
                    '/' + assertions.length + ' assertions failed (' +
                    assertions.duration + 'ms)'
                );
            }
            else {
                sys.puts(
                    '\n' + bold(ok('OK: ')) + assertions.length +
                    ' assertions (' + assertions.duration + 'ms)'
                );
            }

            var moduleNames = Object.keys(modules);
            var i = moduleNames.length;
            while (i--) {
               writeTestcaseXML(modules[moduleNames[i]]);
            }

            function writeTestcaseXML(module) {
                fs.readFile
                  ( __dirname + "/../../share/junit.xml.ejs"
                  , function (error, data) {
                        if (error) throw error;
                        var rendered
                          = ejs.render
                              ( data.toString()
                              , { locals: { suites: [ module ] } });

                        var filename
                          = path.join
                              ( opts.outputDirectory
                              , module.name + '.xml');

                        puts("Writing to " + filename);
                        fs.writeFile(filename, rendered);
                  });
            }
        }
    });
}
