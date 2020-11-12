

// NEXT:
//   FIX BUG: Uncaught TypeError: Cannot read property 'parts' of undefined 
              // (happens on words with same for both lang?)
//   FIX PREMATURE LANGUAGE SWAP ON TRIGGER
//   FINISH RED FADING 
//   buzz ???
//   ? handle long-loops (more indeterminism)

function preload() {

  bell = new Tone.Player("res/chime.wav").toMaster();
  strk = new Tone.Player("res/strk.wav").toMaster();
  triggers = loadJSON('triggers.json');
  chars = loadJSON('chardata.json');
  defs = loadJSON('definitions.json');
  $('#about').modal({
    escapeClose: false,
    clickClose: false,
    showClose: false
  }); // disable auto close
}

function setup() {

  frameRate(30);
  textFont('Georgia');
  cnv = createCanvas(800, 600)
  noLoop();  // don't start yet
}

function unpause() {
  paused = false;
  next();
}

function draw() {

  if (!initalResize) {
    initalResize = true;
    updateSize();
    repairCanvas();
    window.onresize = updateSize;
    host = window.location.hostname;
    util = new CharUtils(chars, defs, Levenshtein);
    typer = new Autochar(triggers, util, onAction, onNewTarget);
    return next();
  }

  if (paused) {
    //console.log("paused");
    return;
  }

  adjustColor();
  background(rgb[0], rgb[1], rgb[2]);
  drawWord(typer.word);
  showDefs && drawDefs();
  doPerf && logPerf();
  showNav && drawNav();

  if (pausePending) {
    paused = true;
    let triggered = (pausePending === TRIGGER_PAUSE);
    //console.log('triggered: ' + triggered);
    clearTimeout(tid);
    tid = setTimeout(unpause, pausePending);
    pausePending = 0;
  }
}

function onNewTarget(nextWord, med, numStrokes) {

  //triggered = isTrigger;
  strokeIdx = 0;
  strokeCount = numStrokes;
  let nSpeed = min(1, numStrokes / 12);
  strokeDelay = map(nSpeed, 0, 1, strokeDelayMax, strokeDelayMin);
  changeMs = strokeDelay * (strokeCount - 1);
  changeTs = millis();
  timer = changeMs;

  //console.log(numStrokes + " strokes over " + changeMs + "ms strokeDelay=" + strokeDelay);

  let chars = nextWord.characters;
  console.log((typer.steps) + ') ' + (lastWord || "''") + " -> "
    + nextWord.literal, med + util.lang.substring(0, 1), "'" + nextWord.definition
    + "' (" + chars[0].definition + ' :: ' + chars[1].definition + ') ');// + millis());
}

function onAction(completedWord, nextWord, nextWordIsTrigger) {

  0 && console.log((strokeIdx + 1) + "/" + strokeCount + " "
    + (completedWord ? completedWord.literal : typer.target.literal)
    + " " + (timer / changeMs));
  //+ " " + round(((millis() - changeTs) / changeMs) * 100) + "%");

  //console.log('onAction', nextWordIsTrigger);
  if (completedWord) { // word complete

    if (nextWordIsTrigger) console.log('[TRIGGER] "'
      + nextWord.literal + "'" + nextWord.definition + "'");

    pausePending = triggered ? TRIGGER_PAUSE : NON_TRIGGER_PAUSE;
    defAlpha = 0;
    flashColors();
    playStroke(true);
    playBell();
    triggered = nextWordIsTrigger;
    lastWord = completedWord.literal;
    //triggered = false;
  }
  else {         // just a stroke
    playStroke();
  }
  strokeIdx++;
  /*   console.log('onAction: stroke' + (nextWord ? 0 : (strokeCount
       - strokeIdx)), Math.round((timer / changeMs) * 100) / 100); */
}

function drawDefs() {

  let def = typer.word.definition || '';
  let textSz = defSz * (util.lang === "trad" ? 1 : .8);

  // TODO: refigure (few strokes, words don't come all the way in)
  //let defAlpha = map(timer, 1, 0, 0, 255);

  let defAlpha = (timer / changeMs < .8) ? 
      map(timer / changeMs, .8, 0, 0, 255) : 0;
   
  textSize(textSz);
  textAlign(CENTER);
  fill(txtcol[0], txtcol[1], txtcol[2], defAlpha);

  // uppercase if simplified Chinese
  text(util.lang === "trad" ? def :
    def.toUpperCase(), width / 2, 2.4 * defSz);

  if (charDefs) {
    let def0 = typer.word.characters[0].definition;
    let def1 = typer.word.characters[1].definition;
    textSize(textSz * .5);
    fill(txtcol[0], txtcol[1], txtcol[2]); // draw char-defs at full alpha
    text(util.lang === "trad" ? def0 : def0.toUpperCase(), width * .25, height - 2 * defSz);
    text(util.lang === "trad" ? def1 : def1.toUpperCase(), width * .75, height - 2 * defSz);
  }

  timer = changeMs - (millis() - changeTs);
}

function next() {
  tid = setTimeout(next, typer.step() ? strokeDelay : strokeDelay / 40);
}

