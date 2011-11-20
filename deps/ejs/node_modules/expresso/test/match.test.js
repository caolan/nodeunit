var assert = require('assert');
var spawn = require('child_process').spawn;

module.exports = {
  'will run only matched tests': function() {
    var proc = spawn('bin/expresso', ['-m', 'p..s', 'test/match/test.js']);
    proc.on('exit', function(code) {
        completed = true;
        assert.equal(0, code, 'failing test was not filtered out');
    });
    setTimeout(function() {
        proc.kill('SIGINT');
    }, 1000);
  },
  'will run tests matched in a subsequent expression': function() {
    var proc = spawn('bin/expresso', ['-m', 'nothing', '--match', 'p..s', 'test/match/test.js']);
    proc.on('exit', function(code) {
        completed = true;
        assert.equal(0, code, 'failing test was not filtered out');
    });
    setTimeout(function() {
        proc.kill('SIGINT');
    }, 1000);
  },
};