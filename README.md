# ngux-loader for webpack
[![Build Status](https://travis-ci.org/mcfly-io/ngux-loader.svg?branch=master)](https://travis-ci.org/mcfly-io/ngux-loader)

## Dependencies
This loader executes a dot.net exe (https://github.com/fusetools/NGUX).    
As such it requires mono when using a non-windows platform.   
To install mono using Homebrew execute the following instruction:

To install Homebrew open a Terminal and paste in the following command
```sh
ruby -e "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/master/install)"
```
Then to install mono, execute:
```sh
brew update && brew install mono
```



## Usage

[Documentation: Using loaders](http://webpack.github.io/docs/using-loaders.html)

Code
``` javascript
var html = require("html-loader!./file.ngux?subdir=ngux");
```

or

webpack.config.js
```js
{
    test: /\.ngux$/,
    loader: 'html-loader!ngux-loader?subdir=ngux'
}
```

Alternatively, options (see [below](#options)) can be passed to the loader inside of a `query` object instead of as querystring parameters.
```js
{
    test: /\.ngux$/,
    loader: 'html-loader!ngux-loader',
    query: {
        subdir: 'ngux',
        skipClean: true
    }
}
```

###### Options


|Parameter|Definition|Default|
|---|---|---|
|`subdir` | This will be the name of the sub directory where the output files will be created, during standard operation this will be deleted. The location of the `subdir` will vary depending on other options passed to the loader, but these will always be created relative to the resource path, i.e. if the loader is working on `client/scripts/app/components/main/main.ngux`  the `subdir` will be `<outputRoot>/components/main/ngux/`.|`'ngux'`|
|`skipClean` | Set to `true` if you want to skip deleting the generated files after the loader is finished.|`false`|
|`useOutput` | If `true`, generate the files in `subdir` relative to the loader's output path option. E.g. if `useOutput` is `true` and the loader is working on `client/scripts/app/components/main/main.ngux`  the files will be generated in `dist/app/dev/components/main/ngux/`.|`false`|
|`noEmitUx` | If true, the generated `*.g.ux` file will not be emitted for webpack to create in the output directory. Because the resulting fuse code would break without this file, we force the `useOutput` option to true if this is set.|`false`|
|`outputRoot`† | This will change the root path that will be used with the context-relative resource path + the `subdir` as the directory for the generated files. If `outputRoot` is an absolute path, it is used as-is, otherwise the provided path is resolved relative to the current working directory, usually the project's root folder. Example: if the loader is working on `client/scripts/app/components/main/main.ngux`, the context-relative resource path is `components/main/main.ngux` and the `subdir` will point to `components/main/ngux/`, so the default folder where the files would be generated will be `client/scripts/app/components/main/ngux/`, or `dist/app/dev/components/main/ngux/` if `useOutput` is `true`. If `outputRoot` is set to `'ux-files'`, the files will be generated `ux-files/components/main/ngux/`.|`false` |

>† **NB**: The `outputRoot` option overrides `useOutput`. Caution is required when it is used in combination with `noEmitUx = true`, as your app might break if you do not make sure Fuse knows about the new locations of the `*.g.ux` files.

```js
{
    test: /\.ngux$/,
    loader: 'html-loader!ngux-loader?subdir=ngux'
}
```

> **NOTE:**    
> Defining a query object will not work as we have mulitple loaders

## License

MIT (http://www.opensource.org/licenses/mit-license.php)
