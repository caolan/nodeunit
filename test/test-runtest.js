var assert = require('assert'),
    sys = require('sys'),
    nodeunit = require('nodeunit');


// this is mean to bubble to the top, and will be ignored for the purposes
// of testing:
var ignored_error = new Error('ignore this callback error');
process.addListener('uncaughtException', function(err){
    if(err && err.message != ignored_error.message){
        throw err;
    }
});

var call_order1 = [];
var test1 = function(test){
    call_order1.push('test1');
    assert.ok(test.expect instanceof Function, 'test.expect');
    assert.ok(test.done instanceof Function, 'test.done');
    assert.ok(test.ok instanceof Function, 'test.ok');
    assert.ok(test.same instanceof Function, 'test.same');
    assert.ok(test.equals instanceof Function, 'test.equals');
    test.done();
};
nodeunit.runTest(test1, {
    name: 'test1',
    log: function(assertion){
        throw assertion.error;
    },
    testDone: function(name, assertions){
        assert.equal(assertions.failures, 0, 'failures');
        assert.equal(assertions.length, 0, 'length');
        assert.ok(typeof assertions.duration == "number","duration is number");
        assert.equal(name, 'test1');
        call_order1.push('testDone');
    }
});


var err = new Error('test');
var call_order2 = [];
var test2 = function(test){
    call_order2.push('test2');
    throw err;
};
nodeunit.runTest(test2, {
    log: function(assertion){
        call_order2.push('log');
        assert.deepEqual(assertion.error, err, 'assertion.error');
    },
    testDone: function(name, assertions){
        assert.equal(assertions.failures, 1);
        assert.equal(assertions.length, 1);
        call_order2.push('testDone');
    }
});


var call_order3 = [];
var assertion3;
var test3 = function(test){
    call_order3.push('test3');
    test.ok(true, 'test.ok');
    test.done();
};
nodeunit.runTest(test3, {
    log: function(assertion){
        assertion3 = assertion;
        call_order3.push('log ' + assertion.message);
    },
    testDone: function(name, assertions){
        assert.equal(assertions.failures, 0, 'failures');
        assert.equal(assertions.length, 1, 'total');
        call_order3.push('testDone');
    }
});


// A failing callback should not affect the test outcome
var call_order4 = [];
var test4 = function(test){
    call_order4.push('test4');
    test.ok(true, 'test.ok');
    test.done();
};
nodeunit.runTest(test4, {
    log: function(assertion){
        call_order4.push('log');
        assert.ok(true, 'log called');
        throw ignored_error;
    },
    testDone: function(name, assertions){
        assert.equal(assertions.failures, 0, 'failures');
        assert.equal(assertions.length, 1, 'total');
        call_order4.push('testDone');
    }
});


// A failing callback should not affect the test outcome
var call_order5 = [];
var test5 = function(test){
    call_order5.push('test5');
    test.done();
};
nodeunit.runTest(test5, {
    log: function(assertion){
        call_order5.push('log');
        assert.ok(false, 'log should not be called');
    },
    testDone: function(name, assertions){
        assert.equal(assertions.failures, 0, 'failures');
        assert.equal(assertions.length, 0, 'total');
        call_order5.push('testDone');
        throw ignored_error;
    }
});

// test6 removed

// using expect
var call_order7 = [];
var test7 = function(test){
    test.expect(2);
    call_order7.push('test7');
    test.done();
};
nodeunit.runTest(test7, {
    log: function(assertion){
        assert.equal(
            '' + assertion.message,
            'Expected 2 assertions, 0 ran'
        );
        call_order7.push('log');
    },
    testDone: function(name, assertions){
        call_order7.push('testDone');
        assert.equal(assertions.failures, 1, 'failures');
        assert.equal(assertions.length, 1, 'total');
    }
});

var call_order8 = [];
var test8 = function(test){
    test.expect(1);
    call_order8.push('test8');
    test.ok(true, 'test.ok');
    test.done();
};
nodeunit.runTest(test8, {
    log: function(assertion){
        call_order8.push('log');
    },
    testDone: function(name, assertions){
        call_order8.push('testDone');
        assert.equal(assertions.failures, 0, 'failures');
        assert.equal(assertions.length, 1, 'total');
    }
});


