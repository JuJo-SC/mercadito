const {chromium}=require('/usr/local/lib/node_modules/playwright-core');
const fs=require('node:fs'),assert=require('node:assert/strict');
(async()=>{
 const base='http://web:3000',browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox','--disable-dev-shm-usage']});
 const results=[],errors=[];
 for(const [device,viewport,motion] of [
  ['desktop',{width:1440,height:1000},'no-preference'],
  ['mobile',{width:390,height:844},'no-preference'],
  ['short',{width:390,height:560},'no-preference'],
  ['narrow',{width:320,height:740},'no-preference'],
  ['reduce',{width:390,height:640},'reduce'],
 ]){
  const context=await browser.newContext({viewport,locale:'es-MX',reducedMotion:motion});
  await context.addCookies([{name:'authjs.session-token',value:'fixture-mariana-session',url:base}]);
  const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
  await page.goto(base+'/mercadito',{waitUntil:'networkidle'});
  assert.equal(await page.locator('.product-card-disclosure').count(),0);
  await page.getByRole('button',{name:/Ver publicación: Calculadora/}).click();
  const dialog=page.locator('.listing-detail-dialog[open]');await dialog.waitFor();
  assert.equal(await dialog.locator('.listing-detail-price').textContent(),'$350.00');
  assert.equal(await dialog.locator('.listing-detail-condition').textContent(),'Buen estado');
  assert.equal(await dialog.locator('.listing-detail-facts').count(),0);
  assert.ok((await dialog.locator('time').textContent()).length<16);
  assert.equal(await dialog.locator('.notice-contact-form h3').count(),0);
  if(device==='desktop'||device==='mobile')await dialog.screenshot({path:'/out/detail-'+device+'-initial.png'});
  const scroll=dialog.locator('.listing-detail-scroll');
  const max=await scroll.evaluate(e=>e.scrollHeight-e.clientHeight);
  await scroll.evaluate(e=>e.scrollTop=148);await page.waitForTimeout(80);
  const photoWidth=await dialog.locator('.listing-detail-photo-button').evaluate(e=>e.getBoundingClientRect().width);
  const expected=device==='desktop'?null:motion==='reduce'?120:196-Math.min(148,max);
  if(expected!==null)assert.ok(Math.abs(photoWidth-expected)<2,JSON.stringify({device,max,photoWidth,expected}));
  if(device!=='desktop'&&motion!=='reduce'){
   const overlay=await dialog.evaluate(e=>{const p=e.querySelector('.listing-detail-photo-button').getBoundingClientRect(),m=e.querySelector('.listing-detail-mini-context');return {opacity:Number(getComputedStyle(m).opacity),right:p.right,left:m.getBoundingClientRect().left}});
   if(overlay.opacity>0)assert.ok(overlay.right+8<=overlay.left,'The compact title must not overlap the photo');
  }
  const overflow=await dialog.evaluate(e=>e.scrollWidth>e.clientWidth);
  assert.equal(overflow,false,device);
  if(device==='short')assert.ok(Math.abs(photoWidth-48)<2,'Full collapse reaches a 48px photo');
  if(device==='short')await dialog.screenshot({path:'/out/detail-mobile-collapsed.png'});
  await dialog.getByRole('button',{name:'Ampliar foto del producto',exact:true}).click();
  await page.locator('.listing-photo-lightbox[open]').waitFor();
  await page.keyboard.press('Escape');assert.equal(await page.locator('.listing-photo-lightbox[open]').count(),0);
  assert.equal(await dialog.count(),1,'Escape closes only the enlarged photo');
  await scroll.evaluate(e=>e.scrollTop=0);await page.waitForTimeout(80);
  const restored=await dialog.locator('.listing-detail-photo-button').evaluate(e=>e.getBoundingClientRect().width);
  if(device!=='desktop')assert.ok(Math.abs(restored-(motion==='reduce'?120:196))<2);
  await dialog.locator('.listing-detail-more summary').click();
  assert.equal(await dialog.locator('.listing-detail-more').evaluate(e=>e.open),true);
  const input=dialog.getByRole('textbox',{name:'Escribir a Carlos M.'});await input.fill('Hola');await input.press('Shift+Enter');await input.pressSequentially('Me interesa.');assert.ok((await input.inputValue()).includes('\n'));
  await dialog.getByRole('button',{name:'Cerrar detalles',exact:true}).click();await page.waitForTimeout(50);
  assert.equal(await page.locator('.listing-detail-dialog').count(),0);
  await page.getByRole('button',{name:/Ver publicación: Sudadera/}).click();await dialog.waitFor();
  await dialog.getByRole('button',{name:'Ver foto siguiente',exact:true}).click();
  assert.match(await dialog.locator('.listing-gallery-pagination>span').textContent(),/^2 de/);
  await dialog.getByRole('button',{name:'Ampliar foto del producto',exact:true}).click();
  const lightbox=page.locator('.listing-photo-lightbox[open]');await lightbox.waitFor();
  await page.keyboard.press('ArrowRight');assert.match(await lightbox.locator('p').textContent(),/^3 de/);
  await page.keyboard.press('Escape');
  await page.keyboard.press('Escape');await page.locator('.listing-detail-dialog').waitFor({state:'detached'});assert.equal(await page.locator('.listing-detail-dialog').count(),0);
  await page.getByRole('button',{name:/Ver publicación: Pantalón/}).click();await dialog.waitFor();
  assert.equal(await dialog.locator('.listing-detail-no-image').count(),1);
  assert.equal(await dialog.locator('.listing-detail-photo-button').count(),0);
  await page.keyboard.press('Escape');
  results.push({device,maxScroll:max,photoWidth,restored,overflow,lightbox:true,multiplePhotos:true,noPhoto:true});
  await context.close();
 }
 assert.equal(errors.length,0,JSON.stringify(errors));fs.writeFileSync('/out/listing-details.json',JSON.stringify({results,errors},null,2));console.log(JSON.stringify({results,errors}));await browser.close();
})().catch(e=>{console.error(e.stack);process.exit(1)});
