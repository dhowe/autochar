class Word {

  // TODO: make it possible to show 2nd full-part and first stroke-by-stroke
  constructor(literal, chars) {
    this.literal = literal;
    this.characters = chars;

    //this.reset();
    for (var i = 0; i < this.characters.length; i++) {
      let partCount = 2; // NOTE: can be != 2
      if (!this.characters[i].hasOwnProperty('parts') ||
        this.characters[i].parts.length != partCount) {
        this.characters[i].parts = new Array(partCount);
      }
      this.characters[i].parts.fill(Number.MAX_SAFE_INTEGER);
    }
    console.log(this);
    this.computeStrokes(this.characters);

    console.log(this);

    this.NONE = -1;
    this.PART0 = 0;
    this.PART1 = 1;
    this.ALL = Number.MAX_SAFE_INTEGER;
  }

  computeStrokes() {
    var chrs = this.characters;
    for (var i = 0; i < chrs.length; i++) {
      chrs[i].strokes = this.computeStrokesFor(chrs[i]);
    }
  }

  // divide strokes into character parts
  computeStrokesFor(chr) {

    // char has two parts
    // each part has a list of strokes
    var strokes = [];
    for (var i = 0; i < chr.parts.length; i++) strokes[i] = [];

    for (var j = 0; j < chr.matches.length; j++) {
      if (chr.matches[j] == 0) { // part 0
        strokes[0].push(chr.strokes[j]);
      }
      // (handle null values by putting them in 2nd part?)
      else { //(char.matches[j] == 1) {   // part 1
        strokes[1].push(chr.strokes[j]);
      }
    }

    return strokes;
  }

  nextStroke(charIdx, partIdx) { // partIdx is 0 || 1
    console.log('nextStroke', arguments.length);
    if (arguments.length != 2) throw Error('bad args: ' + arguments.length);
    if (arguments[0] != 0 && arguments[0] != 1) throw Error('bad charIdx: ' + arguments[0]);
    if (arguments[1] != 0 && arguments[1] != 1) throw Error('bad partIdx: ' + arguments[1]);
    this.characters[charIdx].parts[partIdx]++;
    console.log("parts[" + partIdx + "] = " + this.characters[charIdx].parts[partIdx]);
  }

  charComplete(charIdx) {
    //if (typeof charIdx === 'undefined') charIdx = -1;
    // if (typeof partIdx === 'undefined') partIdx = -1;
    // if (this.characters[charIdx].parts[0] >
    // }
  }

  partComplete(charIdx, partIdx) {
    //if (typeof charIdx === 'undefined') charIdx = -1;
    // if (typeof partIdx === 'undefined') partIdx = -1;
    // if (this.characters[charIdx].parts[partIdx] >
    // }
  }

  visiblePart(charIdx, value) { // -1(none), 0(left), 1(right), max(both)
    if (arguments.length != 2) throw Error('bad args: ' + arguments.length);
    if (arguments[0] != 0 && arguments[0] != 1) throw Error('bad charIdx: ' + arguments[0]);

    this.characters[charIdx].parts[0] = this.ALL;
    this.characters[charIdx].parts[1] = this.ALL;
    if (value == 0) { // show left-only
      this.characters[charIdx].parts[1] = -1;
    } else if (value == 1) { // show right-only
      this.characters[charIdx].parts[0] = -1;
    } else if (value < 0) { // show neither
      this.characters[charIdx].parts[0] = -1;
      this.characters[charIdx].parts[1] = -1;
    } else if (value != this.ALL) {
      throw Error('visiblePart() got bad value: ' + value);
    }
  }

  reset() {
    for (var i = 0; i < this.characters.length; i++) {
      let partCount = 2; // NOTE: can be != 2
      if (this.characters[i].parts.length != partCount) {
        this.characters[i].parts = new Array(partCount);
      }
      this.characters[i].parts.fill(Number.MAX_SAFE_INTEGER);
    }
  }
}