// test.same - pass
var call_order9 = [];
var test9 = function(test){
    call_order9.push('test9');
    test.same({test:'test'}, {test:'test'}, 'test.same');
    test.done();
};
nodeunit.runTest(test9, {
    log: function(assertion){
        call_order9.push('log');
        assert.ok(assertion.passed(), 'assertion.passed');
        assert.equal(assertion.method, 'same', 'assertion.method');
    },
    testDone: function(){
        call_order9.push('testDone');
    }
});


// test.same - fail
var call_order10 = [];
var test10 = function(test){
    call_order10.push('test10');
    test.same({test:'test'}, {test2:'test2'}, 'test.same');
    test.done();
};
nodeunit.runTest(test10, {
    log: function(assertion){
        call_order10.push('log');
        assert.ok(assertion.failed(), 'failed');
    },
    testDone: function(){
        call_order10.push('testDone');
    }
});


// test.equals - pass
var call_order11 = [];
var test11 = function(test){
    call_order11.push('test11');
    test.equals('test', 'test', 'test.equals');
    test.done();
};
nodeunit.runTest(test11, {
    log: function(assertion){
        call_order11.push('log');
        assert.ok(assertion.passed(), 'passed');
    },
    testDone: function(){
        call_order11.push('testDone');
    }
});


// test.same - fail
var call_order12 = [];
var test12 = function(test){
    call_order12.push('test12');
    test.equals('test', 'test2', 'test.equals');
    test.done();
};
nodeunit.runTest(test12, {
    log: function(assertion){
        call_order12.push('log');
        assert.ok(assertion.failed(), 'failed');
    },
    testDone: function(){
        call_order12.push('testDone');
    }
});


// test assertion object
var call_order13 = [];
var test13 = function(test){
    call_order13.push('test13');
    test.ok(true, 'ok true');
    test.done();
};
nodeunit.runTest(test13, {
    log: function(assertion){
        call_order13.push('log');
        assert.strictEqual(assertion.passed(), true, 'assertion.passed');
        assert.strictEqual(assertion.failed(), false, 'assertion.failed');
    },
    testDone: function(name, assertions){
        call_order13.push('testDone');
        assert.equal(assertions.failures, 0, 'failures');
        assert.equal(assertions.length, 1, 'total');
    }
});


// log callback is optional
var call_order14 = [];
var test14 = function(test){
    call_order14.push('test14');
    test.ok(true, 'ok true');
    test.done();
};
nodeunit.runTest(test14, {
    testDone: function(name, assertions){
        call_order14.push('testDone');
        assert.equal(assertions.failures, 0, 'failures');
        assert.equal(assertions.length, 1, 'total');
    }
});

var call_order15 = [];
var test15 = function(test){
    test.expect(1);
    call_order15.push('test15');
    test.ok(false, 'test.ok');
    test.done();
};
nodeunit.runTest(test15, {
    log: function(assertion){
        assert.equal(assertion.method, 'ok', 'assertion.method');
        call_order15.push('log');
    },
    testDone: function(name, assertions){
        call_order15.push('testDone');
        assert.equal(assertions.failures, 1, 'failures');
        assert.equal(assertions.length, 1, 'total');
    }
});


// callbacks are async, so test call order after callbacks have executed
setTimeout(function(){
    assert.deepEqual(call_order1, ['test1', 'testDone']);
    assert.deepEqual(call_order2, ['test2', 'log', 'testDone']);
    assert.deepEqual(call_order3, ['test3', 'log test.ok', 'testDone']);
    assert.deepEqual(call_order4, ['test4', 'log', 'testDone']);
    assert.deepEqual(call_order5, ['test5', 'testDone']);
    //assert.deepEqual(call_order6, ['test6', 'log', 'testDone']);
    assert.deepEqual(call_order7, ['test7', 'log', 'testDone']);
    assert.deepEqual(call_order8, ['test8', 'log', 'testDone']);
    assert.deepEqual(call_order9, ['test9', 'log', 'testDone']);
    assert.deepEqual(call_order10, ['test10', 'log', 'testDone']);
    assert.deepEqual(call_order11, ['test11', 'log', 'testDone']);
    assert.deepEqual(call_order12, ['test12', 'log', 'testDone']);
    assert.deepEqual(call_order13, ['test13', 'log', 'testDone']);
    assert.deepEqual(call_order14, ['test14', 'testDone']);
    assert.deepEqual(call_order15, ['test15', 'log', 'testDone']);
    sys.puts('test-runtest OK');
}, 200);
