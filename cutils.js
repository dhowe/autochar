var fs = require("fs");

class CharUtils {
  constructor(charData, wordData) {
    this.charData = charData;
    this.wordData = wordData;
  }
  test() {
    return 'test-ok';
  }
  binEditDist(char1, char2) {
    if (char1 === char2) return 0;
    var c1 = this.charData[char1];
    var c2 = this.charData[char2];
    console.log("PARTS",c1,c2);
    return -1;
  }
}

if (typeof module != 'undefined') {
  var charData = JSON.parse(fs.readFileSync('chardata.json', 'utf8'));
  var wordData = JSON.parse(fs.readFileSync('words-trad.json', 'utf8'));
  module.exports = new CharUtils(charData, wordData);
}
