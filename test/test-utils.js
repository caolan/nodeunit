var utils = require('../lib/utils');

var root = __dirname + '/fixtures/nested_dirs/';

exports.readDir = function (test) {
    utils.readDirMaybeRecursive(root, false, function (err, files) {
        if (err) {
            throw  err;
        }

        test.same(
            files.sort(),
            [root + 'nd.js'],
            'readDirMaybeRecursive(false) ok'
        );
        test.done();
    });
};

exports.readDirRecursive = function (test) {
    utils.readDirMaybeRecursive(root, true, function (err, files) {
        if (err) {
            throw err;
        }

        test.same(
            files.sort(),
            [root + 'a/a1.js', root + 'a/a2.js', root + 'b/b1.js', root + 'c/not_a_js.file', root + 'nd.js'],
            'readDirMaybeRecursive(true) ok'
        );
        test.done();
    });
};

//delete(exports.readDirMaybeRecursiveTrue);

exports.modulePaths = function (test) {
    utils.modulePaths([root], false, function (err, paths) {
        if (err) {
            throw err;
        }

        test.same(
            paths,
            [root + 'nd'],
            'modulePaths(false) ok'
        );
        test.done();
    });
};

exports.modulePathsRecursive = function (test) {
    utils.modulePaths([root], true, function (err, paths) {
        if (err) {
            throw err;
        }

        test.same(
            paths,
            [root + 'a/a1', root + 'a/a2', root + 'b/b1', root + 'nd'],
            'modulePaths(true) ok'
        );
        test.done();
    });
};
