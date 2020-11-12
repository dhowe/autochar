
////////////////////////////////////////////////////////////////////////////////
///// Generates chardata.js and definitions.js in top-level of project     /////
////////////////////////////////////////////////////////////////////////////////

// to run: $ node scripts/createDataFiles

const fs = require('fs');
const simp = require('../data/words_simp.json');
const trad = require('../data/words_trad.json');
const cdefs = require('../data/char_defs.json');
const triggers = require('../data/trigger_defs.json');

// generated via createHanziDict.js script
const cdata = require('../data/all_char_data.json'); 

const regex = /\([^)]*[^A-Za-z ,-.')(]+[^)]*\)/g;
const maxWordDefLen = 42, maxCharDefLen = 30;
const triggerPairs = [], fullDict = { simp, trad };

// create dict entry {dict[lang][word]: def} for all valid 2-char words
function compileDictionary() {

  let badDefs = {}, noCharData = {};
  Object.keys(fullDict).forEach(lang => {
    badDefs[lang] = {};
    noCharData[lang] = {};
    Object.keys(fullDict[lang]).forEach(w => {
      if (w.length === 2) {
        if (!cdata[w[0]] || !cdata[w[1]]) {
          noCharData[lang][w] = 1;
        }
        else {
          let def = fullDict[lang][w];
          if (validateWordDef(w, def)) {
            dict[lang][w] = def.replace(/ +/g, ' ').replace(/ ,/g, ',');
          }
          else {
            badDefs[lang][w] = def;
          }
        }
      }
    });
    console.log(lang + '-words: ' + Object.keys(dict[lang]).length
      + ' word defs, ' + Object.keys(badDefs[lang]).length + ' bad defs, '
      + Object.keys(noCharData[lang]).length + ' w\'out char-data');
  });
}

// validate each trigger and remove it if it fails
// add each new definition to the 'dict'
// create sorted trigger-pairs object
function parseTriggerDefs() {

  let msg = 'parsed ' + Object.keys(triggers).length + " triggers";

  // first validate each trigger
  Object.keys(triggers).forEach(w => {

    // check defs are valid
    if (!validateWordDef(w, triggers[w])) {
      throw Error('Invalid trigger def: ' + w + ' -> '
        + triggers[w] + " (len=" + triggers[w].length + ")");
    }
  });

  triggerPairs.splice(0, triggerPairs.length); // clear

  // sort triggers {char: def} first by definition
  // then, if tied, by strokeCount (simp before trad)
  let sorted = Object.entries(triggers).sort
    ((a, b) => (a[1].localeCompare(b[1]))
      || (wordStrokeCount(a[0]) - wordStrokeCount(b[0])));

  let fails = {}, dbug = 0;
  for (let i = 0; i < sorted.length; i++) {
    let word = sorted[i][0], def = sorted[i][1];
    //console.log(i + ') ' + char[0] + ' ' + char[1]);

    //let char = sorted[i][0], def = sorted[i][1];
    if (i < sorted.length - 1 && sorted[i + 1][1] === def) {
      let word2 = sorted[i + 1][0];
      i++; // will skip next bc it is the same pair reversed
      if (!cdata[word[0]] || !cdata[word[1]] || !cdata[word2[0]] || !cdata[word2[1]]) {
        dbug && console.warn('No char-data for: ' + word);
        delete triggers[word];
        delete triggers[word2];
        fails[word] = 1;
        fails[word2] = 1;
        continue;
      }

      // add both 2 dictionary
      dict.simp[word] = triggers[word];
      dict.trad[word2] = triggers[word2];

      // add pair and reverse pair
      triggerPairs.push([word, word2]);
      triggerPairs.push([word2, word]);
    }
    else {

      if (!cdata[word[0]] || !cdata[word[1]]) {
        dbug && console.warn('No char-data[c] for: ' + word);
        delete triggers[word];
        fails[word] = 1;
        continue;
      }
      // add to both dictionaries
      dict.simp[word] = triggers[word];
      dict.trad[word] = triggers[word];

      // add as a single pair
      triggerPairs.push([word, word]);
    }
  }
  console.log(msg + ', ' + Object.keys(fails).length
    + " failed w'out char-data\n" + Object.keys(triggers).length
    + ' trigger defs remaining, ' + triggerPairs.length + ' pairs');
}

// check and repair all char entries in dict
function addCharDefs() {
  let stats = { fixed: 0 };
  Object.keys(dict).forEach(lang => {
    if (lang === 'chars') return;
    Object.keys(dict[lang]).forEach(w => {
      if (w.length !== 2) throw Error('bad length for ' + w);
      for (let i = 0; i < w.length; i++) {
        const ch = w[i];
        if (!dict.chars[ch]) {
          dict.chars[ch] = repairCharDef(ch, stats);
        }
      }
    });
    console.log(lang + '-chars: ' + Object.keys(dict.chars).length
      + ' char defs, ' + stats.fixed + ' repaired');
  });
  return dict;
}

function repairCharDef(w, stats) {

  if (w.length !== 1) throw Error('Bad char: ' + w);
  let def = cdefs[w];
  if (def.length > maxCharDefLen) {
    stats.fixed++;
    //let tmp = def;
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
function prunePathData() {
  let pruned = {};
  Object.keys(cdata).forEach(c => {
    if (dict.chars[c]) pruned[c] = cdata[c];
  });
  let num = (Object.keys(cdata).length - Object.keys(pruned).length);
  console.log('paths: ' + Object.keys(pruned).length + '/'
    + Object.keys(cdata).length + ' char entries, ' + num + ' pruned');
  return pruned;
}
/* 
function pruneTriggers(dict) {
  let badTriggers = [], badChars = {}, dbug = 0;
  Object.keys(triggers).forEach(w => {
    if (w.length !== 2) throw Error('Bad trigger: ' + w);
    if (!cdata.hasOwnProperty(w[0]) || !cdata.hasOwnProperty(w[1])) {
      if (dbug) console.warn('Invalid Trigger (no char-data): ' + w);
      for (let i = 0; i < w.length; i++) {
        if (!cdata.hasOwnProperty(w[i])) {
          if (dbug); console.warn('no char-data for ' + w[i] + ' in ' + w + " [" + triggers[w] + "]");
          badChars[w[i]] = 1;
        }
      }
      badTriggers.push(w);
      delete dict.simp[w];
      delete dict.trad[w];
    }
  });
  badTriggers.forEach(bt => delete triggers[bt]);
  console.log('found ' + badTriggers.length + ' bad triggers, ' + Object.keys(triggers).length + " remaining")
} */

/* function updateTriggerDefs(dict) {

  // then check words already exist in dictionary
  Object.keys(triggers).forEach(t => {
    if (!dict.trad.hasOwnProperty(t) && !dict.simp.hasOwnProperty(t)) {
      console.warn("No def. for trigger: " + t + " -> " + triggers[t]);
    }
    // then update the definitions if needed
    if (dict.trad[t]) dict.trad[t] = triggers[t];
    if (dict.simp[t]) dict.simp[t] = triggers[t];
  });

  console.log('updated ' + Object.keys(triggers).length + ' trigger definitions');
} */

/* function hasCharData(c) {
  return cdata.hasOwnProperty(c);
} */

function charStrokeCount(c) {
  if (!cdata.hasOwnProperty(c)) {
    //console.log('No char-data for: ' + c);
    return -1;
  }
  if (cdata[c].decomposition.length != 3) throw Error('Bad decomp for: ' + c);
  let cstrokes = [[], []];
  for (let j = 0; j < cdata[c].matches.length; j++) {
    let strokeIdx = cdata[c].matches[j][0];
    if (strokeIdx === 0) { // part 0
      cstrokes[0].push(cdata[c].strokes[j]);
    } else if (strokeIdx === 1) { // part 1
      cstrokes[1].push(cdata[c].strokes[j]);
    } else { // should never happen
      throw Error("Null stroke match at [" + j + "]0");
    }
  }
  return cstrokes.reduce((acc, c) => acc + c.length, 0);
}

function wordStrokeCount(c) {
  if (c.length !== 2) throw Error("Invalid word: " + c);
  return charStrokeCount(c[0]) + charStrokeCount(c[1]);
}

function triggerPairsToJs() { // save: not used
  let js = '\nconst WORD_TRIGGERS_PAIRS = ';
  js += triggerPairsToJson();
  return js + ';\n';
}

// write out the trigger pairs for copy/paste
function triggerPairsToJson() {
  let json = '{\n';
  for (let i = 0; i < triggerPairs.length; i++) {
    let s = triggerPairs[i];
    json += '  ' + '"' + s[0] + '": "' + s[1] + '"';
    if (i < triggerPairs.length - 1) json += ',' + '\n';
  }
  json += '\n}';
  return json;
}

function writeTriggerPairs() {
  let name = 'triggers.json';
  console.log('writing ' + triggerPairs.length +
    ' trigger-pairs to \'' + name + '\'');
  fs.writeFileSync(name, triggerPairsToJson());
}

// write the definitions {simp, trad, chars} to a file
function writeDefinitions() {
  let name = 'definitions.json';
  console.log('writing ' + Object.keys(dict.simp).length + '/'
    + Object.keys(dict.trad).length + ' word-defs to \'' + name + '\'');
  fs.writeFileSync(name, JSON.stringify(dict));
}

// prune the path and write the char-data to file
function writeCharData() {
  let paths = prunePathData(dict);
  let name = 'chardata.json';
  console.log('writing ' + Object.keys(paths).length
    + ' char-paths to \'' + name + '\'');
  fs.writeFileSync(name, JSON.stringify(paths));
}

/* console.log(charStrokeCount("少"));
console.log(charStrokeCount("婦"));
console.log(wordStrokeCount("少婦"));
return; */

const dict = { simp: {}, trad: {}, chars: {} };

compileDictionary();
parseTriggerDefs();
addCharDefs();
writeDefinitions();
writeCharData();
writeTriggerPairs()
