var http = require('http');
var assert = require('assert');
var server = http.createServer(function(req, res) { /* Never send a response */ });

exports['assert.response'] = function() {
    // This will keep running for a while because the server never returns.
    assert.response(server, { url: '/' }, { status: 200 });
};
