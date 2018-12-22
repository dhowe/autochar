if (typeof Path2D == 'undefined') Path2D = (class Path2DMock {});

let fs = require('fs');
let util = require('./cutils');
let Autochar = require('./autochar');

let chars = JSON.parse(fs.readFileSync("chardata.json", 'utf8'));
let trad = JSON.parse(fs.readFileSync('words-trad.json', 'utf8'));
let simp = JSON.parse(fs.readFileSync('words-simp.json', 'utf8'));

textWidth = function () { return -1; }
textAscent = function () { return -1; }
textDescent = function () { return -1; }
millis = function () { return +new Date(); }
elapsed = function (t) { return millis() - t; };

let word;
let count = 0;
let nodes = {};
let args = process.argv.slice(2);
let numlines = args && args[0] || 10;
let timer = millis();

onActionComplete = function (next, med) {
  if (next) {
    if (word) console.log(word + ',' + next.literal + ',' + med);
    word = next.literal;
    count++;
  }
}

step = function () {
  typer.step();
  if (count < numlines) {
    setTimeout(step, 1);
  } else {
    var e = elapsed(timer);
    console.log('Processed ' + count + ' steps in ' +
      Math.round(e / 1000) + "s at " + (e / count) + 'ms per-step, '+typer.triggers+' triggers');
  }
}

typer = new Autochar(util, onActionComplete);
step();
