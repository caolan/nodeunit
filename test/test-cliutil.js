var cliutil = require('../lib/utils').cliutil;

exports.testCLIUtilBasic = function (test) {
    cliutil(
        './bin/nodeunit',
        ['./test/fixtures/raw_jscode1.js'],
        {
            stdout: new RegExp('\u001b\\[1m\u001b\\[32mOK: \u001b\\[39m\u001b\\[22m0 assertions'),
            stderr: '',
            exitCode: 0
        },
        test
    );
};

exports.testCLIUtilError = function (test) {
    cliutil(
        './abc',
        [],
        {
            stdout: '',
            stderr: 'execvp(): No such file or directory\n',
            exitCode: 127
        },
        test
    );
};
