let charData, wordData, util, word, charIdx, partIdx;
let autostep = 1;
let tid = 0;
let dir = 1; // 0 = pause

function preload() {
  charData = loadJSON('../chardata.json');
  wordData = loadJSON('../words-trad.json');
}

function setup() {
  createCanvas(1024, 512);
  textSize(24);
  util = new CharUtils(charData, wordData);
  word = util.randWord(2);
  //word = util.getWord("璨");
  step();
}

function keyReleased() {

  clearTimeout(tid);

  if (keyCode === RIGHT_ARROW) {
    autostep = false;
    dir = 1;
    step();
  }
  if (keyCode === LEFT_ARROW) {
    autostep = false;
    dir = -1;
    step();
  }
  if (key == ' ') {
    autostep = !autostep;
    autostep && step();
  }
}

function step() {

  if (dir == 1) {
    if (typeof charIdx === 'undefined') charIdx = 0
    if (typeof partIdx === 'undefined') partIdx = -1;
    word.nextStroke(charIdx, partIdx);
    forward();
  } else if (dir == -1) {
    if (typeof charIdx === 'undefined') charIdx = 1
    if (typeof partIdx === 'undefined') partIdx = 1;
    word.eraseStroke(charIdx, partIdx);
    backward();
  }
}

function forward() {

  if (typeof charIdx === 'undefined') charIdx = 0
  if (typeof partIdx === 'undefined') partIdx = -1;

  if (!word.isVisible()) {

    if (!word.isCharVisible(charIdx)) {

      var dirty = word.nextStroke(charIdx, partIdx);
      if (dirty) {
        loop();
        if (autostep) tid = setTimeout(forward, 100);
      } else {
        if (partIdx < word.characters[charIdx].parts.length - 1) {
          partIdx++;
          forward();
        }
      }
    } else {
      if (charIdx < word.characters.length - 1) {
        partIdx = -1;
        charIdx++;
        forward();
      }
    }
  } else {
    word = util.randWord(2);
    console.log(word.literal);
    word.hide();
    partIdx = -1;
    charIdx = 0;
    if (autostep) tid = setTimeout(forward, 1000);
  }
}

function backward() {

  if (typeof charIdx === 'undefined') charIdx = 1;
  if (typeof partIdx === 'undefined') partIdx = 1;

  if (!word.isHidden()) {

    if (!word.isCharHidden(charIdx)) {

      var dirty = word.eraseStroke(charIdx, partIdx);
      if (dirty) {
        loop();
        if (autostep) tid = setTimeout(backward, 200);
      } else {
        if (partIdx > 0) {
          partIdx--;
          backward();
        }
      }
    } else {
      if (charIdx > 0) {
        partIdx = 1;
        charIdx--;
        backward();
      }
    }
  } else {
    word = util.randWord(2);
    console.log(word.literal);
    word.show();
    partIdx = 1;
    charIdx = 1;
    backward();
  }
}

function draw() {
  background(240);
  renderWord(word);
  textAlign(CENTER);
  text(util.definition(word.literal), width / 2, height - 10);
  textAlign(LEFT);
  text(util.definition(word.literal[0]), 20, 20);
  textAlign(RIGHT);
  text(util.definition(word.literal[1]), width - 20, 20);
  noLoop();
}

function renderWord(word) {
  //console.log('renderWord', word);
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
