// to run: $ node scripts/write-word-defs

const fs = require('fs'), maxCharDefLength = 30;
const chars = require('../data/char-data-orig.json');
const cdefs = require('../data/char-defs-orig.json');
const simp = require('../data/words-simp-orig.json');
const trad = require('../data/words-trad-orig.json');
const dict = { simp: {}, trad: {}, single: {} };
const regex = /\([^)]*[^A-Za-z ,-.')(]+[^)]*\)/g;

//function validateSingle(w) {

function handleSingle(w)  {

  if (!cdefs[w]) return ++skipped;
  if (cdefs[w].length > maxCharDefLength) {
    fixed++;
    let tmp = cdefs[w];
    let parts = cdefs[w].split(';');
    if (parts.length > 1) {
      cdefs[w] = parts.reduce((acc, val) =>
        (acc.length + val.length < maxCharDefLength) ? acc + ';' + val : acc);
      //console.log(w, tmp + '\n  ->1 ' + cdefs[w]);
    }
    else if (cdefs[w].length > maxCharDefLength + 5) {
      cdefs[w] = cdefs[w].substring(0, 30) + '...';
      //console.log(w, tmp + '\n  ->2 ' + cdefs[w]);
    }
  }
  if (regex.test(cdefs[w])) {
    fixed++;
    let tmp = cdefs[w];
    cdefs[w] = cdefs[w].replace(regex, '');
    //console.log(w, tmp + '\n  ->3 ' + cdefs[w]);
  }
  dict.single[w] = cdefs[w];
} 

function check(w, lang) {

  let data = lang.data;
  data[w] = data[w].replace(/ ,/g, ',').replace(/ +/g, ' ');

  if (w.length === 1) { // single-char
    lang.singles++;
    handleSingle(w);
    return;
  }

  if (w.length > 2 || data[w].length > 40 || data[w].startsWith("-")) {
    lang.skips++;
    return;
  }

  if (w.length > 1 && !/^[A-Za-z ',.-]+$/.test(data[w])) {
    //console.log(w + ': "' + data[w] + '"');
    lang.skips++;
    return;
  }

  dict[lang.name][w] = data[w];
}

let langs = [
  { name: 'simp', data: simp, skips: 0, singles: 0, missing: [], num: 0 },
  { name: 'trad', data: trad, skips: 0, singles: 0, missing: [], num: 0 }
];

let fixed = 0, skipped = 0;

for (let i = 0; i < langs.length; i++) {
  Object.keys(langs[i].data).forEach(w => check(w, langs[i]));
  langs[i].num = Object.keys(dict[langs[i].name]).length;
}

console.log();


let total = langs[0].num + langs[1].num;
for (let i = 0; i < langs.length; i++) {
  Object.keys(dict[langs[i]].data).forEach(w => {
    for (let i = 0; i < w.length; i++) {
      const ch = w[i];
      if (!dict.single[ch]) throw Error('No single for ' + ch + ' in ' + w);
    }
  });
  console.log('\nFound ' + langs[i].num + ' ' + langs[i].name + '. entries, ' 
    + langs[i].singles + ' singles, ' + langs[i].skips + ' removed');
}

let defFile = 'definitions.json';
console.log('\nWriting ' + total + ' entries to \'' + defFile + '\' (' + skipped + ' skipped)\n ',
  Object.keys(dict.single).length + ' single chars,', fixed + ' defs repaired');
fs.writeFileSync(defFile, JSON.stringify(dict));

let dataFile = 'chardata.json';
let charData = {};
Object.keys(chars).forEach(c => {
  if (dict.single[c]) charData[c] = chars[c];
  //else if (c === '伄') throw Error('skipping '+c)
});
console.log('\nWriting ' + Object.keys(charData).length 
  + ' char-data entries to \'' + dataFile+'\'');
fs.writeFileSync(dataFile, JSON.stringify(charData));