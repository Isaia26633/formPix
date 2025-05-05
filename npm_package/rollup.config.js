// Make sure to install the required packages
// npm install --save-dev rollup rollup-plugin-node-resolve rollup-plugin-commonjs

import resolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';

export default {
  input: 'formpixapi.js',   // your package entry point
  output: {
    file: 'formpixbrowser.js',
    format: 'umd',          // or 'iife' for direct <script> usage
    name: 'formPixAPI',      // global variable name in browser
  },
  plugins: [resolve(), commonjs()]
};

// Run this command to build the package for browser usage
// npx rollup formpixapi.js --file formpixbrowser.js --format umd --name formPixAPI --plugin node-resolve commonjs
// or this to be simple
// npx rollup -c
