var nodeunit = require('./nodeunit'),
    sys = require('sys');


var showResult = function(failures, total){
    if(failures){
        sys.puts('\nFAILURES: ' + failures + '/' + total + ' failed.');
    }
    else {
        sys.puts('\nOK');
    }
};

exports.run = function(files){
    nodeunit.runFiles(files, {
        moduleStart: function(name){
            sys.puts('\n== ' + name + ' ==');
        },
        testStart: function(name){
            sys.puts('- ' + name);
        },
        log: function(assertion){
            if(assertion.failed()){
                sys.puts(assertion.error.stack);
            }
        },
        done: showResult
    });
};

// If this is run from the command-line:
if(module.id === '.'){
    require.paths.push(process.cwd());
    var args = process.ARGV.slice(2);
    exports.run(args);
}
