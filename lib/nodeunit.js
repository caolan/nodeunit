var assert = require('assert'),
    fs = require('fs'),
    sys = require('sys');


exports.testrunner = require('./testrunner');

var Assertion = function(method, message, error){
    return {
        method: method,
        message: message || '',
        error: error,
        passed: function(){return !error;},
        failed: function(){return Boolean(error);}
    };
};

var TestEnv = function(start, options){
    var expecting;
    var assertions = [];
    options.log = options.log || function(){}; // log callback optional

    var wrapAssert = function(new_method, assert_method){
        return function(){
            try {
                assert[assert_method].apply(global, arguments);
                var message = arguments[arguments.length-1];
                var assertion = new Assertion(new_method, message);
            }
            catch (e){
                var assertion = new Assertion(new_method, e.message || '', e);
            }
            assertions.push(assertion);
            process.nextTick(function(){options.log(assertion)});
        };
    };

    return {
        done: function(){
            if(expecting !== undefined && expecting != assertions.length){
                var err = new Error(
                    'Expected ' + expecting + ' assertions, ' +
                    assertions.length + ' ran'
                );
                var assertion = new Assertion('expect', err.message, err);
                assertions.push(assertion);
                process.nextTick(function(){options.log(assertion);});
            }
            var failures = assertions.reduce(function(a,x){
                return x.failed() ? a+1 : a;
            }, 0);
            var end = new Date().getTime();
            process.nextTick(function(){
                options.testDone({
                    failures: failures,
                    total: assertions.length,
                    duration: end - start,
                    assertions: assertions
                });
            });
        },
        ok: wrapAssert('ok', 'ok'),
        same: wrapAssert('same', 'deepEqual'),
        equals: wrapAssert('equals', 'equal'),
        expect: function(num){
            expecting = num;
        }
    };
};


exports.runTest = function(fn, options){
    options.log = options.log || function(){}; // log callback optional
    var start = new Date().getTime();
    try {
        fn(new TestEnv(start, options));
    }
    catch (e){
        var end = new Date().getTime();
        var assertion = new Assertion('', e.message || '', e);
        process.nextTick(function(){options.log(assertion)});
        process.nextTick(function(){
            options.testDone({
                failures: 1,
                total: 1,
                duration: end - start,
                assertions: [assertion]
            });
        });
    }
};


exports.runModule = function(mod, options){
    var m_failures = 0;
    var m_total = 0;
    var i = 0;
    var tests = Object.keys(mod);
    var _fn = function(testname){
        (options.testStart || function(){})(testname);
        exports.runTest(mod[testname], {
            log: options.log,
            testDone: function(test){
                m_failures += test.failures;
                m_total += test.total;
                (options.testDone || function(){})(test);

                i++;
                if(i < tests.length){
                    _fn(tests[i]);
                }
                else {
                    (options.moduleDone || function(){})(m_failures, m_total);
                }
            }
        });
    };
    _fn(tests[0] || {});
};


exports.runFiles = function(paths, options){
    var failures = 0;
    var total = 0;

    if(!paths.length) return options.done(0,0);

    var files = paths.reduce(function(a,p){
        var stats = fs.statSync(p);
        if(stats.isFile()){
            return a.concat([p]);
        }
        else if(stats.isDirectory()){
            return a.concat(fs.readdirSync(p).filter(function(filename){
                return /\.js$/.exec(filename);
            }).map(function(filename){
                return [p, filename].join('/');
            }));
        }
    }, []);

    var i = 0;
    var _fn = (function(file){
        options.moduleStart(file);
        exports.runModule(require(file.replace(/\.js$/, '')), {
            log: options.log,
            moduleStart: options.moduleStart,
            testStart: options.testStart,
            testdone: options.testDone,
            moduleDone: function(f, t){
                failures += f;
                total += t;
                (options.moduleDone || function(){}).apply(global, arguments);
                i++;
                if(i < files.length){
                    _fn(files[i]);
                }
                else {
                    options.done(failures, total);
                }
            }
        });
    });
    _fn(files[0]);
};
