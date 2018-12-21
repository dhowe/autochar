class Word {

  constructor(literal, chars) {

    this.literal = literal;
    this.characters = chars;
    this.length = literal.length;
    this.characters.forEach(this.computeParts); // 2-parts-per-char
    this.characters.forEach(this.computeStrokes); // strokes-per-path
    this.characters.forEach(this.computePaths); // path2Ds-per-stroke
  }

  computeParts(chr) {
    // assume 2 parts per char, otherwise check decomposition
    chr.parts = new Array(2);
    chr.parts.fill(Number.MAX_SAFE_INTEGER);
  }

  // divide strokes into character parts
  computeStrokes(chr) {

    // a char has ~2 parts, each with a list of strokes
    chr.cstrokes = [];
    for (var i = 0; i < chr.parts.length; i++) {
      chr.cstrokes[i] = [];
    }

    for (var j = 0; j < chr.matches.length; j++) {
      var strokeIdx = chr.matches[j][0];
      if (strokeIdx === 0) { // part 0
        chr.cstrokes[0].push(chr.strokes[j]);
      } else if (strokeIdx === 1) { // part 1
        chr.cstrokes[1].push(chr.strokes[j]);
      } else { // should never happen
        console.error("Null stroke match at [" + j + "]0");
      }
    }
  }

  computePaths(chr) { // TODO: make sure this happens only once per char

    chr.paths = [];
    for (var i = 0; i < chr.parts.length; i++) chr.paths[i] = [];

    for (var j = 0; j < chr.parts.length; j++) {
      for (var i = 0; i < chr.cstrokes[j].length; i++) {
        chr.paths[j].push(new Path2D(chr.cstrokes[j][i]));
      }
    }
  }

  toEditStr() {
    var es = '';
    for (var i = 0; i < this.characters.length; i++) {
      es += this.characters[i].decomposition;
      if (i < this.characters.length - 1) es += ' ';
    }
    return es;
  }

  eraseStroke(charIdx, partIdx) { // returns true if changed

    if (typeof charIdx === 'undefined') throw Error('no charIdx');
    if (typeof partIdx === 'undefined') throw Error('no partIdx');

    var chr = this.characters[charIdx];
    partIdx = this.constrain(partIdx, 0, chr.parts.length - 1);

    if (partIdx < 0 || partIdx >= chr.parts.length) {
      throw Error('bad partIdx: ' + partIdx);
    }

    chr.parts[partIdx] = min(chr.parts[partIdx], chr.cstrokes[partIdx].length - 1);

    if (--chr.parts[partIdx] >= -1) {
      //console.log("eraseStroke:char[" + charIdx + "][" + partIdx + "] = " +
      //(chr.parts[partIdx]) + "/" + (chr.cstrokes[partIdx].length)); // keep
      return true;
    }
    return false;
  }

  nextStroke(charIdx, partIdx) { // returns true if changed

    if (typeof charIdx === 'undefined') throw Error('no charIdx');
    if (typeof partIdx === 'undefined') throw Error('no partIdx');

    charIdx = Math.max(charIdx, 0); // if -1, show first char
    partIdx = Math.max(partIdx, 0); // if -1, show first part

    var chr = this.characters[charIdx];

    //console.log("char["+ charIdx+"]["+partIdx+"] = " +
    //(chr.parts[partIdx]+1)+"/"+(chr.cstrokes[partIdx].length)); // keep

    return (++this.characters[charIdx].parts[partIdx] <
      this.characters[charIdx].cstrokes[partIdx].length-1);
  }

  constrain(n, low, high) { return Math.max(Math.min(n, high), low); }

  ///////////////////////// visibility (redo) ///////////////////////////////

  isVisible() { // true if word is fully drawn
    for (var i = 0; i < this.characters.length; i++) {
      if (!this.isCharVisible(i)) return false;
    }
    return true;
  }

  isHidden() { // true if all strokes are hidden
    for (var i = 0; i < this.characters.length; i++) {
      if (!this.isCharHidden(i)) return false;
    }
    return true;
  }

  isCharVisible(charIdx) { // true if character is fully drawn
    var chr = this.characters[charIdx];
    if (!chr) throw Error('no charIdx for: ' + charIdx);
    for (var i = 0; i < chr.parts.length; i++) {
      if (!this.isPartVisible(charIdx, i))
        return false;
    }
    return true;
  }

  isCharHidden(charIdx) { // true if character is fully drawn
    var chr = this.characters[charIdx];
    if (!chr) throw Error('no charIdx for: ' + charIdx);
    for (var i = 0; i < chr.parts.length; i++) {
      if (!this.isPartHidden(charIdx, i))
        return false;
    }
    return true;
  }

  isPartVisible(charIdx, partIdx) { // true if part is fully drawn
    if (typeof charIdx === 'undefined') throw Error('no charIdx');
    if (typeof partIdx === 'undefined') throw Error('no partIdx');
    var chr = this.characters[charIdx];
    //console.log('check '+chr.parts[partIdx]+ " >=? "+(chr.cstrokes[partIdx].length-1));
    return (chr.parts[partIdx] >= chr.cstrokes[partIdx].length - 1);
  }

  isPartHidden(charIdx, partIdx) { // true if part is fully drawn
    if (typeof charIdx === 'undefined') throw Error('no charIdx');
    if (typeof partIdx === 'undefined') throw Error('no partIdx');
    var chr = this.characters[charIdx];
    //console.log('check '+chr.parts[partIdx]+ " >=? "+(chr.cstrokes[partIdx].length-1));
    return (chr.parts[partIdx] < 0);
  }

  show(charIdx, partIdx) {
    var ALL = Number.MAX_SAFE_INTEGER;
    if (typeof charIdx === 'undefined') {
      this.setVisible(0, ALL); // show both chars
      this.setVisible(1, ALL);
    } else {
      var chr = this.characters[charIdx];
      if (!chr) throw Error('show: no charIdx for: ' + charIdx);
      if (typeof partIdx === 'undefined') {
        this.setVisible(charIdx, ALL); // show one char
      } else {
        this.characters[charIdx].parts[partIdx] = ALL; // show one part
      }
    }
  }

  hide(charIdx, partIdx) {
    if (typeof charIdx === 'undefined') {
      for (var i = 0; i < this.characters.length; i++) {
        this.setVisible(i, -1); // hide all chars
      }

    } else {

      if (!chr) throw Error('hide: no charIdx for: ' + charIdx);
      if (typeof partIdx === 'undefined') {
        this.setVisible(charIdx, -1); // hide one char
      } else {
        this.characters[charIdx].parts[partIdx] = -1; // hide one part
      }
    }
  }

  setVisible(charIdx, value) { // -1(none), 0(left), 1(right), max(both)

    if (arguments.length != 2) throw Error('bad args: ' + arguments.length);

    if (typeof charIdx === 'undefined') throw Error('no charIdx');

    var ALL = Number.MAX_SAFE_INTEGER;

    var chr = this.characters[charIdx];
    //console.log('setVisible', charIdx, value);
    for (var i = 0; i < chr.parts.length; i++) chr.parts[i] = ALL;

    if (value == 0) { // show left-only
      if (chr.parts.length > 0) chr.parts[1] = -1;

    } else if (value == 1) { // show right-only
      chr.parts[0] = -1;

    } else if (value < 0) { // show none
      chr.parts[0] = -1;
      chr.parts[1] = -1;

    } else if (value != ALL) {
      throw Error('setVisible() got bad value: ' + value);
    }
  }
}

