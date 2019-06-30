const fs = require('fs');
const path = require('path');
const util = require('util');

const { statSync, readFileSync } = fs;
const { isString } = util;
const compiler = require('./compiler.js');

function setCompilerFile(...files) {
  const pathFile = path.join(__dirname, ...files);
  try {
    if (!statSync(pathFile).isFile()) throw new Error('not found file');
    return compiler(readFileSync(pathFile, 'utf8'));
  } catch (error) {
    console.error(error);
    return null;
  }
}

fs.writeFile(
  __dirname + '/../$.js',
  setCompilerFile('..', 'src', 'index.jsx'),
  error => {
    if (error) throw error;
  }
);
