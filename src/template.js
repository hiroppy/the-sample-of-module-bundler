'use strict';

const requireFunction = () =>
  `
    function require(moduleId) {
      if (usedModules[moduleId]) {
        return usedModules[moduleId].exports;
      }

      const module = usedModules[moduleId] = {
        exports: {}
      };

      modules[moduleId](module, module.exports, require);

      return module.exports;
    }
  `;

const defineExports = () =>
  `
    require.__defineExports = (exports, exporters) => {
      Object.entries(exporters).forEach(([key, value]) => {
        Object.defineProperty(exports, key, {
          enumerable: true,
          get: value
        });
      });
    }
  `;

const addEsmFlag = () =>
  `
    require.__addEsmFlag = (exports) => {
      Object.defineProperty(exports, '__esModule', { value: true });
    }
  `;

// keep for compatibility between ESM and CJS
const getDefaultExports = () =>
  `
    require.__getDefaultExports = (module) => {
      const getter = module.__esModule ? () => module['default'] : () => module;

      require.__defineExports(getter, { d: getter });

      return getter;
    }
  `;

const moduleTemplate = (content) =>
  `
    function(module, exports, require) {
      ${content}
    }
  `;

const registerExportConfigTemplate = (exporters) =>
  `
    require.__defineExports(exports, {
      ${Object.entries(exporters)
        .map(([key, value]) => {
          return `${JSON.stringify(key)}: () => ${value}`;
        })
        .join(',\n')}
    });
  `;

const mainTemplate = (modules, entryPoint, hasESM) =>
  `
    ((modules) => {
      const usedModules = {};

      ${requireFunction()}

      ${
        hasESM
          ? `
      ${defineExports()}

      ${addEsmFlag()}

      ${getDefaultExports()}
      `
          : ''
      }

      return require(${entryPoint});
    })({
      ${Array.from(modules.entries())
        .map(([id, { code }]) => `${id}: ${code}`)
        .join(',')}
    });
  `;

module.exports = {
  mainTemplate,
  moduleTemplate,
  registerExportConfigTemplate,
};
