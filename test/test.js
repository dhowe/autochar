let expect = require('chai').expect;
let util = require('../cutils');
let HistQ = util.HistQ;

describe('word-class', function () {
  it('should test Word class functions', function () {
    let word = util.getWord('拒齐');
    expect(word.literal).to.equal('拒齐');
    expect(word.literal[0]).to.equal('拒');
    expect(word.literal[1]).to.equal('齐');

    for (var i = 0; i < word.characters.length; i++) {
      expect(word.characters[i].parts.length).to.equal(2);
      expect(word.characters[i].parts[0]).to.equal(-1);
      expect(word.characters[i].parts[1]).to.equal(-1);
    }
  });
});

describe('history-q', function () {
  it('should act like a history queue (stack)', function () {
    let hq = new HistQ(5);
    expect(hq.size()).to.equal(0);
    expect(hq.isEmpty()).to.equal(true);
    for (var i = 0; i < 5; i++) hq.add(i);
    expect(hq.size()).to.equal(5);
    hq.add(5);
    expect(hq.size()).to.equal(5);
    expect(hq.peek()).to.equal(5);
    expect(hq.pop()).to.equal(5);
    expect(hq.size()).to.equal(4);
    expect(hq.isEmpty()).to.equal(false);
  });
});

describe('cutil-tests', function () {

  describe('pad()', function () {
    it('should pad the string with ？', function () {
      expect(util.pad('aaa', 3)).to.equal('aaa');
      expect(util.pad('a', 3)).to.equal('a？？');
      expect(util.pad('', 3)).to.equal('？？？');
      expect(util.pad('AA', 3)).to.equal('AA？');
      expect(util.pad('aaa', 2)).to.equal('aaa');
      expect(util.pad('a', 0)).to.equal('a');
      expect(util.pad('', 1)).to.equal('？');
    });
  });

  /*ddescribe('actions(stroke)', function () {
    it('should return actions to transform string-to-string by stroke', function () {
      let acs, act;
    });
  });

  escribe('actions(part)', function () {
    it('should return actions to transform string-to-string by part', function () {
      let acs, act;

      expect(util.actions('拒拒', '拒拒', 'part')).to.eql([]); // nothing required

      acs = util.actions('拒', '', 'part');
      expect(acs.length).to.equal(2); // 1 delete
      expect(acs[0]).to.eql({ action: 'del', index: 0, part: 0 });
      expect(acs[1]).to.eql({ action: 'del', index: 0, part: 1 });

      acs = util.actions('拒拒', '拒', 'part');
      expect(acs.length).to.equal(2); // 1 delete
      expect(acs[0]).to.eql({ action: 'del', index: 1, part: 0 });
      expect(acs[1]).to.eql({ action: 'del', index: 1, part: 1 });

      acs = util.actions('拒', '拒拒', 'part');
      expect(acs.length).to.equal(2); // 1 insert
      expect(acs[0]).to.eql({ action: 'ins', data: '拒', index: 1, part: 0 });
      expect(acs[1]).to.eql({ action: 'ins', data: '拒', index: 1, part: 1 });

      acs = util.actions('', '拒', 'part');
      expect(acs.length).to.equal(2); // 1 insert
      expect(acs[0]).to.eql({ action: 'ins', data: '拒', index: 0, part: 0 });
      expect(acs[1]).to.eql({ action: 'ins', data: '拒', index: 0, part: 1 });

      acs = util.actions('拒拒', '拒三', 'part');
      expect(acs.length).to.equal(2); // replace last
      expect(acs[0]).to.eql({ action: 'sub', data: '三', index: 1, part: 0 });
      expect(acs[1]).to.eql({ action: 'sub', data: '三', index: 1, part: 1 });

      acs = util.actions('拒拒', '三拒', 'part');
      expect(acs.length).to.equal(2); // replace first
      expect(acs[0]).to.eql({ action: 'sub', data: '三', index: 0, part: 0 });
      expect(acs[1]).to.eql({ action: 'sub', data: '三', index: 0, part: 1 });

      acs = util.actions('拒拒', '三齐', 'part');
      expect(acs.length).to.equal(4); // replace both
      // what if the decompositions are different
      expect(acs[0]).to.eql({ action: 'sub', data: '三', index: 0, part: 0 });
      expect(acs[1]).to.eql({ action: 'sub', data: '三', index: 0, part: 1 });
      expect(acs[2]).to.eql({ action: 'sub', data: '齐', index: 1, part: 0 });
      expect(acs[3]).to.eql({ action: 'sub', data: '齐', index: 1, part: 1 });
    });
  }); */

  describe('actions(char)', function () {
    it('should return actions to transform string-to-string by char', function () {
      let acs, act;

      expect(util.actions('拒拒', '拒拒', 'char')).to.eql([]); // nothing required
      acs = util.actions('拒', '', 'char');
      expect(acs.length).to.equal(1); // 1 delete
      expect(acs[0]).to.eql({ action: 'del', index: 0 });

      acs = util.actions('拒拒', '拒', 'char');
      expect(acs.length).to.equal(1); // 1 delete
      expect(acs[0]).to.eql({ action: 'del', index: 1 });

      acs = util.actions('拒', '拒拒', 'char');
      expect(acs.length).to.equal(1); // 1 insert
      expect(acs[0]).to.eql({ action: 'ins', data: '拒', index: 1 });

      acs = util.actions('', '拒', 'char');
      expect(acs.length).to.equal(1); // 1 insert
      expect(acs[0]).to.eql({ action: 'ins', data: '拒', index: 0 });

      acs = util.actions('拒拒', '拒三', 'char');

      expect(acs.length).to.equal(2); // replace last
      expect(acs[0]).to.eql({ action: 'sub', data: ' ', index: 1 });
      expect(acs[1]).to.eql({ action: 'sub', data: '三', index: 1 });

      acs = util.actions('拒拒', '三拒', 'char');
      expect(acs.length).to.equal(2); // replace first
      expect(acs[0]).to.eql({ action: 'sub', data: ' ', index: 0 });
      expect(acs[1]).to.eql({ action: 'sub', data: '三', index: 0 });

      acs = util.actions('拒拒', '三齐', 'char');
      expect(acs.length).to.equal(4); // replace both
      expect(acs[0]).to.eql({ action: 'sub', data: ' ', index: 0 });
      expect(acs[1]).to.eql({ action: 'sub', data: '三', index: 0 });
      expect(acs[2]).to.eql({ action: 'sub', data: ' ', index: 1 });
      expect(acs[3]).to.eql({ action: 'sub', data: '齐', index: 1 });
    });
  });

  describe('actions(simple)', function () {
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

      // FAILING (only handles length-diff of 1)
      // acs = util.actions('三拒拒', '三');
      // expect(acs.length).to.equal(2); // delete two
      // expect(acs[0]).to.eql({ action: 'del', index: 2 });
      // expect(acs[1]).to.eql({ action: 'del', index: 1 });
    });
  });

  describe('doAction(stroke)', function () {
    it('should transform string to target by stroke', function () {
      let test, tests, acts;
    });
  });

  /*describe('doAction(part)', function () {
    it('should transform string to target part', function () {
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
        word = util.getWord(test[0]);
        acts = util.actions(test[0], test[1]);
        for (var j = 0; j < acts.length; j++) {
          util.doAction(word, acts[j]);
        }
        expect(word.literal).to.equal(test[1]);
        expect(word.characters[0].parts).to.equal([]);
      }
return;
      // compound actions
      tests = [
        ['拒拒', '三齐'],
        //['三拒拒', '三'], // FAILING (only handles length-diff of 1)
      ]
      for (var i = 0; i < tests.length; i++) {
        test = tests[i];
        acts = util.actions(test[0], test[1]);
        word = util.getWord(test[0]);
        for (var j = 0; j < acts.length; j++) {
          util.doAction(word, acts[j]);
        }
        expect(word.literal).to.equal(test[1]);
      }
    });
  });*/

  describe('doAction(char)', function () {
    it('should transform string to target by char', function () {
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
        word = util.getWord(test[0]);
        for (var j = 0; j < acts.length; j++) {
          util.doAction(word, acts[j]);
        }
        expect(word.literal).to.equal(test[1]);
      }

      // compound actions
      tests = [
        ['拒拒', '三齐'],
        //['三拒拒', '三'], // FAILING (only handles length-diff of 1)
      ]
      for (var i = 0; i < tests.length; i++) {
        test = tests[i];
        acts = util.actions(test[0], test[1]);
        word = util.getWord(test[0]);
        for (var j = 0; j < acts.length; j++) {
          util.doAction(word, acts[j]);
        }
        expect(word.literal).to.equal(test[1]);
      }
    });
  });

  describe('doAction(simple)', function () {
    it('should transform string to target', function () {
      let test, tests, acts, word;

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
        word = util.getWord(test[0]);
        for (var j = 0; j < acts.length; j++) {
          util.doAction(word, acts[j]);
        }
        expect(word.literal).to.equal(test[1]);
      }
      // compound actions
      tests = [
        ['拒拒', '三齐'],
        //['三拒拒', '三'], // FAILING (only handles length-diff of 1)
      ]
      for (var i = 0; i < tests.length; i++) {
        test = tests[i];
        acts = util.actions(test[0], test[1], 'part');
        word = util.getWord(test[0]);
        for (var j = 0; j < acts.length; j++) {
          util.doAction(word, acts[j]);
        }
        expect(word.literal).to.equal(test[1]);
      }
    });
  });

  describe('getWord()', function () {
    it('should return word object for literal', function () {
      let word = util.getWord('拒');
      expect(word.literal).to.equal('拒');

      word = util.getWord("三價");
      expect(word.literal).to.equal("三價");

      word = util.getWord(" 價");
      expect(word.literal).to.equal(" 價");
    });
  });

  describe('bestEditDist()', function () {
    it('should return set of minimum MEDs for a word', function () {
      let bet, word = util.getWord('拒');

      bet = util.bestEditDist(word.literal, ['拒', '捕', '價', '三', '齊', '齐']);
      expect(bet.length).to.equal(1);
      expect(bet[0]).to.equal('捕'); // ignore duplicate
      expect(util.minEditDist(word.literal, bet[0])).to.equal(1);

      bet = util.bestEditDist(word.literal, ['捕', '價', '三', '齊', '齐']);
      expect(bet.length).to.equal(1);
      expect(bet[0]).to.equal('捕');
      expect(util.minEditDist(word.literal, bet[0])).to.equal(1);

      bet = util.bestEditDist(word.literal, ['價', '三', '齊', '齐']);
      expect(bet.length).to.equal(1);
      expect(bet[0]).to.equal('價');
      expect(util.minEditDist(word.literal, bet[0])).to.equal(2);

      bet = util.bestEditDist(word.literal, ['三', '齊', '齐']);
      expect(bet.length).to.equal(3);
      expect(util.minEditDist(word.literal, bet[0])).to.equal(3);

      // with 4th parameter
      bet = util.bestEditDist(word.literal, ['拒', '捕', '價', '三', '齊', '齐'], null, 2);
      expect(bet.length).to.equal(1);
      expect(bet[0]).to.equal('價'); // ignore duplicate
      expect(util.minEditDist(word.literal, bet[0])).to.equal(2);

      bet = util.bestEditDist(word.literal, ['捕', '價', '三', '齊', '齐'], null, 2);
      expect(bet.length).to.equal(1);
      expect(bet[0]).to.equal('價');
      expect(util.minEditDist(word.literal, bet[0])).to.equal(2);

      bet = util.bestEditDist(word.literal, ['價', '三', '齊', '齐'], null, 2);
      expect(bet.length).to.equal(1);
      expect(bet[0]).to.equal('價');
      expect(util.minEditDist(word.literal, bet[0])).to.equal(2);

      bet = util.bestEditDist(word.literal, ['三', '齊', '齐'], null, 4);
      expect(bet).to.eql([]);
    });
  });

  describe('minEditDist()', function () {
    it('should return dist between 2 words (1 matching)', function () {
      expect(util.minEditDist('拒拒', '拒拒')).to.equal(0); // exact
      expect(util.minEditDist('拒拒', '拒捕')).to.equal(1); // match decomp + half
      expect(util.minEditDist('拒拒', '拒價')).to.equal(2); // match decomp only
      expect(util.minEditDist('拒拒', '拒三')).to.equal(3); // nothing
    });

    // FAILING (HANDLE WITH ACTIONS)
    // it('should not return dist of 2 when swapping both', function () {
    //   expect(util.minEditDist('漏壺', '涓吉')).is.gt(2);
    // });
  });

  describe('binEditDist()', function () {
    it('should return dist between 2 chars', function () {
      let dbg = 0;
      expect(util.binEditDist('拒', '拒')).to.equal(0); // exact
      expect(util.binEditDist('拒', '捕')).to.equal(1); // match decomp + half
      expect(util.binEditDist('拒', '價')).to.equal(2); // match decomp only
      expect(util.binEditDist('拒', '三')).to.equal(3); // nothing

      expect(util.binEditDist('齐', '齊')).to.equal(2); // match decomp and ?

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
