/*!
 * Nodeunit
 * Copyright (c) 2010 Caolan McMahon
 * MIT Licensed
 *
 * THIS FILE SHOULD BE BROWSER-COMPATIBLE JS!
 * You can use @REMOVE_LINE_FOR_BROWSER to remove code from the browser build.
 * Only code on that line will be removed, its mostly to avoid requiring code
 * that is node specific
 */


/**
 * NOTE: this test runner is not listed in index.js because it cannot be
 * used with the command-line tool, only inside the browser.
 */


/**
 * Reporter info string
 */

exports.info = "Browser-based test reporter";


exports.addStyles = function () {
    document.body.innerHTML += '<style type="text/css">' +
        'body { font: 12px Helvetica Neue }' +
        'h2 { margin:0 ; padding:0 }' +
        'pre {' +
            'font: 11px Andale Mono;' +
            'margin-left: 1em;' +
            'padding-left: 1em;' +
            'margin-top: 0;' +
            'font-size:smaller;' +
        '}' +
        '.assertion_message { margin-left: 1em; }' +
        '  ol {' +
            'list-style: none;' +
            'margin-left: 1em;' +
            'padding-left: 1em;' +
            'text-indent: -1em;' +
        '}' +
        '  ol li.pass:before { content: "\\2714 \\0020"; }' +
        '  ol li.fail:before { content: "\\2716 \\0020"; }' +
    '</style>';
};


/**
 * Run all tests within each module, reporting the results
 *
 * @param {Array} files
 * @api public
 */

exports.run = function (modules, options) {
    var start = new Date().getTime();
    exports.addStyles();

    var results, module;

    results = document.createElement('div');
    results.id = 'results';
    document.body.appendChild(results);

    nodeunit.runModules(modules, {
        moduleStart: function (name) {
            var mheading = document.createElement('h2');
            mheading.innerText = name;
            results.appendChild(mheading);
            module = document.createElement('ol');
            results.appendChild(module);
        },
        testDone: function (name, assertions) {
            var test = document.createElement('li');
            if (!assertions.failures()) {
                test.className = 'pass';
                test.innerText = name;
            }
            else {
                test.className = 'fail';
                var html = name;
                for (var i=0; i<assertions.length; i++) {
                    var a = assertions[i];
                    if (a.failed()) {
                        if (a.error instanceof assert.AssertionError && a.message) {
                            html += '<div class="assertion_message">' +
                                'Assertion Message: ' + a.message +
                            '</div>';
                        }
                        html += '<pre>';
                        html += a.error.stack || a.error;
                        html += '</pre>';
                    }
                };
                test.innerHTML = html;
            }
            module.appendChild(test);
        },
        done: function (assertions) {
            var end = new Date().getTime();
            var duration = end - start;

            var summary = document.createElement('h3');
            if (assertions.failures()) {
                summary.innerText = 'FAILURES: '  + assertions.failures() +
                    '/' + assertions.length + ' assertions failed (' +
                    assertions.duration + 'ms)';
            }
            else {
                summary.innerText = 'OK: ' + assertions.length +
                    ' assertions (' + assertions.duration + 'ms)';
            }
            document.body.appendChild(summary);
        }
    });
};
