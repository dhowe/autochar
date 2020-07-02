
class CharUtils {

  constructor(chars, defs, levenshtein) {

    if (!levenshtein) throw Error('no med');

    this.Word = Word; // class
    this.HistQ = HistQ; // class

    this.lang = 'trad';
    this.defs = defs;
    this.charData = chars;
    this.editDist = levenshtein;
    this.wordCache = { simp: {}, trad: {} };

    this.prefillCaches();

    console.log('cUtils[chars=' + Object.keys
      (this.charData).length + ',lang=' + this.lang + ']');
  }

  /* 
    loadCaches() {
      //while (!this.prefillCaches(100));
      //this.prefillCache('simp');
      this.prefillCaches();
      console.log('cache[' + Object.keys(this.wordCache).length + ']');
      return this;
    } */

  prefillCaches() {
    if (!this.charData) throw Error('no char-data');

    Object.keys(this.defs).forEach(word => {
      if (word.length !== 2) return; 
      if (typeof this.wordCache[word] === 'undefined') {
        for (let k = 0; k < word.length; k++) {
          const ch = word[k];
          if (!this.charData[ch]) {
            throw Error('no char-data for ' + ch + ' in ' + word);
          }
          if (!this.defs[ch]) missingDefs.push(ch);
          this.charData[ch].definition = this.defs[ch] || '-';
        }
        this.wordCache[word] = this.createWord(word);
      }
    });
  }

  toggleLang() {
    this.lang = (this.lang === 'simp') ? 'trad' : 'simp';
  }

  bestEditDistance(literal, words, hist, minAllowed) {

    words = words || Object.keys(this.currentWords());
    if (typeof minAllowed == 'undefined' || minAllowed < 1) minAllowed = 1;

    let med, meds = [], bestMed = Number.MAX_SAFE_INTEGER;
    let wes = this.getWord(literal).editString;

    for (let i = 0; i < words.length; i++) {

      // no dups and nothing in history, maintain length
      if (literal === words[i] || words[i].length != literal.length) {
        continue;
      }

      if (typeof hist != 'undefined' && hist.contains(words[i])) {
        //console.log('*** Skipping item in history: '+words[i]);
        continue;
      }

      let wes2 = this.getWord(words[i]).editString;

      // chinese min-edit-dist
      let cost = this.editDist.get(literal, words[i]) - 1;
      med = Math.max(0, cost) + this.editDist.get(wes, wes2);

      //console.log(i, words[i], med, 'best='+bestMed);

      if (med < minAllowed || med > bestMed) continue;

      if (med < bestMed) bestMed = med;
      if (!meds[med]) meds[med] = [];
      meds[med].push(words[i]);
    }

    // return the best list
    for (let i = 0; i < meds.length; i++) {
      if (meds[i] && meds[i].length) {
        //console.log('     '+meds[i]+' for '+i);
        return meds[i];
      }
    }

    return []; // or nothing
  };

  minEditDistance(l1, l2) {
    return this.editDist.get(this.getWord(l1).editString,
      this.getWord(l2).editString) + Math.max(0, this.editDist.get(l1, l2) - 1);
  }

  createWord(literal) {

    let chars = [];
    for (let i = 0; i < literal.length; i++) {
      if (literal[i] !== ' ') {
        if (!this.charData[literal[i]]) {
          throw Error('createWord() failed for ' + literal[i] + ' in ' + literal);
        }
        chars.push(this.charData[literal[i]]);
      } else {
        chars.push([]);
      }
    }

    return new Word(literal, chars, this.defs[literal]);
  }

  getWord(literal) {

    if (this.wordCache[literal]) {
      return this.wordCache[literal];
    }

    console.log("[WARN] creating word object for " + literal);
    let word = this.createWord(literal);
    this.wordCache[literal] = word;

    return word;
  }

  definition(literal) {
    let words = this.currentWords();
    return words[literal] ? words[literal] : '---';
  }

  currentWords() {
    return this.defs;
  }

