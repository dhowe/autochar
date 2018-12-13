let charData, wordData, util, word, opts;

function preload() {
  charData = loadJSON('../chardata.json');
  wordData = loadJSON('../words-trad.json');
}

function setup() {
  createCanvas(1024, 512);
  util = new CharUtils(charData, wordData);
  word = util.getWord('拒齐');
  word.visiblePart(0, 0); // 0:left-only, 1:both
  //console.log(word);
}

function mouseClicked() {
  word.nextStroke(0, 1);
  loop();
}

function draw() {
  background(240);
  renderWord(word, opts);
  noLoop();
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
  //if (charIdx == 0) return;
  // -1(none), 0(left), 1(right), max(both)
  var pg = this._renderer;
  var char = word.characters[charIdx];
  var matches = char.matches;
  var parts = char.parts;
  var strokeIdx0 = parts[0]; // left/top part
  var strokeIdx1 = parts[1]; // right/bottom part

  console.log('renderPath', word.literal[charIdx], strokeIdx0, strokeIdx1);

  if (strokeIdx0 < 0 && strokeIdx1 < 0) return; // nothing to draw

  if (typeof pg === 'undefined') throw Error('No renderer');
  if (typeof char.matches === 'undefined') throw Error('No matches: ' + char.character);

  //console.log(char.strokes);
  //console.log(char.matches);
  // WORKING HERE: divide strokes into parts
  // char has two parts
  // each part has a list of strokes
  var paths = [];
  for (var i = 0; i < parts.length; i++) paths[i] = [];

  //for (var i = 0; i < parts.length; i++)
  for (var j = 0; j < char.matches.length; j++) {
    if (char.matches[j] == 0) { // part 0
      paths[0].push(new Path2D(char.strokes[j]));
    }
    // (handle null values by putting them in 2nd part?)
    else { //(char.matches[j] == 1) {   // part 1
      paths[1].push(new Path2D(char.strokes[j]));
    }
  }

  //console.log(paths);
  //
  // // draw all parts completely
  // if (strokeIdx0 == Number.MAX_SAFE_INTEGER && strokeIdx1 == Number.MAX_SAFE_INTEGER) {
  //   for (var i = 0; i < char.strokes.length; i++) {
  //     paths.push(new Path2D(char.strokes[i]));
  //   }
  // }
  // else { // draw some part only partially
  //   for (var i = 0; i < parts.length; i++) {
  //     // i = 0 || 1
  //     for (var j = 0; j < char.matches.length; j++) {
  //       if (char.matches[j] === i) {
  //         paths.push(new Path2D(char.strokes[i]));
  //       }
  //     }
  //   }
  // }

  var ctx = pg.drawingContext,
    adjust = true;

  ctx.fillStyle = "#000";
  for (var j = 0; j < paths.length; j++) {
    for (var i = 0; i < paths[j].length; i++) {
      if (adjust) {
        ctx.translate(0, 512 - 70); // shift for mirror
        if (charIdx > 0) ctx.translate(512, 0); // shift for mirror
        ctx.scale(.5, -.5); // mirror-vertically
      }

      /* if (ctx.isPointInPath(paths[i], mouseX, mouseY)) {
        ctx.fillStyle = "#d00";
      }*/

      //if (strokeIdx < 0 || i <= strokeIdx) // TEMP, FIX
      if (parts[j] >= i)
        ctx.fill(paths[j][i]);

      /*
      ctx.strokeStyle = "#777";
      ctx.lineWidth = 6;
      ctx.stroke(paths[i]);
      */

      ctx.setTransform(1, 0, 0, 1, 0, 0); // reset
    }
  }
}
