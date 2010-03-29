var assert = require('assert'),
    sys = require('sys'),
    fs = require('fs'),
    path = require('path'),
    nodeunit = require('nodeunit');


process.chdir(__dirname);
require.paths.push(__dirname);
var mock_module1 = require('./fixtures/mock_module1');
var mock_module2 = require('./fixtures/mock_module2');
var mock_module3 = require('./fixtures/dir/mock_module3');
var mock_module4 = require('./fixtures/dir/mock_module4');



// copy runModule
var runModule_copy = nodeunit.runModule;

var call_order = [];
var runModule_calls = [];
var modules = [];

var opts = {
    moduleStart: function(){
        call_order.push('moduleStart');
    },
    testDone: function(){return 'testDone';},
    testStart: function(){return 'testStart';},
    log: function(){return 'log';},
    done: function(assertions){
        call_order.push('done');
        assert.equal(assertions.failures, 0, 'failures');
        assert.equal(assertions.length, 4, 'length');
        assert.ok(typeof assertions.duration == "number");
    }
};

nodeunit.runModule = function(mod, options){
    assert.equal(options.testDone, opts.testDone);
    assert.equal(options.testStart, opts.testStart);
    assert.equal(options.log, opts.log);
    assert.ok(typeof options.name == "string");
    call_order.push('runModule');
    runModule_calls.push(mod);
    var m = [{failed: function(){return false;}}];
    modules.push(m);
    options.moduleDone(options.name, m);
};

nodeunit.runFiles(
    ['fixtures/mock_module1.js','fixtures/mock_module2.js','fixtures/dir'],
    opts
);

var runfiles_empty_called = false;
nodeunit.runFiles([], {
    moduleStart: function(){assert.ok(false, 'should not be called');},
    testDone: function(){assert.ok(false, 'should not be called');},
    testStart: function(){assert.ok(false, 'should not be called');},
    log: function(){assert.ok(false, 'should not be called');},
    done: function(assertions){
        assert.equal(assertions.failures, 0, 'failures');
        assert.equal(assertions.length, 0, 'length');
        assert.ok(typeof assertions.duration == "number");
        runfiles_empty_called = true;
    }
});


var dir2 = __dirname + '/fixtures/dir2';
var runfiles_emptydir_called = false;

// git doesn't like empty directories, so we have to create one
path.exists(dir2, function(exists){
    if(!exists) fs.mkdirSync(dir2, 0777);

    // runFiles on empty directory:
    nodeunit.runFiles([dir2], {
        moduleStart: function(){assert.ok(false, 'should not be called');},
        testDone: function(){assert.ok(false, 'should not be called');},
        testStart: function(){assert.ok(false, 'should not be called');},
        log: function(){assert.ok(false, 'should not be called');},
        done: function(assertions){
            assert.equal(assertions.failures, 0, 'failures');
            assert.equal(assertions.length, 0, 'length');
            assert.ok(typeof assertions.duration == "number");
            runfiles_emptydir_called = true;
        }
    });
});

// restore runModule function
nodeunit.runModule = runModule_copy;

setTimeout(function(){

    assert.deepEqual(call_order, [
        'moduleStart', 'runModule', 'moduleStart', 'runModule', 'moduleStart',
        'runModule', 'moduleStart', 'runModule', 'done'
    ], 'call_order');

    var called_with = function(name){
        return runModule_calls.some(function(m){
            return m.name == name;
        });
    };
    assert.ok(called_with('mock_module1'), 'mock_module1 ran');
    assert.ok(called_with('mock_module2'), 'mock_module2 ran');
    assert.ok(called_with('mock_module3'), 'mock_module3 ran');
    assert.ok(called_with('mock_module4'), 'mock_module4 ran');
    assert.equal(runModule_calls.length, 4);

    assert.ok(runfiles_empty_called);
    assert.ok(runfiles_emptydir_called);

    sys.puts('test-runfiles OK');

}, 100);
