let charData, wordData, util, word, memory, next;

function preload() {

  charData = loadJSON('../chardata.json');
  wordData = loadJSON('../words-trad.json');
}

function setup() {

  createCanvas(1024, 512);
  textSize(24);
  util = new CharUtils(charData, wordData);
  memory = new util.HistQ(10);
  word = util.getWord('油菜');
  console.log('WORD: '+word.literal);
  step();
}

function draw() {

  background(240);
  renderWord(word);
  noLoop();
}

function step() {

  next = nextWord();
  console.log('NEXT: '+next.literal);
}

function nextWord() {

  //let bests = ["油花", "油葷", "泡菜", "洋菜", "浙菜", "湘菜", "滷菜", "酒菜"];//util.bestEditDistance(word.literal, 0, memory);

  let bests = util.bestEditDistance(word.literal, null, memory);
  if (!bests || !bests.length) {
    throw Error('Died on ' + word.literal, word);
  }
  return util.getWord(bests[random(bests.length) << 0]);
}

function renderWord(word) {
  console.log('renderWord', word);
  if (word.characters) {
    for (var i = 0; i < word.characters.length; i++) {
      if (word.literal[i] !== ' ')
        util.renderPath(word, i, this._renderer);
    }
  }
}

function minEditDistance(l1, l2) {
    //console.log('minEditDistance', l1, l2);
    var cost = Math.max(0, util.rawEditDistance(l1, l2) - 1);
    //let e1 = this.getWord(l1).toEditStr();
    //let e2 = this.getWord(l2).toEditStr();
    //console.log('minEditDistance', e1, 'vs', e2, cost);
    return 1;//cost;//this.rawEditDistance(e1, e2) + cost;
  }

// function bestEditDistance(literal, words, hist, minAllowed) { // todo: only store bestSoFar
//
//   let word = util.getWord(literal);
//   words = words || Object.keys(util.wordData);
//   if (typeof minAllowed == 'undefined') minAllowed = 1;
//
//
//   console.log('bestEditDistance: '+literal, words, hist, minAllowed);
//
//   let med, meds = [];
//   let dbg = 0;
//
//   for (let i = 0; i < words.length; i++) {
//
//     var check = words[i];
//
//     // no dups and nothing in history, maintain length
//     if (literal === words[i] || words[i].length != literal.length ||
//       (typeof hist != 'undefined' && hist && hist.contains(words[i]))) {
//       continue;
//     }
//
//     //console.log(i, words[i], literal.length, words[i].length, literal.length == words[i].length);
//     med = util.minEditDistance(literal, words[i]);
//
// //      if (med < minAllowed) continue;
//
//     if (!meds[med]) meds[med] = [];
//
//     meds[med].push(words[i]);
//   }
//
//   // return the best list
//   for (var i = minAllowed; i < meds.length; i++) {
//     if (meds[i] && meds[i].length) {
//       return meds[i];
//     }
//   }
//
//   return []; // or nothing
// };