class CharUtils {

  constructor(charData, wordData, disablePrecache) {

    this.HistQ = HistQ; // class
    this.Word = Word; // class
    this.wordData = wordData; // TODO: remove defs?
    this.wordCache = {};

    if (!disablePrecache) {
      this.prefillCache(charData);
    } else {
      this.charData = charData;
    }
    console.log('cUtils[' + Object.keys(charData).length + ',' +
      Object.keys(wordData).length + (disablePrecache ? ',nc]' : ',pf]'));

    this.DEFCOL = [0, 0, 0];
  }

  prefillCache(charData) {
    let that = this;
    Object.keys(this.wordData).forEach(function (lit) { that.getWord(lit, charData); });
    //console.log('Cache prefilled with ' + Object.keys(this.wordCache).length + ' words');
  }

  bestEditDistance(literal, words, hist, minAllowed) { // todo: only store bestSoFar

    words = words || Object.keys(this.wordData);
    if (typeof minAllowed == 'undefined') minAllowed = 1;

    //console.log('bestEditDistance: '+literal);

    let med, meds = [];
    let bestMed = Number.MAX_SAFE_INTEGER;

    for (let i = 0; i < words.length; i++) {

      // no dups and nothing in history, maintain length
      if (literal === words[i] || words[i].length != literal.length ||
        (typeof hist != 'undefined' && hist && hist.contains(words[i]))) {
        continue;
      }

      med = this.minEditDistance(literal, words[i]);

      //console.log(i, words[i], med, 'best='+bestMed);

      if (med < minAllowed || med > bestMed) continue;

      if (med < bestMed) bestMed = med;
      if (!meds[med]) meds[med] = [];
      meds[med].push(words[i]);
    }

    // return the best list
    for (var i = 0; i < meds.length; i++) {
      if (meds[i] && meds[i].length) return meds[i];
    }

    return []; // or nothing
  };

  minEditDistance(l1, l2) {
    var cost = Math.max(0, this.rawEditDistance(l1, l2) - 1);
    let e1 = this.getWord(l1).toEditStr();
    let e2 = this.getWord(l2).toEditStr();
    //console.log('minEditDistance', e1, 'vs', e2, cost);
    return this.rawEditDistance(e1, e2) + cost;
  }

