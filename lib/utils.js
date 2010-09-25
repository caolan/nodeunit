/*!
 * Nodeunit
 * Copyright (c) 2010 Caolan McMahon
 * MIT Licensed
 */

/**
 * Module dependencies
 */

var async = require('../deps/async'),
    fs = require('fs'),
    Script = process.binding('evals').Script;


/**
 * Detect if coffee-script is available and search for .coffee as an
 * extension in modulePaths if it is.
 */

var extensionPattern;
try {
    require('coffee-script');
    extensionPattern = /\.(?:js|coffee)$/;
}
catch (e) {
    extensionPattern = /\.js$/;
}


/**
 * Finds all modules at each path in an array, If a path is a directory, it
 * returns all supported file types inside it. This only reads 1 level deep in
 * the directory and does not recurse through sub-directories.
 *
 * The extension (.js, .coffee etc) is stripped from the filenames so they can
 * simply be require()'ed.
 *
 * @param {Array} paths
 * @param {Function} callback
 * @api public
 */

exports.modulePaths = function (paths, callback) {
    async.concat(paths, function (p, cb) {
        fs.stat(p, function (err, stats) {
            if (err) return cb(err);
            if (stats.isFile()) return cb(null, [p]);
            if (stats.isDirectory()) {
                fs.readdir(p, function (err, files) {
                    if (err) return cb(err);

                    // filter out any filenames with unsupported extensions
                    var modules = files.filter(function (filename) {
                        return extensionPattern.exec(filename);
                    });

                    // remove extension from module name and prepend the
                    // directory path
                    var fullpaths = modules.map(function (filename) {
                        var mod_name = filename.replace(extensionPattern, '');
                        return [p, mod_name].join('/');
                    });

                    cb(null, fullpaths);
                });
            }
        });
    }, callback);
};

exports.sandbox = function (files, sandbox) {
    var source, script, result;
    if( !(files instanceof Array) ) {
        files = [files];
    }
    source = files.map(function (file) {
        return fs.readFileSync( file, 'utf8' );
    }).join('');

    if( ! sandbox ) {
        sandbox = {};
    }
    script = new Script( source );
    result = script.runInNewContext( sandbox );
    return sandbox;
};
