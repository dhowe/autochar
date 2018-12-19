## only run on server
exit
cd ~/git/Automachar
git stash && git pull
rsync -avz --exclude '*.zip' --exclude '.git' ./ /var/www/html/autochar/
