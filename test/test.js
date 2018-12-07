let expect = require('chai').expect;
let util = require('../cutils');

describe('cutil-tests', function () {

  describe('pad()', function () {
    it('should return actions needed to transform one string to another', function () {
      expect(util.pad('aaa', 3)).to.equal('aaa');
      expect(util.pad('a', 3)).to.equal('a？？');
      expect(util.pad('', 3)).to.equal('？？？');
      expect(util.pad('AA', 3)).to.equal('AA？');

      expect(util.pad('aaa', 2)).to.equal('aaa');
      expect(util.pad('a', 0)).to.equal('a');
      expect(util.pad('', 1)).to.equal('？');
    });
  });

  // describe('current-test', function () {
  //   it('should fix current problem', function () {
  //     acs = util.actions('三拒拒', '三');
  //     console.log(acs);
  //     expect(acs.length).to.equal(2); // delete two
  //     expect(acs[0]).to.eql({ action: 'del', index: 2 });
  //     expect(acs[1]).to.eql({ action: 'del', index: 1 });
  //   });
  // });

  describe('actions()', function () {
    it('should return actions needed to transform one string to another', function () {

      let acs, act;

      expect(util.actions('拒拒', '拒拒')).to.eql([]); // nothing required

      acs = util.actions('拒', '');
      expect(acs.length).to.equal(1); // 1 delete
      expect(acs[0]).to.eql({ action: 'del', index: 0 });

      // atomic actions.....
      acs = util.actions('拒拒', '拒');
      expect(acs.length).to.equal(1); // 1 delete
      expect(acs[0]).to.eql({ action: 'del', index: 1 });

      acs = util.actions('拒', '拒拒');
      expect(acs.length).to.equal(1); // 1 insert
      expect(acs[0]).to.eql({ action: 'ins', data: '拒', index: 1 });


      acs = util.actions('', '拒');
      expect(acs.length).to.equal(1); // 1 insert
      expect(acs[0]).to.eql({ action: 'ins', data: '拒', index: 0 });

      acs = util.actions('拒拒', '拒三');
      expect(acs.length).to.equal(1); // replace last
      expect(acs[0]).to.eql({ action: 'sub', data: '三', index: 1 });

      acs = util.actions('拒拒', '三拒');
      expect(acs.length).to.equal(1); // replace first
      expect(acs[0]).to.eql({ action: 'sub', data: '三', index: 0 });

      // compound actions.....
      acs = util.actions('拒拒', '三齐');
      expect(acs.length).to.equal(2); // replace both
      expect(acs[0]).to.eql({ action: 'sub', data: '三', index: 0 });
      expect(acs[1]).to.eql({ action: 'sub', data: '齐', index: 1 });

      // FAILING
      // acs = util.actions('三拒拒', '三');
      // expect(acs.length).to.equal(2); // delete two
      // expect(acs[0]).to.eql({ action: 'del', index: 2 });
      // expect(acs[1]).to.eql({ action: 'del', index: 1 });
    });
  });

  describe('doAction()', function () {
    it('should transform string to target', function () {
      let test, tests, acts;

      // atomic actions
      tests = [
        ['拒拒', '拒'],
        ['拒', '拒拒'],
        ['拒', ''],
        ['', '拒'],
        ['拒拒', '拒三'],
        ['拒拒', '三拒']
      ]
      for (var i = 0; i < tests.length; i++) {
        test = tests[i];
        acts = util.actions(test[0], test[1]);
        expect(util.doAction(test[0], acts[0])).to.equal(test[1]);
      }

      // compound actions
      tests = [
        ['拒拒', '三齐'],
        //['三拒拒', '三'], //FAILING
      ]
      for (var i = 0; i < tests.length; i++) {
        test = tests[i];
        acts = util.actions(test[0], test[1]);
        var current = test[0];
        //console.log('curr0:', current);
        for (var j = 0; j < acts.length; j++) {
          current = util.doAction(current, acts[j])
          //console.log('curr' + j + ':', current, acts[j]);
        }
        expect(current).to.equal(test[1]);
      }
    });
  });

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

      bet = util.bestEditDist(word.literal, ['價', '三', '齊', '齐']);
      expect(bet.length).is.equal(1);
      expect(bet[0]).is.equal('價');
      expect(util.minEditDist(word.literal, bet[0])).is.equal(2);

      bet = util.bestEditDist(word.literal, ['三', '齊', '齐']);
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

    // FAILING (HANDLE WITH ACTIONS)
    // it('should not return dist of 2 when swapping both', function () {
    //   expect(util.minEditDist('漏壺', '涓吉')).is.gt(2);
    // });
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
