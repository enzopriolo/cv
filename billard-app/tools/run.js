const { chromium } = require('playwright');
const fs = require('fs');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  page.on('pageerror', e => console.log('ERR', String(e)));
  await page.goto('file://' + __dirname + '/base.html');
  await page.waitForFunction(() => typeof runSim === 'function');
  await page.addScriptTag({path: __dirname + '/lib.js'});
  await page.addScriptTag({path: __dirname + '/topics.js'});
  const topics = (process.argv[2] || '0,1,2,3,4,5').split(',').map(Number);
  for (const t of topics) {
    const t0 = Date.now();
    const lv = await page.evaluate(t => makeTopic(t), t);
    fs.writeFileSync(__dirname + '/topic' + t + '.json', JSON.stringify(lv));
    console.log('topic', t, 'levels', lv.length, ((Date.now() - t0) / 1000).toFixed(0) + 's');
  }
  await browser.close();
})();
