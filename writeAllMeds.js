if (typeof Path2D == 'undefined') Path2D = (class Path2DMock {});

let fs = require('fs');
let util = require('./cutils');
let memo = require('fast-memoize')

let args = process.argv.slice(2);
let maxAllowedMed = args && Math.min(args[0],10) || 10;
let writeFile = (args && args.length > 1 && args[1] == '-f');
let edgeFile = 'edges-dist'+maxAllowedMed+'.csv';
let words = JSON.parse(fs.readFileSync('words-trad.json', 'utf8'));
let keys = Object.keys(words);
let memMED = memo(util.rawEditDistance);

console.log('Loaded '+keys.length+' words (med<='+maxAllowedMed+')');

function minEditDist(l1, l2) {
  var cost = Math.max(0, memMED(l1, l2) - 1);
  let e1 = util.getWord(l1).toEditStr();
  let e2 = util.getWord(l2).toEditStr();
  //console.log('minEditDistance', e1, 'vs', e2, cost);
  return memMED(e1, e2) + cost;
}

let edgeData = 'source,target,med';
for (var i = 0; i < keys.length; i++) {
  for (var j = 0; j < keys.length; j++) {
    if (i == j) continue;
    var word1 = keys[i];
    var word2 = keys[j];
    //var med = util.minEditDistance(word1, word2);
    var med = minEditDist(word1, word2);
    if (med <= maxAllowedMed) {
        var line = word1+','+word2+','+med;
        if (writeFile) {
          edgeData += line + "\n";
        }
        else console.log(line);
    }
  }
  if (writeFile && i%100==0) {
    console.log(Math.floor((i/keys.length)*1000)/10+'% complete');
  }
}

if (args && args.length > 1 && args[1] == '-f') {
  fs.writeFileSync(edgeFile, edgeData);
  console.log('Wrote file: '+edgeFile);
}
