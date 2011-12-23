var assert = require('assert');
var spawn = require('child_process').spawn;

exports['early exit'] = function(beforeExit) {
    var completed = false;

    var proc = spawn('bin/expresso', ['test/earlyexit/forever.test.js', '--port', '23444']);
    proc.on('exit', function(code) {
        completed = true;
        assert.equal(1, code, "assert.response didn't report an error while still running");
    });

    setTimeout(function() {
        proc.kill('SIGINT');
    }, 1000);

    // Also kill the child if it still exists.
    beforeExit(function() {
        proc.kill();
        assert.ok(completed);
    });
};