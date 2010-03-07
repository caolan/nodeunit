var assert = require('assert'),
    sys = require('sys'),
    nodeunit = require('nodeunit');



var call_order = [];
var testmodule = {
    test1: function(test){
        call_order.push('test1');
        test.ok(true, 'ok true');
        test.done();
    },
    test2: function(test){
        call_order.push('test2');
        test.ok(false, 'ok false');
        test.ok(false, 'ok false');
        test.done();
    },
    test3: function(test){
        call_order.push('test3');
        test.done();
    }
};
nodeunit.runModule(testmodule, {
    log: function(assertion){
        call_order.push('log');
    },
    testStart: function(name){
        assert.ok(
            name == 'test1' || name == 'test2' || name == 'test3',
            'testStart called with test name'
        );
        call_order.push('testStart');
    },
    testDone: function(failures, total){
        call_order.push('testDone');
    },
    moduleDone: function(failures, total){
        assert.equal(failures, 2);
        assert.equal(total, 3);
        call_order.push('moduleDone');
    }
});


// callbacks are async, so test call order after callbacks have executed
setTimeout(function(){
    assert.deepEqual(call_order, [
        'testStart', 'test1', 'log', 'testDone',
        'testStart', 'test2', 'log', 'log', 'testDone',
        'testStart', 'test3', 'testDone',
        'moduleDone'
    ]);
    sys.puts('test-runmodule OK');
}, 100);
