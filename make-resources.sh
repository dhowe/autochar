#!/bin/sh

set -e

node createHanziDict.js && node createWordList.js
