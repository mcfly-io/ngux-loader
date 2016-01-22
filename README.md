# ngux-loader for webpack
[![Build Status](https://travis-ci.org/mcfly-io/ngux-loader.svg?branch=master)](https://travis-ci.org/mcfly-io/ngux-loader)

## Dependencies
This loader execute a dot.net exe (https://github.com/fusetools/NGUX).    
As such it requires mono when using a non windows platform.   
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
var html = require("html-loader!./file.ngux");
```

or

webpack.config.js
```js
{
    test: /\.ngux$/,
    loader: 'html-loader!ngux-loader'
}
```

This loader supports a `subdir` query string when you need to save the resulting files in
a sub folder of the source `ngux` file

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
