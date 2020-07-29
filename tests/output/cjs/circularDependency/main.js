((modules) => {
  const usedModules = {};

  function require(moduleId) {
    if (usedModules[moduleId]) {
      return usedModules[moduleId].exports;
    }

    const module = (usedModules[moduleId] = {
      exports: {},
    });

    modules[moduleId](module, module.exports, require);

    return module.exports;
  }

  return require(1);
})({
  0: function (module, exports, require) {
    const a = require(1);

    console.log("module1:", a);
    module.exports = "from module1";
  },
  1: function (module, exports, require) {
    "use strict";

    module.exports = "from entry";

    const a = require(0);

    console.log("main:", a);
  },
});
