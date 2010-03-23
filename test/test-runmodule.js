var assert = require('assert'),
    sys = require('sys'),
    nodeunit = require('nodeunit');



var call_order = [];
var test_results = [];

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
    name: 'testmodule',
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
    testDone: function(name, assertions){
        test_results.push(assertions);
        assert.ok(
            name == 'test1' || name == 'test2' || name == 'test3',
            'testDone called with test name'
        );
        call_order.push('testDone');
    },
    moduleDone: function(name, assertions){
        assert.equal(assertions.length, 3);
        assert.equal(assertions.failures, 2);
        assert.equal(name, 'testmodule');
        assert.ok(typeof assertions.duration == "number");
        call_order.push('moduleDone');
    }
});

var module2_called = false;
nodeunit.runModule({}, {
    name: 'module with no exports',
    log: function(assertion){
        assert.ok(false, 'log should not be called');
    },
    testStart: function(name){
        assert.ok(false, 'testStart should not be called');
    },
    testDone: function(name, assertions){
        assert.ok(false, 'testDone should not be called');
    },
    moduleDone: function(name, assertions){
        assert.equal(assertions.length, 0);
        assert.equal(assertions.failures, 0);
        assert.equal(name, 'module with no exports');
        assert.ok(typeof assertions.duration == "number");
        module2_called = true;
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
    assert.ok(module2_called);
    sys.puts('test-runmodule OK');
}, 100);
