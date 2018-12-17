let expect = require('chai').expect;
let util = require('../cutils');
let HistQ = util.HistQ;

describe('Word', function () {
  it('should wrap a sequence of characters', function () {

    let word = util.getWord('拒齐');

    expect(word.literal).to.equal('拒齐');
    expect(word.literal[0]).to.equal('拒');
    expect(word.literal[1]).to.equal('齐');

    // -1(none), 0(left), 1(right), max(both)
    for (var i = 0; i < word.characters.length; i++) {
      expect(word.characters[i].parts.length).to.equal(2);
      expect(word.characters[i].parts[0]).to.equal(Number.MAX_SAFE_INTEGER);
      expect(word.characters[i].parts[1]).to.equal(Number.MAX_SAFE_INTEGER);
    }

    // char 0 -> '拒'
    expect(word.characters[0].matches.length).to.equal(7);
    expect(word.characters[0].cstrokes.length).to.equal(2);
    expect(word.characters[0].parts.length).to.equal(2);
    expect(word.characters[0].cstrokes[0].length).to.equal(3);
    expect(word.characters[0].cstrokes[1].length).to.equal(4);

    let strokeCount = 0;
    let cstrokes = word.characters[0].cstrokes;
    for (var i = 0; i < cstrokes.length; i++) {
      strokeCount += cstrokes[i].length;
    }
    expect(word.characters[0].matches.length).to.equal(strokeCount);

    // char 1 -> '齐'
    expect(word.characters[1].matches.length).to.equal(6);
    expect(word.characters[1].cstrokes.length).to.equal(2);
    expect(word.characters[1].parts.length).to.equal(2);
    expect(word.characters[1].cstrokes[0].length).to.equal(4);
    expect(word.characters[1].cstrokes[1].length).to.equal(2);

    strokeCount = 0;
    cstrokes = word.characters[1].cstrokes;
    for (let i = 0; i < cstrokes.length; i++) {
      strokeCount += cstrokes[i].length;
    }
    expect(word.characters[1].matches.length).to.equal(strokeCount);
  });
});

