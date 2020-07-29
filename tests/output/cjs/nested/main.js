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

  return require(2);
})({
  0: function (module, exports, require) {
    console.log("module1");
  },
  1: function (module, exports, require) {
    console.log("module1-sub");
  },
  2: function (module, exports, require) {
    "use strict";

    require(0);

    require(1);

    console.log("entry");
  },
});
