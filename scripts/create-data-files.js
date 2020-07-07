// to run: $ node scripts/create-data-files


const fs = require('fs');
const simp = require('../data/words-simp-orig.json');
const trad = require('../data/words-trad-orig.json');
const cdefs = require('../data/char-defs-orig.json');
const cdata = require('../data/char-data-orig.json');
const regex = /\([^)]*[^A-Za-z ,-.')(]+[^)]*\)/g;

const wordData = { simp, trad }

const maxWordDefLen = 42, maxCharDefLen = 30;

function compileWordDict(dict) {

  let misses = {};
  Object.keys(wordData).forEach(lang => {
    let data = wordData[lang];
    misses[lang] = {};
    Object.keys(data).forEach(w => {
      if (w.length === 2) {
        let def = data[w];
        if (validateWordDef(w, def)) {
          dict[lang][w] = def;
        }
        else {
          misses[lang][w] = def;
        }
      }
    });
    console.log(lang + '-words: ' + Object.keys(dict[lang]).length
      + ' word defs, ' + Object.keys(misses[lang]).length + ' misses');
  });
}

function addCharDefs(dict) {
  let stats = { fixed: 0 };
  Object.keys(dict).forEach(lang => {
    if (lang === 'chars') return;
    let data = dict[lang];
    Object.keys(data).forEach(w => {
      if (w.length !== 2) throw Error('bad length for ' + w);
      for (let i = 0; i < w.length; i++) {
        const ch = w[i];
        if (!dict.chars[ch]) {
          dict.chars[ch] = validateCharDef(ch, stats);
        }
      }
    });
    console.log(lang + '-chars: ' + Object.keys(dict.chars).length
      + ' char defs, ' + stats.fixed + ' fixes');
  });
  return dict;
}

function validateCharDef(w, stats) {

  if (w.length !== 1) throw Error('Bad char: ' + w);

  let def = cdefs[w];
  if (def.length > maxCharDefLen) {
    stats.fixed++;
    let tmp = def;
    let parts = def.split(';');
    if (parts.length > 1) {
      def = parts.reduce((acc, val) =>
        (acc.length + val.length < maxCharDefLen) ? acc + ';' + val : acc);
      //console.log(w, tmp + '\n  ->1 ' + cdefs[w]);
    }
    else if (def.length > maxCharDefLen + 5) {
      def = def.substring(0, 30) + '...';
      //console.log(w, tmp + '\n  ->2 ' + cdefs[w]);
    }
  }

  if (regex.test(def)) {
    stats.fixed++;
    let tmp = def;
    def = def.replace(regex, '');
    //console.log(w, tmp + '\n  ->3 ' + cdefs[w]);
  }

  return def;
}

function validateWordDef(w, def) {
  if (!cdefs[w[0]] || !cdefs[w[1]]) return false;
  if (!def
    || def.length > maxWordDefLen
    || def.startsWith("-")
    || def.startsWith('see ')
    || def.includes('variant of')
    || !/^[A-Za-z ',.-]+$/.test(def)) {
    return false;
  }
  return true;
}

function prunePathData(dict) {
  let pruned = {}, cdl = Object.keys(cdata).length;
  Object.keys(cdata).forEach(c => dict.chars[c] && (pruned[c] = cdata[c]));
  let num = (Object.keys(cdata).length - Object.keys(pruned).length);
  console.log('paths: ' + Object.keys(pruned).length + '/' + cdl + ' char entries, ' + num + ' pruned');
  return pruned;
}

let defs = { simp: {}, trad: {}, chars: {} };
compileWordDict(defs);
addCharDefs(defs);
let paths = prunePathData(defs);

let name = 'definitions.json';
console.log('writing ' + Object.keys(defs.simp).length + '/' 
  + Object.keys(defs.trad).length + ' word-defs to \'' + name + '\'');
fs.writeFileSync(name, JSON.stringify(defs));

name = 'chardata.json';
console.log('writing ' + Object.keys(paths).length +' char-paths to \'' + name + '\'');
fs.writeFileSync(name, JSON.stringify(paths));