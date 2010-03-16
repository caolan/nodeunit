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
            var end = new Date().getTime();
            assertions.__defineGetter__('failures', function(){
                return this.reduce(function(a,x){
                    return x.failed() ? a+1 : a;
                }, 0);
            });
            assertions.duration = end - start;
            process.nextTick(function(){
                options.testDone(options.name, assertions);
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
        var assertions = [assertion];
        assertions.failures = 1;
        assertions.duration = end - start;
        process.nextTick(function(){options.log(assertion)});
        process.nextTick(function(){
            options.testDone(options.name, assertions);
        });
    }
};


exports.runModule = function(mod, options){
    var m_assertions = [];
    var start = new Date().getTime();
    var i = 0;
    var tests = Object.keys(mod);
    var _fn = function(testname){
        (options.testStart || function(){})(testname);
        exports.runTest(mod[testname], {
            name: testname,
            log: options.log,
            testDone: function(name, assertions){
                m_assertions = m_assertions.concat(assertions);
                (options.testDone || function(){})(name, assertions);

                i++;
                if(i < tests.length){
                    _fn(tests[i]);
                }
                else {
                    var end = new Date().getTime();
                    m_assertions.__defineGetter__('failures', function(){
                        return this.reduce(function(a,x){
                            return x.failed() ? a+1 : a;
                        }, 0);
                    });
                    m_assertions.duration = end - start;
                    (options.moduleDone || function(){})(
                        options.name, m_assertions
                    )
                }
            }
        });
    };
    _fn(tests[0] || {});
};


exports.runFiles = function(paths, options){
    var all_assertions = [];
    var start = new Date().getTime();

    if(!paths.length){
        all_assertions.failures = 0;
        all_assertions.duration = 0;
        return options.done(all_assertions);
    }

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
            name: file,
            log: options.log,
            moduleStart: options.moduleStart,
            testStart: options.testStart,
            testDone: options.testDone,
            moduleDone: function(name, assertions){
                all_assertions = all_assertions.concat(assertions);
                (options.moduleDone || function(){}).apply(global, arguments);
                i++;
                if(i < files.length){
                    _fn(files[i]);
                }
                else {
                    var end = new Date().getTime();
                    all_assertions.__defineGetter__('failures', function(){
                        return this.reduce(function(a,x){
                            return x.failed() ? a+1 : a;
                        }, 0);
                    });
                    all_assertions.duration = end - start;
                    options.done(all_assertions);
                }
            }
        });
    });
    _fn(files[0]);
};
