npm install

if [ ! -d `pwd`/config/serverconfig.js ]; then
  cp `pwd`/config/serverconfig.sample.js `pwd`/config/serverconfig.js
fi
