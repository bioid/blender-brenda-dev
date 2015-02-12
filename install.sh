npm install
cp `pwd`/config/serverconfig.sample.js `pwd`/config/serverconfig.js
if [ ! -f `pwd`/server/projects.json ]; then
  echo "{}" > `pwd`/server/projects.json
fi
if [ ! -d `pwd`/db ]; then
  mkdir db
fi