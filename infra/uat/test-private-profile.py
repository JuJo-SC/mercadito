"""Isolated HTTP ownership checks; tmpfs database, synthetic identities, no production network."""
import json
import subprocess
import time
import uuid

prefix = 'mercadito-profile-test-' + uuid.uuid4().hex[:8]
network = prefix + '-net'
database = prefix + '-db'
web = prefix + '-web'
containers = []

def docker(*args, check=True):
    return subprocess.run(['docker', *args], text=True, capture_output=True, check=check)

def sql(statement):
    return docker('exec', database, 'psql', '-U', 'fixture', '-d', 'mercadito', '-v', 'ON_ERROR_STOP=1', '-c', statement)

try:
    docker('network', 'create', network)
    docker('run', '-d', '--name', database, '--network', network, '--network-alias', 'database',
           '--tmpfs', '/var/lib/postgresql/data', '-e', 'POSTGRES_USER=fixture', '-e', 'POSTGRES_PASSWORD=fixture-password',
           '-e', 'POSTGRES_DB=mercadito', 'postgres:17-alpine')
    containers.append(database)
    for _ in range(60):
        if docker('exec', database, 'pg_isready', '-U', 'fixture', check=False).returncode == 0: break
        time.sleep(.5)
    url='postgresql://fixture:fixture-password@database:5432/mercadito'
    docker('run', '--rm', '--network', network, '-e', 'DATABASE_URL='+url, 'mercadito-migrator:profile-candidate')
    sql('''INSERT INTO "University" (id,name,slug,status,"isDemo","isTest","updatedAt") VALUES ('uat','UAT','uat','ACTIVE',false,true,now());
    INSERT INTO "User" (id,name,"facultyName","universityId",role,status,"isDemo","updatedAt") VALUES
    ('maria','María Isabel L.','Facultad de Enfermería','uat','STUDENT','ACTIVE',false,now()),('carlos','Carlos Alberto M.','Facultad de Ingeniería','uat','STUDENT','ACTIVE',false,now());
    INSERT INTO "StudentPrivateProfile" ("userId","fullName","updatedAt") VALUES
    ('maria','María Isabel López García',now()),('carlos','Carlos Alberto Méndez Ruiz',now());
    INSERT INTO "Session" (id,"sessionToken","userId",expires) VALUES
    ('sm','fixture-maria-session','maria',now()+interval '1 hour'),('sc','fixture-carlos-session','carlos',now()+interval '1 hour');
    INSERT INTO "Listing" (id,"universityId","sellerId",title,description,price,category,condition,status,"updatedAt") VALUES
    ('book-maria','uat','maria','Libro de María','Libro de prueba',20,'BOOKS','GOOD','PUBLISHED',now()),
    ('book-carlos','uat','carlos','Libro de Carlos','Libro de prueba',25,'BOOKS','GOOD','PUBLISHED',now());''')
    docker('run', '-d', '--name', web, '--network', network, '--network-alias', 'web', '-e', 'DATABASE_URL='+url,
           '-e','AUTH_SECRET=fixture-profile-secret-at-least-thirty-two-characters', '-e','AUTH_URL=http://web:3000',
           '-e','AUTH_TRUST_HOST=true','-e','ACTIVE_UNIVERSITY_SLUG=uat','-e','ACTIVE_UNIVERSITY_NAME=UAT',
           '-e','UAT_LOGIN_ENABLED=true','-e','UAT_PRIVACY_URL=https://example.test/privacy','mercadito-web:uat-candidate')
    containers.append(web)
    for _ in range(60):
        if docker('exec',web,'node','-e',"fetch('http://127.0.0.1:3000/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))",check=False).returncode==0: break
        time.sleep(.5)
    test = r'''
    const assert = require('node:assert/strict');
    async function get(path,person) {
      return fetch('http://127.0.0.1:3000'+path,{headers:person?{cookie:'authjs.session-token=fixture-'+person+'-session'}:{},redirect:'manual'});
    }
    (async()=>{
      const anonymous=await get('/perfil');assert.equal(anonymous.status,307);
      assert.ok(anonymous.headers.get('location').includes('/ingresar'));
      for(const [person,own,other] of [['maria','María Isabel López García','Carlos Alberto Méndez Ruiz'],['carlos','Carlos Alberto Méndez Ruiz','María Isabel López García']]) {
        const profile=await get('/perfil?userId='+ (person==='maria'?'carlos':'maria'),person);
        assert.equal(profile.status,200);const html=await profile.text();
        assert.ok(html.includes(own));assert.ok(!html.includes(other));
        assert.ok(profile.headers.get('cache-control').includes('no-store'));
        const publicPage=await get('/mercadito',person);assert.equal(publicPage.status,200);
        const session=await get('/api/auth/session',person);const sessionText=await session.text();
        assert.ok(!sessionText.includes(own));assert.ok(!sessionText.includes(other));assert.ok(!sessionText.includes('uat_private_name'));
        const api=await get('/api/listings?university=uat',person);assert.equal(api.status,200);
        const payload=await api.json();assert.equal(payload.listings.find(x=>x.seller.id==='maria').seller.facultyName,'Facultad de Enfermería');
        assert.equal(payload.listings.find(x=>x.seller.id==='carlos').seller.facultyName,'Facultad de Ingeniería');
        const listings=await publicPage.text();assert.ok(listings.includes('María Isabel L.'));assert.ok(listings.includes('Carlos Alberto M.'));
        assert.ok(!listings.includes(own));assert.ok(!listings.includes(other));
      }
      console.log('PASS: two sessions see their own private name, both public seller names, no full names in catalog, no-store and anonymous rejection');
    })().catch(error=>{console.error(error);process.exit(1)});
    '''
    result=docker('exec',web,'node','-e',test)
    print(result.stdout.strip())
    print('PASS: all migrations applied to disposable database')
finally:
    for name in reversed(containers):
        assert name.startswith(prefix+'-')
        docker('rm','-f',name,check=False)
    docker('network','rm',network,check=False)
