'use strict';

const fs = require('fs');
const { getOptions } = require('loader-utils');
const { pbjs } = require('protobufjs/cli');
const protobuf = require('protobufjs');
const tmp = require('tmp-promise');
const validateOptions = require('schema-utils');

const schema = {
  type: 'object',
  properties: {
    json: {
      type: 'boolean',
    },
    paths: {
      type: 'array',
    },
    pbjsArgs: {
      type: 'array',
    },
    additionalTargets: {
      type: 'array'
    }
  },
  additionalProperties: false,
};

const flat = (arr) => arr.reduce((acc, val) =>
  Array.isArray(val) ? acc.concat(flat(val)) : acc.concat(val),
[]);

const promisify = (fn) => (...args) => new Promise((resolve, reject) =>
  fn(...args, (err, result) =>
    err ? reject(err) : resolve(result)
  )
);

const runPbCommand = promisify(pbjs.main);
const fsWrite = promisify(fs.write);

async function loadDeps(filename, paths, addDependency) {
  let root = new protobuf.Root();

  root.resolvePath = (origin, target) => {
    // Adapted from
    // https://github.com/dcodeIO/protobuf.js/blob/master/cli/pbjs.js
    const normOrigin = protobuf.util.path.normalize(origin);
    const normTarget = protobuf.util.path.normalize(target);

    let resolved = protobuf.util.path.resolve(normOrigin, normTarget, true);
    const idx = resolved.lastIndexOf('google/protobuf/');

    if (idx > -1) {
      const altname = resolved.substring(idx);

      if (altname in protobuf.common) {
        resolved = altname;
      }
    }

    if (fs.existsSync(resolved)) {
      // Don't add a dependency on the temp file
      if (resolved !== filename) {
        addDependency(resolved);
      }

      return resolved;
    }

    for (let path of paths) {
      const iresolved = protobuf.util.path.resolve(`${path}/`, target);

      if (fs.existsSync(iresolved)) {
        addDependency(iresolved);

        return iresolved;
      }
    }
  };

  return await protobuf.load(filename, root);
}

function loaderWrapper(...args) {
  const callback = this.async();

  if (this.cacheable) {
    this.cacheable();
  }

  loader
    .call(this, ...args)
    .then((result) => callback(null, ...result))
    .catch((err) => callback(err));
}

async function loader(source) {
  const options = Object.assign({
    json: false,
    paths: this.options ?
      this.options.resolve.modules
      : this.context ?
        [this.context]
        : [],
    pbjsArgs: [],
    additionalTargets: []
  }, getOptions(this) || {});

  validateOptions(schema, options, 'protobufjs-loader');

  const { path, fd } = await tmp.file();
  await fsWrite(fd, source);
  const { paths } = options;

  let args = flat([
    ...options.pbjsArgs,
    ...paths.map((p) => ['-p', p]),
    ['-t', options.json ? 'json-module' : 'static-module'],
    path,
    ...options.additionalTargets
  ]);

  const [output] = await Promise.all([
    runPbCommand(args),
    loadDeps(path, paths, this.addDependency)
  ]);

  return [output];
}

module.exports = loaderWrapper;
