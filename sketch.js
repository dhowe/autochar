
/**
 * TODO: Sally's changes
 *   1) def appears earlier, or fades in (in progress)
 *      NEXT: set countdown on flash, should hit 0 on next-flash
 *   2) pause after word-completion
 *   3) start next word with zero strokes after erasin (instead of 1)
 *   4) add single word defs below
 */

/* function preload() {
  if (doSound) {
    bell = new Tone.Player("res/chime.wav").toMaster();
    strk = new Tone.Player("res/strk.wav").toMaster();
  } */

/*   chars = loadJSON('chardata.json');
  cdefs = showCharDefs && loadJSON('char-defs.json');
  trad = loadJSON('words-trad.json');
  simp = loadJSON('words-simp.json'); 
//conf = loadJSON('config.json');
}*/

let jsonData = {};
function loaded(name, data) {
  jsonData[name] = data;
  if (Object.keys(jsonData).length === 4) loading = false;
}

function loadData() {
  loadJSON('char-data.json', function (d) { loaded('chars', d) });
  loadJSON('char-defs.json', d => loaded('cdefs', d));
  loadJSON('words-trad.json', d => loaded('trad', d));
  loadJSON('words-simp.json', d => loaded('simp', d));
}

function setup() {
  frameRate(30);
  cnv = createCanvas(800, 600);
  textFont('Georgia');
  loadData();
}

let loading = true;
function draw() {

  if (!initalResize) {
    initalResize = true;
    updateSize();
    repairCanvas();
    window.onresize = updateSize;
  }

  adjustColor();
  background(rgb[0], rgb[1], rgb[2]);

  if (loading) {
    textSize(defSz);
    textAlign(CENTER);
    let els = Array(1 + round(frameCount / 10) % 4).join(".");
    els = ''; // tmp
    text(els + ' loading ' + els, width / 2, height / 2);
    return;
  }
  else if (!util) {
    util = new CharUtils(jsonData, Levenshtein, showDefs);
    typer = new Autochar(util, onAction, onTarget);
    word = typer.word.literal;
    console.log("1) [ ] -> " + word);
    next();
    return;
  }
  
  drawWord(typer.word);
  showDefs && drawDefs();
  showMed && text(wmed, width - 12, 15);
  doPerf && logPerf();
  showNav && drawNav();
}

function drawDefs() {
  textSize(defSz);
  textAlign(CENTER);
  let defAlpha = (timer / changeMs < .8) ?
    map(timer / changeMs, .8, 0, 0, 255) : 0;
  let def = typer.word.definition || '';
  fill(txtcol[0], txtcol[1], txtcol[2], defAlpha);
  text(def.toUpperCase(), width / 2, 2.4 * defSz);
  if (showCharDefs) {
    textSize(defSz * .5);
    fill(txtcol[0], txtcol[1], txtcol[2]);
    text(typer.word.characters[0].definition.toUpperCase(), width * .25, height - 2 * defSz);
    text(typer.word.characters[1].definition.toUpperCase(), width * .75, height - 2 * defSz);
    timer = changeMs - (millis() - changeTs);
    0 && text(//Math.round(strokeDelay) + '/' +
      (strokeCount - strokeIdx) + '   ' +// - done + '  ' +
      Math.max(0, Math.round(timer / 100) / 10), width - 100, 2 * defSz);
  }
}


function drawWord(word) {
  let ctx = this._renderer.drawingContext;

  // draw each character
  for (let k = 0; k < word.characters.length; k++) {
    let chr = word.characters[k];

    // strange constants
    let xoff = k ? 20 * scayl + width : 140 * scayl;
    let yoff = -1220 * scayl;

    // draw each path of the character
    push();
    fill(txtcol);
    for (let j = 0; j < chr.paths.length; j++) {
      for (let i = 0; i < chr.paths[j].length; i++) {
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.scale(.5, -.5); // mirror-vertically 
        ctx.translate(xoff, yoff);
        if (chr.parts[j] >= i) {
          ctx.scale(scayl, scayl);
          ctx.fill(chr.paths[j][i]);
        }
      }
    }
    pop();
  }
}

// computes size and position of canvas after resize (xo, yo, sw, sh)
// and size of en-translation font (defSz) and scaling of characters (scayl)
function updateSize() {
  w = window.innerWidth;
  h = window.innerHeight;
  if (w * aspectH > h * aspectW) { // wider
    sh = Math.round(h - border * 2);
    sw = Math.round(sh * (aspectW / aspectH));
  } else {                        // taller
    sw = Math.round(w - border * 2);
    sh = Math.round(sw * (aspectH / aspectW));
  }
  xo = (w - sw) / 2;
  yo = (h - sh) / 2;

  // strange constants
  defSz = sh / 18;
  scayl = sw / 1150;

  // resize/position canvas
  resizeCanvas(sw, sh);
  cnv.position(xo, yo);

  console.log(w + 'x' + h + ' -> ' + sw + 'x' + sh + ' scale=' + scayl);
}

