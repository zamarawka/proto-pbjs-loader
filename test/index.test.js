'use strict';

const path = require('path');

const compile = require('./helpers/compile');

describe('with JSON / reflection', () => {
  let opts = {
    json: true,
  };

  it('should compile to a JSON representation', async () => {
    const inspect = await compile('basic', opts);
    const contents = inspect.arguments[0];
    const innerString = 'addJSON({foo:{nested:{Bar:{fields:{baz:{type:"string",id:1}}}}}})})';

    expect(contents).toContain(innerString);
  });
});

describe('with static code', () => {
  it('should compile static code by default', async () => {
    const inspect = await compile('basic');
    const contents = inspect.arguments[0];

    expect(contents).toContain('foo.Bar=function(){');
  });

  it('should compile static code when the option is set explicitly', async () => {
    const inspect = await compile('basic', { json: false });
    const contents = inspect.arguments[0];

    expect(contents).toContain('foo.Bar=function(){');
  });
});

describe('with command line options', () => {
  it('should pass command line options to the pbjs call', async () => {
    const inspect = await compile('basic', { pbjsArgs: ['--no-encode'] });
    const contents = inspect.arguments[0];
    // Sanity check
    const innerString = 'Bar.decode=function(reader,length)';

    expect(contents).toContain(innerString);
    expect(contents).not.toContain('encode');
  });
});

describe('with imports', () => {
  const innerString = 'addJSON({foo:{nested:{NotBar:{fields:{bar:{type:"Bar",id:1}}},Bar:{fields:{baz:{type:"string",id:1}}}}}})})';

  it('should respect the webpack paths configuration', async () => {
    const inspect = await compile('import', {
      json: true,
    }, {
      resolve: {
        modules: ['node_modules', path.resolve(__dirname, 'fixtures')],
      }
    });
    const contents = inspect.arguments[0];

    expect(contents).toContain(innerString);
  });

  it('should respect an explicit paths configuration', async () => {
    const inspect = await compile('import', {
      json: true,
      paths: [path.resolve(__dirname, 'fixtures')],
    });
    const contents = inspect.arguments[0];

    expect(contents).toContain(innerString);
  });

  it('should add the imports as dependencies', async () => {
    const inspect = await compile('import', {
      paths: [ path.resolve(__dirname, 'fixtures') ]
    });

    expect(inspect.context.getDependencies()).toContain(path.resolve(__dirname, 'fixtures', 'basic.proto'));
  });
});
