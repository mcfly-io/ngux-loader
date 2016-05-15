'use strict';

global.Promise = require('bluebird');
var path = require('path');
var should = require('should');
var fs = require('fs');
var os = require('os');
var nguxLoader = require('../');

function FixWindowsReturnCarriage(content) {
    if (!content) {
        return content;
    }
    if (os.platform() === 'win32') {
        content = content.replace(/\r\n/g, '\n');
    }
    return content;
}

function readFile(filename) {
    return new Promise(function(resolve, reject) {
        fs.readFile(filename, 'utf-8', function(err, data) {
            if (err) {
                reject(err);
            } else {
                resolve(FixWindowsReturnCarriage(data));
            }
        });
    });
}

function readFiles(folder, name) {
    return Promise.all([
        readFile(path.join(folder, name + '.html')),
        readFile(path.join(folder, name + '.js')),
        readFile(path.join(folder, name + '.g.ux'))
    ]);
}

function run(context) {
    var content = new Buffer('1234');
    nguxLoader.call(context, content);
}

function processAndCheck(filename, testConfig) {
    testConfig = testConfig || {
        subdir: '', // no subdir, look directly in pathResults for files
        skipClean: true, // do not clean up gnerated files so tests can read them
        useOutput: true // put generated files in pathResults
    };
    var pathFixture = './test/fixture';
    var pathExpectations = './test/fixture/expectations';
    var pathResults = './test/fixture/results';
    var resourcePath = path.join(pathFixture, filename + '.ngux');
    var moduleContent;
    var fileResults;
    var fileExpectations;
    return new Promise(function(resolve, reject) {
            var context = {
                resourcePath: resourcePath,
                cacheable: function() {},
                async: function() {
                    return function(err, success) {
                        if (err) {
                            reject(err);
                        } else {
                            resolve(success);
                        }
                    };
                },
                options: {
                    context: pathFixture,
                    output: {
                        path: pathResults
                    }
                },
                addDependency: function() {

                },
                testConfig: testConfig,
                test: true,
                emitFile: function(path, content) {

                },
                emitError: function(msg) {
                    throw new Error(msg);
                },
                emitWarning: function(msg) {

                }
            };

            run(context);
        })
        .then(function(content) {
            moduleContent = FixWindowsReturnCarriage(content);
            should.exists(moduleContent);
        })
        .then(function() {
            // return result files
            return readFiles(pathResults, filename);
        })
        .then(function(files) {
            // assign result files
            fileResults = files;
        })
        .then(function() {
            // return expected files
            return readFiles(pathExpectations, filename);
        })
        .then(function(files) {
            // assign expected files
            fileExpectations = files;
        })
        .then(function() {
            // check that return result from the loader is html
            moduleContent.should.be.equal(fileResults[1] + '; module.exports = ' + JSON.stringify(fileResults[0]) + ';');
        })
        .then(function() {
            // check that all files are identical to expected
            fileExpectations.forEach(function(f, index) {
                f.should.be.equal(fileResults[index]);
            });
        });

}

module.exports = {
    processAndCheck: processAndCheck
};