class CharUtils {

  constructor(charData, wordData) {

    this.HistQ = HistQ; // class
    this.Word = Word; // class
    this.charData = charData;
    this.wordData = wordData;
    console.log("cutils[" + Object.keys(charData).length +
      "," + Object.keys(wordData).length + "]");
  }

  doAction(word, act) {

    function doSub(word, idx, chr, part) {
      let str = word.literal;
      if (idx > str.length) return;
      word.literal = str.substr(0, idx) + chr + str.substr(idx + 1);;
    }

    if (act.action === 'del') {

      doSub(word, act.index, '', act.part);

    } else if (act.action === 'ins') {

      doSub(word, act.index, '', act.part);
      //console.log("1: "+str);
      doSub(word, act.index, act.data, act.part);
      //console.log("2: "+str);

    } else if (act.action === 'sub') {

      doSub(word, act.index, act.data, act.part);

    } else {

      throw Error('Bad Action: ' + act.action);
    }
  }

  pad(str, len) {
    while (str.length < len) str += '？';
    return str;
  }

  actions(currLit, nextLit, mode) {

    if (Math.abs(currLit.length - nextLit.length) > 1) {
      console.err('actions:', currLit, nextLit);
      throw Error("Max allowed length diff is 1 [TODO]");
    }

    let len = Math.max(currLit.length, nextLit.length);
    let cl = this.pad(currLit, len);
    let nl = this.pad(nextLit, len);
    let todo = [];

    if (typeof mode == 'undefined') {
      for (let i = 0; i < len; i++) {
        if (nl[i] !== cl[i]) {
          if (cl[i] === '？') {
            todo.push({ action: 'ins', data: nl[i], index: i });
          } else if (nl[i] === '？') {
            todo.push({ action: 'del', index: i });
          } else if (nl[i] !== '？') {
            todo.push({ action: 'sub', data: nl[i], index: i });
          }
        }
      }

    } else {
      this['_by' + mode](cl, nl, len, todo);
    }

    return todo;
  }

  _bychar(cl, nl, len, todo) {
    for (let i = 0; i < len; i++) {
      if (nl[i] !== cl[i]) {
        if (cl[i] === '？') {
          todo.push({ action: 'ins', data: nl[i], index: i });
        } else if (nl[i] === '？') {
          todo.push({ action: 'del', index: i });
        } else if (nl[i] !== '？') {
          todo.push({ action: 'sub', data: ' ', index: i });
          todo.push({ action: 'sub', data: nl[i], index: i });
        }
      }
    }
  }

  _bypart(cl, nl, len, todo) {
    for (let i = 0; i < len; i++) {
      if (nl[i] !== cl[i]) {
        if (cl[i] === '？') {
          todo.push({ action: 'ins', data: nl[i], index: i, part: 0 });
          todo.push({ action: 'ins', data: nl[i], index: i, part: 1 });
        } else if (nl[i] === '？') {
          todo.push({ action: 'del', index: i, part: 0 });
          todo.push({ action: 'del', index: i, part: 1 });
        } else if (nl[i] !== '？') {
          todo.push({ action: 'sub', data: nl[i], index: i, part: 0 });
          todo.push({ action: 'sub', data: nl[i], index: i, part: 1 });
        }
      }
    }
  }

  _bystroke(cl, nl, len, todo) {
    for (let i = 0; i < len; i++) {
      if (nl[i] !== cl[i]) {
        if (cl[i] === '？') {
          todo.push({ action: 'ins', data: nl[i], index: i });
        } else if (nl[i] === '？') {
          todo.push({ action: 'del', index: i });
        } else if (nl[i] !== '？') {
          todo.push({ action: 'sub', data: nl[i], index: i });
        }
      }
    }
  }

