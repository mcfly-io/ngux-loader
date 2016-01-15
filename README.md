# file loader for webpack

## Usage

[Documentation: Using loaders](http://webpack.github.io/docs/using-loaders.html)

Code
``` javascript
var html = require("html-loader!./file.ngux");
```

or

webpack.config.js
```json
{
    test: /\.ngux$/,
    loader: 'html-loader!ngux-loader'
}
```

## License

MIT (http://www.opensource.org/licenses/mit-license.php)
