import defaultFunc, { namedFunc } from './modules/module1.js';
import * as module3 from './modules/module3.js';

defaultFunc('from entry-point');
namedFunc();

console.log(Object.keys(module3).length);
console.log(module3.default);
console.log(module3.value);

export default function () {}
