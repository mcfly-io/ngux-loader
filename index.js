'use strict';
var path = require('path');
var Bluebird = require('bluebird');
var fs = Bluebird.promisifyAll(require('fs'));
var os = require('os');
var loaderUtils = require('loader-utils');
var helper = require('./lib/helper.js');

/**
 * The nguxLoader function
 * @namespace
 * @param {String} content     - The contents of the `*.ngux` file
 * @returns {Promise<String>}  - The module constructed from the `*.ngux` file; it runs the contents of the generated `*.js` file and then exports the contents of the generated `*.html` file as a string.
 */
var nguxLoader = function(content) {
    if (!this.webpack && !this.test) {
        this.emitError('NguxLoader currently only supports compiling by webpack.');
        return 'module.exports = ' + JSON.stringify(content) + ';';
    }

    this.cacheable();
    var callback = this.async();
    if (!callback) {
        this.emitError('NguxLoader needs to run in async mode.');
        return 'module.exports = ' + JSON.stringify(content) + ';';
    }

    var exec = Bluebird.promisify(require('child_process').exec, {
        multiArgs: true
    });

    var output = this.options.output.path;

    var loaderOptions = this.test ? this.testConfig : loaderUtils.parseQuery(this.query);

    // loader options
    var subdir = loaderOptions.subdir;
    var skipClean = loaderOptions.skipClean;
    var noEmitUx = loaderOptions.noEmitUx;
    var useOutput = loaderOptions.useOutput || noEmitUx;
    var outputRoot = loaderOptions.outputRoot;

    var emitFile = this.emitFile.bind(this);
    var emitWarning = this.emitWarning.bind(this);
    var result = {
        html: '',
        js: ''
    };

    /**
     * @type {ngux/helper.Paths} paths
     * @see ngux/helper.Paths
     */
    var paths;

    /**
     * @type {ngux/helper.PathsConfig} pathsConfig
     * @see ngux/helper.PathsConfig
     */
    var pathsConfig = {
        resourcePath: this.resourcePath,
        context: this.options.context,
        output: output, // this.options.output.path
        subdir: subdir,
        useOutput: useOutput,
        outputRoot: outputRoot
    };

    return Bluebird.try(function() {
            return helper.getPaths(pathsConfig);
        })
        .then(function(p) {
            paths = p;
            return exec((os.platform() === 'win32' ? '' : 'mono ') + paths.ngux + ' ' + paths.resourcePath + ' ' + paths.out.dir);
        })
        // read the files
        .then(function(stdarr /* : [stdout, stderr]*/ ) {
            var html = fs.readFileAsync(paths.out.html, 'utf-8');
            var js = fs.readFileAsync(paths.out.js, 'utf-8');
            var ux = fs.readFileAsync(paths.out.ux, null);
            return Bluebird.join(html, js, ux, function(html, js, ux) {
                result.html = html;
                result.js = js;
                if (!noEmitUx || !useOutput || !paths.root === output) {
                    noEmitUx = false;
                    emitFile(paths.rel.ux, ux);
                }
                return result;
            });
        })
        // clean the files
        .then(function(result) {
            if (skipClean) {
                return result;
            }
            var html = fs.unlinkAsync(paths.out.html);
            var js = fs.unlinkAsync(paths.out.js);
            var ux = noEmitUx ? null : fs.unlinkAsync(paths.out.ux);
            return Bluebird.join(html, js, ux, function(html, js, ux) {
                return result;
            });
        })
        // clean the dir
        .then(function(result) {
            if (skipClean || noEmitUx || subdir === '') {
                return result;
            }
            return fs.rmdirAsync(paths.out.dir)
                .catch(function(err) {
                    if (err && err.code !== 'ENOTEMPTY') {
                        throw err;
                    } else if (err && err.code === 'ENOTEMPTY') {
                        emitWarning('NguxLoader: ENOTEMPTY! Directory \'' + path.relative(context, paths.out.dir) + '\' is not empty, refusing to delete.');
                    }
                })
                .then(function() {
                    return result;
                });
        })
        // build loaded module from the result
        .then(function(result) {
            return result.js + '; module.exports = ' + JSON.stringify(result.html) + ';';
        })
        .asCallback(callback);
};

module.exports = nguxLoader;