function mouseClicked() {
  if ($('#p5_loading').length > 0) return;

  if ($('#about').is(':visible')) {
    $.modal.close();
  } else if (showNav && mouseX < 40 && mouseY < 40) {
    $('#about').modal();
  }
  if (firstRun) {
    loop(); // run sketch
    doSound = true;
    firstRun = false;
    $('#about').removeClass("beforeLoaded");
    $('#startButton').hide();
    $.modal.close();
  }
}

function toggleMute(event) {
  if (typeof event === 'boolean') {
    doSound = event ? 0 : 1;
  }
  else {
    doSound = doSound == 0 ? 1 : 0;
  }
  document.getElementById("mute").innerText =
    doSound == 0 ? 'unmute' : ' mute ';
}

function flashColors() {
  for (let i = 0; i < rgb.length; i++) {
    rgb[i] = triggered ? trgcol[i] : hitcol[i];
    txtcol[i] = 255;
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
    strk.restart(undefined, 0, random(.05, .1));
  }
}

function keyReleased() {

  // no key commands on live site
  //if (host === 'rednoise.org') return;

  if (key == ' ') {
    if (tid) {
      clearTimeout(tid);
      tid = 0;
    }
    else {
      next();
    }
  }
  if (key == 'D') {
    showDefs = !showDefs;
    charDefs = !charDefs;
  }

  if (key == 'T') {
    console.log('Manual trigger');
    util.toggleLang();
    triggered = true;
    flashColors();
    playStroke(true);
    playBell();
    //triggered = false;
  }
}


function drawWord(word, complete) {

  // draw each character
  let ctx = this._renderer.drawingContext;
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
        if (complete || chr.parts[j] >= i) {
          ctx.scale(scayl, scayl);
          ctx.lineWidth = 5;
          ctx.fill(chr.paths[j][i]);
          ctx.stroke(chr.paths[j][i]);
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

  // retina/ high dpi
  if (isRetina()) {
    sw = sw * window.devicePixelRatio;
    sh = sh * window.devicePixelRatio;
  }

  // strange constants
  defSz = sh / 18;
  scayl = sw / 1150;

  // resize/position canvas
  resizeCanvas(sw, sh, true);

  cnv.position(xo, yo);
  //console.log(w + 'x' + h + ' -> ' + sw + 'x' + sh + ' scale=' + scayl);
}

function isRetina() {
  let mq = window.matchMedia(RETINA_CHECK);
  return mq && mq.matches || window.devicePixelRatio > 1;
}

// fixes a bug in p5.resizeCanvas
function repairCanvas() {

  // first hide the html nav button (use the p5 one)
  let canvas = document.getElementsByTagName('canvas')[0];
  canvas.width = sw;
  canvas.height = sh;
  pixelDensity(1);
  if (isRetina()) {
    // display at original width for retina
    $('#defaultCanvas0').css("width", sw / window.devicePixelRatio + "px");
    $('#defaultCanvas0').css("height", sh / window.devicePixelRatio + "px");
  }
}

function adjustColor() {
  for (let i = 0; i < rgb.length; i++) {
    if (rgb[i] != bgcol[i]) rgb[i] = lerp(rgb[i], bgcol[i], lerpFactor);
    if (txtcol[i] > 0) txtcol[i] = lerp(txtcol[i], 0, lerpFactor);
    //if (txtcol[i] > 0) txtcol[i] -= 10;
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

  if (performance && performance.memory && typer.steps - memt >= 20) {
    console.log('Perf: ' + round(frameRate()) + ' fps, ' +
      round(performance.memory.usedJSHeapSize / 1000000) +
      '/' + round(performance.memory.jsHeapSizeLimit / 1000000) + ' MB heap');
    memt = typer.steps;
  }
}

let paused = false, pausePending = false;
let doSound = false, doPerf = true, showDefs = true;
let charDefs = true, showNav = true;

let cnv, sw, sh, xo, yo, defSz, w, h, chars, defs;
let bell, conf, lastWord, tid, strk, util, typer;
let timer = 0, strokeCount = 0, firstRun = true;
let scayl = 1, aspectW = 4.3, aspectH = 3;

let defAlpha = 255, strokeIdx = 0, changeMs, changeTs;
let strokeDelay, strokeDelayMax = 1300, strokeDelayMin = 300;
let triggered = 0, navOpen = false, host;
let initalResize = false, border = 10, memt = -15;
let lerpFactor = 0.05;

let bgcol = [255, 255, 255];
let hitcol = [76, 87, 96];
let txtcol = [0, 0, 0];
let trgcol = [150, 0, 0];
let rgb = [0, 0, 0];

const TRIGGER_PAUSE = 2000, NON_TRIGGER_PAUSE = 500;
const RETINA_CHECK = 'only screen and (min--moz-device-pixel-ratio: 1.3), only screen and (-o-min-device-pixel-ratio: 2.6/2), only screen and (-webkit-min-device-pixel-ratio: 1.3), only screen  and (min-device-pixel-ratio: 1.3), only screen and (min-resolution: 1.3dppx)");'