  bestEditDist(l1, words, hist, minAllowed) {

    words = words || Object.keys(this.wordData);
    if (typeof minAllowed == 'undefined') minAllowed = 1;

    let med, meds = [],
      dbg = 0;

    // check each word in list for edit-distance
    // meds is an array where each index is the MED
    // and holds a list of all words with the MED
    for (let i = 0; i < words.length; i++) {

      // no dups and nothing in history
      if (l1 === words[i] || (typeof hist != 'undefined' && hist && hist.contains(words[i]))) {
        continue;
      }
      med = this.minEditDist(l1, words[i], minAllowed);
      if (med < minAllowed) continue;
      if (!meds[med]) meds[med] = [];
      meds[med].push(words[i]);
    }

    // find the best non-empty index (REDO)
    // let best = -1;
    // for (let i = meds.length - 1; i >= 0; i--) {
    //   if (meds[i] && meds[i].length) {
    //     dbg && console.log(i + ")", meds[i]);
    //     best = i;
    //   }
    // }
    //dbg && console.log("\nbestEditDist=" + best, meds[best]);

    // return the best list
    for (var i = minAllowed; i < meds.length; i++) {
      if (meds[i] && meds[i].length) return meds[i];
    }

    return []; // or nothing
  }

  minEditDist(l1, l2) {
    if (l1.length != l2.length) {
      throw Error('Accepts matching length string, got:', l1, l2);
    }
    if (l1 === l2) return 0;

    let med = 0;
    for (let i = 0; i < l1.length; i++) {
      med += this.binEditDist(l1[i], l2[i]);
    }

    return med;
  }

  binEditDist(lc1, lc2, minAllowed) {

    if (lc1.length != 1 || lc2.length != 1) {
      throw Error('Accepts single chars only, got:', lc1, lc2);
    }

    let dbg = 0;
    dbg && console.log(lc1, lc2);
    if (lc1 === lc2) return 0;
    let c1 = this.charData[lc1];
    let c2 = this.charData[lc2];
    let d1 = c1.decomposition,
      d2 = c2.decomposition;

    dbg && console.log(lc1, d1[0]);
    dbg && console.log(lc2, d2[0]);

    if (d1[0] === d2[0] && d1[0] != '？') { // decomps match
      if ((d1[1] === d2[1] && d1[1] != '？') || (d1[2] == d2[2] && d1[2] != '？')) { // one side-matches
        return 1;
      }
      return 2;
    }
    return 3;
  }

  decomp(literal) {
    console.log("decomp:" + literal);
    if (literal.length != 1) {
      throw Error('Accepts single char only, got: ' + literal);
    }
    return this.charData[literal].decomposition;
  }

  getWord(literal) {
    let chars = [];
    for (let i = 0; i < literal.length; i++) {
      if (literal[i] !== ' ') {
        if (!this.charData.hasOwnProperty(literal[i])) {
          throw Error('getWord() fail: ' + literal[i]);
        }
        chars.push(this.charData[literal[i]]);
      } else {
        chars.push([]);
      }
    }
    return new Word(literal, chars);
  }

  def(literal) {
    return this.wordData.hasOwnProperty(literal) ? this.wordData[literal] : '---';
  }

  randWord() {
    return this.getWord(this.randKey(this.wordData));
  }

  randVal(o) {
    let keys = Object.keys(o);
    return keys[keys.length * Math.random() << 0];
  }

  randKey(o) {
    let keys = Object.keys(o);
    return keys[keys.length * Math.random() << 0];
  }

  renderPath(word, charIdx, renderer) {

    var pg = renderer || this._renderer;
    var char = word.characters[charIdx];
    var matches = char.matches;
    var parts = char.parts;
    var stokes = char.stokes;

    var strokeIdx0 = parts[0]; // left/top part
    var strokeIdx1 = parts[1]; // right/bottom part

    console.log('renderPath', word.literal[charIdx], strokeIdx0, strokeIdx1);

    if (strokeIdx0 < 0 && strokeIdx1 < 0) return; // nothing to draw

    if (typeof char.matches === 'undefined') {
      throw Error('No matches: ' + char.character);
    }

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