describe('Word-visibility', function () {
  it('should wrap a sequence of characters', function () {

    let word = util.getWord('拒齐');

    expect(word.isVisible()).to.equal(true);
    expect(word.isCharVisible(0)).to.equal(true);
    expect(word.isCharVisible(1)).to.equal(true);
    expect(word.isPartVisible(0, 0)).to.equal(true);
    expect(word.isPartVisible(0, 1)).to.equal(true);
    expect(word.isPartVisible(1, 0)).to.equal(true);
    expect(word.isPartVisible(1, 1)).to.equal(true);

    word.setVisible(0, -1);
    expect(word.isVisible()).to.equal(false);
    expect(word.isCharVisible(0)).to.equal(false);
    expect(word.isPartVisible(0, 0)).to.equal(false);
    expect(word.isPartVisible(0, 1)).to.equal(false);
    expect(word.isCharVisible(1)).to.equal(true);
    expect(word.isPartVisible(1, 0)).to.equal(true);
    expect(word.isPartVisible(1, 1)).to.equal(true);

    word.show();
    expect(word.isVisible()).to.equal(true);
    expect(word.isCharVisible(0)).to.equal(true);
    expect(word.isPartVisible(0, 0)).to.equal(true);
    expect(word.isPartVisible(0, 1)).to.equal(true);
    expect(word.isCharVisible(1)).to.equal(true);
    expect(word.isPartVisible(1, 0)).to.equal(true);
    expect(word.isPartVisible(1, 1)).to.equal(true);

    word.hide();
    expect(word.isVisible()).to.equal(false);
    expect(word.isCharVisible(0)).to.equal(false);
    expect(word.isPartVisible(0, 0)).to.equal(false);
    expect(word.isPartVisible(0, 1)).to.equal(false);
    expect(word.isCharVisible(1)).to.equal(false);
    expect(word.isPartVisible(1, 0)).to.equal(false);
    expect(word.isPartVisible(1, 1)).to.equal(false);

    ////////////////////////////////parts[[3][4]]/////////////////////////////////

    word.characters[0].parts[0] = 0;
    expect(word.isVisible()).to.equal(false);
    expect(word.isCharVisible(0)).to.equal(false);
    expect(word.isPartVisible(0, 0)).to.equal(false);
    expect(word.isPartVisible(0, 1)).to.equal(false);

    word.characters[0].parts[0] = 1;
    expect(word.isVisible()).to.equal(false);
    expect(word.isCharVisible(0)).to.equal(false);
    expect(word.isPartVisible(0, 0)).to.equal(false);
    expect(word.isPartVisible(0, 1)).to.equal(false);

    //return; // FAILING
    word.characters[0].parts[0] = 2;
    expect(word.isVisible()).to.equal(false);
    expect(word.isCharVisible(0)).to.equal(false);
    expect(word.isPartVisible(0, 0)).to.equal(true); // HERE
    expect(word.isPartVisible(0, 1)).to.equal(false);

    word.characters[0].parts[1] = 0;
    expect(word.isVisible()).to.equal(false);
    expect(word.isCharVisible(0)).to.equal(false);
    expect(word.isPartVisible(0, 0)).to.equal(true);
    expect(word.isPartVisible(0, 1)).to.equal(false);

    word.characters[0].parts[1] = 1;
    expect(word.isVisible()).to.equal(false);
    expect(word.isCharVisible(0)).to.equal(false);
    expect(word.isPartVisible(0, 0)).to.equal(true);
    expect(word.isPartVisible(0, 1)).to.equal(false);

    word.characters[0].parts[1] = 2;
    expect(word.isVisible()).to.equal(false);
    expect(word.isCharVisible(0)).to.equal(false);
    expect(word.isPartVisible(0, 0)).to.equal(true);
    expect(word.isPartVisible(0, 1)).to.equal(false);

    word.characters[0].parts[1] = 3;
    expect(word.isVisible()).to.equal(false);
    expect(word.isCharVisible(0)).to.equal(true);
    expect(word.isPartVisible(0, 0)).to.equal(true);
    expect(word.isPartVisible(0, 1)).to.equal(true);

    ////////////////////////////////parts[4][2]/////////////////////////////////
    //console.log(word.characters[1].cstrokes[0].length,word.characters[1].cstrokes[1].length);
    word.characters[1].parts[0] = 0;
    expect(word.isVisible()).to.equal(false);
    expect(word.isCharVisible(0)).to.equal(true);
    expect(word.isCharVisible(1)).to.equal(false);
    expect(word.isPartVisible(1, 0)).to.equal(false);
    expect(word.isPartVisible(1, 1)).to.equal(false);

    word.characters[1].parts[0] = 1;
    expect(word.isVisible()).to.equal(false);
    expect(word.isCharVisible(1)).to.equal(false);
    expect(word.isPartVisible(1, 0)).to.equal(false);
    expect(word.isPartVisible(1, 1)).to.equal(false);

    word.characters[1].parts[0] = 2;
    expect(word.isVisible()).to.equal(false);
    expect(word.isCharVisible(1)).to.equal(false);
    expect(word.isPartVisible(1, 0)).to.equal(false);
    expect(word.isPartVisible(1, 1)).to.equal(false);

    word.characters[1].parts[0] = 3;
    expect(word.isVisible()).to.equal(false);
    expect(word.isCharVisible(1)).to.equal(false);
    expect(word.isPartVisible(1, 0)).to.equal(true);
    expect(word.isPartVisible(1, 1)).to.equal(false);

    word.characters[1].parts[1] = 0;
    expect(word.isVisible()).to.equal(false);
    expect(word.isCharVisible(1)).to.equal(false);
    expect(word.isPartVisible(1, 0)).to.equal(true);
    expect(word.isPartVisible(1, 1)).to.equal(false);

    word.characters[1].parts[1] = 1;
    expect(word.isVisible()).to.equal(true);
    expect(word.isCharVisible(0)).to.equal(true);
    expect(word.isCharVisible(1)).to.equal(true);
    expect(word.isPartVisible(0, 0)).to.equal(true);
    expect(word.isPartVisible(0, 1)).to.equal(true);
    expect(word.isPartVisible(1, 0)).to.equal(true);
    expect(word.isPartVisible(1, 1)).to.equal(true);

    word = util.getWord('拒齐');
    let es = word.toEditStr();
    expect(word.toEditStr()).to.equal('⿰扌巨 ⿱文？');
    for (var i = 0; i < 5; i++) {
      word = util.randWord(1);
      expect(word.toEditStr()).to.equal(word.characters[0].decomposition);
    }
    for (var i = 0; i < 5; i++) {
      word = util.randWord(2);
      let exp = word.characters[0].decomposition + ' ' + word.characters[1].decomposition;
      expect(word.toEditStr()).to.equal(exp);
    }
  });
});

