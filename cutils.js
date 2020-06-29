const BLACK = [0, 0, 0]; // BLACK

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
    //this.characters.forEach(this.computeCharDefs); // path2Ds-per-stroke

    /* for (let i = 0; cdefs && i < cdefs.length; i++) {
      this.characters[i].definition = cdefs[i]; // per-character-defs
    } */
  }

  /*   computeCharDefs(chr) {
      chr.definition = 
    } */

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

class CharUtils {

  constructor(jsonData, levenshtein, loadDefs, lang) {

    if (!levenshtein) throw Error('no levenshtein impl');

    lang = (lang != 'simp') ? 'trad' : lang;

    this.HistQ = HistQ; // class
    this.Word = Word; // class
    this.wordCache = {};

    this.levenshtein = levenshtein;
    this.charData = jsonData.chars;
    this.charDefs = jsonData.cdefs;
    this.tradData = jsonData.trad;
    this.simpData = jsonData.simp;
    
    this.prefillCache('trad', loadDefs);
    this.prefillCache('simp', loadDefs);

    this.language(lang, true);

    console.log('cUtils[' + Object.keys(this.charData).length + 
      ',' + Object.keys(this.wordCache).length + '] ' + this.lang);
  }

  toggleLang() {
    this.language(this.lang === 'simp' ? 'trad' : 'simp');
  }

  language(type, quiet) {
    if (type) {
      this.lang = 'trad';
      if (type === 'simp') {
        if (this.simpData) {
          this.lang = type;
        } else {
          !quiet && console.warn('[WARN] No simp. data, call ignored');
        }
      }
      else if (type === 'trad') {
        if (this.tradData) {
          this.lang = type;
        } else {
          !quiet && console.warn('[WARN] No trad. data, call ignored');
          this.lang = 'simp';
        }
      }
    }
    return type ? this : this.lang;
  }

  prefillCache(lang, loadDefs) {
    let words = lang === 'simp' ? this.simpData : this.tradData;
    
    
    if (this.charData && words) {
      let that = this;
      let mcdefs = [];
      Object.keys(words).forEach(word => {
        if (this.charDefs && word.length > 1) {
          for (let i = 0; i < word.length; i++) {
            if (!this.charDefs.hasOwnProperty(word[i])) {
              mcdefs.push(word[i]);
              //console.log('no-def: ' + word[i]);
            }
            this.charData[word[i]].definition = this.charDefs[word[i]] || '-';
          }
        }
        that.wordCache[word] = that._createWord(word, this.charData,
          loadDefs ? words[word] : undefined);;
      });
      this.charDefs && console.log(mcdefs.length + ' missing ' + lang + ' char-defs');
    }
  }

  bestEditDistance(literal, words, hist, minAllowed) {

    words = words || Object.keys(this.currentWords());
    if (typeof minAllowed == 'undefined' || minAllowed < 1) minAllowed = 1;

    //console.log('bestEditDistance: '+literal);

    let med, meds = [];
    let bestMed = Number.MAX_SAFE_INTEGER;
    let wes = this.getWord(literal).editString;

    for (let i = 0; i < words.length; i++) {

      // no dups and nothing in history, maintain length
      if (literal === words[i] || words[i].length != literal.length) {
        continue;
      }

      if (typeof hist != 'undefined' && hist.contains(words[i])) {
        continue;
      }

      let wes2 = this.getWord(words[i]).editString;

      // chinese min-edit-dist
      let cost = this.levenshtein.get(literal, words[i]) - 1;
      med = Math.max(0, cost) + this.levenshtein.get(wes, wes2);

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
    return this.levenshtein.get(this.getWord(l1).editString,
      this.getWord(l2).editString) + Math.max(0, this.levenshtein.get(l1, l2) - 1);
  }

  cacheSize() {
    return Object.keys(this.wordCache).length;
  }

  _createWord(literal, charData, def) {

    let chars = [];
    for (let i = 0; i < literal.length; i++) {
      if (literal[i] !== ' ') {
        if (!charData.hasOwnProperty(literal[i])) {
          throw Error('_createWord() failed for ' + literal[i] + ' in ' + literal);
        }
        chars.push(charData[literal[i]]);
      } else {
        chars.push([]);
      }
    }

    return new Word(literal, chars, def);
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

    console.log("[WARN] creating word object for " + literal);
    let word = this._createWord(literal, charData);

    if (this.wordCache) this.wordCache[literal] = word;

    return word;
  }

  definition(literal) {
    let words = this.currentWords();
    return words.hasOwnProperty(literal) ? words[literal] : '---';
  }

  currentWords() {
    return this.lang == 'simp' ? this.simpData : this.tradData;
  }

  randWord(length, testMode) {
    if (typeof length == 'undefined') throw Error('no length');

    if (testMode) return this.randKey(this.currentWords());

    let word = null;
    let words = this.currentWords();
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

if (typeof module != 'undefined') {

  module.exports = CharUtils;
  /*let useDefs = false;
  let lang = 'trad';
  let fs = require("fs");
  let lev = require('fast-levenshtein');*/
  /*module.exports = new CharUtils(
    JSON.parse(fs.readFileSync('chardata.json', 'utf8')),
    JSON.parse(fs.readFileSync('words-trad.json', 'utf8')),
    JSON.parse(fs.readFileSync('words-simp.json', 'utf8')),
    lev, useDefs, lang);*/
}
