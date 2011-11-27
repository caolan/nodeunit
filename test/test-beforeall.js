/*  THIS FILE SHOULD BE BROWSER-COMPATIBLE JS!
 *  You can use @REMOVE_LINE_FOR_BROWSER to remove code from the browser build.
 *  Only code on that line will be removed, it's mostly to avoid requiring code
 *  that is node specific
 */

var nodeunit = require('../lib/nodeunit'); // @REMOVE_LINE_FOR_BROWSER

exports.testBeforeAllDeepNested = function (test) {
    var val1 = 'foo';
    var val2 = 'fizz';
    var val3 = 'flah';
    var beforeAllCallCount_1 = 0;
    var beforeAllCallCount_2 = 0;

    var suite = {
        beforeAll: function (callback) {
            val3 = 'blah';
            beforeAllCallCount_1++;
            callback();
        },

        setUp: function (callback) {
            val1 = 'bar';
            callback();
        },

        tearDown: function (callback) {
            callback();
        },

        test1: function (test) {
            test.equal(val1, 'bar');
            test.equal(val2, 'fizz');
            test.equal(val3, 'blah');
            test.equal(beforeAllCallCount_1, 1);
            test.done();
        },

        group1: {
            setUp: function (callback) {
                val2 = 'buzz';
                callback();
            },

            subgroup: {
                beforeAll: function (callback) {
                    beforeAllCallCount_2++;
                    callback();
                },

                test2: function (test) {
                    test.equal(val1, 'bar');
                    test.equal(val2, 'buzz');
                    test.equal(val3, 'blah');
                    test.equal(beforeAllCallCount_1, 1);
                    test.equal(beforeAllCallCount_2, 1);
                    test.done();
                },

                test3: function (test) {
                    test.equal(beforeAllCallCount_2, 1);
                    test.done();
                }
            }
        }
    };

    nodeunit.runSuite(null, suite, {}, function (err, assertions) {
        test.ok(!assertions[0].failed());
        test.equal(assertions.length, 10);
        test.done();
    });
};
