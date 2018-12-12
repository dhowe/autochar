let charData, wordData, util, word, opts;

function preload() {
  charData = loadJSON('../chardata.json');
  wordData = loadJSON('../words-trad.json');
}

function setup() {
  createCanvas(1024, 512);
  util = new CharUtils(charData, wordData);
  word = util.getWord('拒三');
  console.log(word);
}

function draw() {
  background(240);
  renderWord(word, opts);
  noLoop();
}

function mouseClicked() {
  if (mouseX < width/2) {
    var part = word.partIdxs[0];
    if (part < 0) word.setPart(0, 1);
    if (part == 1) word.setPart(0, 0);
    if (part == 0) word.setPart(0, 1);
  }
  else {
    word.nextStroke(0);
  }
  loop();
}

function renderWord(word) {
  if (word.characters) {
    for (var i = 0; i < word.characters.length; i++) {
      if (word.literal[i] !== ' ')
        renderPath(word, i);
    }
  } else {
    textSize(120);
    text(word, width / 2, height / 2);
    textSize(20);
  }
}

function renderPath(word, charIdx) {

  var pg = this._renderer;
  var char = word.characters[charIdx];
  var partIdx = word.partIdxs[charIdx];
  var strokeIdx = word.strokeIdxs[charIdx];

  console.log('renderPath', word.literal[charIdx], partIdx, strokeIdx);

  if (typeof pg === 'undefined') throw Error('No renderer');
  if (typeof char.matches === 'undefined') throw Error('No matches: ' + char.character);

  var paths = [];
  if (partIdx > -1) {
    for (var i = 0; i < char.matches.length; i++) {
      if (char.matches[i] == partIdx) {
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

  ctx.fillStyle = "#000";
  for (var i = 0; i < paths.length; i++) {
    if (adjust) {
      ctx.translate(0, 512 - 70); // shift for mirror
      if (charIdx > 0) ctx.translate(512, 0); // shift for mirror
      ctx.scale(.5, -.5); // mirror-vertically
    }

    /* if (ctx.isPointInPath(paths[i], mouseX, mouseY)) {
      ctx.fillStyle = "#d00";
    }*/
    if (strokeIdx < 0 || i <= strokeIdx)
      ctx.fill(paths[i]);

    /*
    ctx.strokeStyle = "#777";
    ctx.lineWidth = 6;
    ctx.stroke(paths[i]);
    */

    ctx.setTransform(1, 0, 0, 1, 0, 0); // reset
  }
}
