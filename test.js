#!/usr/local/bin/node

var path = require('path'),
    fs = require('fs');

require.paths.push(process.cwd());
require.paths.push(path.join(process.cwd(), 'deps'));
require.paths.push(path.join(process.cwd(), 'lib'));

fs.readdirSync('test').filter(function(filename){
    return /\.js$/.exec(filename);
}).forEach(function(filename){
    require('test/' + filename.replace(/\.js$/,''));
});
