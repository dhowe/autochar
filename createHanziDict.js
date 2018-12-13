const DICT = "data/dictionary.txt";
const STROKES = "data/graphics.txt";
const OUTPUT = "chardata.json";
const INDENT = false;
const MEDIANS = false;

var fs = require("fs"), chars = {}, nulls = [];
parseDict(fs.readFileSync(DICT, 'utf8').split('\n'));
parseStrokes(fs.readFileSync(STROKES, 'utf8').split('\n'));
var json = INDENT ? JSON.stringify(chars, null, 2) : JSON.stringify(chars);
fs.writeFileSync(OUTPUT, json);
console.log("Wrote JSON to " + OUTPUT);

////////////////////////////////////////////////////////////////////////////////

function parseDict(lines) {
  function addData(chars, data) {
    for (var i = 0; i < data.matches.length; i++) {
      if (!data.matches[i]) {
        //console.log('SKIP: Null match data for '+data.character);
        nulls.push(data.character);
        return false;
      }
    }
    chars[data.character] = {
      matches: data.matches,
      character: data.character,
      decomposition: data.decomposition
    };
    return true;
  }
  var uniques = {};

  lines.forEach(line => {
    if (line) {
      var data = JSON.parse(line);
      var dcom = data.decomposition;

      // store unique top-level decomps
      if (dcom[0] != '？') uniques[dcom[0]] = 1;

      if (dcom.length == 3) {
        // single left/right or top/bottom pair
        if (dcom[0] === '⿰' || dcom[0] === '⿱') {
          //console.log(data.character);//+": '"+data)
          addData(chars, data);
        }
      }
    }
  });

  console.log("Processed " + Object.keys(chars).length + " characters ("+nulls.length + " bad matches)");
  console.log("Found  " + Object.keys(uniques));
}

function parseStrokes(lines, saveAsJSON) {

  lines.forEach(line => {
    if (line) {
      var data = JSON.parse(line);
      if (chars.hasOwnProperty(data.character)) {
        if (chars[data.character].hasOwnProperty('strokes'))
          console.error("Dup. stroke data for: " + data.character);
        chars[data.character].strokes = data.strokes;
        if (MEDIANS) chars[data.character].medians = data.medians;
      }
    }
  });
  console.log("Processed " + Object.keys(chars).length + " stroke paths");

}
