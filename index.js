'use strict';
var path = require('path');
var fs = require('fs');
var os = require('os');
var loaderUtils = require('loader-utils');

var getOutputPath = function(filename, outputDir, extension) {
    var res = path.join(outputDir, path.basename(filename));
    if (extension) {
        var oldextension = path.extname(res);
        res = res.replace(oldextension, extension);
    }
    return res;
};

module.exports = function(content) {
    this.cacheable();
    var callback = this.async();
    var folder = path.resolve(__dirname, 'bin', 'ngux', 'NGUX.exe');
    var resourcePath = this.resourcePath;

    var exec = require('child_process').exec;
    var outputDir = path.dirname(resourcePath);
    var loaderOptions = loaderUtils.parseQuery(this.query);
    if (loaderOptions.subdir) {
        outputDir = path.join(outputDir, loaderOptions.subdir);
    }
    if (this.options.outputDir) {
        outputDir = this.options.outputDir;
    }
    exec((os.platform() === 'win32' ? '' : 'mono ') + folder + ' ' + resourcePath + ' ' + outputDir, function(err, stdout, stderr) {
        if (err) {
            callback(err);
            return;
        }
        var htmlPath = getOutputPath(resourcePath, outputDir, '.html');
        //var jsPath = getOutputPath(resourcePath, outputDir, '.js');

        // causes infinite loop so i deactivated those 2 lines
        //this.addDependency(path.resolve(htmlPath));
        //this.addDependency(path.resolve(jsPath));
        fs.readFile(htmlPath, 'utf-8', function(err, htmlContent) {
            callback(null, htmlContent);
        });
    }.bind(this));
};
