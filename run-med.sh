#!/bin/bash
node --max-old-space-size=16384 writeAllMeds.js 3 -f 2>&1 | tee log.txt
#ctrl-z, bg, disown
