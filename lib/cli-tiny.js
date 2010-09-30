var testrunner = require('./testrunner-tiny'),
    fs = require('fs');

require.paths.push(process.cwd());
var args = process.ARGV.slice(2);

// load package.json and read version number
if (args.length === 1 && (args[0] === '-v' || args[0] === '--version')) {
    fs.readFile(__dirname + '/../package.json', function (err, content) {
        if (err) {
            throw err;
        }
        else {
            var pkg = JSON.parse(content);
            console.log(pkg.version);
        }
    });
    return;
}

testrunner.run(args);
