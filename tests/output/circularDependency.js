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

    

    

    require.__getDefaultExports = (module) => {
      const getter = module.__esModule ? () => module['default'] : () => module;

      require.__defineExports(getter, { d: getter });

      return getter;
    }

    return require(1);
  })({
    0: function(module, exports, require) {
    'use strict';

module.exports = 'from entry';

const a = require(1);

console.log('main:', a);
  },1: function(module, exports, require) {
    const a = require(0);

console.log('module1:', a);
module.exports = 'from module1';
  }
  });