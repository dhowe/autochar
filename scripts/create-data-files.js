
////////////////////////////////////////////////////////////////////////////////
///// Generates chardata.js and definitions.js in top-level of project     /////
////////////////////////////////////////////////////////////////////////////////

// to run: $ node scripts/create-data-files

const fs = require('fs');
const simp = require('../data/words-simp-orig.json');
const trad = require('../data/words-trad-orig.json');
const cdefs = require('../data/char-defs-orig.json');
const cdata = require('../data/all-char-data.json');
const triggers = require('../data/trigger-defs.json');

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
  if (!def) return;
  def = def.replace(/, abbr\. for .+/g, "");
  def = def.replace(/, also written .+/g, "");
  if (def.length > maxWordDefLen) {
    //console.log("SKIP-LEN(" + lang + "): " + w + ": " + def);
    return false;
  }
  if (def.startsWith("-")
    || def.startsWith('see ')
    || def.includes('prefecture')
    || def.includes('municipality')
    || def.includes('variant of')) {
    //console.log("SKIP1(" + lang + "): " + w + ": " + def);
    return false;
  }
  if (!/^[A-Za-z ',.()é°θàō=√@;’&:ó♥0-9+%āü*-]+$/.test(def)) {
    if (!/^[A-Z]/.test(def) && !/[?!]$/.test(def)) {
      //console.log("SKIP2(" + lang + "): " + w + ": " + def);
    }
    return false;
  };
  return true;
}

// remove character data (paths) if not used in dictionary
function prunePathData(dict) {
  let pruned = {};
  Object.keys(cdata).forEach(c => {
    if (dict.chars[c]) pruned[c] = cdata[c];
  });
  let num = (Object.keys(cdata).length - Object.keys(pruned).length);
  console.log('paths: ' + Object.keys(pruned).length + '/'
    + Object.keys(cdata).length + ' char entries, ' + num + ' pruned');
  return pruned;
}

function updateTriggersDefs(dict) {

  // first check the defs are valid
  Object.keys(triggers).forEach(w => {
    let def = triggers[w];
    if (!validateWordDef(w, def)) {
      throw Error('Invalid trigger def: ' + w + ' -> ' + def + " (len=" + def.length + ")");
    }
  });

  // then check words already exist in dictionary
  Object.keys(triggers).forEach(t => {
    if (!dict.trad.hasOwnProperty(t) && !dict.simp.hasOwnProperty(t)) {
      console.warn("No def. for trigger: " + t + " -> " + triggers[t]);
    }
    // then update the definitions if neededs
    if (dict.trad[t]) dict.trad[t] = triggers[t];
    if (dict.simp[t]) dict.simp[t] = triggers[t];
  });

  console.log('updated ' + Object.keys(triggers).length + ' trigger definitions');
}

function writeCharData(defs) {
  let paths = prunePathData(defs);
  let name = 'chardata.json';
  console.log('writing ' + Object.keys(paths).length + ' char-paths to \'' + name + '\'');
  fs.writeFileSync(name, JSON.stringify(paths));
}

function writeDefinitions(defs) {
  let name = 'definitions.json';
  console.log('writing ' + Object.keys(defs.simp).length + '/'
    + Object.keys(defs.trad).length + ' word-defs to \'' + name + '\'');
  fs.writeFileSync(name, JSON.stringify(defs));
}

const defs = { simp: {}, trad: {}, chars: {} };

compileWordDict(defs);
updateTriggersDefs(defs);
addCharDefs(defs);
pruneTriggersWithoutCharData();
writeDefinitions(defs);
writeCharData(defs);

function pruneTriggersWithoutCharData() {
  let badTriggers = [], badChars = {}, dbug = 0;
  Object.keys(triggers).forEach(w => {
    if (w.length !== 2) throw Error('Bad trigger: ' + w);
    if (!cdata.hasOwnProperty(w[0]) || !cdata.hasOwnProperty(w[1])) {
      if (dbug)console.warn('Invalid Trigger (no char-data): ' + w);
      for (let i = 0; i < w.length; i++) {
        if (!cdata.hasOwnProperty(w[i])) {
          if (dbug) console.warn('  no char-data for ' + w[i] + ' in ' + w);
          badChars[w[i]] = 1;
        }
      }
      badTriggers.push(w);
      delete defs.simp[w];
      delete defs.trad[w];
    }
  });
  badTriggers.forEach(bt => delete triggers[bt]);
  console.log('found ' + badTriggers.length + ' bad triggers, '+Object.keys(triggers).length+" remaining")
}

console.log('\nconst WORD_TRIGGERS =', JSON.stringify(Object.keys(triggers)), ';\n');
