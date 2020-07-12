// to run: $ node scripts/create-data-files

const fs = require('fs');
const simp = require('../data/words-simp-orig.json');
const trad = require('../data/words-trad-orig.json');
const cdefs = require('../data/char-defs-orig.json');
const cdata = require('../data/char-data-orig.json');
const triggers = require('../data/trigger-defs.json');
const regex = /\([^)]*[^A-Za-z ,-.')(]+[^)]*\)/g;

const maxWordDefLen = 42, maxCharDefLen = 30;
const wordData = { simp, trad }

function compileWordDict(dict) {

  let misses = {};
  Object.keys(wordData).forEach(lang => {
    let data = wordData[lang];
    misses[lang] = {};
    Object.keys(data).forEach(w => {
      if (w.length === 2) {
        let def = data[w];
        if (validateWordDef(w, def)) {
          dict[lang][w] = def.replace(/ +/g, ' ').replace(/ ,/g, ',');
        }
        else {
          misses[lang][w] = def;
        }
      }
    });
    console.log(lang + '-words: ' + Object.keys(dict[lang]).length
      + ' word defs, ' + Object.keys(misses[lang]).length + ' misses');
  });
}

function addCharDefs(dict) {
  let stats = { fixed: 0 };
  Object.keys(dict).forEach(lang => {
    if (lang === 'chars') return;
    let data = dict[lang];
    Object.keys(data).forEach(w => {
      if (w.length !== 2) throw Error('bad length for ' + w);
      for (let i = 0; i < w.length; i++) {
        const ch = w[i];
        if (!dict.chars[ch]) {
          dict.chars[ch] = validateCharDef(ch, stats);
        }
      }
    });
    console.log(lang + '-chars: ' + Object.keys(dict.chars).length
      + ' char defs, ' + stats.fixed + ' fixes');
  });
  return dict;
}

function validateCharDef(w, stats) {

  if (w.length !== 1) throw Error('Bad char: ' + w);

  let def = cdefs[w];
  if (def.length > maxCharDefLen) {
    stats.fixed++;
    let tmp = def;
    let parts = def.split(';');
    if (parts.length > 1) {
      def = parts.reduce((acc, val) =>
        (acc.length + val.length < maxCharDefLen) ? acc + ';' + val : acc);
      //console.log(w, tmp + '\n  ->1 ' + cdefs[w]);
    }
    else if (def.length > maxCharDefLen + 5) {
      def = def.substring(0, 30) + '...';
      //console.log(w, tmp + '\n  ->2 ' + cdefs[w]);
    }
  }

  if (regex.test(def)) {
    stats.fixed++;
    let tmp = def;
    def = def.replace(regex, '');
    //console.log(w, tmp + '\n  ->3 ' + cdefs[w]);
  }

  return def.replace(/ +/g, ' ');
}

function validateWordDef(w, def) {
  if (!cdefs[w[0]] || !cdefs[w[1]]) return false;
  if (!def
    || def.length > maxWordDefLen
    || def.startsWith("-")
    || def.startsWith('see ')
    || def.includes('variant of')
    || !/^[A-Za-z ',.()é0-9-]+$/.test(def)) {
    return false;
  }
  return true;
}

function prunePathData(dict) {
  let pruned = {}, cdl = Object.keys(cdata).length;
  Object.keys(cdata).forEach(c => dict.chars[c] && (pruned[c] = cdata[c]));
  let num = (Object.keys(cdata).length - Object.keys(pruned).length);
  console.log('paths: ' + Object.keys(pruned).length + '/' + cdl + ' char entries, ' + num + ' pruned');
  return pruned;
}

function updateTriggersDefs(dict) {
  
  let idx = 0, misses = 0;
  Object.keys(triggers).forEach(t => {
    if (dict.trad[t]) dict.trad[t] = triggers[t];
    else if (dict.simp[t]) dict.simp[t] = triggers[t];
/*     else {
      //throw Error
      if (cdata[t[0]] && cdata[t[1]]) {
        console.log('"' + t + '": "' + triggers[t]+'",');
      }
      else {
        console.log(++misses, '"' + t + '": "' + triggers[t] + '",');
      }
    } */
  });
  console.log('updated ' + Object.keys(triggers).length + ' trigger defs');
}

/* function appendTriggers(dict) {
  let result = [], log = false, data = {};
  Object.keys(triggers).forEach(t => {
    if (dict.trad[t]) {
      // modify the definition?
      log && console.log(t + '\t' + trad[t] + (triggers[t] ? ' OR ' + triggers[t] : ''), '[trad]');
      result.push(t)
      data[t] = { def: trad[t] + (triggers[t] && trad[t].toLowerCase() !== triggers[t].toLowerCase() ? ' OR ' + triggers[t] : ''), lang: 'trad' }
    }
    else if (dict.simp[t]) {
      // modify the definition?
      log && console.log(t + '\t' + simp[t] + (triggers[t] ? ' OR ' + triggers[t] : ''), '[simp]');
      data[t] = { def: simp[t] + (triggers[t] && simp[t].toLowerCase() !== triggers[t].toLowerCase() ? ' OR ' + triggers[t] : ''), lang: 'simp' }
      result.push(t);
    }
    else {
      // def doesn't exist, but chars do
      if (cdata[t[0]] && cdata[t[1]]) {

          if (triggers[t]) {
            dict[trad][t] = triggers[t];
            dict[simp][t] = triggers[t];
          } 

        // so lets add to both dictionaries (?)
        log && console.log(t + '\t' + (triggers[t] || '???'), '[simp/trad]');
        //data[t] = { def: (triggers[t] || '???'), lang: 'simp/trad' }
        result.push(t);
      }
    }
  });
  return data;
} */

function writeCharData(defs) {
  let paths = prunePathData(defs);
  let name = 'chardata.json';
  console.log('writing ' + Object.keys(paths).length + ' char-paths to \'' + name + '\'');
  fs.writeFileSync(name, JSON.stringify(paths));
}

function writeDefinitions(defs) {
  let name = 'definitions.json';
  console.log('writing ' + Object.keys(defs.simp).length + '/'
    + Object.keys(defs.trad).length + ' word-defs to \'' + name + '\'');
  fs.writeFileSync(name, JSON.stringify(defs));
}

const defs = { simp: {}, trad: {}, chars: {} };
compileWordDict(defs);
updateTriggersDefs(defs);
addCharDefs(defs);
writeDefinitions(defs);
writeCharData(defs);

console.log('\nconst WORD_TRIGGERS =', JSON.stringify(Object.keys(triggers)), ';\n');

/*
let trigDefs = {}, misses = 0;
const WORD_TRIGGERS = ['臉書', '脸书', '經濟', '经济', '萬歲', '万岁', '對抗', '对抗', '共产', '共產', '本土', '本地', '資本', '资本', '政治', '人民', '微博', '教会', '教會', '天主', '教徒', '发展', '發展', '信徒', '宗教', '文化', '和諧', '河蟹', '和谐', '專政', '封閉', '運動', '专政', '封闭', '>运动', '回教', '新疆', '宗教', '伦理', '倫理', '道德', '公德', '诚实', '誠實', '公平', '公正', '持平', '正義', '野蛮', '野蠻', '粗暴', '未來', '好处', '好處', '利益', '接任', '接替', '继承', '繼承', '皇帝', '傳教', '传教', '传道', '傳道', '新闻', '新聞', '主席', '年輕', '回歸', '回归', '放棄', '触发', '觸發', '抵制', '挑撥', '挑拨', '杯葛', '領土', '领土', '过敏', '過敏', '敏感', '市場', '占领', '佔領', '雨傘', '雨伞', '利润', '盈利', '領域', '领域', '边界', '邊界', '边境', '邊境', '极限', '極限', '穩定', '稳定', '繁榮', '繁荣', '文明', '发达', '發達', '干預', '干预', '內政', '罢工', '罷工', '無產', '階級', '無產', '階級', '暴君', '统治', '統治', '歷史', '历史', '自由', '自主', '言論', '言论', '示威', '隱私', '私隱', '隐私', '私隐', '取締', '取缔', '管制', '操纵', '操縱', '制度', '系统', '體系', '体系', '体制', '操控', '體制', '問題', '问题', '不安', '害怕', '畏惧', '畏懼', '欺負', '欺凌', '欺负', '領導', '领导', '主導', '主导', '领袖', '領袖', '抑制', '馴化', '驯化', '族裔', '血统', '血統', '關係', '关系', '懷疑', '怀疑', '疑心', '疑虑', '疑慮', '身分', '身份', '釘子', '危害', '憤慨', '憤慨', '忠诚', '忠誠', '忠贞', '忠貞', '贡献', '貢獻', '效忠', '諾言', '诺言', '承诺', '承諾', '收縮', '收缩', '選舉', '选举', '推选', '推選', '提名', '投票', '表决', '票选', '票選', '公投', '參選', '参选', '立誓', '宣誓', '應諾', '应诺', '屈服', '降服', '归顺', '歸順', '服從', '服从', '請願', '请愿', '腐敗', '腐败', '钳制', '箝制', '崩潰', '崩溃', '瓦解', '倒塌', '崩塌', '打倒', '革命', '文革', '高鐵', '高铁', '治安', '公安', '尊重', '禮儀', '礼仪', '否決', '否决', "專政", "惡搞", "書記", "獻花", "暗访", "暗杀", "罢工", "罢教", "罢课", "罢市", "百姓", "败类", "绑架", "爆炸", "被捕", "崩溃", "笔会", "变态", "标语", "兵变", "冰毒", "部队", "部委", "采访", "惨案", "藏獨", "藏独", "藏文", "藏语", "草根", "铲除", "常委", "倡议", "城管", "澄清", "冲突", "抽插", "出卖", "出台", "出租", "传销", "打倒", "打炮", "打砸", "代理", "弹劾", "荡妇", "倒台", "祷告", "悼念", "登基", "地震", "颠覆", "调查", "调教", "定性", "动乱", "动态", "毒杀", "对付", "对峙", "多維", "多维", "多黨", "夺权", "恶搞", "二奶", "法会", "法轮", "法輪", "法治", "翻牆", "翻墙", "放纵", "分裂", "愤青", "封杀", "富婆", "讣告", "妇联", "改朝", "肛交", "蛤蟆", "公安", "公诉", "广场", "龟公", "海外", "汉奸", "号召", "和谐", "合法", "护法", "怀念", "皇储", "基督", "激情", "鸡奸", "集合", "集会", "集结", "集体", "计划", "纪念", "纪委", "加油", "驾崩", "奸污", "贱货", "江猪", "交警", "教会", "揭秘", "禁食", "精液", "精英", "决策", "绝食", "军妓", "开苞", "开枪", "开斋", "抗议", "空难", "空難", "口号", "口交", "口號", "酷刑", "垮台", "蜡烛", "雷管", "冷战", "联署", "领馆", "领袖", "流氓", "聲援", "露点", "律师", "乱伦", "轮奸", "沦陷", "论功", "论坛", "裸露", "裸照", "吗啡", "孟浪", "缅怀", "敏感", "明天", "墓碑", "呐喊", "纳粹", "奴役", "陪酒", "彭博", "评论", "破鞋", "曝光", "欺负", "谴责", "强奸", "清朝", "清明", "情妇", "情色", "群交", "热点", "热血", "儒教", "乳交", "瑞典", "骚货", "骚乱", "色狼", "色情", "色欲", "煽动", "上台", "少妇", "射精", "社论", "呻吟", "审查", "审核", "审理", "审判", "蕩婦", "圣战", "使馆", "收盘", "吮吸", "號召", "台獨", "台独", "台湾", "贪官", "谈判", "坦克", "讨伐", "特警", "特务", "统独", "统战", "统治", "推翻", "推特", "吞精", "脱光", "外挂", "外泄", "晚会", "汪洋", "维权", "维稳", "味精", "文凭", "喜讯", "洗牌", "系统", "下台", "下体", "下體", "献花", "宪法", "宪章", "宪政", "香港", "消魂", "消息", "邪恶", "邪教", "邪灵", "泄密", "信访", "行动", "性交", "性欲", "胸推", "胸罩", "血案", "血战", "讯息", "颜射", "艳舞", "异议", "阴部", "阴蒂", "阴户", "阴精", "阴谋", "隐私", "游行", "诱惑", "冤案", "元老", "杂种", "早泄", "論功", "炸弹", "炸藥", "炸药", "真相", "震撼", "挣扎", "正念", "政策", "政权", "政协", "政治", "证词", "支持", "珠江", "烛光", "變態", "抓捕", "转化", "走光", "走私", "昨天", "作秀", "茉莉", "鎮壓", "陰蒂", "陰莖", "收费", "阳萎", "網址", "脫光", "鸡婆", "无码", "吸毒", "溜冰", "赌博", "艳照", "全活", "正法", "性伴", "煽情", "偷情", "猎枪", "零售", "治愈", "精准", "口爆", "咕噜", "聚会", "宇宙", "駐港", "罷教", "罷課", "罷市", "罷工", "燭光", "繁星", "导弹", "仿真", "狗粮", "炮弹", "塑胶", "订购", "交换", "转让", "提供", "加工", "合成", "蔡锷", "李鹏", "纽时", "双开", "双规", "上证", "政变", "叶城", "阿坝", "博讯", "韩正", "喀什", "军委", "胡佳", "江青", "吴仪", "郭泉", "紫阳", "上访", "妈的", "喇嘛"];
WORD_TRIGGERS.forEach(t => {
  if (defs.trad[t]) {
    trigDefs[t] = defs.trad[t];
  }
  else if (defs.simp[t]) {
    trigDefs[t] = defs.simp[t];
  }
  else {
    misses++;
    //console.log('No def: '+t);
  }
});
//console.log(JSON.stringify(trigDefs,0,2));
console.log(JSON.stringify(Object.keys(trigDefs)));
console.log(misses + '/' + WORD_TRIGGERS.length+ ' misses');*/


//console.log('Triggers:\n', JSON.stringify(Object.keys(triggers)));