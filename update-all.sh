#!/bin/sh

ssh $SCM1 "cd /Library/WebServer/Documents/autochar && git pull"
ssh $SCM2 "cd /Library/WebServer/Documents/autochar && git pull"
ssh $SCM3 "cd /Library/WebServer/Documents/autochar && git pull"
ssh $SCM4 "cd /Library/WebServer/Documents/autochar && git pull"
ssh $SCM5 "cd /Library/WebServer/Documents/autochar && git pull"
ssh $SCM6 "cd /Library/WebServer/Documents/autochar && git pull"
