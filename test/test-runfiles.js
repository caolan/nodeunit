var assert = require('assert'),
    sys = require('sys'),
    fs = require('fs'),
    path = require('path'),
    nodeunit = require('nodeunit');


var setup = function(fn){
    return function(test){
        process.chdir(__dirname);
        require.paths.push(__dirname);
        var env = {
            mock_module1: require('./fixtures/mock_module1'),
            mock_module2: require('./fixtures/mock_module2'),
            mock_module3: require('./fixtures/dir/mock_module3'),
            mock_module4: require('./fixtures/dir/mock_module4')
        }
        fn.call(env, test)
    };
};


exports.testRunFiles = setup(function(test){
    test.expect(28);
    var runModule_copy = nodeunit.runModule;

    var runModule_calls = [];
    var modules = [];

    var opts = {
        moduleStart: function(){
            test.ok(true, 'moduleStart called');
        },
        testDone: function(){return 'testDone';},
        testStart: function(){return 'testStart';},
        log: function(){return 'log';},
        done: function(assertions){
            test.equals(assertions.failures, 0, 'failures');
            test.equals(assertions.length, 4, 'length');
            test.ok(typeof assertions.duration == "number");

            var called_with = function(name){
                return runModule_calls.some(function(m){
                    return m.name == name;
                });
            };
            test.ok(called_with('mock_module1'), 'mock_module1 ran');
            test.ok(called_with('mock_module2'), 'mock_module2 ran');
            test.ok(called_with('mock_module3'), 'mock_module3 ran');
            test.ok(called_with('mock_module4'), 'mock_module4 ran');
            test.equals(runModule_calls.length, 4);

            nodeunit.runModule = runModule_copy;
            test.done();
        }
    };

    nodeunit.runModule = function(mod, options){
        test.equals(options.testDone, opts.testDone);
        test.equals(options.testStart, opts.testStart);
        test.equals(options.log, opts.log);
        test.ok(typeof options.name == "string");
        runModule_calls.push(mod);
        var m = [{failed: function(){return false;}}];
        modules.push(m);
        options.moduleDone(options.name, m);
    };

    nodeunit.runFiles(
        ['fixtures/mock_module1.js','fixtures/mock_module2.js','fixtures/dir'],
        opts
    );
});

exports.testRunFilesEmpty = function(test){
    test.expect(3);
    nodeunit.runFiles([], {
        moduleStart: function(){
            test.ok(false, 'should not be called');
        },
        testDone: function(){
            test.ok(false, 'should not be called');
        },
        testStart: function(){
            test.ok(false, 'should not be called');
        },
        log: function(){
            test.ok(false, 'should not be called');
        },
        done: function(assertions){
            test.equals(assertions.failures, 0, 'failures');
            test.equals(assertions.length, 0, 'length');
            test.ok(typeof assertions.duration == "number");
            test.done();
        }
    });
};


exports.testEmptyDir = function(test){
    var dir2 = __dirname + '/fixtures/dir2';

    // git doesn't like empty directories, so we have to create one
    path.exists(dir2, function(exists){
        if(!exists) fs.mkdirSync(dir2, 0777);

        // runFiles on empty directory:
        nodeunit.runFiles([dir2], {
            moduleStart: function(){
                test.ok(false, 'should not be called');
            },
            testDone: function(){
                test.ok(false, 'should not be called');
            },
            testStart: function(){
                test.ok(false, 'should not be called');
            },
            log: function(){
                test.ok(false, 'should not be called');
            },
            done: function(assertions){
                test.equals(assertions.failures, 0, 'failures');
                test.equals(assertions.length, 0, 'length');
                test.ok(typeof assertions.duration == "number");
                test.done();
            }
        });
    });
};
/*
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
*/
