let charData, wordData, util, word, charIdx, partIdx;

function preload() {
  charData = loadJSON('../chardata.json');
  wordData = loadJSON('../words-trad.json');
}

function setup() {
  createCanvas(1024, 512);
  textSize(24);
  util = new CharUtils(charData, wordData);
  word = util.randWord(2);
  console.log(word.literal);
  word.show();
  unstep();
}

function mouseClicked() {
  if (typeof charIdx === 'undefined') charIdx = 1
  if (typeof partIdx === 'undefined') partIdx = 1;
  word.eraseStroke(charIdx, partIdx);
  unstep();
}

function step() {
  if (typeof charIdx === 'undefined') charIdx = 0
  if (typeof partIdx === 'undefined') partIdx = -1;

  if (!word.isVisible()) {

    if (!word.isCharVisible(charIdx)) {

      var dirty = word.nextStroke(charIdx, partIdx);
      if (dirty) {
        loop();
        setTimeout(step, 100);
      }
      else {
        if (partIdx < word.characters[charIdx].parts.length-1) {
          partIdx++;
          step();
        }
      }
    }
    else {
      if (charIdx < word.characters.length-1) {
        partIdx = -1;
        charIdx++;
        step();
      }
    }
  }
  else {
    word = util.randWord(2);
    word.hide();
    partIdx = -1;
    charIdx = 0;
    step();
  }
}

function unstep() {

  if (typeof charIdx === 'undefined') charIdx = 1;
  if (typeof partIdx === 'undefined') partIdx = 1;

  if (!word.isHidden()) {

    if (!word.isCharHidden(charIdx)) {

      var dirty = word.eraseStroke(charIdx, partIdx);
      if (dirty) {
        loop();
        setTimeout(unstep, 200);
      }
      else {
        if (partIdx > 0) {
          partIdx--;
          unstep();
        }
      }
    }
    else {
      if (charIdx > 0) {
        partIdx = 1;
        charIdx--;
        unstep();
      }
    }
  }
  else {
    word = util.randWord(2);
    word.show();
    partIdx = 1;
    charIdx = 1;
    unstep();
  }
}

function draw() {
  background(240);
  renderWord(word);
  textAlign(CENTER);
  text(word.definition(), width / 2, height - 10);
  textAlign(LEFT);
  text(word.definition(0), 20, 20);
  textAlign(RIGHT);
  text(word.definition(1), width - 20, 20);
  noLoop();
}

function renderWord(word) {
  if (word.characters) {
    for (var i = 0; i < word.characters.length; i++) {
      //if (i != 1) continue;
      if (word.literal[i] !== ' ')
        util.renderPath(word, i, this._renderer);
    }
  } else {
    textSize(120);
    text(word, width / 2, height / 2);
    textSize(20);
  }
}