  rawEditDistance(source, target) {

    function min3(a, b, c) {
      var min = a;
      if (b < min) min = b;
      if (c < min) min = c;
      return min;
    }

    if (!source.length && !target.length) return 0;

    var cost, matrix = [];
    var sI; // ith character of s
    var tJ; // jth character of t

    var sourceLength = source.length;
    var targetLength = target.length;

    if (!source.length) return target.length;
    if (!target.length) return source.length;

    for (var i = 0; i <= source.length; i++) {
      matrix[i] = [];
      matrix[i][0] = i;
    }

    for (var j = 0; j <= target.length; j++) {
      matrix[0][j] = j;
    }

    for (var i = 1; i <= source.length; i++) {
      sI = source.charAt(i - 1);
      for (var j = 1; j <= target.length; j++) {
        tJ = target.charAt(j - 1);
        cost = (sI == tJ) ? 0 : 1;
        matrix[i][j] = min3(
          matrix[i - 1][j] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j - 1] + cost);
      }
    }
    return matrix[source.length][target.length];
  }

  cacheSize() {
    return Object.keys(this.wordCache).length;
  }

  getWord(literal, charData) {

    if (this.wordCache && this.wordCache.hasOwnProperty(literal)) {
      return this.wordCache[literal];
    }

    if (typeof charData == 'undefined') {
      if (!this.hasOwnProperty('charData')) {
        throw Error('getWord: no charData for ' + literal);
      }
      charData = this.charData;
    }

    let chars = [];
    for (let i = 0; i < literal.length; i++) {
      if (literal[i] !== ' ') {
        if (!charData.hasOwnProperty(literal[i])) {
          throw Error('getWord() fail: ' + literal[i]);
        }
        chars.push(charData[literal[i]]);
      } else {
        chars.push([]);
      }
    }

    let word = new Word(literal, chars);

    if (this.wordCache) this.wordCache[literal] = word;

    return word;
  }

  definition(literal) {
    return this.wordData.hasOwnProperty(literal) ? this.wordData[literal] : '---';
  }

  randWord(num) {
    if (typeof num == 'undefined') throw Error('no num');

    let word = null;
    while (!word || word.length != num) {
      // keep going until we get the right length
      word = this.getWord(this.randKey(this.wordData));
    }
    return word;
  }

  randVal(o) {
    let keys = Object.keys(o);
    return keys[keys.length * Math.random() << 0];
  }

  randKey(o) {
    let keys = Object.keys(o);
    return keys[keys.length * Math.random() << 0];
  }

  pad(str, len) {
    while (str.length < len) str += '？';
    return str;
  }

  renderPath(word, charIdx, renderer, scale, yoff, rgb) {

    var char = word.characters[charIdx]; // anything to draw?
    if (char.parts[0] < 0 && char.parts[1] < 0) return;

    if (!rgb || rgb.length != 3) rgb = this.DEFCOL;
    if (typeof scale == 'undefined') scale = 1;

    var pg = renderer || this._renderer;
    var ctx = pg.drawingContext;
    ctx.fillStyle = 'rgb(' + rgb[0] + ',' + rgb[1] + ',' + rgb[2] + ')';

    for (var j = 0; j < char.paths.length; j++) {
      for (var i = 0; i < char.paths[j].length; i++) {

        var shift = renderer.width / 2;
        ctx.translate(0, shift + yoff); // shift for mirror
        if (charIdx > 0) ctx.translate(shift, 0); // shift for mirror
        ctx.scale(.5, -.5); // mirror-vertically

        if (char.parts[j] >= i) {
          ctx.scale(scale, scale);
          ctx.fill(char.paths[j][i]);
        } // else console.log('skip', j, i);

        /* // draw stroke
        ctx.strokeStyle = "#777";
        ctx.lineWidth = 6;
        ctx.stroke(char.paths[i]);
        */

        ctx.setTransform(1, 0, 0, 1, 0, 0); // reset transform
      }
    }
  }
}

class HistQ {
  constructor(sz) {
    this.q = [];
    this.capacity = sz;
  }
  add(item) {
    this.q.push(item);
    if (this.q.length > this.capacity) {
      this.q.shift();
    }
  }
  contains(item) {
    return this.q.indexOf(item) > -1;
  }
  peek() {
    return this.q[this.q.length - 1];
  }
  pop() {
    return this.q.pop();
  }
  unshift(item) {
    return this.q.unshift(item);
  }
  popOldest() {
    return this.q.shift();
  }
  isEmpty() {
    return this.q.length < 1;
  }
  oldest() {
    return this.q[0];
  }
  size() {
    return this.q.length;
  }
  indexOf(e) {
    return this.q.indexOf(e);
  }
  toString() {
    return this.q;
  }
  data() {
    return this.q;
  }
  at(idx) {
    return this.q[idx];
  }
  clear() {
    this.q = [];
    return this;
  }
}

if (typeof module != 'undefined') {
  let fs = require("fs");
  module.exports = new CharUtils(
    JSON.parse(fs.readFileSync('chardata.json', 'utf8')),
    JSON.parse(fs.readFileSync('words-trad.json', 'utf8')));
}
