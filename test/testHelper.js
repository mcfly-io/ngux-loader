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

function run(resourcePath, cb) {
    var content = new Buffer('1234');
    var context = {
        resourcePath: resourcePath,
        cacheable: function() {},
        async: function() {
            return cb;
        },
        options: {
            outputDir: './test/fixture/results'
        },
        addDependency: function() {

        }
    };
    nguxLoader.call(context, content);
}

function processAndCheck(filename) {
    var pathFixture = './test/fixture';
    var pathExpectations = './test/fixture/expectations';
    var pathResults = './test/fixture/results';
    var resourcePath = path.join(pathFixture, filename + '.ngux');
    var htmlContent;
    var fileResults;
    var fileExpectations;
    return new Promise(function(resolve, reject) {
            run(resourcePath, function(err, success) {
                if (err) {
                    reject(err);
                } else {
                    resolve(success);
                }

            });
        })
        .then(function(content) {
            htmlContent = FixWindowsReturnCarriage( content);
            should.exists(htmlContent);
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
            fileResults[0].should.be.equal(htmlContent);
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
