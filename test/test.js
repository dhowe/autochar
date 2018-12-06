var expect = require('chai').expect;
var Util = require('../cutils');

describe('tests', function () {

  describe('utils-pkg', function () {
    it('should load data files', function () {
      var word = Util.test();
      expect(word).to.equal('test-ok');
      expect(Object.keys(Util.wordData)).length.gt(0);
      expect(Object.keys(Util.charData)).length.gt(0);
    });
    it('should return dist between 2 chars', function () {
      var bed = Util.binEditDist("万","俟");
      expect(bed).to.equal(-1);
    });
  });

});