  randWord(length, testMode) {
    if (typeof length == 'undefined') throw Error('no length');
    let word = null, words = this.currentWords();
    while (!word || word.length != length) {
      // keep going until we get the right length
      word = this.getWord(this.randKey(words));
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

class Word {

  constructor(literal, chars, def) {

    this.literal = literal;
    this.characters = chars;
    this.length = literal.length;
    this.definition = def;
    this.editString = this.computeEditString();
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
    for (let i = 0; i < chr.parts.length; i++) {
      chr.cstrokes[i] = [];
    }

    for (let j = 0; j < chr.matches.length; j++) {
      let strokeIdx = chr.matches[j][0];
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
    for (let i = 0; i < chr.parts.length; i++) chr.paths[i] = [];

    for (let j = 0; j < chr.parts.length; j++) {
      for (let i = 0; i < chr.cstrokes[j].length; i++) {
        chr.paths[j].push(new Path2D(chr.cstrokes[j][i]));
      }
    }
  }

  computeEditString() {
    let es = '';
    for (let i = 0; i < this.characters.length; i++) {
      es += this.characters[i].decomposition;
      if (i < this.characters.length - 1) es += ' ';
    }
    return es;
  }

  eraseStroke(charIdx, partIdx) { // returns true if changed

    if (typeof charIdx === 'undefined') throw Error('no charIdx');
    if (typeof partIdx === 'undefined') throw Error('no partIdx');

    let chr = this.characters[charIdx];
    partIdx = this.constrain(partIdx, 0, chr.parts.length - 1);

    if (partIdx < 0 || partIdx >= chr.parts.length) {
      throw Error('bad partIdx: ' + partIdx);
    }

    chr.parts[partIdx] = Math.min(chr.parts[partIdx], chr.cstrokes[partIdx].length - 1);

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

    let chr = this.characters[charIdx];

    //console.log("char["+ charIdx+"]["+partIdx+"] = " +
    //(chr.parts[partIdx]+1)+"/"+(chr.cstrokes[partIdx].length)); // keep

    return (++this.characters[charIdx].parts[partIdx] <
      this.characters[charIdx].cstrokes[partIdx].length - 1);
  }

  constrain(n, low, high) { return Math.max(Math.min(n, high), low); }

  ///////////////////////// visibility (redo) ///////////////////////////////

  isVisible() { // true if word is fully drawn
    for (let i = 0; i < this.characters.length; i++) {
      if (!this.isCharVisible(i)) return false;
    }
    return true;
  }

  isHidden() { // true if all strokes are hidden
    for (let i = 0; i < this.characters.length; i++) {
      if (!this.isCharHidden(i)) return false;
    }
    return true;
  }

  isCharVisible(charIdx) { // true if character is fully drawn
    let chr = this.characters[charIdx];
    if (!chr) throw Error('no charIdx for: ' + charIdx);
    for (let i = 0; i < chr.parts.length; i++) {
      if (!this.isPartVisible(charIdx, i))
        return false;
    }
    return true;
  }

  isCharHidden(charIdx) { // true if character is fully drawn
    let chr = this.characters[charIdx];
    if (!chr) throw Error('no charIdx for: ' + charIdx);
    for (let i = 0; i < chr.parts.length; i++) {
      if (!this.isPartHidden(charIdx, i))
        return false;
    }
    return true;
  }

  isPartVisible(charIdx, partIdx) { // true if part is fully drawn
    if (typeof charIdx === 'undefined') throw Error('no charIdx');
    if (typeof partIdx === 'undefined') throw Error('no partIdx');
    let chr = this.characters[charIdx];
    //console.log('check '+chr.parts[partIdx]+ " >=? "+(chr.cstrokes[partIdx].length-1));
    return (chr.parts[partIdx] >= chr.cstrokes[partIdx].length - 1);
  }

  isPartHidden(charIdx, partIdx) { // true if part is fully drawn
    if (typeof charIdx === 'undefined') throw Error('no charIdx');
    if (typeof partIdx === 'undefined') throw Error('no partIdx');
    let chr = this.characters[charIdx];
    //console.log('check '+chr.parts[partIdx]+ " >=? "+(chr.cstrokes[partIdx].length-1));
    return (chr.parts[partIdx] < 0);
  }

  show(charIdx, partIdx) {
    let ALL = Number.MAX_SAFE_INTEGER;
    if (typeof charIdx === 'undefined') {
      this.setVisible(0, ALL); // show both chars
      this.setVisible(1, ALL);
    } else {
      let chr = this.characters[charIdx];
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
      for (let i = 0; i < this.characters.length; i++) {
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

    let ALL = Number.MAX_SAFE_INTEGER;

    let chr = this.characters[charIdx];
    //console.log('setVisible', charIdx, value);
    for (let i = 0; i < chr.parts.length; i++) chr.parts[i] = ALL;

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


if (typeof module != 'undefined') module.exports = CharUtils;
