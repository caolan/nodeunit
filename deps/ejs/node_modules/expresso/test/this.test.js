/**
 * This.
 */

module.exports = {
    'test this': function(beforeExit, assert) {
        assert.equal(this.suite, 'this.test.js');
        assert.equal(this.title, 'test this');
        assert.ok(this.assert);

        var exiting = false;
        this.on('exit', function() {
            exiting = true;
        });

        beforeExit(function() {
            assert.ok(exiting);
        });
    }
};