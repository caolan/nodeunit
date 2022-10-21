var assert = require('assert');

// Using a localized version of assert.
exports['first'] = function(beforeExit, assert) {
    process.nextTick(function() {
        assert.equal(assert._test.suite, 'local-assert.test.js');
        assert.equal(assert._test.title, 'first');
    });
};

// Using the broken global version of assert.
exports['second'] = function(beforeExit) {
    process.nextTick(function() {
        assert.notEqual(assert._test.suite, 'local-assert.test.js');
        assert.notEqual(assert._test.title, 'third');
    });
};

// Overwrite the testTitle in assert.
exports['third'] = function() {};
