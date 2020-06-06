import * as cjs from './cjs.js';
import * as esm from './esm.js';
import main from './default.js';

cjs.say(cjs.helloWorld);
esm.say(esm.helloWorld);

console.log(cjs.default.default);
console.log(esm.default);

main();
