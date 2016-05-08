'use strict';
var path = require('path');
var Bluebird = require('bluebird');
var fs = Bluebird.promisifyAll(require('fs'));
var os = require('os');
var loaderUtils = require('loader-utils');
var NGUX_EXTENSION = '.ngux';

var clean = function(path, opts, cb) {
    if (!opts || opts instanceof Function) {
        cb = opts;
        opts = {
            isDirectory: false
        };
    }
    var deleteMethod = opts.isDirectory ? 'rmdirAsync' : 'unlinkAsync';
    return fs[deleteMethod](path);
};

/**
 * Resolve needed paths
 * @param {string} resPath         - The loader's resourcePath
 * @param {string} context         - The context, usually taken from `loaderContext._compilation.options`
 * @param {string} output          - The output path, usually taken from `loaderContext._compilation.options`
 * @param {string} [subdir]        - The name of the subdirectory where `NGUX.exe` should generate its files. If `''`, files will be put in the same folder as the resource.
 * @param {boolean} [useOutput]    - Use the output directory instead of the context directory (overridden by outputRoot option).
 * @param {string} [outputRoot]    - An alternate base folder to use when running `NGUX.exe`.
 * @returns {Promise<Object>}      - An object containing the resolved paths
 */
var getPaths = function(resPath, context, output, subdir, useOutput, outputRoot) {
    return Bluebird.try(function() {
        useOutput = useOutput || false;
        // make sure that the subdir is a non-empty string if not provided so we can remove it
        subdir = subdir || subdir === '' ? subdir : '.ngux';
        var resName = path.basename(resPath, NGUX_EXTENSION);

        if (!outputRoot) {
            outputRoot = useOutput ? output : context;
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
    });
};

module.exports = function(content) {
    if (!this.webpack) {
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

    // webpack options
    var resourcePath = this.resourcePath;
    var context = this.options.context;
    var output = this.options.output.path;

    var loaderOptions = loaderUtils.parseQuery(this.query);
    // loader query options
    var subdir = loaderOptions.subdir;
    var skipClean = loaderOptions.skipClean;
    var outputRoot = loaderOptions.outputRoot;
    var noEmitUx = loaderOptions.noEmitUx;
    var useOutput = loaderOptions.useOutput || noEmitUx;

    var emitFile = this.emitFile.bind(this);
    var emitWarning = this.emitWarning.bind(this);
    var result = {
        html: '',
        js: ''
    };
    var paths;
    return getPaths(resourcePath, context, output, subdir, useOutput, outputRoot)
        .then(function(p) {
            paths = p;
            return exec((os.platform() === 'win32' ? '' : 'mono ') + paths.ngux + ' ' + paths.resource + ' ' + paths.out.dir);
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
            var html = clean(paths.out.html);
            var js = clean(paths.out.js);
            var ux = noEmitUx ? null : clean(paths.out.ux);
            return Bluebird.join(html, js, ux, function(html, js, ux) {
                return result;
            });
        })
        // clean the dir
        .then(function(result) {
            if (skipClean) {
                return result;
            }
            return clean(paths.out.dir, {
                    isDirectory: true
                })
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
