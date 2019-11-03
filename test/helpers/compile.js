'use strict';

const memoryfs = require('memory-fs');
const path = require('path');
const webpack = require('webpack');

const fixturePath = path.resolve(__dirname, '..', 'fixtures');

module.exports = (fixture, loaderOpts, webpackOpts) =>
  new Promise((resolve, reject) => {
    webpackOpts = (webpackOpts || {});
    let inspect;

    const compiler = webpack(Object.assign({
      entry: path.resolve(fixturePath, `${fixture}.proto`),
      output: {
        path: '/',
        filename: 'compiled.js',
      },
      module: {
        rules: [{
          test: /\.proto$/,
          use: [{
            loader: 'inspect-loader',
            options: {
              callback: (_inspect) => {
                inspect = _inspect;
              }
            }
          }, {
            loader: 'uglify-loader',
            options: {
              mangle: false,
            },
          }, {
            loader: path.resolve(__dirname, '..', '..', 'src', 'index.js'),
            options: loaderOpts,
          }]
        }],
      }
    }, webpackOpts));

    compiler.outputFileSystem = new memoryfs();

    compiler.run((err, stats) => {
      if (err) reject(err);
      if (stats.hasErrors()) reject(new Error(stats.toJson().errors));

      resolve(inspect);
    });
  });
