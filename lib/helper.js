'use strict';
var path = require('path');
var NGUX_EXTENSION = '.ngux';

/**
 * Resolve needed paths
 * @param {String} resPath         - The loader's resourcePath
 * @param {String} context         - The context, usually taken from `loaderContext._compilation.options`
 * @param {String} output          - The output path, usually taken from `loaderContext._compilation.options`
 * @param {String} [subdir]        - The name of the subdirectory where `NGUX.exe` should generate its files. If `''`, files will be put in the same folder as the resource.
 * @param {Boolean} [useOutput]    - Use the output directory instead of the context directory (overridden by outputRoot option).
 * @param {String} [outputRoot]    - An alternate base folder to use when running `NGUX.exe`.
 * @returns {Paths}                - An object containing the resolved paths, see below
 */
var getPaths = function(resPath, context, output, subdir, useOutput, outputRoot) {
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
     * @typedef Pathxs
     * @type {Object}
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
        ngux: path.resolve(__dirname, '..', 'bin', 'ngux', 'NGUX.exe'),
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

module.exports = {
    getPaths: getPaths
};