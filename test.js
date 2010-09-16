#!/usr/local/bin/node

var testrunner = require('./lib/nodeunit').testrunner;

process.chdir(__dirname);
testrunner.run(['test']);
