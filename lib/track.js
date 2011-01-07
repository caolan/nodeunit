/*!
 * Simple util module to track tests. Adds a process.exit hook to print the undone tests.
 */
var sys = require('sys');
var track = {
    names : {},
    put : function (testname) {
        this.names[testname] = testname;
    },
    remove : function (testname) {
        delete this.names[testname];
    },
    printnames : function () {        
        for(i in this.names) {
            sys.puts(i)
        }
    }
};

process.on('exit', function() {
    sys.puts('Undone tests (or their setups/teardowns): '); 
    track.printnames(); 
});

exports.track = track;