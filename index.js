'use strict';
var path = require('path');
var fs = require('fs');
var os = require('os');
var loaderUtils = require('loader-utils');
var NGUX_EXTENSION = '.ngux';

var clean = function(path, skipClean, isDirectory, cb) {
    if (skipClean instanceof Function) {
        cb = skipClean;
        skipClean = false;
        isDirectory = false;
    }
    if (isDirectory instanceof Function) {
        cb = isDirectory;
        isDirectory = false;
    }
    if (skipClean) {
        cb(null, true);
    } else {
        var deleteMethod = isDirectory ? 'rmdir' : 'unlink';
        fs[deleteMethod](path, cb);
    }
};

/**
 * Resolve needed paths
 * @param {string} resPath         - The loader's resourcePath
 * @param {string} context         - The context, usually taken from `loaderContext._compilation.options`
 * @param {string} output          - The output path, usually taken from `loaderContext._compilation.options`
 * @param {string} [subdir]        - The name of the subdirectory where `NGUX.exe` should generate its files. If `''`, files will be put in the same folder as the resource.
 * @param {boolean} [useOutput]    - Use the output directory instead of the context directory (overridden by outputRoot option).
 * @param {string} [outputRoot]    - An alternate base folder to use when running `NGUX.exe`.
 * @returns {Object}               - An object containing the resolved paths
 */
var getPaths = function(resPath, context, output, subdir, useOutput, outputRoot) {
    useOutput = useOutput || false;
    // make sure that the subdir is a non-empty string if not provided so we can remove it 
    subdir = subdir || subdir === '' ? subdir : 'ngux';
    var resName = path.basename(resPath, NGUX_EXTENSION);

    if (!outputRoot) {
        outputRoot = useOutput ? context : output;
    }

    outputRoot = path.isAbsolute(outputRoot) ? outputRoot : path.resolve(process.cwd(), outputRoot);

    var resdir = path.dirname(resPath);
    var resdirRelative = path.relative(context, resdir);

    var htmlName = resName + '.html';
    var jsName = resName + '.js';
    var uxName = resName + '.g.ux';

    /**
     * The resolved paths
     * @property {String} ngux     - The path to the `NGUX.exe` binary
     * @property {String} resource - The path to the resource in the context
     * @property {String} resdir   - The path to the resource's directory in the context
     * @property {String} root     - The root of the output path that the `rel` paths are relative to.
     * @property {Object} out      - The absolute paths to the output of `NGUX.exe`
     * @property {String} out.dir  - The output directory for `NGUX.exe`. If no using useOutput or outputRoot, equivalent to `path.join(resdir, subdir)`.
     * @property {String} out.html - The path to the generated `.html` file
     * @property {String} out.js   - The path to the generated `.js` file
     * @property {String} out.ux   - The path to the generated `.ux` file
     * @property {Object} rel      - The relative paths of the files output by `NGUX.exe`, relative to the outputRoot
     * @property {String} rel.dir  - The relative path to the directory where the files are.
     * @property {String} rel.html - The relative path to the generated `.html` file
     * @property {String} rel.js   - The relative path to the generated `.js` file
     * @property {String} rel.ux   - The relative path to the generated `.ux` file
     */
    var paths = {
        ngux: path.resolve(__dirname, 'bin', 'ngux', 'NGUX.exe'),
        resource: resPath,
        resdir: resdir,
        root: outputRoot,
        out: {
            dir: path.join(outputRoot, resdirRelative, subdir),
            html: path.join(outputRoot, resdirRelative, subdir, htmlName),
            js: path.join(outputRoot, resdirRelative, subdir, jsName),
            ux: path.join(outputRoot, resdirRelative, subdir, uxName)
        },
        rel: {
            dir: path.join(resdirRelative, subdir),
            html: path.join(resdirRelative, subdir, htmlName),
            js: path.join(resdirRelative, subdir, jsName),
            ux: path.join(resdirRelative, subdir, uxName)
        }
    };
    return paths;
};

module.exports = function(content) {
    this.cacheable();
    var callback = this.async();

    var exec = require('child_process').exec;
    var loaderOptions = loaderUtils.parseQuery(this.query);

    var resourcePath = this.resourcePath;
    var context = this._compilation.options.context;
    var output = this._compiler.options.output.path;

    var subdir = this.options.subdir || loaderOptions.subdir;
    var useOutput = this.options.useOutput || loaderOptions.useOutput;
    var outputRoot = this.options.outputRoot || loaderOptions.outputRoot;
    var skipBundle = this.options.skipBundle || loaderOptions.skipBundle || false;
    var skipClean = this.options.skipClean || loaderOptions.skipClean || false || !skipBundle;
    var noEmitUx = this.options.noEmitUx || loaderOptions.noEmitUx || false;

    var paths = getPaths(resourcePath, context, output, subdir, useOutput, outputRoot);
    noEmitUx = noEmitUx && (useOutput && paths.root === output);

    var result = {
        html: '',
        js: ''
    };
    var getResult = function() {
        if (skipBundle) {
            return 'require(' + paths.out.js + '); module.exports = require(html!' + paths.out.html + ');';
        }
        return result.js + '; module.exports = ' + JSON.stringify(result.html) + ';'
    }
    exec((os.platform() === 'win32' ? '' : 'mono ') + paths.ngux + ' ' + paths.resource + ' ' + paths.out.dir, function(err, stdout, stderr) {
        if (err) {
            callback(err);
            return;
        }
        fs.readFile(paths.out.html, 'utf-8', function(err, htmlContent) {
            if (err) {
                callback(err);
                return;
            }
            result.html = htmlContent;
            fs.readFile(paths.out.js, 'utf-8', function(err, jsContent) {
                if (err) {
                    callback(err);
                    return;
                }
                result.js = jsContent;
                fs.readFile(paths.out.ux, null, function(err, uxContent) {
                    if (err) {
                        callback(err);
                        return;
                    }
                    if (!noEmitUx) {
                        this.emitFile(paths.rel.ux, uxContent);
                    }
                    clean(paths.out.html, skipClean, function(err, skipped) {
                        if (err) {
                            callback(err);
                            return;
                        }
                        clean(paths.out.js, skipClean, function(err, skipped) {
                            if (err) {
                                callback(err);
                                return;
                            }
                            clean(paths.out.ux, skipClean || noEmitUx, function(err, skipped) {
                                if (err) {
                                    callback(err);
                                    return;
                                }
                                clean(paths.out.dir, skipClean, /* isDirectory = */ true, function(err, skipped) {
                                    if (err && err.code !== 'ENOTEMPTY') {
                                        callback(err);
                                        return;
                                    } else if (err && err.code === 'ENOTEMPTY') {
                                        this.emitWarning('NguxLoader: ENOTEMPTY! Directory \'' + path.relative(this._compilation.options.context, paths.out.dir) + '\' is not empty, refusing to delete.');
                                    } else if (skipped) {
                                        this.emitWarning('NguxLoader: Skipped cleaning generated files.');
                                    }
                                    callback(null, );
                                }.bind(this));
                            }.bind(this));
                        }.bind(this));
                    }.bind(this));
                }.bind(this));
            }.bind(this));
        }.bind(this));
    }.bind(this));
};
