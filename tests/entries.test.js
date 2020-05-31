'use strict';

const { readFile } = require('fs').promises;
const { Script, runInContext, createContext } = require('vm');
const { join } = require('path');
const bundler = require('../src');

const outputBasePath = join(__dirname, 'output');

async function build(fixture, filename) {
  await bundler({
    entry: join(__dirname, 'fixtures', fixture),
    output: join(outputBasePath, filename),
  });
}

async function runGeneratedCodeInVM(file) {
  const code = await readFile(join(__dirname, file), 'utf-8');
  const sandbox = { console, process };
  const ctx = new createContext(sandbox);

  runInContext(code, ctx);
}

beforeEach(() => {
  jest.spyOn(console, 'log').mockImplementation();
  jest.spyOn(console, 'warn').mockImplementation();
});

afterEach(() => {
  jest.clearAllMocks();
});

describe('common', () => {
  test('not found a module', async () => {
    await build('notFoundModule/entry.js', 'module.js');

    expect(console.warn.mock.calls[0][0].includes('could not find the module:')).toBeTruthy();
  });
});

describe('cjs', () => {
  test('simple', async () => {
    await build('simple/entry.js', 'simple.js');
    await runGeneratedCodeInVM('./output/simple.js');

    expect(console.log.mock.calls).toMatchSnapshot();
  });

  test('nested', async () => {
    await build('nested/entry.js', 'nested.js');
    await runGeneratedCodeInVM('./output/nested.js');

    expect(console.log.mock.calls).toMatchSnapshot();
  });

  test('circular dependencies', async () => {
    {
      await build('circularDependency/entry.js', 'circularDependency.js');
      await runGeneratedCodeInVM('./output/circularDependency.js');

      expect(console.log.mock.calls).toMatchSnapshot();
    }

    jest.clearAllMocks();

    {
      await build('circularDependency/module1.js', 'circularDependency.js');
      await runGeneratedCodeInVM('./output/circularDependency.js');

      expect(console.log.mock.calls).toMatchSnapshot();
    }
  });

  test('filename', async () => {
    await build('filename/entry.js', 'filename.js');
    await runGeneratedCodeInVM('./output/filename.js');

    expect(console.log.mock.calls).toMatchSnapshot();
  });

  test('node_modules', async () => {
    await build('cjs-node-modules/entry.js', 'cjs-node-modules.js');
    await runGeneratedCodeInVM('./output/cjs-node-modules.js');

    expect(console.log.mock.calls).toMatchSnapshot();
  });
});

describe('esm', () => {
  test('esm-simple', async () => {
    await build('esm-simple/entry.js', 'esm-simple.js');
    await runGeneratedCodeInVM('./output/esm-simple.js');

    expect(console.log.mock.calls).toMatchSnapshot();
  });

  test('esm', async () => {
    await build('esm/entry.js', 'esm.js');
    await runGeneratedCodeInVM('./output/esm.js');

    expect(console.log.mock.calls).toMatchSnapshot();
  });

  test('esm-node_modules', async () => {
    await build('esm-node-modules/entry.js', 'esm-node-modules.js');
    await runGeneratedCodeInVM('./output/esm-node-modules.js');

    expect(console.log.mock.calls).toMatchSnapshot();
  });
});
