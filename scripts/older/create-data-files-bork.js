// to run: $ node scripts/create-data-files

const maxWordDefLen = 42, maxCharDefLen = 30;

const fs = require('fs');
const simp = require('../data/words-simp-orig.json');
const trad = require('../data/words-trad-orig.json');
const cdefs = require('../data/char-defs-orig.json');
const cdata = require('../data/char-data-orig.json');
const regex = /\([^)]*[^A-Za-z ,-.')(]+[^)]*\)/g;

function unifyWordDicts() {

  let combined = {}, duals = 0;
  let tadds = 0, missing = 0, badDefs = 0;

  // Add the simplified entries, checking for differing definitions 
  Object.keys(simp).forEach(w => {
    if (w.length === 2) {
      let sd = simp[w], td = trad[w], def = sd;
      if (td) {
        duals++;
        if (td !== sd && !td.includes('variant of')) { // collision
          if (sd.includes('variant of') || sd.startsWith('see ')
            || sd.length > maxWordDefLen && td.length < sd.length) {
            def = td;
          }
          else if (td.length < maxWordDefLen) {
            def = td + '; ' + sd;
            //console.log(w + ': ' + def + '\n  simp: ' + sd + '\n  trad: ' + td, sd.length);
          }
        }
      }
      if (!cdefs[w[0]] || !cdefs[w[1]]) { // ignore word with missing char-def
        missing++;
      }
      else {
        if (validateWordDef(w, def)) {
          combined[w] = def;
        }
        else {
          badDefs++;
        }
      }
    }
  });

  console.log('\n' + Object.keys(combined).length + '/' + Object.keys(simp).length
    + ' added from simp/collisions (' + duals + ' in both)');

  // Add the traditional entries
  Object.keys(trad).forEach(w => {
    if (w.length === 2 && !combined[w]) {
      if (!cdefs[w[0]] || !cdefs[w[1]]) { // ignore word with missing char-def
        missing++;
      }
      else {
        if (validateWordDef(w, trad[w])) {
          combined[w] = trad[w];
          tadds++;
        }
        else {
          //console.log('BAD: '+trad[w]);
          badDefs++;
        }
      }
    }
  });
  console.log(tadds + '/' + Object.keys(trad).length + ' added from trad,',
    Object.keys(combined).length + ' total words\nIgnored ' + missing +
    ' words with missing char defs\nIgnored ' + badDefs + ' words with bad word sdefs');

  return combined;
}

function validateWordDef(w, def) {

  if (w.length !== 2) throw Error('Illegal state');
  if (!def
    || def.startsWith("-")
    || def.length > maxWordDefLen
    || !/^[A-Za-z ',.-]+$/.test(def)) {
    return false;
  }
  return true;
}

function addCharDefs(dict) {
  let chars = []; stats = { fixed: 0 };
  Object.keys(dict).forEach(w => {
    if (w.length !== 2) throw Error('bad length for ' + w);
    for (let i = 0; i < w.length; i++) {
      const ch = w[i];
      if (!cdefs[ch]) throw Error('no cdef for ' + ch + ' in ' + w);
      if (!dict[ch]) {
        dict[ch] = validateCharDef(ch, stats);
        chars[ch] = 1;
      }
    }
  });
  console.log('Added ' + Object.keys(chars).length + ' unique '
    + 'characters, fixed ' + stats.fixed + ' defs');

  return chars;
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

function pruneCharData() {
  let pruned = {}, cdl = Object.keys(cdata).length;
  Object.keys(cdata).forEach(c => chars[c] && (pruned[c] = cdata[c]));
  console.log('Pruned ' + (Object.keys(cdata).length -
    Object.keys(pruned).length) + '/' + cdl + ' char-data entries');
  return pruned;
}

function writeJSON(name, data) {
  console.log('\nWriting ' + Object.keys(data).length + ' entries to \'' + name + '\'');
  fs.writeFileSync(name, JSON.stringify(data));
}

let dict = unifyWordDicts();
let chars = addCharDefs(dict);
let pruned = pruneCharData(chars);

writeJSON('chardata.json', pruned);
writeJSON('definitions.json', dict);