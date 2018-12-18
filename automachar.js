const REPLACE_ERASE = 1,
  DELETE_ACTION = 2,
  INSERT_ACTION = 3,
  REPLACE_NEXT = 4;

// NEXT: handle cases for med > 1 (need array of charIdx/partIdx?) ***
// NEXT: timing proportional to number of strokes
// NEXT: alternative characters whenever possible
// NEXT: alternative parts whenever possible ?

// ENHANCEMENTS
// sound
// 3rd character
class Automachar {

  constructor(callback) {

    this.med = -1;
    this.target = null;
    this.targetCharIdx = -1;
    this.targetPartIdx = -1;
    this.word = util.randWord(2);
    this.wordCompleteCallback = callback;
  }

  draw(renderer, hexcol) {
    this.renderWord(this.word, renderer, .65, 30, hexcol);
    text(util.definition(this.word.literal), width / 2, height - 10);
    text(this.med, width - 10, 15);
  }

  step() {
    if (!this.target) {
      this.pickNextTarget();
      this.findNextEdit();
    }
    else {
      this.doNextEdit();
    }
  }

  pickNextTarget() {

    let bests = util.bestEditDistance(this.word.literal, null, memory);
    if (!bests || !bests.length) {
      throw Error('Died on ' + this.word.literal, this.word);
    }
    let result = util.getWord(bests[random(bests.length) << 0]);
    memory.add(result.literal);
    this.med = util.minEditDistance(this.word.literal, result.literal);
    this.target = result;
    //console.log("WORD: ", this.word, "\nNEXT: ", this.target, "\nMED: ", this.med);
  }

  doNextEdit() {

    //console.log('doNextEdit',this.action);
    if (this.action == REPLACE_ERASE) {
      if (!this.word.eraseStroke(this.targetCharIdx, this.targetPartIdx)) {
        // erasing done, now replace
        this.word = this.target;
        this.word.hide();
        this.word.show(this.targetCharIdx, this.targetPartIdx == 1 ? 0 : 1);
        this.word.show(this.targetCharIdx == 1 ? 0 : 1);
        this.action = REPLACE_NEXT;
      }
      else {
        this.wordCompleteCallback(); // stroke change
      }
    }

    if (this.action == REPLACE_NEXT) {
      if (!this.word.nextStroke(this.targetCharIdx, this.targetPartIdx)) {
        this.wordCompleteCallback(this.word.literal, this.med);
        this.target = null;
      }
    }
  }

  findNextEdit() {

    this.targetCharIdx = -1;
    this.targetPartIdx = -1;

    if (this.target.length === this.word.length) {

      this.action = REPLACE_ERASE;

      for (var i = 0; i < this.word.length; i++) {
        if (this.word.literal[i] !== this.target.literal[i]) {
          this.targetCharIdx = i;
          let wchr = this.word.characters[i];
          let tchr = this.target.characters[i];
          //console.log('wchr',wchr);
          for (var j = 0; j < wchr.parts.length; j++) {
            if (wchr.cstrokes[j].length !== tchr.cstrokes[j].length) {
              this.targetPartIdx = j;
            }
          }
        }
      }
    } else if (this.target.length > this.word.length) {
      this.action = INSERT_ACTION;
    } else if (this.target.length < this.word.length) {
      this.action = DELETE_ACTION
    }

    //console.log('target=' + this.target.literal[this.targetCharIdx] +', charIdx=' + this.targetCharIdx + ', pIdx=' + this.targetPartIdx);
  }

  renderWord(word, renderer, scale, yoff, hexcol) {

    if (word.characters) {
      for (var i = 0; i < word.characters.length; i++) {
        if (word.literal[i] !== ' ')
          util.renderPath(word, i, renderer, scale, yoff, hexcol);
      }
    }
  }
}
