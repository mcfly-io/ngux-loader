'use strict';
var path = require('path');
var NGUX_EXTENSION = '.ngux';
var EXTERNAL_UX_DIR = 'external-ux' + path.sep;

/**
 * Helper module for NguxLoader
 * @module ngux/helper
 */

/**
 * pathsConfig for {@link getPaths}
 * @typedef {Object} PathsConfig
 * @property {String} resourcePath    - The loader's resourcePath
 * @property {String} context         - The context, usually taken from `loaderContext._compilation.options`
 * @property {String} output          - The output path, usually taken from `loaderContext._compilation.options`
 * @property {String} [subdir]        - The name of the subdirectory where `NGUX.exe` should generate its files. If `''`, files will be put in the same folder as the resource.
 * @property {Boolean} [useOutput]    - Use the output directory instead of the context directory (overridden by outputRoot option).
 * @property {String} [outputRoot]    - An alternate base folder to use when running `NGUX.exe`.
 * @memberof ngux/helper
 * @inner
 */

/**
 * The resolved paths from {@link getPaths}
 * @typedef {Object} Paths
 * @property {String} nguxExe      - The path to the `NGUX.exe` binary
 * @property {String} resourcePath - The resourcePath provided by webpack
 * @property {String} context      - The context provided by webpack
 * @property {String} output       - The output path provided by webpack
 * @property {String} resdir       - The path to the resource's directory in the context
 * @property {String} root         - The root of the output path that the `rel` paths are relative to.
 * @property {Object} out          - The absolute paths to the output of `NGUX.exe`
 * @property {String} out.dir      - The output directory for `NGUX.exe`. If no using useOutput or outputRoot, equivalent to `path.join(resdir, subdir)`.
 * @property {String} out.html     - The path to the generated `.html` file
 * @property {String} out.js       - The path to the generated `.js` file
 * @property {String} out.ux       - The path to the generated `.ux` file
 * @property {Object} rel          - The relative paths of the files output by `NGUX.exe`, relative to the outputRoot
 * @property {String} rel.dir      - The relative path to the directory where the files are.
 * @property {String} rel.html     - The relative path to the generated `.html` file
 * @property {String} rel.js       - The relative path to the generated `.js` file
 * @property {String} rel.ux       - The relative path to the generated `.ux` file
 * @memberof ngux/helper
 * @inner
 */

/**
 * Resolve needed paths
 * @namespace
 * @param {PathsConfig} pathsConfig       - The pathsConfig object, see [above]{@link PathsConfig}
 * @returns {Paths}                       - An object containing the resolved paths, see [below]{@link Paths}
 * @memberof ngux/helper
 */
var getPaths = function(pathsConfig) {
    var resourcePath = pathsConfig.resourcePath;
    var context = pathsConfig.context;
    var output = pathsConfig.output;
    var subdir = pathsConfig.subdir;
    var useOutput = pathsConfig.useOutput;
    var outputRoot = pathsConfig.outputRoot;

    useOutput = useOutput || false;
    // make sure that the subdir is a non-empty string if not provided so we can remove it
    subdir = subdir || subdir === '' ? subdir : 'ngux';
    var resName = path.basename(resourcePath, NGUX_EXTENSION);

    if (!outputRoot) {
        outputRoot = useOutput ? output : context;
    }

    outputRoot = path.isAbsolute(outputRoot) ? outputRoot : path.resolve(process.cwd(), outputRoot);

    var resdir = path.dirname(resourcePath);
    var resdirRelative = path.relative(context, resdir);
    if (/^(\.\.[\\\/])+/.test(resdirRelative)) {
        // Put outputs of .ngux files in other modules in an `external-ux` folder
        resdirRelative = resdirRelative.replace(/^(\.\.?[\\\/])*/, EXTERNAL_UX_DIR);
    }

    // We shouldn't hit other `..`s in the path, but just in case remove them.
    if (resdirRelative.indexOf('..') >= 0) {
        resdirRelative = resdirRelative.replace(/../, '');
    }

    var htmlName = resName + '.html';
    var jsName = resName + '.js';
    var uxName = resName + '.g.ux';

    var paths = {
        ngux: path.resolve(__dirname, '..', 'bin', 'ngux', 'NGUX.exe'),
        resourcePath: resourcePath,
        context: context,
        output: output,
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

module.exports = {
    getPaths: getPaths
};
