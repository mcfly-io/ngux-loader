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
    outputDir = path.join(outputDir, this.options.subdir || loaderOptions.subdir || 'ngux');
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
        var res = {
            html: null,
            js: null,
            make: function(js, html) {
                return js + '; module.exports = ' + JSON.stringify(html) + ';'
            }
        };
        fs.readFile(htmlPath, 'utf-8', function(err, htmlContent) {
            if (err) {
                throw err;
                // this._compilation.errors.push(err);
            }
            res.html = htmlContent;
            fs.readFile(jsPath, 'utf-8', function(err, jsContent) {
                if (err) {
                    throw err;
                    // this._compilation.errors.push(err);
                }
                res.js = jsContent;
                fs.readFile(uxPath, null, function(err, uxContent) {
                    if (err) {
                        throw err;
                        // this._compilation.errors.push(err);
                    }
                    this.emitFile(uxContext, uxContent);
                    fs.unlink(htmlPath, function(err) {
                        if (err) {
                            throw err;
                            // this._compilation.errors.push(err);
                        }
                        fs.unlink(jsPath, function(err) {
                            if (err) {
                                throw err;
                                // this._compilation.errors.push(err);
                            }
                            fs.unlink(uxPath, function(err) {
                                if (err) {
                                    throw err;
                                    // this._compilation.errors.push(err);
                                }
                                fs.rmdir(outputDir, function(err, files) {
                                    if (err && err.code === 'ENOTEMPTY') {
                                        this._compilation.warnings.push(err);
                                    } else if (err) {
                                        throw err;
                                        // this._compilation.errors.push(err);
                                    } else {
                                        callback(null, res.make(res.js, res.html));
                                    }
                                }.bind(this));
                            }.bind(this));
                        }.bind(this));
                    }.bind(this));
                }.bind(this));
            }.bind(this));
        }.bind(this));
    }.bind(this));
};
