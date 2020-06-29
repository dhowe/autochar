// to run: $ node scripts/prune-dicts

const fs = require('fs');
const simp = require('../data/words-simp-orig.json');
const trad = require('../data/words-trad-orig.json');

function check(w, lang) {
  
  let data = lang.data;
  data[w] = data[w].replace(/ ,/g, ',').replace(/ +/g, ' ');
  if (w.length === 1) {
    lang.skips++;
    return;
  }

 /* if (w.length === 1) {
    lang.singles++;
    if (!data.hasOwnProperty(w)) {
      lang.missing.push(w)
      //console.log('Error', w,data[w]);
    }
  }*/
  
  if (w.length > 2 || data[w].length > 40 || data[w].startsWith("-")) {
    //console.log(w + ': "' + data[w] + '"');
    lang.skips++;
    return;
  }
 
  if (w.length > 1 && !/^[A-Za-z ',.-]+$/.test(data[w])) {
    //console.log(w + ': "' + data[w] + '"');
    lang.skips++;
    return;
  }
  lang.updated[w] = data[w];
}

let langs = [
  { name: 'simp', data: simp, updated: {}, skips: 0, singles: 0, missing: [] },
  { name: 'trad', data: trad, updated: {}, skips: 0, singles: 0, missing: [] }
];

for (let i = 0; i < langs.length; i++) {
  let skips = 0;
  Object.keys(langs[i].data).forEach(w => check(w, langs[i]));
  console.log('Found ' + Object.keys(langs[i].updated).length + ' ' + langs[i].name 
    + ' entries, ' + langs[i].singles + ' singles, '+ langs[i].skips + ' removed');
  let fname = 'words-' + langs[i].name + '.json';
  console.log('Writing ' + fname);
  fs.writeFileSync(fname, JSON.stringify(langs[i].updated));
}

