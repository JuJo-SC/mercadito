"""HTTP privacy regression using synthetic sessions and a disposable tmpfs database.

Run on Oracle after building mercadito-web:uat-candidate. No production data,
secrets, networks, volumes or identity-provider credentials are used.
"""
import json
import subprocess
import time
import uuid

prefix = "mercadito-listing-test-" + uuid.uuid4().hex[:8]
network = prefix + "-net"
database = prefix + "-db"
web = prefix + "-web"
containers = []


def docker(*args, check=True):
    result = subprocess.run(["docker", *args], text=True, capture_output=True)
    if check and result.returncode:
        raise RuntimeError(f"Docker test command failed: {result.stderr}\n{result.stdout}")
    return result


def sql(statement):
    return docker("exec", "-i", database, "psql", "-U", "fixture", "-d", "mercadito",
                  "-v", "ON_ERROR_STOP=1", "-c", statement)


def ready(name, command):
    for _ in range(90):
        if docker("exec", name, *command, check=False).returncode == 0:
            return
        time.sleep(.5)
    raise AssertionError(f"Test container {name} did not become ready")


try:
    docker("network", "create", "--internal", network)
    docker("run", "-d", "--name", database, "--network", network, "--network-alias", "database",
           "--tmpfs", "/var/lib/postgresql/data", "-e", "POSTGRES_USER=fixture",
           "-e", "POSTGRES_PASSWORD=fixture-password", "-e", "POSTGRES_DB=mercadito", "postgres:17-alpine")
    containers.append(database)
    ready(database, ["pg_isready", "-U", "fixture"])
    url = "postgresql://fixture:fixture-password@database:5432/mercadito"
    # Uses the current checked-out migrations, rather than a potentially stale migrator image.
    docker("run", "--rm", "--network", network, "-e", "DATABASE_URL=" + url,
           "-v", "/srv/apps/mercadito/web:/app", "-w", "/app", "node:24-bookworm-slim",
           "./node_modules/.bin/prisma", "migrate", "deploy")
    photo = docker("run", "--rm", "--entrypoint", "node", "mercadito-web:uat-candidate", "-e",
                   "require('sharp')({create:{width:4,height:4,channels:3,background:'#167d62'}}).webp().toBuffer().then(b=>console.log(b.toString('base64')))").stdout.strip()
    sql("""
    INSERT INTO "University" (id,name,slug,status,"isDemo","isTest","updatedAt") VALUES
      ('uat','UAT','uat','ACTIVE',false,true,now()),
      ('other','Other','other','ACTIVE',false,false,now()),
      ('demo','Demo','fixture-demo','ACTIVE',true,true,now());
    INSERT INTO "User" (id,name,"universityId",role,status,"isDemo","updatedAt") VALUES
      ('seller','Seller','uat','STUDENT','ACTIVE',false,now()),
      ('buyer','Buyer','uat','STUDENT','ACTIVE',false,now()),
      ('outsider','Outsider','uat','STUDENT','ACTIVE',false,now()),
      ('foreign','Foreign','other','STUDENT','ACTIVE',false,now()),
      ('demo','Demo','demo','STUDENT','ACTIVE',true,now()),
      ('suspended','Suspended','uat','STUDENT','SUSPENDED',false,now()),
      ('admin','Admin','uat','PLATFORM_ADMIN','ACTIVE',false,now());
    INSERT INTO "Session" (id,"sessionToken","userId",expires)
      SELECT id,'fixture-'||id,id,now()+interval '1 hour' FROM "User";
    INSERT INTO "Session" (id,"sessionToken","userId",expires)
      VALUES ('expired','fixture-expired','buyer',now()-interval '1 hour');
    """)
    for state in ["PUBLISHED", "DRAFT", "RESERVED", "SOLD", "ARCHIVED"]:
        name = state.lower()
        sql(f"""
        INSERT INTO "Listing" (id,"universityId","sellerId",title,description,price,category,condition,status,"updatedAt","imageUrl")
          VALUES ('{name}','uat','seller','PRIVATE-FIXTURE-{state}','Private fixture description',21.37,'BOOKS','GOOD','{state}',now(),'https://legacy.invalid/private-fixture.webp');
        """)
    sql("""
    INSERT INTO "Listing" (id,"universityId","sellerId",title,description,price,category,condition,status,"updatedAt","isDemo") VALUES
      ('sample','uat','seller','PRIVATE-FIXTURE-SAMPLE','Private example',13,'BOOKS','GOOD','PUBLISHED',now(),true),
      ('foreign','other','foreign','PRIVATE-FIXTURE-FOREIGN','Private foreign',14,'BOOKS','GOOD','PUBLISHED',now(),false),
      ('demo','demo','demo','PRIVATE-FIXTURE-DEMO','Legacy public exception',15,'BOOKS','GOOD','PUBLISHED',now(),true);
    INSERT INTO "Conversation" (id,"universityId","listingId","buyerId","sellerId","updatedAt")
      SELECT 'thread-'||id,'uat',id,'buyer','seller',now() FROM "Listing" WHERE status IN ('RESERVED','SOLD','ARCHIVED');
    """)
    sql(f"""
    INSERT INTO "ListingPhoto" ("listingId",position,width,height,data)
      SELECT id,0,4,4,decode('{photo}','base64') FROM "Listing";
    INSERT INTO "ListingPhoto" ("listingId",position,width,height,data)
      VALUES ('published',1,4,4,decode('{photo}','base64'));
    """)
    docker("run", "-d", "--name", web, "--network", network, "--network-alias", "web",
           "-e", "DATABASE_URL=" + url,
           "-e", "AUTH_SECRET=fixture-listing-secret-at-least-thirty-two-characters",
           "-e", "AUTH_URL=http://web:3000", "-e", "AUTH_TRUST_HOST=true",
           "-e", "ACTIVE_UNIVERSITY_SLUG=uat", "-e", "ACTIVE_UNIVERSITY_NAME=UAT",
           "-e", "UAT_LOGIN_ENABLED=true", "-e", "UAT_PRIVACY_URL=https://example.test/privacy",
           "mercadito-web:uat-candidate")
    containers.append(web)
    ready(web, ["node", "-e", "fetch('http://127.0.0.1:3000/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"])
    tests = r"""
    const assert = require('node:assert/strict');
    const base='http://127.0.0.1:3000';
    async function get(path,person,options={}) {
      return fetch(base+path,{redirect:'manual',...options,headers:{
        ...(person?{cookie:'authjs.session-token=fixture-'+person}:{}),...options.headers}});
    }
    function privateResponse(r) {
      assert.match(r.headers.get('cache-control'),/private/);
      assert.match(r.headers.get('cache-control'),/no-store/);
    }
    async function absent(r) {
      const text=await r.text();
      assert.ok(!text.includes('PRIVATE-FIXTURE'));
      assert.ok(!text.includes('legacy.invalid'));
      assert.ok(!text.includes('data:image'));
      assert.ok(!text.includes('landing-product'));
    }
    (async()=>{
      for(const person of [undefined,'expired','invalid','suspended','foreign','demo','admin']) {
        const landing=await get('/',person);assert.equal(landing.status,200);privateResponse(landing);
        const html=await landing.text();assert.ok(html.includes('Tu campus. Tu mercadito.'));
        assert.ok(html.includes('Así funciona'));assert.ok(html.includes('/ingresar'));
        assert.ok(!html.includes('PRIVATE-FIXTURE'));assert.ok(!html.includes('data:image'));
        assert.ok(!html.includes('landing-product'));assert.ok(!html.includes('21.37'));
        const catalog=await get('/mercadito',person);assert.equal(catalog.status,307);
        assert.ok(catalog.headers.get('location').includes('/ingresar'));await absent(catalog);
        for(const path of ['/api/listings','/api/listings?university=uat','/api/listings/published',
          '/api/listings/demo','/api/listings/sample','/api/listings/missing',
          '/api/listings/published/photo','/api/listings/published/photo?position=1',
          '/api/listings/demo/photo','/api/listings/missing/photo']) {
          const r=await get(path,person);assert.ok([401,404].includes(r.status),path+': '+r.status);
          privateResponse(r);await absent(r);
        }
        const head=await get('/api/listings/published/photo',person,{method:'HEAD'});
        assert.equal(head.status,401);privateResponse(head);assert.equal(await head.text(),'');
      }
      const rsc=await get('/',undefined,{redirect:'follow',headers:{RSC:'1'}});
      assert.equal(rsc.status,200);privateResponse(rsc);await absent(rsc);
      const home=await get('/','buyer');assert.equal(home.status,307);
      assert.equal(home.headers.get('location'),'/mercadito');
      const catalog=await get('/mercadito','buyer');assert.equal(catalog.status,200);privateResponse(catalog);
      const catalogHtml=await catalog.text();assert.ok(catalogHtml.includes('PRIVATE-FIXTURE-PUBLISHED'));
      assert.ok(!catalogHtml.includes('PRIVATE-FIXTURE-FOREIGN'));assert.ok(!catalogHtml.includes('legacy.invalid'));
      for(const path of ['/api/listings','/api/listings?q=PRIVATE-FIXTURE&category=BOOKS&sort=INTEREST']) {
        const r=await get(path,'buyer');assert.equal(r.status,200);privateResponse(r);
        const data=await r.json();assert.deepEqual(new Set(data.listings.map(x=>x.id)),new Set(['published','sample']));
        assert.ok(data.listings.every(x=>x.imageUrls.every(u=>u.startsWith('/api/listings/'))));
      }
      assert.equal((await get('/api/listings?university=other','buyer')).status,404);
      for(const id of ['published','sample']) {
        const r=await get('/api/listings/'+id,'buyer');assert.equal(r.status,200);privateResponse(r);
        const data=await r.json();assert.equal(data.listing.id,id);assert.ok(!('imageUrl' in data.listing));
      }
      for(const id of ['foreign','demo','draft','reserved','sold','archived','missing']) {
        const r=await get('/api/listings/'+id,'buyer');assert.equal(r.status,404);privateResponse(r);
        await absent(r);
      }
      for(const [person,ids] of [
        ['seller',['published','sample','draft','reserved','sold','archived']],
        ['buyer',['published','sample','reserved','sold','archived']],
        ['outsider',['published','sample']]]) {
        for(const id of ids) {
          const path='/api/listings/'+id+'/photo';
          const r=await get(path,person);assert.equal(r.status,200,person+': '+id);
          privateResponse(r);assert.match(r.headers.get('vary'),/Cookie/i);
          assert.equal(r.headers.get('content-type'),'image/webp');
          assert.equal(Buffer.from(await r.arrayBuffer()).toString('ascii',0,4),'RIFF');
          const anon=await get(path,undefined,{headers:{'if-none-match':'"old"'}});
          assert.equal(anon.status,401);privateResponse(anon);await absent(anon);
        }
      }
      for(const path of ['/api/listings/foreign/photo','/api/listings/demo/photo',
        '/api/listings/draft/photo','/api/listings/published/photo?position=5',
        '/api/listings/published/photo?position=-1','/api/listings/published/photo?position=NaN']) {
        const r=await get(path,'buyer');assert.equal(r.status,404);privateResponse(r);await absent(r);
      }
      for(const id of ['draft','reserved','sold','archived']) {
        assert.equal((await get('/api/listings/'+id+'/photo','outsider')).status,404);
      }
      assert.equal((await get('/api/listings/published/photo?position=1','buyer')).status,200);
      for(const person of [undefined,'buyer']) {
        for(const url of ['/api/listings/published/photo','/api/listings/published/photo?position=1']) {
          const r=await get('/_next/image?url='+encodeURIComponent(url)+'&w=256&q=75',person);
          assert.equal(r.status,400);assert.ok(!r.headers.get('content-type')?.startsWith('image/'));
        }
      }
      const sw=await get('/sw.js');assert.match(sw.headers.get('cache-control'),/no-store/);
      const swText=await sw.text();assert.ok(swText.includes('const OFFLINE_URL = "/offline.html"'));
      console.log('PASS: anonymous/expired/invalid/suspended/foreign/demo/admin sessions blocked; HTML and RSC private; authenticated catalog/search/detail/photos intact; same-campus ownership and buyer references preserved; cache warm-up, HEAD and optimizer blocked');
    })().catch(error=>{console.error(error);process.exit(1)});
    """
    print(docker("exec", web, "node", "-e", tests).stdout.strip())
    sql('UPDATE "University" SET "isTest"=false WHERE id=\'uat\';')
    stricter = r"""
    const assert=require('node:assert/strict');
    const headers={cookie:'authjs.session-token=fixture-buyer'};
    (async()=>{
      const base='http://127.0.0.1:3000';
      const r=await fetch(base+'/api/listings',{headers});assert.equal(r.status,200);
      assert.deepEqual((await r.json()).listings.map(x=>x.id),['published']);
      const page=await fetch(base+'/mercadito',{headers});const html=await page.text();
      assert.ok(html.includes('PRIVATE-FIXTURE-PUBLISHED'));assert.ok(!html.includes('PRIVATE-FIXTURE-SAMPLE'));
      for(const path of ['/api/listings/sample','/api/listings/sample/photo']) {
        assert.equal((await fetch(base+path,{headers})).status,404);
      }
      console.log('PASS: examples hidden consistently outside a test campus');
    })().catch(e=>{console.error(e);process.exit(1)});
    """
    print(docker("exec", web, "node", "-e", stricter).stdout.strip())
    print("PASS: current migrations applied to disposable tmpfs database")
finally:
    # Only resources created by this invocation can be cleaned up.
    for name in reversed(containers):
        assert name.startswith(prefix + "-")
        docker("rm", "-f", name, check=False)
    assert network == prefix + "-net"
    docker("network", "rm", network, check=False)
