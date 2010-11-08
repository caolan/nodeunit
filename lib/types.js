/*!
 * Nodeunit
 * Copyright (c) 2010 Caolan McMahon
 * MIT Licensed
 */

/**
 * Module dependencies
 */

var assert = require('assert'),
    sys = require('sys');


/**
 * Creates assertion objects representing the result of an assert call.
 * Accepts an object or AssertionError as its argument.
 *
 * @param {object} obj
 * @api public
 */

exports.assertion = function (obj) {
    return {
        method: obj.method || '',
        message: obj.message || (obj.error && obj.error.message) || '',
        error: obj.error,
        passed: function () {
            return !this.error;
        },
        failed: function () {
            return Boolean(this.error);
        }
    };
};

/**
 * Creates an assertion list object representing a group of assertions.
 * Accepts an array of assertion objects.
 *
 * @param {Array} arr
 * @param {Number} duration
 * @api public
 */

exports.assertionList = function (arr, duration) {
    var that = arr || [];
    that.__defineGetter__('failures', function () {
        return this.reduce(function (a, x) {
            return x.failed() ? a + 1 : a;
        }, 0);
    });
    that.duration = duration || 0;
    return that;
};

/**
 * Create a wrapper function for assert module methods. Executes a callback
 * after the it's complete with an assertion object representing the result.
 *
 * @param {Function} callback
 * @api private
 */

var assertWrapper = function (callback) {
    return function (new_method, assert_method) {
        return function () {
            var a;
            try {
                assert[assert_method].apply(global, arguments);
                var message = arguments[arguments.length - 1];
                a = exports.assertion({method: new_method, message: message});
            }
            catch (e) {
                // deepEqual error message is a bit sucky, lets improve it!
                // e.actual and e.expected could be null or undefined, so
                // using getOwnPropertyDescriptor to see if they exist:
                if (Object.getOwnPropertyDescriptor(e, 'actual') &&
                    Object.getOwnPropertyDescriptor(e, 'expected')) {

                    var actual = sys.inspect(e.actual).replace(/\n$/, '');
                    var expected = sys.inspect(e.expected).replace(/\n$/, '');
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
                        e.stack.split('\n').slice(1).join('\n')
                    );
                }
                a = exports.assertion({method: new_method, error: e});
            }
            callback(a);
        };
    };
};

/**
 * Creates the 'test' object that gets passed to every test function.
 * Accepts the name of the test function as its first argument, followed by
 * the start time in ms, the options object and a callback function.
 *
 * @param {String} name
 * @param {Number} start
 * @param {Object} options
 * @param {Function} callback
 * @api public
 */

exports.test = function (name, start, options, callback) {
    var expecting;
    var a_list = [];

    var wrapAssert = assertWrapper(function (a) {
        a_list.push(a);
        process.nextTick(function () {
            options.log(a);
        });
    });

    var test = {
        done: function (err) {
            if (expecting !== undefined && expecting !== a_list.length) {
                var e = new Error(
                    'Expected ' + expecting + ' assertions, ' +
                    a_list.length + ' ran'
                );
                var a1 = exports.assertion({method: 'expect', error: e});
                a_list.push(a1);
                process.nextTick(function () {
                    options.log(a1);
                });
            }
            if (err) {
                var a2 = exports.assertion({error: err});
                a_list.push(a2);
                process.nextTick(function () {
                    options.log(a2);
                });
            }
            var end = new Date().getTime();
            process.nextTick(function () {
                var assertion_list = exports.assertionList(a_list, end - start);
                options.testDone(name, assertion_list);
                callback(null, a_list);
            });
        },
        ok: wrapAssert('ok', 'ok'),
        same: wrapAssert('same', 'deepEqual'),
        equals: wrapAssert('equals', 'equal'),
        expect: function (num) {
            expecting = num;
        },
        _assertion_list: a_list
    };
    // add all functions from the assert module
    for (var k in assert) {
        if (assert.hasOwnProperty(k)) {
            test[k] = wrapAssert(k, k);
        }
    }
    return test;
};

/**
 * Ensures an options object has all callbacks, adding empty callback functions
 * if any are missing.
 *
 * @param {Object} opt
 * @return {Object}
 * @api public
 */

exports.options = function (opt) {
    var optionalCallback = function (name) {
        opt[name] = opt[name] || function () {};
    };

    optionalCallback('moduleStart');
    optionalCallback('moduleDone');
    optionalCallback('testStart');
    optionalCallback('testDone');
    optionalCallback('log');

    // 'done' callback is not optional.

    return opt;
};
