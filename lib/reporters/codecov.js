/*
 * Copyright (c) 2011 Arunoda Susiripala
 * MIT Licensed
 * Borrowed some codes from following projects
 * 
 * Nodeunit
 * Copyright (c) 2010 Caolan McMahon
 * MIT Licensed

 * Expresso
 * Copyright(c) TJ Holowaychuk <tj@vision-media.ca>
 * (MIT Licensed)
 */

/**
 * Module dependencies
 */

var nodeunit = require('../nodeunit'),
    utils = require('../utils'),
    fs = require('fs'),
    sys = require('sys'),
    track = require('../track'),
    path = require('path');
    AssertionError = require('../assert').AssertionError;

/**
 * Reporter info string
 */

exports.info = "Default tests reporter";


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
    var tracker = track.createTracker(function (tracker) {
        if (tracker.unfinished()) {
            sys.puts('');
            sys.puts(error(bold(
                'FAILURES: Undone tests (or their setups/teardowns): '
            )));
            var names = tracker.names();
            for (var i = 0; i < names.length; i += 1) {
                sys.puts('- ' + names[i]);
            }
            sys.puts('');
            sys.puts('To fix this, make sure all tests call test.done()');
            process.reallyExit(tracker.unfinished());
        }
    });

    nodeunit.runFiles(paths, {
        moduleStart: function (name) {
            sys.puts('\n' + bold(name));
        },
        testDone: function (name, assertions) {
            tracker.remove(name);

            if (!assertions.failures()) {
                sys.puts('✔ ' + name);
            }
            else {
                sys.puts(error('✖ ' + name) + '\n');
                assertions.forEach(function (a) {
                    if (a.failed()) {
                        a = utils.betterErrors(a);
                        if (a.error instanceof AssertionError && a.message) {
                            sys.puts(
                                'Assertion Message: ' +
                                assertion_message(a.message)
                            );
                        }
                        sys.puts(a.error.stack + '\n');
                    }
                });
            }
        },
        done: function (assertions, codeCoverageDetails) {
            var end = new Date().getTime();
            var duration = end - start;
            if (assertions.failures()) {
                sys.puts(
                    '\n' + bold(error('FAILURES: ')) + assertions.failures() +
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


            //display codeCoverage
            if(codeCoverageDetails) {
                populateCoverage(codeCoverageDetails);
                reportCoverage(codeCoverageDetails);
            }

            // alexgorbatchev 2010-11-10 :: should be able to flush stdout
            // here, but doesn't seem to work, instead delay the exit to give
            // enough to time flush.
            // process.stdout.flush()
            // process.stdout.end()
            setTimeout(function () {
                process.reallyExit(assertions.failures());
            }, 10);

        },
        testStart: function(name) {
            tracker.put(name);
        }
    });
};

/*
    Borrowed Code from Expresso
*/

var file_matcher = /\.js$/;

/**
 * Report test coverage.
 *
 * @param  {Object} cov
 */

function reportCoverage(cov) {
    // Stats
    print('\n   [bold]{Test Coverage}\n');
    var sep = '   +------------------------------------------+----------+------+------+--------+',
        lastSep = '                                              +----------+------+------+--------+';
    sys.puts(sep);
    sys.puts('   | filename                                 | coverage | LOC  | SLOC | missed |');
    sys.puts(sep);
    for (var name in cov) {
        var file = cov[name];
        if (Array.isArray(file)) {
            sys.print('   | ' + rpad(name, 40));
            sys.print(' | ' + lpad(file.coverage.toFixed(2), 8));
            sys.print(' | ' + lpad(file.LOC, 4));
            sys.print(' | ' + lpad(file.SLOC, 4));
            sys.print(' | ' + lpad(file.totalMisses, 6));
            sys.print(' |\n');
        }
    }
    sys.puts(sep);
    sys.print('     ' + rpad('', 40));
    sys.print(' | ' + lpad(cov.coverage.toFixed(2), 8));
    sys.print(' | ' + lpad(cov.LOC, 4));
    sys.print(' | ' + lpad(cov.SLOC, 4));
    sys.print(' | ' + lpad(cov.totalMisses, 6));
    sys.print(' |\n');
    sys.puts(lastSep);
    // Source
    for (var name in cov) {
        if (name.match(file_matcher)) {
            var file = cov[name];
            if (codeCoverage.verbose) {
               print('\n   [bold]{' + name + '}:');
               print(file.source);
               sys.print('\n');
            }
        }
    }
}

/**
 * Populate code coverage data.
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
            file.source = file.source.map(function(line, i){
                ++i;
                var hits = file[i] === 0 ? 0 : (file[i] || ' ');
                if (hits === 0) {
                    hits = '\x1b[31m' + hits + '\x1b[0m';
                    line = '\x1b[41m' + line + '\x1b[0m';
                } else {
                    hits = '\x1b[32m' + hits + '\x1b[0m';
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

function print(str){
    sys.error(colorize(str));
}

/**
 * Colorize the given string using ansi-escape sequences.
 * Disabled when --boring is set.
 *
 * @param {String} str
 * @return {String}
 */

function colorize(str){
    var colors = { bold: 1, red: 31, green: 32, yellow: 33 };
    return str.replace(/\[(\w+)\]\{([^]*?)\}/g, function(_, color, str){
        return '\x1B[' + colors[color] + 'm' + str + '\x1B[0m';
    });
}
