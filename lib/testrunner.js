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
        testDone: function(test){
            if(test.passed()){
                sys.puts('✔ ' + test.name);
            }
            else {
                sys.puts(red('✖ ' + test.name) + '\n');
                test.assertions.forEach(function(assertion){
                    if(assertion.failed()){
                        sys.puts(assertion.error.stack + '\n');
                    }
                });
            }
        },
        done: function(r){
            var end = new Date().getTime();
            var duration = end - start;
            if(r.failed()){
                sys.puts(
                    '\n' + bold(red('FAILURES: ')) + r.failures + '/' +
                    r.total + ' assertions failed (' + r.duration + 'ms)'
                );
            }
            else {
                sys.puts(
                    '\n' + bold(green('OK: ')) + r.total + ' assertions (' +
                    r.duration + 'ms)'
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
