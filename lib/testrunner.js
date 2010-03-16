var nodeunit = require('./nodeunit'),
    sys = require('sys');



exports.run = function(files){

    var red   = function(str){return "\033[31m" + str + "\033[39m"};
    var green = function(str){return "\033[32m" + str + "\033[39m"};
    var bold  = function(str){return "\033[1m" + str + "\033[22m"};

    var start = new Date().getTime();

    nodeunit.runFiles(files, {
        moduleStart: function(name){
            sys.puts('\n' + bold(name));
        },
        testDone: function(name, assertions){
            if(!assertions.failures){
                sys.puts('✔ ' + name);
            }
            else {
                sys.puts(red('✖ ' + name) + '\n');
                assertions.forEach(function(assertion){
                    if(assertion.failed()){
                        sys.puts(assertion.error.stack + '\n');
                    }
                });
            }
        },
        done: function(assertions){
            var end = new Date().getTime();
            var duration = end - start;
            if(assertions.failures){
                sys.puts(
                    '\n' + bold(red('FAILURES: ')) + assertions.failures +
                    '/' + assertions.length + ' assertions failed (' +
                    assertions.duration + 'ms)'
                );
            }
            else {
                sys.puts(
                    '\n' + bold(green('OK: ')) + assertions.length +
                    ' assertions (' + assertions.duration + 'ms)'
                );
            }
        }
    });
};

// If this is run from the command-line:
if(module.id === '.'){
    require.paths.push(process.cwd());
    var args = process.ARGV.slice(2);
    exports.run(args);
}
