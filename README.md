# file loader for webpack
[![Build Status](https://travis-ci.org/mcfly-io/ngux-loader.svg?branch=master)](https://travis-ci.org/mcfly-io/ngux-loader)

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


## License

MIT (http://www.opensource.org/licenses/mit-license.php)
