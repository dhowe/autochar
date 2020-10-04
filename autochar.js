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
    /* for (j = 0; !trigger && j < cand.length; j++) {
      if (CHAR_TRIGGERS.indexOf(cand[j]) > -1) {
        trigger = cand[j];
      }
    } */
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
    
    // can freeze a single word here for screenshots
    // result = this.util.getWord("和諧");

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
const WORD_TRIGGERS = ["書記", "笔会", "孟浪", "热点", "溜冰", "維尼", "臉書", "經濟", "对抗", "政治", "教会", "天主", "教徒", "信徒", "宗教", "文化", "和諧", "河蟹", "和谐", "專政", "伦理", "倫理", "诚实", "誠實", "公正", "正義", "野蛮", "野蠻", "利益", "皇帝", "傳教", "传教", "挑撥", "挑拨", "杯葛", "領土", "领土", "敏感", "市場", "占领", "佔領", "利润", "盈利", "領域", "领域", "极限", "極限", "穩定", "稳定", "文明", "干預", "干预", "罢工", "罷工", "階級", "统治", "統治", "隱私", "隐私", "取締", "取缔", "操纵", "操縱", "系统", "體系", "体系", "操控", "欺負", "欺凌", "欺负", "領導", "领导", "主導", "主导", "领袖", "領袖", "馴化", "驯化", "血统", "血統", "憤慨", "忠诚", "忠誠", "忠贞", "忠貞", "贡献", "貢獻", "效忠", "投票", "表决", "公投", "宣誓", "請願", "崩潰", "崩溃", "打倒", "治安", "公安", "禮儀", "礼仪", "否決", "否决", "惡搞", "獻花", "暗访", "暗杀", "罢教", "罢课", "罢市", "百姓", "败类", "绑架", "爆炸", "被捕", "变态", "标语", "兵变", "冰毒", "部队", "部委", "采访", "惨案", "藏獨", "藏独", "藏文", "藏语", "草根", "铲除", "常委", "倡议", "城管", "澄清", "冲突", "抽插", "出卖", "出台", "出租", "传销", "打炮", "打砸", "代理", "弹劾", "荡妇", "倒台", "祷告", "悼念", "登基", "地震", "颠覆", "调查", "调教", "定性", "动乱", "动态", "毒杀", "对付", "对峙", "多維", "多维", "多黨", "夺权", "恶搞", "二奶", "法会", "法轮", "法輪", "法治", "翻牆", "翻墙", "放纵", "分裂", "愤青", "封杀", "富婆", "讣告", "妇联", "改朝", "肛交", "蛤蟆", "公诉", "广场", "龟公", "海外", "汉奸", "号召", "合法", "护法", "怀念", "皇储", "基督", "激情", "鸡奸", "集合", "集会", "集结", "集体", "计划", "纪念", "纪委", "加油", "驾崩", "奸污", "贱货", "交警", "揭秘", "禁食", "精液", "精英", "决策", "绝食", "军妓", "开苞", "开枪", "开斋", "抗议", "空难", "空難", "口号", "口交", "口號", "酷刑", "垮台", "蜡烛", "雷管", "冷战", "联署", "领馆", "流氓", "聲援", "露点", "律师", "乱伦", "轮奸", "沦陷", "论功", "论坛", "裸露", "裸照", "吗啡", "缅怀", "明天", "墓碑", "呐喊", "纳粹", "奴役", "陪酒", "彭博", "评论", "破鞋", "曝光", "谴责", "强奸", "清朝", "清明", "情妇", "情色", "群交", "热血", "儒教", "乳交", "瑞典", "骚货", "骚乱", "色狼", "色情", "色欲", "煽动", "上台", "少妇", "射精", "社论", "呻吟", "审查", "审核", "审理", "审判", "蕩婦", "圣战", "使馆", "收盘", "吮吸", "號召", "台獨", "台独", "台湾", "贪官", "谈判", "坦克", "讨伐", "特警", "特务", "统独", "统战", "推翻", "推特", "吞精", "脱光", "外挂", "外泄", "晚会", "汪洋", "维权", "维稳", "味精", "文凭", "喜讯", "洗牌", "下台", "下体", "下體", "献花", "宪法", "宪章", "宪政", "香港", "消魂", "消息", "邪恶", "邪教", "邪灵", "泄密", "信访", "行动", "性交", "性欲", "胸推", "胸罩", "血案", "血战", "讯息", "颜射", "艳舞", "异议", "阴部", "阴蒂", "阴户", "阴精", "阴谋", "游行", "诱惑", "冤案", "元老", "杂种", "早泄", "論功", "炸弹", "炸藥", "炸药", "真相", "震撼", "挣扎", "正念", "政策", "政权", "政协", "证词", "支持", "珠江", "烛光", "變態", "抓捕", "转化", "走光", "走私", "昨天", "作秀", "茉莉", "鎮壓", "陰蒂", "陰莖", "收费", "阳萎", "網址", "脫光", "鸡婆", "无码", "吸毒", "赌博", "艳照", "全活", "正法", "性伴", "煽情", "偷情", "猎枪", "零售", "治愈", "精准", "口爆", "咕噜", "聚会", "宇宙", "駐港", "罷教", "罷課", "罷市", "导弹", "炮弹", "蔡锷", "李鹏", "纽时", "双开", "双规", "上证", "政变", "叶城", "阿坝", "博讯", "韩正", "喀什", "军委", "胡佳", "江青", "吴仪", "郭泉", "紫阳", "上访", "妈的", "喇嘛", "革命", "光復", "送中", "港獨", "林鄭", "榮光", "元朗", "警暴", "國安", "之鋒", "催淚", "示威", "白紙", "武肺", "文亮", "蘋果", "智英", "安生", "柱銘", "自決", "巨流", "恐襲", "威脅", "勾結", "維護", "安全", "顛覆", "政權", "恐怖", "境外", "規定", "管轄", "懲治", "組織", "犯罪", "保障", "權益", "依法", "保護", "定罪", "被告", "擁護", "媒體", "宣傳", "意識", "負責", "保安", "研判", "規劃", "協調", "干涉", "秘密", "任務", "審查", "核准", "策劃", "破壞", "分離", "徒刑", "拘役", "煽動", "教唆", "干擾", "阻撓", "攻擊", "實現", "主張", "放毒", "放射", "傳染", "公私", "宣揚", "主義", "影響", "指使", "支援", "憎恨", "投案", "如實", "查證", "偵破", "出境", "偵查", "保釋", "公訴", "相信", "搜查", "細則", "上訴", "外交", "檢察", "作證", "妨礙", "保密", "脅迫", "危害", "刺探", "串謀"];

if (typeof module != 'undefined') module.exports = Autochar;
