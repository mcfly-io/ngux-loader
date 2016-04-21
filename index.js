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

    // if (loaderOptions.subdir) {
    //     outputDir = path.join(outputDir, loaderOptions.subdir);
    // }

    // make sure that the subdir is a truthy so we can remove it 
    outputDir = path.join(outputDir, this.options.subdir ||  loaderOptions.subdir || 'ngux'); 
    if (this.options.outputDir || loaderOptions.outputDir) {
        outputDir = this.options.outputDir || loaderOptions.outputDir;
    }
    exec((os.platform() === 'win32' ? '' : 'mono ') + folder + ' ' + resourcePath + ' ' + outputDir, function(err, stdout, stderr) {
        if (err) {
            callback(err);
            return;
        }
        //causes infinite loop so is deactivated those 2 lines
        //this.addDependency(path.resolve(htmlPath));
        //this.addDependency(path.resolve(jsPath));

        var htmlPath = getOutputPath(resourcePath, outputDir, '.html');
        var jsPath = getOutputPath(resourcePath, outputDir, '.js');
        var uxPath = getOutputPath(resourcePath, outputDir, '.g.ux');
        var uxName = path.basename(uxPath);
        var resourceDir = path.dirname(resourcePath);
        var uxContext = path.relative(this._compilation.options.context, path.join(resourceDir, uxName));
        fs.readFile(htmlPath, 'utf-8', function(err, htmlContent) {
            fs.readFile(jsPath, 'utf-8', function(err, jsContent) {
                fs.readFile(uxPath, null, function(err, uxContent) {
                    this.emitFile(uxContext, uxContent);
                    fs.rmdir(outputDir, null, function(err) {
                        callback(null, jsContent + '; module.exports = ' + JSON.stringify(htmlContent) + ';');
                    }.bind(this));
                }.bind(this));
            }.bind(this));
        }.bind(this));
    }.bind(this));
};