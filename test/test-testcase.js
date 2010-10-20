var nodeunit = require('../lib/nodeunit');
var testCase = nodeunit.testCase;

exports.testTestCase = function (test) {
    test.expect(7);
    var call_order = [];
    var s = testCase({
        setUp: function (t) {
            call_order.push('setUp');
            test.equals(this.one, undefined);
            this.one = 1;
            t.done();
        },
        tearDown: function (t) {
            call_order.push('tearDown');
            test.ok(true, 'tearDown called');
            t.done();
        },
        test1: function (t) {
            call_order.push('test1');
            test.equals(this.one, 1);
            this.one = 2;
            t.done();
        },
        test2: function (t) {
            call_order.push('test2');
            test.equals(this.one, 1);
            t.done();
        }
    });
    nodeunit.runSuite(null, s, {}, function () {
        test.same(call_order, [
            'setUp', 'test1', 'tearDown',
            'setUp', 'test2', 'tearDown'
        ]);
        test.done();
    });
};

exports.tearDownAfterError = function (test) {
    test.expect(1);
    var s = testCase({
        tearDown: function (t) {
            test.ok(true, 'tearDown called');
            t.done();
        },
        test: function (t) {
            throw new Error('some error');
        }
    });
    nodeunit.runSuite(null, s, {}, function () {
        test.done();
    });
};
