// to run: $ node scripts/create-data-files

const fs = require('fs');
const simp = require('../data/words-simp-orig.json');
const trad = require('../data/words-trad-orig.json');
const cdefs = require('../data/char-defs-orig.json');
const cdata = require('../data/char-data-orig.json');
const triggers = require('../data/triggers-orig.json');
const regex = /\([^)]*[^A-Za-z ,-.')(]+[^)]*\)/g;

const maxWordDefLen = 42, maxCharDefLen = 30;
const wordData = { simp, trad }

function compileWordDict(dict) {

  let misses = {};
  Object.keys(wordData).forEach(lang => {
    let data = wordData[lang];
    misses[lang] = {};
    Object.keys(data).forEach(w => {
      if (w.length === 2) {
        let def = data[w];
        if (validateWordDef(w, def)) {
          dict[lang][w] = def.replace(/ +/g, ' ').replace(/ ,/g, ',');
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

  return def.replace(/ +/g, ' ');
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

function appendTriggers(dict) {
  let result = [], log = false, data = {};
  Object.keys(triggers).forEach(t => {
    if (dict.trad[t]) {
      // modify the definition?
      log && console.log(t + '\t' + trad[t] + (triggers[t] ? ' OR ' + triggers[t] : ''), '[trad]');
      result.push(t)
      data[t] = { def: trad[t] + (triggers[t] && trad[t].toLowerCase() !== triggers[t].toLowerCase() ? ' OR ' + triggers[t] : ''), lang: 'trad' }
    }
    else if (dict.simp[t]) {
      // modify the definition?
      log && console.log(t + '\t' + simp[t] + (triggers[t] ? ' OR ' + triggers[t] : ''), '[simp]');
      data[t] = { def: simp[t] + (triggers[t] && simp[t].toLowerCase() !== triggers[t].toLowerCase() ? ' OR ' + triggers[t] : ''), lang: 'simp' }
      result.push(t);
    }
    /*else {
      // def doesn't exist, but chars do
      if (cdata[t[0]] && cdata[t[1]]) {

          if (triggers[t]) {
            dict[trad][t] = triggers[t];
            dict[simp][t] = triggers[t];
          } 

        // so lets add to both dictionaries (?)
        log && console.log(t + '\t' + (triggers[t] || '???'), '[simp/trad]');
        //data[t] = { def: (triggers[t] || '???'), lang: 'simp/trad' }
        result.push(t);
      }
    }*/
  });
  return data;
}


let defs = { simp: {}, trad: {}, chars: {} };
compileWordDict(defs);
/* let res = appendTriggers(defs);
console.log('\nFound ' + Object.keys(res).length + ' possible triggers\n');
let name = 'trig.json';
fs.writeFileSync(name, JSON.stringify(res, 0, 2));
return; */
addCharDefs(defs);
let paths = prunePathData(defs);

name = 'definitions.json';
console.log('writing ' + Object.keys(defs.simp).length + '/'
  + Object.keys(defs.trad).length + ' word-defs to \'' + name + '\'');
fs.writeFileSync(name, JSON.stringify(defs));

name = 'chardata.json';
console.log('writing ' + Object.keys(paths).length + ' char-paths to \'' + name + '\'');
fs.writeFileSync(name, JSON.stringify(paths));