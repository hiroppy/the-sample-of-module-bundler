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

    return require(0);
  })({
    0: function(module, exports, require) {
    'use strict';

require(1);

require(2);

console.log('entry');
  },1: function(module, exports, require) {
    console.log('module1');
  },2: function(module, exports, require) {
    console.log('module1-sub');
  }
  });