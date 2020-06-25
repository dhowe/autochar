const fs = require('fs');
const simp = require('../words-simp-orig.json');
const trad = require('../words-trad-orig.json');

function check(w, lang) {

  if (w.length !== 2) return;
  let data = lang.data;
  data[w] = data[w].replace(/ ,/g, ',');
  if (data[w].length > 40) {
    //console.log(w + ': "' + data[w] + '"');
    lang.skips++;
    return;
  }
  if (!/^[A-Za-z ',.-]+$/.test(data[w])) {
    //console.log(w + ': "' + data[w] + '"');
    lang.skips++;
    return;
  }
  lang.updated[w] = data[w];
}

let langs = [
  { name: 'simp', data: simp, updated: {}, skips: 0 },
  { name: 'trad', data: trad, updated: {}, skips: 0 }
];

for (let i = 0; i < langs.length; i++) {
  let skips = 0;
  Object.keys(langs[i].data).forEach(w => check(w, langs[i]));
  console.log('Found ' + Object.keys(langs[i].updated).length + ' ' + langs[i].name + ' entries, ' + langs[i].skips + ' removed');
  let fname = 'words-' + langs[i].name + '.json';
  console.log('Writing ' + fname);
  fs.writeFileSync(fname, JSON.stringify(langs[i].updated));
}

