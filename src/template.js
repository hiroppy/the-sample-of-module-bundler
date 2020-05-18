'use strict';

const mainTemplate = (modules, entryPoint) =>
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

module.exports = {
  mainTemplate,
  moduleTemplate,
};
