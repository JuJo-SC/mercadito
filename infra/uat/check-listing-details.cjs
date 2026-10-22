const {chromium}=require('/usr/local/lib/node_modules/playwright-core');
const fs=require('node:fs'),assert=require('node:assert/strict');
(async()=>{
 const base='http://web:3000',browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox','--disable-dev-shm-usage','--unsafely-treat-insecure-origin-as-secure=http://web:3000']});
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
  assert.match(await dialog.locator('time').textContent(),/^Publicado el /);
  assert.equal(await dialog.locator('.notice-contact-form h3').count(),0);
  if(device==='desktop'||device==='mobile')await dialog.screenshot({path:'/out/detail-'+device+'-initial.png'});
  await dialog.locator('.listing-detail-photo-button img').evaluate(e=>e.decode());
  const scroll=dialog.locator(device==='desktop'?'.listing-detail-scroll':'.listing-detail-shell');
  const initial=await dialog.evaluate(e=>{
   const image=e.querySelector('.listing-detail-photo-button').getBoundingClientRect(),gallery=e.querySelector('.listing-detail-gallery'),region=e.querySelector(window.innerWidth<=760?'.listing-detail-shell':'.listing-detail-scroll'),info=e.querySelector('.listing-detail-info');
   return {width:image.width,height:image.height,galleryHeight:gallery.clientHeight,dialogHeight:e.getBoundingClientRect().height,dialogWidth:e.clientWidth,contentWidth:region.clientWidth,bottomGap:region.clientHeight-(info.getBoundingClientRect().bottom-region.getBoundingClientRect().top+region.scrollTop)};
  });
  if(device!=='desktop'){
   assert.ok(initial.dialogHeight<=(viewport.height-24)+2,'The mobile sheet matches the bounded preview');
   assert.ok(initial.width>=initial.contentWidth-26,'The photo uses the available width');
   assert.ok(initial.bottomGap<=2,'No forced empty space below the content');
  }
  const max=await scroll.evaluate(e=>e.scrollHeight-e.clientHeight);
  await scroll.evaluate((e,distance)=>e.scrollTop=distance,Math.min(80,max));await page.waitForTimeout(80);
  const photoWidth=await dialog.locator('.listing-detail-photo-button').evaluate(e=>e.getBoundingClientRect().width);
  const photoHeight=await dialog.locator('.listing-detail-photo-button').evaluate(e=>e.getBoundingClientRect().height);
  assert.ok(Math.abs(photoWidth-initial.width)<2,'Scrolling must preserve photo width');
  assert.ok(Math.abs(photoHeight-initial.height)<2,'Scrolling must preserve photo height');
  if(device==='mobile'||device==='narrow')assert.equal(max,0,'Normal content fits without scroll');
  const overflow=await dialog.evaluate(e=>e.scrollWidth>e.clientWidth);
  assert.equal(overflow,false,device);
  if(device==='short')await dialog.screenshot({path:'/out/detail-mobile-scrolled.png'});
  await dialog.getByRole('button',{name:'Ampliar foto del producto',exact:true}).click();
  await page.locator('.listing-photo-lightbox[open]').waitFor();
  await page.keyboard.press('Escape');assert.equal(await page.locator('.listing-photo-lightbox[open]').count(),0);
  assert.equal(await dialog.count(),1,'Escape closes only the enlarged photo');
  await scroll.evaluate(e=>e.scrollTop=0);await page.waitForTimeout(80);
  const restored=await dialog.locator('.listing-detail-photo-button').evaluate(e=>e.getBoundingClientRect().width);
  if(device!=='desktop')assert.ok(Math.abs(restored-initial.width)<2);
  if(device==='mobile'){
   const description=dialog.locator('.listing-detail-description p');
   const original=await description.textContent();
   await description.evaluate(e=>e.textContent=('Descripción larga para probar la ficha. ').repeat(60));
   await page.waitForTimeout(80);
   const longRange=await scroll.evaluate(e=>e.scrollHeight-e.clientHeight);
   assert.ok(longRange>max);
   await scroll.evaluate(e=>e.scrollTop=e.scrollHeight);await page.waitForTimeout(80);
   const longPhoto=await dialog.locator('.listing-detail-photo-button').boundingBox();
   assert.ok(Math.abs(longPhoto.width-initial.width)<2&&Math.abs(longPhoto.height-initial.height)<2);
   const footer=await dialog.evaluate(e=>({bottom:e.querySelector('.listing-detail-info').getBoundingClientRect().bottom,viewport:e.querySelector('.listing-detail-shell').getBoundingClientRect().bottom,close:e.querySelector('.listing-detail-close').getBoundingClientRect().top}));
   assert.ok(Math.abs(footer.bottom-footer.viewport)<2,'No blank band at the end of long content');
   assert.ok(footer.close>=0&&footer.close<viewport.height-44,'Close remains available after scrolling');
   await dialog.screenshot({path:'/out/detail-mobile-long-description.png'});
   await scroll.evaluate(e=>e.scrollTop=0);
   await description.evaluate((e,text)=>e.textContent=text,original);await page.waitForTimeout(80);
   assert.ok(Math.abs((await dialog.locator('.listing-detail-photo-button').boundingBox()).width-initial.width)<2);
  }
  assert.equal(await dialog.locator('.listing-detail-more').count(),0);
  assert.deepEqual(await dialog.locator('.listing-detail-publisher dt').allTextContents(),['Estudiante','Categoría','Facultad']);
  assert.equal(await dialog.locator('.message-keyboard-hint,.notice-contact-meta').count(),0);
  const compose=await dialog.evaluate(e=>{
    const input=e.querySelector('textarea').getBoundingClientRect(),send=e.querySelector('.notice-contact-send').getBoundingClientRect();
    return {height:input.height,buttonHeight:send.height,sameRow:Math.abs(input.top-send.top)<1,atRight:send.left>=input.right,buttonText:e.querySelector('.notice-contact-send').textContent.trim()};
  });
  assert.equal(compose.height,44);assert.equal(compose.buttonHeight,44);assert.equal(compose.sameRow,true);assert.equal(compose.atRight,true);assert.equal(compose.buttonText,'');
  const input=dialog.getByRole('textbox',{name:'Escribir a Carlos M.'});await input.fill('Hola');await input.press('Shift+Enter');await input.pressSequentially('Me interesa.');assert.ok((await input.inputValue()).includes('\n'));
  await dialog.getByRole('button',{name:'Cerrar detalles',exact:true}).click();await page.locator('.listing-detail-dialog').waitFor({state:'detached'});
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
  await page.locator('.listing-detail-dialog').waitFor({state:'detached'});
  await page.getByRole('button',{name:/Ver publicación: Libro/}).click();await dialog.waitFor();
  await dialog.locator('.listing-detail-photo-button img').evaluate(e=>e.decode());
  if(device!=='desktop'){
   const owner=await dialog.evaluate(e=>{const region=e.querySelector(window.innerWidth<=760?'.listing-detail-shell':'.listing-detail-scroll'),info=e.querySelector('.listing-detail-info');return {gap:region.clientHeight-(info.getBoundingClientRect().bottom-region.getBoundingClientRect().top+region.scrollTop),height:e.getBoundingClientRect().height}});
   assert.ok(owner.gap<=2,'Own listings must not force empty sheet space');
   assert.ok(owner.height<=(viewport.height-24)+2);
  }
  const ownRange=await scroll.evaluate(e=>e.scrollHeight-e.clientHeight);
  if(device!=='desktop'&&ownRange===0){
   const photo=dialog.locator('.listing-detail-photo-button'),before=(await photo.boundingBox()).width;
   await scroll.evaluate(e=>e.scrollTop=80);await page.waitForTimeout(80);
   assert.ok(Math.abs((await photo.boundingBox()).width-before)<2,'Content that fits retains the large photo');
  }
  if(device==='mobile')await dialog.screenshot({path:'/out/detail-mobile-portrait.png'});
  await page.keyboard.press('Escape');
  if(device==='mobile'){
   await page.locator('.listing-detail-dialog').waitFor({state:'detached'});
   await page.getByRole('button',{name:/Ver publicación: Calculadora/}).click();await dialog.waitFor();
   const firstMessage='Hola, me interesa la calculadora de la prueba.';
   await dialog.getByRole('textbox',{name:'Escribir a Carlos M.'}).fill(firstMessage);
   await dialog.getByRole('button',{name:'Enviar mensaje',exact:true}).click();
   await page.waitForURL('**/mensajes/cv-calculator');
   await page.locator('.thread-message-paper p').filter({hasText:firstMessage}).waitFor();
   assert.equal(await page.locator('.thread-message-paper p').filter({hasText:firstMessage}).count(),1);
  }
  results.push({device,initial,maxScroll:max,photoWidth,photoHeight,restored,overflow,lightbox:true,multiplePhotos:true,noPhoto:true});
  await context.close();
 }
 assert.equal(errors.length,0,JSON.stringify(errors));fs.writeFileSync('/out/listing-details.json',JSON.stringify({results,errors},null,2));console.log(JSON.stringify({results,errors}));await browser.close();
})().catch(e=>{console.error(e.stack);process.exit(1)});
