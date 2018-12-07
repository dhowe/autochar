// http://localhost/git/Automachar/p5/index.html

// NEXT: enable back-arrow
var util, word, charData, wordData, actions = [];
var med = 0,
  steps = 0,
  memsize = 10,
  stepms = 1000,
  autostep = false,
  memory = [];

function preload() {
  charData = loadJSON('../chardata.json');
  wordData = loadJSON('../words-trad.json');
}

function setup() {
  let xx = "hello";
  xx[0] = 'j';
  console.log("x",xx);
  util = new CharUtils(charData, wordData);
  createCanvas(1024, 512);
  textAlign(CENTER);
  textSize(20);
  step();
}

function draw() {

  background(240);
  renderWord(word);
  text(util.def(word.literal), width / 2, height - 10);
  text("med: " + med, width - 40, 20);
  if (memory[memory.length - 2]) {
    text("last: " + memory[memory.length - 2], 55, 20);
  }
  noLoop();
}

function nextWord() {

  if (typeof word === 'undefined') word = util.randWord();
  let bests = util.bestEditDist(word.literal, 0, memory);

  if (!bests || !bests.length) {
    throw Error('Died on ' + word.literal, word);
  }
  return util.getWord(bests[random(bests.length) << 0]);
}

function step(dir) {

  if (dir !== -1) {
    let next = nextWord();

    console.log((++steps) + ")", next.literal); //, next.characters[0].decomposition[0]);
    med = util.minEditDist(word.literal, next.literal);
    word = next;
    remember(word.literal);
    loop();
    autostep && setTimeout(step, stepms)
  } else {
    // step backward
    console.log("step back");
  }
}

function keyReleased() {
  if (key == ' ') autostep = false;
  if (keyCode === LEFT_ARROW) step(1);
  if (keyCode === RIGHT_ARROW) step(-1);
}

function doubleClicked() {
  autostep = true;
  step();
}

function remember(o) {
  memory.push(o);
  if (memory.length > memsize)
    memory.shift();
}

function renderWord(word) {
  if (typeof word.characters === 'undefined') word = util.getWord(word);
  for (var i = 0; i < word.characters.length; i++) {
    renderPath(word.characters[i], i);
  }
}

function renderPath(char, charPos, options) {

  //console.log('renderPath', char);
  var pg = options && options.renderer || this._renderer;
  if (typeof pg === 'undefined') throw Error('No renderer');
  if (typeof char.matches === 'undefined') throw Error('No matches: ' + char.character);

  var pidx = -1,
    pos = 0;

  if (options && typeof options.part != 'undefined') pidx = options.part;
  if (typeof charPos != 'undefined' && charPos > 0) pos = charPos;

  //console.log(char.character, pidx);

  var paths = [];
  if (pidx > -1) {
    for (var i = 0; i < char.matches.length; i++) {
      if (char.matches[i] == pidx) {
        paths.push(new Path2D(char.strokes[i]));
      }
    }
  } else {
    for (var i = 0; i < char.strokes.length; i++) {
      paths.push(new Path2D(char.strokes[i]));
    }
  }

  var ctx = pg.drawingContext,
    adjust = true;

  for (var i = 0; i < paths.length; i++) {
    if (adjust) {
      ctx.translate(0, 512 - 70); // shift for mirror
      if (pos > 0) ctx.translate(512, 0); // shift for mirror
      ctx.scale(.5, -.5); // mirror-vertically
    }

    ctx.fillStyle = "#000";
    if (ctx.isPointInPath(paths[i], mouseX, mouseY)) {
      ctx.fillStyle = "#d00";
    }

    ctx.fill(paths[i]);

    /*
    ctx.strokeStyle = "#777";
    ctx.lineWidth = 6;
    ctx.stroke(paths[i]);
    */

    ctx.setTransform(1, 0, 0, 1, 0, 0); // reset
  }
}
