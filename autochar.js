if (typeof module != 'undefined' && process.versions.hasOwnProperty('electron')) {
  Tone = require("./node_modules/tone/build/Tone.min.js");
}

const REPLACE_ERASE = 0;
const REPLACE_STROKE = 1;
const DELETE_ACTION = 2;
const INSERT_ACTION = 3;

class Autochar {

  constructor(util, onActionCallback, onNewTargetCallback) {

    this.target;
    this.tid = -1;
    this.med = -1;
    this.util = util;
    this.leftStatics = 0;
    this.rightStatics = 0;
    this.numTriggers = 0;
    this.useTriggers = true;
    this.targetCharIdx = -1;
    this.targetPartIdx = -1;
    this.currentStrokeCount = 0;

    this.onActionCallback = onActionCallback;
    this.onNewTargetCallback = onNewTargetCallback;

    this.word = util.randWord();
    //this.word = util.getWord('贡献', true);
    this.memory = new util.HistQ(10);
    this.memory.add(this.word.literal);

    //this.memory.add('trigger'); // TMP: replace ***********
  }

  disableTriggers() {
    this.useTriggers = false;
  }

  step() { // returns the next action to be done

    if (!this.target) {
      let isTrigger = this.pickNextTarget();
      //console.log('NEXT: ',isTrigger);
      this.findEditIndices();
      if (this.onNewTargetCallback) {
        this.onNewTargetCallback(this.target, this.med,
          this.currentStrokeCount, isTrigger);
      }
    }

    this.doNextEdit();
    return this.action;
  }

  candidates(minAllowed) {

    let cands = [], filtering = true;
    let minMed = minAllowed || 1, dbug = 0;

    // what is going on here?
    let rightSideFail = this.rightStatics > this.memory.size();
    let leftSideFail = this.leftStatics > this.memory.size();

    while (!cands || !cands.length) {

      cands = this.util.bestEditDistance(this.word.literal, { history: this.memory, minMed });

      if (!cands || !cands.length) throw Error('Died on ' + this.word.literal, this.word);

      // filter based on word definition
      if (filtering) {
        let memDefs = this.memory.q.map(c => this.util.definition(c));
        cands = cands.filter(c => {
          let def = this.util.definition(c);
          if (dbug && memDefs.includes(def)) console.log('[FILTER]', c + '/' + def);
          return !memDefs.includes(this.util.definition(c))
        });
      }

      if (!cands.length) {
        minMed++;
        if (filtering && minMed > 3) {
          minMed = 1; // try without filter
          dbug && console.warn('[RELAX] minMed= 1, *disable-filter*');
          filtering = false;
        }
        else {
          dbug && console.warn('[RELAX] minMed=' + minMed,
            (filtering ? '' : ' *no-filter*'));
        }
        continue;
      }

      // alternate characters when possible
      if (!rightSideFail && !leftSideFail) {
        if (this.targetCharIdx > -1) {
          let ideals = [];
          let justChanged = this.word.literal[this.targetCharIdx];
          //console.log('justChanged', justChanged);
          for (let i = 0; i < cands.length; i++) {
            if (cands[i][this.targetCharIdx] === justChanged) {
              ideals.push(cands[i]);
            }
          }
          if (ideals.length) cands = ideals;
        }
      }
      else {
        let repairs = [];
        if (rightSideFail) {
          console.warn('violation(r) ' + this.word.literal);
          for (let i = 0; i < cands.length; i++) {
            if (cands[i][1] !== this.word.literal[1]) {
              repairs.push(cands[i]);
            }
          }
        }
        else if (leftSideFail) {
          console.warn('violation(l) ' + this.word.literal);
          for (let i = 0; i < cands.length; i++) {
            if (cands[i][0] !== this.word.literal[0]) {
              repairs.push(cands[i]);
            }
          }
        }
        if (repairs.length) {
          console.log('repairs: ' + repairs);
          cands = repairs;
        }
        else {
          minMed++;
          cands = undefined;
          console.log('No repair: incrementing MED to ' + minMed);
        }
      }
    }

    return cands;
  }

