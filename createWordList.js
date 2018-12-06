const CCDICT = "data/cc-cedict.json";
const HANZI = "chardata.json";


var fs = require("fs");
var entries = JSON.parse(fs.readFileSync(CCDICT, 'utf8'));
var lookup = JSON.parse(fs.readFileSync(HANZI, 'utf8'));
var type = 'simplified';//'traditional'
var output = 'words-'+type.substring(0,4)+'.json';
//var lookup = parseHanzi(HANZI);

var words = {};
for (var i = 0; i < entries.length;i++) {
  var e = entries[i][type];

  // is it a 2-length word with both parts in the hanzi data?
  if (e.length == 2 && doLookup(lookup, e)) {
    if (entries[i].hasOwnProperty('definitions')) {
      words[e] = entries[i].definitions[0];
    }
      //words[e] = entries[i].hasOwnProperty('definitions') ? entries[i].definitions[0] : "";
    //console.log(words[e]);
  }
  //if (i>=1020) break;
}

console.log("Found "+Object.keys(words).length+" words, writing...");

var json = JSON.stringify(words, null, 2);
fs.writeFileSync(output, json);

console.log("Wrote JSON to "+output);


//////////////////////////////////////////////////////////////////////

function doLookup(data, e) {
  for (var i = 0; i < e.length; i++) {
    if (!data.hasOwnProperty(e[i])) return false;
  }
  return true;
}

function parseHanzi(dict) {
  var hanzi = JSON.parse(fs.readFileSync(dict, 'utf8'));
  console.log(lines.length+" lines");
  var chars = {};
  lines.forEach(line => {
    if (!line) return;
    var data = JSON.parse(line);
    var dcom = data.decomposition;
    if (data.decomposition.length==3) {
      chars[data.character] = 1;
    }
  });

  return chars;
}
