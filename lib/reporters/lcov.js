/**
 * Module dependencies
 */

var nodeunit = require('../nodeunit'),
    path = require('path');

/**
 * Reporter info string
 */

exports.info = 'The LCOV reporter reads JS files instrumented by JSCoverage (http://siliconforks.com/jscoverage/) and outputs coverage data in the LCOV format (http://ltp.sourceforge.net/coverage/lcov/geninfo.1.php)';

/**
 * Run all tests within each module, reporting the results to the command-line.
 *
 * @param {Array} files
 * @api public
 */

exports.run = function (files) {

    var paths = files.map(function (p) {
        return path.join(process.cwd(), p);
    });

    nodeunit.runFiles(paths, {
        done: function () {
            var cov = (global || window)._$jscoverage || {};

            Object.keys(cov).forEach(function (filename) {
                var data = cov[filename];
                reportFile(filename, data);
            });
        }
    });
};

function reportFile(filename, data) {
    console.log('SF:' + filename);

    data.source.forEach(function(line, num) {
        // increase the line number, as JS arrays are zero-based
        num++;

        if (data[num] !== undefined) {
            console.log('DA:' + num + ',' + data[num]);
        }
    });

    console.log('end_of_record');
}
