const {chromium}=require('/usr/local/lib/node_modules/playwright-core');const fs=require('node:fs');const assert=require('node:assert/strict');
(async()=>{const base='http://web:3000';const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox','--disable-dev-shm-usage','--unsafely-treat-insecure-origin-as-secure=http://web:3000']});const results=[],errors=[],badResponses=[],external=[];
for(const [device,viewport] of [['desktop',{width:1440,height:1000}],['mobile',{width:390,height:844}],['narrow',{width:320,height:740}]]){
 const context=await browser.newContext({viewport,locale:'es-MX',deviceScaleFactor:1,reducedMotion:'reduce'});await context.addCookies([{name:'authjs.session-token',value:'fixture-mariana-session',url:base}]);const page=await context.newPage();
 page.on('pageerror',e=>errors.push({device,message:e.message}));page.on('response',r=>{if(r.status()>=400)badResponses.push({device,status:r.status(),url:r.url()})});page.on('request',r=>{if(!r.url().startsWith(base)&&!r.url().startsWith('data:')&&!r.url().startsWith('blob:'))external.push(r.url())});
 for(const [name,path] of [['explorar','/mercadito'],['mensajes','/mensajes'],['publicar','/publicar'],['mis-publicaciones','/mis-avisos'],['conversacion','/mensajes/cv-shirt'],['perfil','/perfil']]){
  const response=await page.goto(base+path,{waitUntil:'domcontentloaded'});await page.locator('main').waitFor({state:'visible'});await page.evaluate(()=>document.fonts.ready);await page.waitForTimeout(400);
  const state=await page.evaluate(()=>({heading:document.querySelector('h1')?.innerText,overflow:document.documentElement.scrollWidth>innerWidth,height:document.documentElement.scrollHeight,viewport:innerHeight,animations:document.getAnimations().filter(a=>a.playState==='running').length}));
  if(name==='conversacion'){
   const geometry=await page.evaluate(()=>({sendBottom:document.querySelector('.thread-send').getBoundingClientRect().bottom,navTop:document.querySelector('.app-navigation')?.getBoundingClientRect().top,viewport:innerHeight}));
   assert.ok(geometry.sendBottom<=(device==='desktop'?geometry.viewport:geometry.navTop),JSON.stringify(geometry));
  }
  if(device!=='narrow')await page.screenshot({path:`/out/${name}-${device}.png`,fullPage:true});results.push({device,name,status:response.status(),...state});console.log(JSON.stringify(results.at(-1)));
 }
 if(device==='mobile'){
  await page.goto(base+'/mercadito',{waitUntil:'domcontentloaded'});await page.getByRole('button',{name:'Buscar y filtrar',exact:true}).click();await page.locator('dialog[open]').waitFor();await page.screenshot({path:'/out/filtros-mobile.png',fullPage:true});await page.keyboard.press('Escape');
  await page.getByRole('button',{name:/Ver publicación:/}).first().click();await page.locator('dialog[open]').waitFor();await page.screenshot({path:'/out/ficha-mobile.png',fullPage:true});await page.keyboard.press('Escape');
 }
 await context.close();
}
assert.ok(results.every(r=>r.status===200&&!r.overflow&&r.animations===0));assert.equal(errors.length,0);assert.equal(badResponses.length,0);assert.equal(external.length,0);fs.writeFileSync('/out/visual.json',JSON.stringify({results,errors,badResponses,external},null,2));console.log(JSON.stringify({errors,badResponses,external}));await browser.close();})().catch(e=>{console.error(e.stack);process.exit(1)});
