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
    console.log('entry');

require(1);

require(3);
  },1: function(module, exports, require) {
    console.log('module1');

require(2);
  },2: function(module, exports, require) {
    console.log('module2');

require(0);
  },3: function(module, exports, require) {
    console.log('index');
  }
  });