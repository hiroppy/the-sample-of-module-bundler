import esm from './esm.js';
import cjs from './cjs.js';

export default function main() {
  console.log('---- default.js ----');
  console.log(esm);
  console.log(cjs.default);
  console.log('---- default.js ----');
}
