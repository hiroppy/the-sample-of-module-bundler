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

  require.__getDefaultExports = (module) => {
    const getter = module.__esModule ? () => module["default"] : () => module;

    require.__defineExports(getter, { d: getter });

    return getter;
  };

  return require(0);
})({
  0: function (module, exports, require) {
    require(undefined);
  },
});
