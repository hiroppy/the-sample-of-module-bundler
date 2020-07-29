'use strict';

const { readFile, mkdir } = require('fs').promises;
const { Script, runInContext, createContext } = require('vm');
const { join } = require('path');
const bundler = require('../src');
const { exportAllDeclaration } = require('@babel/types');

const fixtureBasePath = join(__dirname, 'fixtures');
const outputBasePath = join(__dirname, 'output');

async function build(fixturePath, outputPath, type) {
  await bundler({
    entry: join(fixturePath, type, 'entry.js'),
    output: join(outputPath, type, 'main.js'),
  });
}

async function runGeneratedCodeInVM(outputPath, lastType) {
  const code = await readFile(join(outputPath, lastType, 'main.js'), 'utf-8');
  const sandbox = { console, process };
  const ctx = new createContext(sandbox);

  runInContext(code, ctx);
}

async function createDir(base, lastType) {
  await mkdir(join(base, lastType), { recursive: true });
}

beforeEach(() => {
  jest.spyOn(console, 'log').mockImplementation();
  jest.spyOn(console, 'warn').mockImplementation();
});

afterEach(() => {
  jest.clearAllMocks();
});

describe('common', () => {
  const fixturePath = join(fixtureBasePath, 'common');
  const outputPath = join(outputBasePath, 'common');

  beforeAll(async () => {
    await createDir(outputPath, '');
  });

  test('not found a module', async () => {
    try {
      await createDir(outputPath, 'notFoundModule');
      await build(fixturePath, outputPath, 'notFoundModule');
    } catch (e) {
      expect(e.message.includes('could not find the module:')).toBeTruthy();
    }
  });

  test('interop', async () => {
    await createDir(outputPath, 'interop');
    await build(fixturePath, outputPath, 'interop');
    await runGeneratedCodeInVM(outputPath, 'interop');

    expect(console.log.mock.calls).toMatchSnapshot();
  });
});

describe('cjs', () => {
  const fixturePath = join(fixtureBasePath, 'cjs');
  const outputPath = join(outputBasePath, 'cjs');

  beforeAll(async () => {
    await createDir(outputPath, '');
  });

  const dirs = ['simple', 'nested', 'circularDependency', 'filename', 'node-modules'];

  for (const dir of dirs) {
    test(dir, async () => {
      await createDir(outputPath, dir);
      await build(fixturePath, outputPath, dir);
      await runGeneratedCodeInVM(outputPath, dir);

      expect(console.log.mock.calls).toMatchSnapshot();
    });
  }
});

describe('esm', () => {
  const fixturePath = join(fixtureBasePath, 'esm');
  const outputPath = join(outputBasePath, 'esm');

  beforeAll(async () => {
    await createDir(outputPath, '');
  });

  const dirs = [
    'simple',
    'complication',
    'node-modules',
    'default',
    'specifier',
    'namespaceSpecifier',
    'import',
  ];

  for (const dir of dirs) {
    test(dir, async () => {
      await createDir(outputPath, dir);
      await build(fixturePath, outputPath, dir);
      await runGeneratedCodeInVM(outputPath, dir);

      expect(console.log.mock.calls).toMatchSnapshot();
    });
  }
});
