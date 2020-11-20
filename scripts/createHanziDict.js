////////////////////////////////////////////////////////////////////////////////
///// Generates chardata.json, with strokes/matches/decomps for each char  /////
////////////////////////////////////////////////////////////////////////////////

const DATA = "data/";
const OUT = DATA + "char_data.json";
const DICT = DATA + "dictionary.txt";
const STROKES = DATA + "graphics.txt";
const MEDIANS = false;

let args = process.argv.slice(2);
let indent = args.length && args[0] == '-i';
let fs = require("fs"), chars = {}, nulls = [];

parseDict(fs.readFileSync(DICT, 'utf8').split('\n'));
parseStrokes(fs.readFileSync(STROKES, 'utf8').split('\n'));

let json = indent ? JSON.stringify(chars, null, 2) : JSON.stringify(chars);
let out = indent ? OUT.replace(".json", "-hr.json") : OUT;
fs.writeFileSync(out, json);

console.log("Wrote JSON to " + out);

////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

function parseDict(lines) {
  function addData(chars, data) {
    for (let i = 0; i < data.matches.length; i++) {
      if (!data.matches[i]) {
        nulls.push(data.character); // null in matches data
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
  let uniques = {};
  let skips = [];

  lines.forEach(line => {
    if (line) {
      let data = JSON.parse(line);
      let dcom = data.decomposition;

      // store unique top-level decomps
      if (dcom[0] != '？') uniques[dcom[0]] = 1;

      if (dcom.length == 3) { // only valid decomps

        // accept only single left/right or top/bottom pair
        if (dcom[0] === '⿰' || dcom[0] === '⿱') {
          addData(chars, data);
        }
        else {
          skips[data.character] = dcom[0]; // incorrect decomp
        }
      }
      else {
        skips[data.character] = dcom.length; // invalid decomp
      }
    }
  });

  console.log("Found " + lines.length + " total entries");
  console.log("Decompositions: " + Object.keys(uniques));
  console.log("Including chars with either ⿰ or ⿱");
  console.log("Processed " + Object.keys(chars).length + " characters ("
    + nulls.length + " bad matches, " + Object.keys(skips).length + " invalid decomps)");
  console.log("Skipped", Object.keys(skips).length + nulls.length,
    "chars (either a null match or a bad decomp)");
}


function parseStrokes(lines) {

  lines.forEach(line => {
    if (line) {
      let data = JSON.parse(line);
      if (chars.hasOwnProperty(data.character)) {
        if (chars[data.character].hasOwnProperty('strokes'))
          console.error("Dup. stroke data for: " + data.character);
        chars[data.character].strokes = data.strokes;
        if (MEDIANS) chars[data.character].medians = data.medians;
      }
      else {
        //console.error("No stroke data for: " + data.character);
      }
    }
  });
  console.log("Processed " + Object.keys(chars).length + " stroke paths");
}
