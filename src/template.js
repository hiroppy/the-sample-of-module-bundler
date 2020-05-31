'use strict';

const mainTemplate = (modules, entryPoint, isESM) =>
  `
  ((modules) => {
    const usedModules = {};

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
    ${
      isESM
        ? `
    require.__defineExports = (exports, exporters) => {
      Object.entries(exporters).forEach(([key, value]) => {
        Object.defineProperty(exports, key, {
          enumerable: true,
          get: value
        });
      });
    }
    `
        : ''
    }
    return require(${entryPoint});
  })({
    ${Array.from(modules.entries())
      .map(([id, { code }]) => `${id}: ${code}`)
      .join(',')}
  });
`.trim();

const moduleTemplate = (content) =>
  `
  function(module, exports, require) {
    ${content}
  }
`.trim();

const registerExportConfigTemplate = (exporters) =>
  `
  require.__defineExports(exports, {
    ${Object.entries(exporters)
      .map(([key, value]) => {
        return `${JSON.stringify(key)}: () => ${value}`;
      })
      .join(',\n')}
  });

`.trim();

module.exports = {
  mainTemplate,
  moduleTemplate,
  registerExportConfigTemplate,
};
