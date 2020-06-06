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
    
    require.__defineExports = (exports, exporters) => {
      Object.entries(exporters).forEach(([key, value]) => {
        Object.defineProperty(exports, key, {
          enumerable: true,
          get: value
        });
      });
    }

    require.__addEsmFlag = (exports) => {
      Object.defineProperty(exports, '__esModule', { value: true });
    }

    require.__getDefaultExports = (module) => {
      const getter = module.__esModule ? () => module['default'] : () => module;

      require.__defineExports(getter, { d: getter });

      return getter;
    }

    return require(3);
  })({
    0: function(module, exports, require) {
    console.log('module2');

require(3);
  },1: function(module, exports, require) {
    console.log('module1');

require(0);
  },2: function(module, exports, require) {
    require.__addEsmFlag(exports)
console.log('index');
  },3: function(module, exports, require) {
    console.log('entry');

require(1);

require(2);
  }
  });