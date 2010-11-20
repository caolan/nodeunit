/*!
 * Nodeunit
 * Copyright (c) 2010 Caolan McMahon
 * MIT Licensed
 *
 * THIS FILE SHOULD BE BROWSER-COMPATIBLE JS!
 * You can use @REMOVE_LINE_FOR_BROWSER to remove code from the browser build.
 * Only code on that line will be removed, its mostly to avoid requiring code
 * that is node specific
 */

/**
 * Module dependencies
 */

var async = require('../deps/async'), //@REMOVE_LINE_FOR_BROWSER
    types = require('./types');       //@REMOVE_LINE_FOR_BROWSER


/**
 * Runs a test function (fn) from a loaded module. After the test function
 * calls test.done(), the callback is executed with an assertionList as its
 * second argument.
 *
 * @param {String} name
 * @param {Function} fn
 * @param {Object} opt
 * @param {Function} callback
 * @api public
 */

exports.runTest = function (name, fn, opt, callback) {
    var options = types.options(opt);

    options.testStart(name);
    var start = new Date().getTime();
    var test = types.test(name, start, options, callback);

    try {
        fn(test);
    }
    catch (e) {
        test.done(e);
    }
};

/**
 * Takes an object containing test functions or other test suites as properties
 * and runs each in series. After all tests have completed, the callback is
 * called with a list of all assertions as the second argument.
 *
 * If a name is passed to this function it is prepended to all test and suite
 * names that run within it.
 *
 * @param {String} name
 * @param {Object} suite
 * @param {Object} opt
 * @param {Function} callback
 * @api public
 */

exports.runSuite = function (name, suite, opt, callback) {
    var keys = Object.keys(suite);

    async.concatSeries(keys, function (k, cb) {
        var prop = suite[k], _name;

        _name = name ? [].concat(name, k) : [k];

        _name.toString = function () {
            // fallback for old one
            return this.join(' - ');
        };

        if (typeof prop === 'function') {
            exports.runTest(_name, suite[k], opt, cb);
        }
        else {
            exports.runSuite(_name, suite[k], opt, cb);
        }
    }, callback);
};

/**
 * Run each exported test function or test suite from a loaded module.
 *
 * @param {String} name
 * @param {Object} mod
 * @param {Object} opt
 * @param {Function} callback
 * @api public
 */

exports.runModule = function (name, mod, opt, callback) {
    var options = types.options(opt);

    options.moduleStart(name);
    var start = new Date().getTime();

    exports.runSuite(null, mod, opt, function (err, a_list) {
        var end = new Date().getTime();
        var assertion_list = types.assertionList(a_list, end - start);
        options.moduleDone(name, assertion_list);
        callback(null, a_list);
    });
};


/**
 * Utility for wrapping a suite of test functions with setUp and tearDown
 * functions.
 *
 * @param {Object} suite
 * @return {Object}
 * @api public
 */

exports.testCase = function (suite) {
    var tests = {};

    var setUp = suite.setUp;
    var tearDown = suite.tearDown;
    delete suite.setUp;
    delete suite.tearDown;

    var keys = Object.keys(suite);

    return keys.reduce(function (tests, k) {
        tests[k] = function (test) {
            var context = {};
            if (tearDown) {
                var done = test.done;
                test.done = function (err) {
                    try {
                        tearDown.call(context, function (err2) {
                            if (err && err2) {
                                test._assertion_list.push(
                                    types.assertion({error: err})
                                );
                                return done(err2);
                            }
                            done(err || err2);
                        });
                    }
                    catch (e) {
                        done(e);
                    }
                };
            }
            if (setUp) {
                setUp.call(context, function (err) {
                    if (err) {
                        return test.done(err);
                    }
                    suite[k].call(context, test);
                });
            }
            else {
                suite[k].call(context, test);
            }
        };

        return tests;
    }, {});
};