  isTrigger(cand) {
    let j, trigger;
    if (WORD_TRIGGERS.includes(cand)) trigger = cand;
    for (j = 0; !trigger && j < cand.length; j++) {
      if (CHAR_TRIGGERS.indexOf(cand[j]) > -1) {
        trigger = cand[j];
      }
    }
    trigger && console.log('*** Trigger: "' + trigger + '" in "' + cand
      + '" -> ' + (this.util.lang === 'simp' ? 'trad' : 'simp'),
      "'" + util.definition(cand) + "'");
    return trigger;
  }

  pickNextTarget() {

    //console.log('pickNextTarget() trigger: ' + (this.memory.peek() === 'trigger'));

    // get candidates with lowest MED
    let result, opts = this.candidates();

    // select any trigger words if we have them
    let triggered = false;
    if (useTriggers && !this.memory.contains('trigger')) {
      let startIdx = (Math.random() * opts.length) << 0;
      for (let i = startIdx; i < opts.length + startIdx; i++) {
        let cand = opts[i % opts.length];
        if (this.isTrigger(cand)) {
          result = this.util.getWord(cand);
          triggered = true;
          this.numTriggers++;
          break;
        }
      }
    }

    // we have a good candidate or we fall back to random one
    result = result || this.util.getWord(opts[(Math.random() * opts.length) << 0]);

    // check neither character has stayed the same for too long
    this.rightStatics = result.literal[1] === this.word.literal[1] ? this.rightStatics + 1 : 0;
    this.leftStatics = result.literal[0] === this.word.literal[0] ? this.leftStatics + 1 : 0;

    // update the new target and MED
    this.med = this.util.minEditDistance(this.word.literal, result.literal);
    this.memory.add(result.literal);
    this.target = result;

    // if its a trigger word, swap languages and mark it
    if (triggered) {
      this.util.toggleLang();
      this.memory.add('trigger');
    }

    return triggered;
  }

  doNextEdit() {

    if (this.action == REPLACE_ERASE) {
      if (!this.word.eraseStroke(this.targetCharIdx, this.targetPartIdx)) {
        // erasing done, now replace
        this.word = this.target;
        this.word.hide(); // TODO: simplify to one function
        this.word.show(this.targetCharIdx, this.targetPartIdx == 1 ? 0 : 1);
        this.word.show(this.targetCharIdx == 1 ? 0 : 1);
        this.action = REPLACE_STROKE;
      }
    }

    if (this.action == REPLACE_STROKE) {
      if (this.word.nextStroke(this.targetCharIdx, this.targetPartIdx)) {
        this.onActionCallback(); // draw stroke change
      } else { // flash
        this.onActionCallback(this.word); // word change
        this.target = null;
      }
    }
  }

  findEditIndices() {

    this.targetCharIdx = -1;
    this.targetPartIdx = -1;

    if (this.target.length === this.word.length) {

      this.action = REPLACE_ERASE;

      for (let i = 0; i < this.word.length; i++) {
        if (this.word.literal[i] !== this.target.literal[i]) {
          this.targetCharIdx = i;
          let wchr = this.word.characters[i];
          let tchr = this.target.characters[i];
          //console.log('wchr',wchr);
          for (let j = 0; j < wchr.parts.length; j++) {

            // check the number of strokes in each part
            // if they don't match then this part needs updating
            if (wchr.cstrokes[j].length !== tchr.cstrokes[j].length) {
              this.targetPartIdx = j;

              // compute the number of strokes that need to be drawn
              if (j < 0) console.log('***pidx=' + j, this.word.literal, this.med);
              if (i > -1 && j > -1) {
                this.currentStrokeCount = tchr.paths[j].length;
              }
            }
          }
        }
      }

      //console.log('strokes: '+this.currentStrokeCount);

    } else if (this.target.length > this.word.length) {
      this.action = INSERT_ACTION; // TODO

    } else if (this.target.length < this.word.length) {
      this.action = DELETE_ACTION; // TODO
    }

    //console.log('target=' + this.target.literal[this.targetCharIdx]
    //+', charIdx=' + this.targetCharIdx + ', pIdx=' + this.targetPartIdx);
  }
}

