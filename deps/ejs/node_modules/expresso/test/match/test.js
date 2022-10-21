var assert = require('assert'); 

module.exports = {
  'this test will pass': function() {
    assert.ok(true);
  },
  'this test will fail': function() {
    assert.ok(false);
  },
}