// to run: $ node scripts/write-word-defs
let simp = require('../data/words-simp-orig.json');
let trad = require('../data/words-trad-orig.json');
let cdefs = require('../data/char-defs-orig.json');

function unifyDictionaries() {

  let maxDefLength = 40, combined = {}, duals = 0;
  let tadds = 0, missing = 0;

  Object.keys(simp).forEach(w => {
    if (w.length === 2) {
      let sd = simp[w], td = trad[w], def = sd;
      if (td) {
        duals++;
        if (td !== sd && !td.includes('variant of')) { // collision
          if (sd.includes('variant of') || sd.startsWith('see ')
            || sd.length > maxDefLength && td.length < sd.length) {
            def = td;
          }
          else if (td.length < maxDefLength) {
            def = td + '; ' + sd;
            //console.log(w + ': ' + def + '\n  simp: ' + sd + '\n  trad: ' + td, sd.length);
          }
        }
      }
      if (!cdefs[w[0]] || !cdefs[w[1]]) { // ignore word with missing char-def
        missing++;
      }
      else {
        combined[w] = def;
      }
    }
  });
  console.log('\n' + Object.keys(combined).length + '/' + Object.keys(simp).length
    + ' added from simp/collisions (' + duals + ' in both)');
  Object.keys(trad).forEach(w => {
    if (w.length === 2 && !combined[w]) {
      if (!cdefs[w[0]] || !cdefs[w[1]]) { // ignore word with missing char-def
        missing++;
      }
      else {
        tadds++;
        combined[w] = trad[w];
      }
    }
  });
  console.log(tadds + '/' + Object.keys(trad).length + ' added from trad,',
    Object.keys(combined).length + ' total words');
  console.log('Ignored ' + missing + ' words with missing char defs');
  return combined;
}

function addCharDefs(dict) {
  let adds = 0; 
  Object.keys(dict).forEach(w => {
    if (w.length !== 2) throw Error('bad length for ' + w);
    let c0 = w[0], c1 = w[1];
    if (!cdefs[c0]) throw Error('no cdef for ' + c0 + ' in ' + w);
    if (!cdefs[c1]) throw Error('no cdef for ' + c1 + ' in ' + w);
    if (!dict[c0]){
      dict[c0] = cdefs[c0];
      adds++;
    }
    if (!dict[c1]) {
      dict[c1] = cdefs[c1];
      adds++;
    }
  });
  console.log('Added '+adds+' unique single characters');
}

/* let defFile = 'definitions.json';
console.log('\nWriting ' + total + ' Object.keys(dict).length to \'' + defFile + '\' (' + skipped + ' skipped)\n ',
  Object.keys(dict.single).length + ' single chars,', fixed + ' defs repaired');
fs.writeFileSync(defFile, JSON.stringify(dict));
 */

let dict = unifyDictionaries();
addCharDefs(dict);

// NEXT: need to repair defs (see 'write-definitions.js')
//       write definitions.json
//       then write chardata.json