const CHAR_TRIGGERS = '';//屄妓刘陆肏毛嫖裸婊奸姦尻淫習习審审國国藝艺罰罚監监獄狱網网書书報报黨党強强憲宪權权規规夢梦變变競竞爭争錯错謬谬惡恶壞坏愛爱衛卫華华賣卖讀读學学檢检驗验戰战鬥斗敵錢钱異异雜杂亂乱法假反翻叛泄控官革斃毙民罪犯真信廉暴軍压壓迫逼毒獨独抗違违廢废捕皇严嚴仇敌敵霸牢禁罷罢憂忧侵窺窥佔騙骗贪貪贿賄';
const WORD_TRIGGERS = ['臉書', '脸书', '經濟', '经济', '萬歲', '万岁', '對抗', '对抗', '共产', '共產', '本土', '本地', '資本', '资本', '政治', '人民', '微博', '教会', '教會', '天主', '教徒', '发展', '發展', '信徒', '宗教', '文化', '和諧', '河蟹', '和谐', '專政', '封閉', '運動', '专政', '封闭', '>运动', '回教', '新疆', '宗教', '伦理', '倫理', '道德', '公德', '诚实', '誠實', '公平', '公正', '持平', '正義', '野蛮', '野蠻', '粗暴', '未來', '好处', '好處', '利益', '接任', '接替', '继承', '繼承', '皇帝', '傳教', '传教', '传道', '傳道', '新闻', '新聞', '主席', '年輕', '回歸', '回归', '放棄', '触发', '觸發', '抵制', '挑撥', '挑拨', '杯葛', '領土', '领土', '过敏', '過敏', '敏感', '市場', '占领', '佔領', '雨傘', '雨伞', '利润', '盈利', '領域', '领域', '边界', '邊界', '边境', '邊境', '极限', '極限', '穩定', '稳定', '繁榮', '繁荣', '文明', '发达', '發達', '干預', '干预', '內政', '罢工', '罷工', '無產', '階級', '無產', '階級', '暴君', '统治', '統治', '歷史', '历史', '自由', '自主', '言論', '言论', '示威', '隱私', '私隱', '隐私', '私隐', '取締', '取缔', '管制', '操纵', '操縱', '制度', '系统', '體系', '体系', '体制', '操控', '體制', '問題', '问题', '不安', '害怕', '畏惧', '畏懼', '欺負', '欺凌', '欺负', '領導', '领导', '主導', '主导', '领袖', '領袖', '抑制', '馴化', '驯化', '族裔', '血统', '血統', '關係', '关系', '懷疑', '怀疑', '疑心', '疑虑', '疑慮', '身分', '身份', '釘子', '危害', '憤慨', '憤慨', '忠诚', '忠誠', '忠贞', '忠貞', '贡献', '貢獻', '效忠', '諾言', '諾言', '承诺', '承諾', '收縮', '收缩', '選舉', '选举', '推选', '推選', '提名', '投票', '表决', '票选', '票選', '公投', '參選', '参选', '立誓', '宣誓', '應諾', '应诺', '屈服', '降服', '归顺', '歸順', '服從', '服从', '請願', '请愿', '腐敗', '腐败', '钳制', '箝制', '崩潰', '崩溃', '瓦解', '倒塌', '崩塌', '打倒', '革命', '文革', '高鐵', '高铁', '治安', '公安', '尊重', '禮儀', '礼仪', '否決', '否决'];

if (typeof module != 'undefined') module.exports = Autochar;