describe('HistQ', function () {
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

describe('CharUtils: utility functions for characters', function () {
  describe('rawEditDistance', function () {
    it('should do the right thing', function () {

      let s1 = 'The dog',
        s2 = 'The cat';
      expect(util.rawEditDistance(s1, s2)).to.equal(3);

      s1 = 'The dog';
      s2 = '';
      expect(util.rawEditDistance(s1, s2)).to.equal(7);

      s1 = "fefnction";
      s2 = "faunctional";
      expect(util.rawEditDistance(s1, s2)).to.equal(4);

      s1 = "intention";
      s2 = "execution";
      expect(util.rawEditDistance(s1, s2)).to.equal(5);
    });
  });

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

  describe('minEditDistance(1)', function () {
    it('should compute the edit string for an MED', function () {
      expect(util.minEditDistance('拒', '拒')).to.equal(0); // exact
      expect(util.minEditDistance('拒', '捕')).to.equal(1); // match decomp + 1 part
      expect(util.minEditDistance('拒', '價')).to.equal(2); // match decomp only
      expect(util.minEditDistance('拒', '三')).to.equal(3); // nothing
    });
  });

  describe('minEditDistance(2)', function () {
    it('should compute the edit string for an MED', function () {
      //first char same, 2nd different
      expect(util.minEditDistance('拒拒', '拒拒')).to.equal(0); // exact
      expect(util.minEditDistance('拒拒', '拒捕')).to.equal(1); // match decomp + half
      expect(util.minEditDistance('拒拒', '拒價')).to.equal(2); // match decomp only
      expect(util.minEditDistance('拒拒', '拒三')).to.equal(3); // nothing

      expect(util.minEditDistance('拒拒', '拒三')).to.equal(3); // one different (non-matching decomp) -> 3

      // added cost param to raise them each by one
      expect(util.minEditDistance('拒拒', '三三')).to.equal(7); // both different(0 matched decomps) -> 6
      expect(util.minEditDistance('拒拒', '捕三')).to.equal(5); // both different(1 matched decomp)  -> 5
      expect(util.minEditDistance('拒拒', '捕價')).to.equal(4); // both different(2 matched decomp)  -> 4
    });
  });

  describe('bestEditDistance(2)', function () {
    it('should return set of minimum MEDs for a 2-char word', function () {
      let test = '拒價';
      let bets = util.bestEditDistance(test);
      for (var i = 0; i < bets.length; i++) {
        expect(util.minEditDistance(test, bets[i])).to.equal(1);
        // console.log(i+"[0]",'vs', bets[i][0], util.minEditDistance(test[0], bets[i][0]));
        // console.log(i+"[1]",'vs', bets[i][1], util.minEditDistance(test[1], bets[i][1]));
        //break;
      }
    });
  });

  describe('bestEditDistance(1)', function () {
    it('should return set of minimum MEDs for a single char', function () {

      let bet, word = util.getWord('拒');

      bet = util.bestEditDistance(word.literal, ['拒', '捕', '價', '三', '齐']);
      expect(bet.length).to.equal(1);
      expect(bet[0]).to.equal('捕'); // ignore duplicate
      expect(util.minEditDistance(word.literal, bet[0])).to.equal(1);

      bet = util.bestEditDistance(word.literal, ['捕', '價', '三', '齐']);
      expect(bet.length).to.equal(1);
      expect(bet[0]).to.equal('捕');
      expect(util.minEditDistance(word.literal, bet[0])).to.equal(1);

      bet = util.bestEditDistance(word.literal, ['價', '三', '齐']);
      expect(bet.length).to.equal(1);
      expect(bet[0]).to.equal('價');
      expect(util.minEditDistance(word.literal, bet[0])).to.equal(2);

      bet = util.bestEditDist(word.literal, ['三', '齐']);
      expect(bet.length).to.equal(2);
      expect(util.minEditDistance(word.literal, bet[0])).to.equal(3);

      // with 4th parameter
      bet = util.bestEditDistance(word.literal, ['拒', '捕', '價', '三', '齐'], null, 2);
      expect(bet.length).to.equal(1);
      expect(bet[0]).to.equal('價'); // ignore duplicate
      expect(util.minEditDistance(word.literal, bet[0])).to.equal(2);

      bet = util.bestEditDistance(word.literal, ['捕', '價', '三', '齐'], null, 2);
      expect(bet.length).to.equal(1);
      expect(bet[0]).to.equal('價');
      expect(util.minEditDistance(word.literal, bet[0])).to.equal(2);

      bet = util.bestEditDistance(word.literal, ['價', '三', '齐'], null, 2);
      expect(bet.length).to.equal(1);
      expect(bet[0]).to.equal('價');
      expect(util.minEditDistance(word.literal, bet[0])).to.equal(2);

      bet = util.bestEditDistance(word.literal, ['三', '齐'], null, 4);
      expect(bet).to.eql([]);
    });
  });

  describe('actions(part)', function () {
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
  });

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
      let wstr = JSON.stringify(word);
      //console.log(wstr);
      //expect(word.literal).to.equal('拒');

      let word2 = util.getWord('拒');
      let wstr2 = JSON.stringify(word2);
      //console.log(wstr2);
      expect(wstr).to.equal(wstr2);
      //return;
      //console.log(word2.characters[0]);
      expect(word.literal).to.equal(word2.literal);
      expect(word.length).to.equal(word2.length);
      expect(word.characters.length).to.equal(word2.characters.length);
      expect(word.characters[0].cstrokes.length).to.equal(word2.characters[0].cstrokes.length);
      for (var i = 0; i < word.characters[0].cstrokes.length; i++) {
        var stroke1 = word.characters[0].cstrokes[i];
        var stroke2 = word2.characters[0].cstrokes[i];
        //console.log(stroke1, stroke2);
        expect(stroke1).to.equal(stroke1);
      }

      word = util.getWord("三價");
      expect(word.literal).to.equal("三價");
    });
  });

  /*describe('bestEditDistOld()', function () {
    it('should return set of minimum MEDs for a word', function () {

      let bet, word = util.getWord('拒');

      bet = util.bestEditDist(word.literal, ['拒', '捕', '價', '三', '齐']);
      expect(bet.length).to.equal(1);
      expect(bet[0]).to.equal('捕'); // ignore duplicate
      expect(util.minEditDist(word.literal, bet[0])).to.equal(1);

      bet = util.bestEditDist(word.literal, ['捕', '價', '三', '齐']);
      expect(bet.length).to.equal(1);
      expect(bet[0]).to.equal('捕');
      expect(util.minEditDist(word.literal, bet[0])).to.equal(1);

      bet = util.bestEditDist(word.literal, ['價', '三', '齐']);
      expect(bet.length).to.equal(1);
      expect(bet[0]).to.equal('價');
      expect(util.minEditDist(word.literal, bet[0])).to.equal(2);

      // bet = util.bestEditDist(word.literal, ['三',  '齐']);
      // expect(bet.length).to.equal(3);
      // expect(util.minEditDist(word.literal, bet[0])).to.equal(3);

      // with 4th parameter
      bet = util.bestEditDist(word.literal, ['拒', '捕', '價', '三', '齐'], null, 2);
      expect(bet.length).to.equal(1);
      expect(bet[0]).to.equal('價'); // ignore duplicate
      expect(util.minEditDist(word.literal, bet[0])).to.equal(2);

      bet = util.bestEditDist(word.literal, ['捕', '價', '三', '齐'], null, 2);
      expect(bet.length).to.equal(1);
      expect(bet[0]).to.equal('價');
      expect(util.minEditDist(word.literal, bet[0])).to.equal(2);

      bet = util.bestEditDist(word.literal, ['價', '三', '齐'], null, 2);
      expect(bet.length).to.equal(1);
      expect(bet[0]).to.equal('價');
      expect(util.minEditDist(word.literal, bet[0])).to.equal(2);

      bet = util.bestEditDist(word.literal, ['三', '齐'], null, 4);
      expect(bet).to.eql([]);
    });
  });*/

  describe('minEditDistOld()', function () {
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

  describe('binEditDistOld()', function () {
    it('should return dist between 2 chars', function () {

      let dbg = 0;
      expect(util.binEditDist('拒', '拒')).to.equal(0); // exact
      expect(util.binEditDist('拒', '捕')).to.equal(1); // match decomp + half
      expect(util.binEditDist('拒', '價')).to.equal(2); // match decomp only
      expect(util.binEditDist('拒', '三')).to.equal(3); // nothing

      //expect(util.binEditDist('齐', '齊')).to.equal(2); // match decomp and ?

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
