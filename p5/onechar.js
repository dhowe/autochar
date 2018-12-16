let charData, wordData, util, word;

function preload() {
  charData = loadJSON('../chardata.json');
  wordData = loadJSON('../words-trad.json');
}

function setup() {
  createCanvas(1024, 512);
  util = new CharUtils(charData, wordData);
  word = util.getWord('拒齐');
  //word.visiblePart(0, -1); // 0:left-only, 1:both
  //word.visiblePart(1, -1); // 0:left-only, 1:both

  //console.log(word);
  //setTimeout(step, 500);
}

function step() {
  word.nextStroke(1, 1);
  loop();
  //setTimeout(step, 500);

  // NEXT: go from totally empty (2 blank chars) to totally full by strokes
}

function mouseClicked() {
  word.nextStroke(1, 1);
  loop();

}

function draw() {
  background(240);
  renderWord(word);
  noLoop();
}

function renderWord(word) {
  if (word.characters) {
    for (var i = 0; i < word.characters.length; i++) {
      if (word.literal[i] !== ' ')
        util.renderPath(word, i, this._renderer);
    }
  } else {
    textSize(120);
    text(word, width / 2, height / 2);
    textSize(20);
  }
}
