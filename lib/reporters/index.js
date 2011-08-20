module.exports = {
    'junit': require('./junit'),
    'default': require('./default'),
    'skip_passed': require('./skip_passed'),
    'minimal': require('./minimal'),
    'html': require('./html')

    // inline not listed since it should only run as part of a self-contained
    // script

    // browser test reporter is not listed because it cannot be used
    // with the command line tool, only inside a browser.
};
