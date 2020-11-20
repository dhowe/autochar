#!/bin/sh

set -e

# Input: data/dictionary.txt, data/graphics.txt
# Output: chardata.json 
#         with strokes/matches/decomps for each char 
node createHanziDict.js "$@" 

# Input: chardata.json, data/cc_cedict.json,  
# Output: words_simp.json/words_simp.json  
#         with 2-char words and definitions
node createWordList.js simplified "$@"
node createWordList.js traditional "$@"

# Input: data/words_simp.json, data/words_trad.json, 
#        data/char_defs.json, data/triggers.json
# Output: definitions.json  { simp, trad, chars, triggers}
#         with definitions for simp/trad/chars
#         and also trigger pairs
node createDataFiles.js "$@" 
