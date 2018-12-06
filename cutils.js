class CharUtils {

  constructor(charData, wordData) {
    this.charData = charData;
    this.wordData = wordData;
    console.log("cutils[" + Object.keys(charData).length +
      "," + Object.keys(wordData).length + "]");
  }

  bestEditDist(l1, words, hist) {
    words = words || Object.keys(this.wordData);
    var meds = [], dbg = 1;

    for (var i = 0; i < words.length; i++) {
      if (l1 === words[i]) continue; // no dups
      var med = this.minEditDist(l1, words[i]);
      if (!meds[med]) meds[med] = [];
      if (typeof hist == 'undefined' || hist.indexOf(words[i]) < 0) {
        meds[med].push(words[i]);
      }
    }

    var best = -1;
    for (var i = meds.length-1; i >= 0; i--) {
      if (meds[i] && meds[i].length) {
        dbg&&console.log(i+")", meds[i]);
        best = i;
      }
    }
    dbg&&console.log("\nbestEditDist="+best, meds[best]);
    //dbg&&console.log('\nbest: '+meds[best][0]+"->("+this.decomp(meds[best][0])+")");
    //dbg&&console.log('orig: '+l1+"->("+this.decomp(l1)+")\n");
    return best > 0 ? meds[best] : [];
  }

  minEditDist(l1, l2) {
    if (l1.length != l2.length) {
      throw Error('Accepts matching length string, got:', l1, l2);
    }
    if (l1 === l2) return 0;

    let med = 0;
    for (var i = 0; i < l1.length; i++) {
      med += this.binEditDist(l1[i],l2[i]);
    }
    return med;
  }

  binEditDist(lc1, lc2) {
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
      if ((d1[1] === d2[1] && d1[1] != '？') || (d1[2] == d2[2] && d1[2] != '？')) { // a side-matches
        return 1;
      }
      return 2;
    }
    return 3;
  }

  decomp(literal) {
    console.log("decomp:"+literal);
    if (literal.length != 1 ) {
      throw Error('Accepts single char only, got: '+literal);
    }
    return this.charData[literal].decomposition;
  }

  getWord(literal) {
    let chars = [];
    for (let i = 0; i < literal.length; i++) {
      if (!this.charData.hasOwnProperty(literal[i])) {
        throw Error('randWord() fail: ' + literal[i]);
      }
      chars.push(this.charData[literal[i]]);
    }
    return { literal: literal, characters: chars };
  }

  def(literal) {
    return this.wordData[literal];
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
}

if (typeof module != 'undefined') {
  let fs = require("fs");
  module.exports = new CharUtils(
    JSON.parse(fs.readFileSync('chardata.json', 'utf8')),
    JSON.parse(fs.readFileSync('words-trad.json', 'utf8')));
}
