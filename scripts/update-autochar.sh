## only run on server
exit
cd ~/git/autochar
git stash && git pull
rsync -avz --exclude '*.zip' --exclude '.git' ./ /var/www/html/autochar/
