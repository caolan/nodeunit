exports.name = 'mock_module3';

exports.setUp = function (next) {
    this.foo = 'bar';
    next();
};

exports.testFoo = function (test) {
    test.equal(this.foo, 'bar');
    test.done();
};

exports.tearDown = function (next) {
    this.foo = 'baz';
    next();
};
