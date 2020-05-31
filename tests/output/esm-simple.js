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
    
    return require(0);
  })({
    0: function(module, exports, require) {
    const __BUNDLER__1 = require(1);

console.log(__BUNDLER__1["add"](10));
  },1: function(module, exports, require) {
    function add(n) {
  return 10 + n;
}

require.__defineExports(exports, {
  "add": () => add
});
  }
  });