function onTarget(next, numStrokes, trigger) {
  //console.log('onTarget', millis());
  triggered = trigger;
  strokeCount = numStrokes;
  strokeIdx = 0;
  let nSpeed = min(1, numStrokes / 12);
  strokeDelay = map(nSpeed, 0, 1, 1000, 200);
  changeMs = strokeDelay * (strokeCount - 1);
  changeTs = millis();
  timer = changeMs;
}

let timer = 0, strokeCount = 0;
function onAction(nextWord, med) {
  if (nextWord) { // word complete
    defAlpha = 0;
    flashColors();
    playStroke(true);
    playBell();
    //console.log(nextWord);
    wmed = med + (util.language().startsWith('s') ? 's' : '');
    console.log(++steps + ') ' + word + " -> " + nextWord.literal,
      wmed, "'" + nextWord.definition + "'");
    word = nextWord.literal;
    triggered = false;
  }
  else {
    playStroke();
  }
  strokeIdx++;
  0 && console.log('onAction: stroke' +
    (nextWord ? 0 : (strokeCount - strokeIdx)),
    Math.round((timer / changeMs) * 100) / 100);//(strokeCount-done))));
}

function next() {
  if (typer.step()) {
    tid = setTimeout(next, strokeDelay); // drawing
  }
  else {
    next(); // erasing
  }
}

function mouseClicked() {
  if (showNav && mouseX < 40 && mouseY < 40) {
    $('#about').modal();
  }
  /*   if (tid) {
      noLoop();
      clearInterval(tid);
      tid = 0;
    }
    else {
      next();
      loop();
    } */
}

function toggleMute(event) {
  if (typeof event === 'boolean') {
    doSound = event ? 0 : 1;
  }
  else {
    doSound = doSound == 0 ? 1 : 0;
  }
  document.getElementById("mute").innerText = doSound == 0 ? 'unmute' : ' mute ';
}

function flashColors() {
  for (let i = 0; i < rgb.length; i++) {
    rgb[i] = triggered ? trgcol[i] : hitcol[i];
    txtcol[i] = whiteOnColor ? 0 : 255;
  }
}

function playBell() {
  if (doSound) {
    bell.playbackRate = random(.6, .9);
    bell.volume.value = random(.7, 1);
    bell.restart();
    if (triggered) {
      bell.playbackRate = random(.5, .7);
      bell.volume.value = 5;
      bell.start(200, 0, .1);
    }
  }
}

function playStroke(quiet) {
  if (doSound) {
    strk.playbackRate = random(.5, .7);
    strk.volume.value = quiet ? -24 : -12;
    strk.restart(undefined, 0, random(.05, .1)); //.05, 0.1));
  }
}

function keyReleased() {
  if (key == ' ') clearTimeout(tid);
  if (key == 't') {
    triggered = true;
    flashColors();
    playStroke(true);
    playBell();
  }
}

// fixes a bug in p5.resizeCanvas
function repairCanvas() {
  let canvas = document.getElementsByTagName('canvas')[0];
  canvas.width = sw;
  canvas.height = sh;
  pixelDensity(1);
}

function adjustColor() {
  if (!rgb) {
    rgb = [0, 0, 0];
    for (let i = 0; i < rgb.length; i++) {
      rgb[i] = bgcol[i];
    }
  }
  for (let i = 0; i < rgb.length; i++) {
    if (rgb[i] != bgcol[i]) rgb[i] = lerp(rgb[i], bgcol[i], .05);
    if (whiteOnColor && txtcol[i] < 255) txtcol[i] += 10;
    if (!whiteOnColor && txtcol[i] > -1) txtcol[i] -= 10;
  }
}

function drawNav() {
  fill(200);
  noStroke();
  for (let i = 0; i < 3; i++) {
    rect(12, 15 + i * 7, 20, 4);
  }
}

function logPerf() {
  if (performance && performance.memory && steps - memt >= 20) {
    console.log('Perf: ' + round(frameRate()) + ' fps, ' +
      round(performance.memory.usedJSHeapSize / 1000000) +
      '/' + round(performance.memory.jsHeapSizeLimit / 1000000) + ' MB heap');
    memt = steps;
  }
}

let doSound = false, doPerf = true, whiteOnColor = false, showMed = false;
let showDefs = true, showCharDefs = true, showNav = true;

let cnv, sw, sh, xo, yo, defSz, w, h;
let lang, bell, conf, word, tid, strk, util, typer;
let scayl = 1, aspectW = 4.3, aspectH = 3;

let defAlpha = 255, strokeIdx = 0, changeMs, changeTs;
let steps = 1, triggered = 0, wmed = '';
let strokeDelay = 300, memt = -15, navOpen = false;
let initalResize = false, border = 10;

let bgcol = [114, 175, 215]; // [137, 172, 198]
let hitcol = [76, 87, 96];
let txtcol = [0, 0, 0];
let trgcol = [150, 0, 0];
let rgb = [0, 0, 0];