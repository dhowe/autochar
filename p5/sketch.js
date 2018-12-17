// http://localhost/git/Automachar/p5/index.html

// NEXT: erase/replace characters part-by-part
//       then erase/replace characters stroke-by-stroke
//       flash/sound on word ?
var util, tid, memory, charData, wordData, actions = [];
var med = 0,
  word = 0,
  next = 0,
  dbeng = 0,
  steps = 0,
  stepms = 1000,
  autostep = 0;

function preload() {
  charData = loadJSON('../chardata.json');
  wordData = loadJSON('../words-trad.json');
}

function setup() {
  util = new CharUtils(charData, wordData);
  memory = new util.HistQ(10);
  createCanvas(1024, 512);
  textAlign(CENTER);
  textSize(20);
  step();
}

function draw() {

  background(240);
  renderWord(word);
  text(util.definition(word.literal), width / 2, height - 10);
  text("med: " + med, width - 40, 20);
  if (memory.size() > 1) {
    text("last: " + memory.at(memory.size() - 2), 55, 20);
  }
  noLoop();
}

////////////////////////////////////////////////////////////

function step(dir) {

  if (dir !== -1) {

    if (word.literal == next.literal) {
      next = nextWord();
      actions = util.actions(word.literal, next.literal, 'char');
      var s = word.literal+' -> '+next.literal+'\n';
      s += '  '+actions.length+' actions:\n';
      for (var i = 0; i < actions.length; i++) {
        s += '  '+i+') '+actions[i].action+actions[i].index+'\n';
      }
      console.log(s);
      med = (dbeng ? -1 : util.minEditDist(word.literal, next.literal));
      return;
    }

    let action = actions.shift();
    //word = util.getWord(util.doAction(word.literal, action));
    word = util.doAction(word, action);

  } else {

    // step backward
    var tmp = memory.pop();
    word = dbeng ? memory.pop() : util.getWord(memory.pop());
    if (memory.isEmpty()) {
      memory.add(dbeng ? word : word.literal);
    }
  }

  memory.add(dbeng ? word : word.literal);
  loop();
  word && console.log((++steps) + ")", dbeng ? word : word.literal, memory.q);
  autostep && stepAfterDelay()
}

function nextWord() {

  if (dbeng) {
    word = word || dbeng + "";
    return ++dbeng + "";
  }

  word = word || util.randWord(2); // first time
  let bests = util.bestEditDist(word.literal, 0, memory, 4);

  if (!bests || !bests.length) {
    throw Error('Died on ' + word.literal, word);
  }
  return util.getWord(bests[random(bests.length) << 0]);
}

function stepAfterDelay() {
  clearTimeout(tid);
  tid = setTimeout(step, stepms);
}

function keyReleased() {

  clearTimeout(tid);

  if (keyCode === RIGHT_ARROW) {
    autostep = false;
    step(1);
  }
  if (keyCode === LEFT_ARROW) {
    autostep = false;
    step(-1);
  }
  if (key == ' ') {
    autostep = !autostep;
    if (autostep) {
      step();
    }
  }
}

function renderWord(word) {
  if (word.characters) {
    for (var i = 0; i < word.characters.length; i++) {
      if (word.literal[i] !== ' ')
        util.renderPath(word.characters[i], i, this._renderer);
    }
  } else {
    textSize(120);
    text(word, width / 2, height / 2);
    textSize(20);
  }
}
