/*!
 * Nodeunit
 * Copyright (c) 2010 Caolan McMahon
 * MIT Licensed
 */

/**
 * Module dependencies
 */

var
  async = require('../deps/async'),
  types = require('./types'),
  utils = require('./utils'),
  path = require('path');


/**
 * Export sub-modules.
 */

exports.testrunner = require('./testrunner');
exports.types = types;
exports.utils = utils;


/**
 * Runs a test function (fn) from a loaded module. After the test function
 * calls test.done(), the callback is executed with an assertionList as its
 * second argument.
 *
 * @param {String} name
 * @param {Function} fn
 * @param {Object} opt
 * @param {Function} callback
 * @api public
 */

exports.runTest = function (name, fn, opt, callback) {
  var
    options = types.options(opt),
    start,
    test;

  options.testStart(name);
  start = new Date().getTime();
  test = types.test(name, start, options, callback);

  try {
    fn(test);
  }
  catch (e) {
    test.done(e);
  }
};

/**
 * Takes an object containing test functions or other test suites as properties
 * and runs each in series. After all tests have completed, the callback is
 * called with a list of all assertions as the second argument.
 *
 * If a name is passed to this function it is prepended to all test and suite
 * names that run within it.
 *
 * @param {String} name
 * @param {Object} suite
 * @param {Object} opt
 * @param {Function} callback
 * @api public
 */

exports.runSuite = function (name, suite, opt, callback) {
  var keys = Object.keys(suite);

  async.concatSeries(keys, function (k, cb) {
    var
      prop = suite[k],
      n = name ? name + ' - ' + k: k;

    if (typeof prop === 'function') {
      exports.runTest(n, suite[k], opt, cb);
    }
    else {
      exports.runSuite(n, suite[k], opt, cb);
    }
  }, callback);
};

/**
 * Run each exported test function or test suite from a loaded module.
 *
 * @param {String} name
 * @param {Object} mod
 * @param {Object} opt
 * @param {Function} callback
 * @api public
 */

exports.runModule = function (name, mod, opt, callback) {
  var
    options = types.options(opt),
    start;

  options.moduleStart(name);
  start = new Date().getTime();

  exports.runSuite(null, mod, opt, function (err, a_list) {
    var
      end = new Date().getTime(),
      assertion_list = types.assertionList(a_list, end - start);
    options.moduleDone(name, assertion_list);
    callback(null, a_list);
  });
};

/**
 * Load modules from paths array and run all exported tests in series. If a path
 * is a directory, load all supported file types inside it as modules. This only
 * reads 1 level deep in the directory and does not recurse through
 * sub-directories.
 *
 * @param {Array} paths
 * @param {Object} opt
 * @api public
 */

exports.runFiles = function (paths, opt) {
  var
    all_assertions = [],
    options = types.options(opt),
    start = new Date().getTime();

  if (!paths.length) {
    return options.done(types.assertionList(all_assertions));
  }

  utils.modulePaths(paths, function (err, files) {
    async.concatSeries(files, function (file, cb) {
      var name = path.basename(file);
      exports.runModule(name, require(file), options, cb);
    },
    function (err, all_assertions) {
      var end = new Date().getTime();
      options.done(types.assertionList(all_assertions, end - start));
    });
  });

};

/**
 * Utility for wrapping a suite of test functions with setUp and tearDown
 * functions.
 *
 * @param {Object} suite
 * @return {Object}
 * @api public
 */

exports.testCase = function (suite) {
  var
    tests = {},
    setUp = suite.setUp,
    tearDown = suite.tearDown,
    keys;
  delete suite.setUp;
  delete suite.tearDown;

  keys = Object.keys(suite);

  return keys.reduce(function (tests, k) {
    tests[k] = function (test) {
      var context = {}, done;
      if (setUp) {
        setUp.call(context);
      }
      if (tearDown) {
        done = test.done;
        test.done = function (err) {
          tearDown.call(context);
          done(err);
        };
      }
      suite[k].call(context, test);
    };

    return tests;
  }, {});
};
