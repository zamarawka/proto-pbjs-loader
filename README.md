# proto-pbjs-loader
Webpack loader that parses `.proto` files and converts them to a [protobuf.js](https://github.com/dcodeIO/ProtoBuf.js/) modules. It build on top of [protobuf.js CLI](https://github.com/dcodeIO/ProtoBuf.js/#pbjs-for-javascript) and could be handy integrate into your current build flow.

# Install

``` sh
npm install --save-dev proto-pbjs-loader
```

# Usage

``` javascript
// webpack.config.js

module.exports = {
    ...
    module: {
        rules: [{
            test: /\.proto$/,
            use: {
              loader: 'proto-pbjs-loader',
              /*
               * Config is optional.
               */
              options: {
                /*
                 * controls the "target" flag to pbjs - true for
                 * json-module, false for static-module.
                 * default: false
                 */
                json: false,

                /*
                 * import paths provided to pbjs.
                 * default: webpack import paths (i.e. config.resolve.modules)
                 */
                paths: ['/path/to/definitions'],

                /*
                 * additional command line arguments passed to
                 * pbjs, see https://github.com/dcodeIO/ProtoBuf.js/#pbjs-for-javascript
                 * for a list of what's available.
                 * default: []
                 */
                pbjsArgs: ['--no-encode'],

                /*
                 * Additional build targets, wich will bundled in root object.
                 * Some times it helpful if pb.js throws error
                 * when try to resolve type
                 * default: []
                 */
                additionalTargets: ['/path/to/additional/definitions']
              }
            }
        }]
    }
};
```

``` javascript
// myModule.js

/*
 * replaces e.g.:
 *
 * const protobuf = require('protobufjs/light');
 * const jsonDescriptor = require('json!my/compiled/protobuf.js');
 * const Root = protobuf.Root.fromJSON(jsonDescriptor);
 */
const Root = require('my/protobuf.proto');
```

# Development

``` sh
npm run lint # linting
npm run test # testing
```

> Fresh up and fully refactored version of [protobufjs-loader](https://github.com/kmontag/protobufjs-loader). Compatable with webpack 3 and 4.

Active maintenance with care and ❤️.

Feel free to send a PR.
