var assert = require('assert');


var Assertion = function(method, message, error){
    return {
        method: method,
        message: message || '',
        error: error,
        passed: function(){return !error;},
        failed: function(){return Boolean(error);}
    };
};

var TestEnv = function(options){
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
                var assertion = new Assertion('', e.message || '', e);
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
            process.nextTick(function(){
                options.testDone(failures, assertions.length);
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
    try {
        fn(new TestEnv(options));
    }
    catch (e){
        var assertion = new Assertion('', e.message || '', e);
        process.nextTick(function(){options.log(assertion)});
        process.nextTick(function(){options.testDone(1, 1)});
    }
};


exports.runModule = function(mod, options){
    var m_failures = 0;
    var m_total = 0;
    var i = 0;
    var tests = Object.keys(mod).map(function(k){return mod[k];});
    var _fn = function(test){
        (options.testStart || function(){})(test);
        exports.runTest(test, {
            log: options.log,
            testDone: function(failures, total){

                m_failures += failures;
                m_total += total;
                (options.testDone || function(){})(failures, total);

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
    _fn(tests[0]);
};
