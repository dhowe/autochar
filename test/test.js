let expect = require('chai').expect;
let util = require('../cutils');

describe('cutil-tests', function () {

  describe('bestEditDist()', function () {
    it('should return set of minimum MEDs for a word', function () {
      let bet, word = util.getWord('拒');

      bet = util.bestEditDist(word.literal, ['拒', '捕', '價', '三', '齊', '齐']);
      expect(bet.length).is.equal(1);
      expect(bet[0]).is.equal('捕'); // ignore duplicate
      expect(util.minEditDist(word.literal, bet[0])).is.equal(1);

      bet = util.bestEditDist(word.literal, ['捕', '價', '三', '齊', '齐']);
      expect(bet.length).is.equal(1);
      expect(bet[0]).is.equal('捕');
      expect(util.minEditDist(word.literal, bet[0])).is.equal(1);

      bet = util.bestEditDist(word.literal, [ '價', '三', '齊', '齐']);
      expect(bet.length).is.equal(1);
      expect(bet[0]).is.equal('價');
      expect(util.minEditDist(word.literal, bet[0])).is.equal(2);

      bet = util.bestEditDist(word.literal, [ '三', '齊', '齐']);
      expect(bet.length).is.equal(3);
      expect(util.minEditDist(word.literal, bet[0])).is.equal(3);
    });
  });

  describe('minEditDist()', function () {
    it('should return dist between 2 words (1 matching)', function () {
      expect(util.minEditDist('拒拒', '拒拒')).is.equal(0); // exact
      expect(util.minEditDist('拒拒', '拒捕')).is.equal(1); // match decomp + half
      expect(util.minEditDist('拒拒', '拒價')).is.equal(2); // match decomp only
      expect(util.minEditDist('拒拒', '拒三')).is.equal(3); // nothing
    });

    // NEXT: FAILING
    it('should not return dist of 2 when swapping both', function () {
      expect(util.minEditDist('漏壺', '涓吉')).is.gt(2);
    });
  });

  describe('binEditDist()', function () {
    it('should return dist between 2 chars', function () {
      let dbg = 0;
      expect(util.binEditDist('拒', '拒')).is.equal(0); // exact
      expect(util.binEditDist('拒', '捕')).is.equal(1); // match decomp + half
      expect(util.binEditDist('拒', '價')).is.equal(2); // match decomp only
      expect(util.binEditDist('拒', '三')).is.equal(3); // nothing

      expect(util.binEditDist('齐', '齊')).is.equal(2); // match decomp and ?

      if (dbg) {
        for (var i = 0; i < 5; i++) {

          let word = 0 ? '拒捕' : util.randWord(2);
          let bed = util.binEditDist(word.literal[0], word.literal[1]);
          console.log(word.literal[0] + '(' + word.characters[0].decomposition + ')',
            word.literal[1] + '(' + word.characters[1].decomposition + ')', "BED=" + bed);
          expect(bed).is.gt(-1);

        }
      }
    });
  });

});
