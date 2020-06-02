import world from './esm2.js';

export function say(str) {
  console.log(`${str} from esm`);
}

export const helloWorld = `hello ${world}`;

const defaultValue = 'default from esm';

export default defaultValue;
