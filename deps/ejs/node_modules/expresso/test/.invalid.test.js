/**
 * This file should never run because it begins with a .
 */

var assert = require('assert');

exports['failure'] = function() {
    assert.ok(false, "Don't run files beginning with a dot");
};
