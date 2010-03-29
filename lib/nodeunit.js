var assert = require('assert'),
    fs = require('fs'),
    sys = require('sys');


exports.testrunner = require('./testrunner');

var assertion = function(obj){
    return {
        method: obj.method || '',
        message: obj.message || (obj.error && obj.error.message) || '',
        error: obj.error,
        passed: function(){return !this.error;},
        failed: function(){return Boolean(this.error);}
    };
};

var assertions = function(arr, duration){
    var that = arr || [];
    that.__defineGetter__('failures', function(){
        return this.reduce(function(a,x){
            return x.failed() ? a+1 : a;
        }, 0);
    });
    that.duration = duration || 0;
    return that;
};

var testEnv = function(start, options){
    var expecting;
    var a_list = [];
    options.log = options.log || function(){}; // log callback optional

    var wrapAssert = function(new_method, assert_method){
        return function(){
            try {
                assert[assert_method].apply(global, arguments);
                var message = arguments[arguments.length-1];
                var a = assertion({method:new_method, message:message});
            }
            catch (e){
                var a = assertion({method:new_method, error:e});
            }
            a_list.push(a);
            process.nextTick(function(){options.log(a)});
        };
    };

    return {
        done: function(){
            if(expecting !== undefined && expecting != a_list.length){
                var err = new Error(
                    'Expected ' + expecting + ' assertions, ' +
                    a_list.length + ' ran'
                );
                var a = assertion({method:'expect', error:err});
                a_list.push(a);
                process.nextTick(function(){options.log(a);});
            }
            var end = new Date().getTime();
            process.nextTick(function(){
                options.testDone(options.name, assertions(a_list, end-start));
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
        fn(testEnv(start, options));
    }
    catch (e){
        var end = new Date().getTime();
        var a = assertion({error:e});
        process.nextTick(function(){
            options.log(a);
            options.testDone(options.name, assertions([a], end-start));
        });
    }
};


exports.runModule = function(mod, options){
    var m_assertions = [];
    var start = new Date().getTime();
    var i = 0;
    var tests = Object.keys(mod);
    if(tests.length){
        var _fn = function(testname){
            (options.testStart || function(){})(testname);
            exports.runTest(mod[testname], {
                name: testname,
                log: options.log,
                testDone: function(name, a_list){
                    m_assertions = m_assertions.concat(a_list);
                    (options.testDone || function(){})(name, a_list);

                    i++;
                    if(i < tests.length){
                        _fn(tests[i]);
                    }
                    else {
                        var end = new Date().getTime();
                        (options.moduleDone || function(){})(
                            options.name, assertions(m_assertions, end-start)
                        );
                    }
                }
            });
        };
        _fn(tests[0] || {});
    }
    else {
        var end = new Date().getTime();
        (options.moduleDone || function(){})(
            options.name, assertions([], end-start)
        );
    }
};


exports.runFiles = function(paths, options){
    var all_assertions = [];
    var start = new Date().getTime();

    if(!paths.length){
        return options.done(assertions(all_assertions));
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

    if(!files.length){
        var end = new Date().getTime();
        (options.done || function(){})(assertions([], end-start));
        return;
    }

    var i = 0;
    var _fn = (function(file){
        options.moduleStart(file);
        exports.runModule(require(file.replace(/\.js$/, '')), {
            name: file,
            log: options.log,
            moduleStart: options.moduleStart,
            testStart: options.testStart,
            testDone: options.testDone,
            moduleDone: function(name, a_list){
                all_assertions = all_assertions.concat(a_list);
                (options.moduleDone || function(){}).apply(global, arguments);
                i++;
                if(i < files.length){
                    _fn(files[i]);
                }
                else {
                    var end = new Date().getTime();
                    options.done(assertions(all_assertions, end-start));
                }
            }
        });
    });
    _fn(files[0]);
};
