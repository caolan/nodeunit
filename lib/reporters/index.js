module.exports = {
    'junit': require('./junit'),
    'default': require('./default'),
    'skip_passed': require('./skip_passed'),
    'minimal': require('./minimal'),
    'html': require('./html'),
    'verbose' : require('./verbose')
    // browser test reporter is not listed because it cannot be used
    // with the command line tool, only inside a browser.
};
