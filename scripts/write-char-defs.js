// to run: $ node scripts/write-char-defs.js

const fs = require('fs');
const defs = require('../data/kDefinition.json');
const simp = require('../data/words-simp-orig.json');
const trad = require('../data/words-trad-orig.json');

const allChars = {}, singleChars = { 'simp': {}, 'trad': {} };

let dict = {}, skips = 0, fixed = 0;

function extract(w, lookup, lang) {
  for (let i = 0; i < w.length; i++) {
    let chr = w[i];
    allChars[chr] = 1;
    if (lookup[chr]) {
      singleChars[lang][chr] = 1;
    }
  }
}

const RE = /\([^)]*[^A-Za-z ,-.')(]+[^)]*\)/g;
function check(w) {
  if (!defs.hasOwnProperty(w)) {
    return ++skips;
  }
  if (defs[w].length > 30) {
    fixed++;
    let tmp = defs[w];
    defs[w] = defs[w].split(';')[0];
    console.log(w, tmp + '\n  -> ' + defs[w]);
  }
  if (RE.test(defs[w])) {
    fixed++;
    let tmp = defs[w];
    defs[w] = defs[w].replace(RE,'');
    console.log(w, tmp + '\n  -> ' + defs[w]);
  }
  //console.log(w, defs[w])
  dict[w] = defs[w];
}
Object.keys(simp).forEach(w => extract(w, simp, 'simp'));
Object.keys(trad).forEach(w => extract(w, trad, 'trad'));
//Object.keys(trad).forEach(extract);
console.log('Found ' + Object.keys(allChars).length + ' unique characters,',

Object.keys(singleChars['simp']).length + ' char-defs in simp, ',
Object.keys(singleChars['trad']).length + ' char-defs in trad');

Object.keys(allChars).forEach(check);
console.log('Found ' + Object.keys(dict).length + ' defs, ' + skips + ' missing,', fixed + ' repaired');


let fname = 'char-defs.json';
console.log('Writing ' + fname);
fs.writeFileSync(fname, JSON.stringify(dict));


