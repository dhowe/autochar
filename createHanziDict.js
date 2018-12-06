const DICT = "data/dictionary.txt";
const STROKES = "data/graphics.txt";
const OUTPUT = "chardata.json";

var fs = require("fs"), chars = {};
parseDict(fs.readFileSync(DICT, 'utf8').split('\n'));
parseStrokes(fs.readFileSync(STROKES, 'utf8').split('\n'));
var json = JSON.stringify(chars, null, 2);
fs.writeFileSync(OUTPUT, json);
console.log("Wrote JSON to "+OUTPUT);


////////////////////////////////////////////////////////////////////////////////

function parseDict(lines) {

  function addData(chars, data) {
    chars[data.character] = {
      matches: data.matches,
      character: data.character,
      decomposition: data.decomposition
    };
  }
  var count = 0, uniques = {};

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
          count++;
        }
      }
    }
  });

  console.log("Processed "+count+" characters");
  console.log("Found  "+Object.keys(uniques));
}

function parseStrokes(lines, saveAsJSON) {

  var count = 0;
  lines.forEach(line => {
    if (line) {
      var data = JSON.parse(line);
      if (chars.hasOwnProperty(data.character)) {
          if (chars[data.character].hasOwnProperty('strokes'))
            console.error("Dup. stroke data for: "+data.character);
          chars[data.character].strokes = data.strokes;
          count++;
      }
    }
  });
  console.log("Processed "+count+" paths");
}
