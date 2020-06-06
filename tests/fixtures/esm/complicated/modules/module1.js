import module2Default, { value as module2Value, value2 } from './module2.js';

export default function defaultNamedExport(str) {
  console.log('1. default: named', module2Value);
  console.log('2. default: arguments', str);

  module2Default(`from module1 ${str}`);
}

export function namedFunc() {
  console.log('4. named: func');
}

function checkScope() {
  function module2Default() {}

  module2Default();
}
