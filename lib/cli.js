var testrunner = require('./testrunner'),
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

var options;
// check for --config argument
if (args[0] === '--config' || args[0].slice(0, 9) === "--config=") {
    var config_file;
    if (args[0] === '--config') {
      config_file = args[1];
      args = args.slice(2);
    } else {
      config_file = args[0].slice(9);
      args = args.slice(1);
    }

    eval(fs.readFileSync(config_file, 'utf8'));
    if (typeof options === 'undefined') {
        sys.puts("Error: there's no `options` variable in the config file.");
        process.exit(1);
    }
}

testrunner.run(args, options);

