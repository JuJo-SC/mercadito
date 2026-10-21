"""Real candidate UI with synthetic database sessions on an isolated Docker network.

Run from the repository root. No production credentials or volumes are used.
Requires mercadito-web:sesion-candidato, mercadito-migrator:sesion-candidato,
postgres:17-alpine and the installed mercadito-qa-chromium:20260926 QA image.
"""
from pathlib import Path
import subprocess
import os
import struct
import zlib
import time
import uuid

root = Path(__file__).resolve().parents[2]
output = root / ".opendesign/artifacts" / os.environ.get("MERCADITO_TEST_OUTPUT", "session-surfaces")
web_image = os.environ.get("MERCADITO_TEST_IMAGE", "mercadito-web:sesion-candidato")
check_details = os.environ.get("MERCADITO_CHECK_LISTING_DETAILS") == "1"
output.mkdir(parents=True, exist_ok=True)
prefix = "mercadito-session-test-" + uuid.uuid4().hex[:8]
network, database, web = (prefix + suffix for suffix in ["-net", "-db", "-web"])
containers = []


def docker(*args, check=True):
    result = subprocess.run(["docker", *args], text=True, capture_output=True)
    if check and result.returncode:
        raise RuntimeError(result.stderr or result.stdout)
    return result


def ready(*args):
    for _ in range(60):
        if docker(*args, check=False).returncode == 0:
            return
        time.sleep(.5)
    raise RuntimeError("Candidate did not become ready")


try:
    docker("network", "create", "--internal", network)
    docker("run", "-d", "--name", database, "--network", network, "--network-alias", "database",
           "--tmpfs", "/var/lib/postgresql/data", "-e", "POSTGRES_USER=fixture",
           "-e", "POSTGRES_PASSWORD=fixture-password", "-e", "POSTGRES_DB=mercadito", "postgres:17-alpine")
    containers.append(database)
    ready("exec", database, "pg_isready", "-U", "fixture")
    url = "postgresql://fixture:fixture-password@database:5432/mercadito"
    docker("run", "--rm", "--network", network, "-e", "DATABASE_URL=" + url,
           "mercadito-migrator:sesion-candidato")
    sql = '''
    INSERT INTO "University" (id,name,slug,status,"isDemo","isTest","updatedAt")
    VALUES ('uat','UAT','uat','ACTIVE',false,true,now());
    INSERT INTO "User" (id,name,"facultyName","universityId",role,status,"isDemo","updatedAt") VALUES
    ('mariana','Mariana G.','Facultad de Ingeniería','uat','STUDENT','ACTIVE',false,now()),
    ('carlos','Carlos M.','Facultad de Ciencias','uat','STUDENT','ACTIVE',false,now());
    INSERT INTO "StudentPrivateProfile" ("userId","fullName","updatedAt") VALUES
    ('mariana','Mariana García López',now()),('carlos','Carlos Méndez Ruiz',now());
    INSERT INTO "Session" (id,"sessionToken","userId",expires) VALUES
    ('sm','fixture-mariana-session','mariana',now()+interval '1 hour'),
    ('sc','fixture-carlos-session','carlos',now()+interval '1 hour');
    INSERT INTO "Listing" (id,"universityId","sellerId",title,description,price,category,condition,status,"updatedAt") VALUES
    ('shirt','uat','mariana','Sudadera verde','Sudadera en buen estado para el semestre.',200,'CLOTHING','GOOD','PUBLISHED',now()),
    ('pants','uat','carlos','Pantalón azul','Pantalón en buen estado para el semestre.',150,'CLOTHING','GOOD','PUBLISHED',now()),
    ('calculator','uat','carlos','Calculadora científica','Calculadora en buen estado para las materias.',350,'TECHNOLOGY','GOOD','PUBLISHED',now()),
    ('book','uat','mariana','Libro de cálculo','Libro con ejercicios para el semestre.',180,'BOOKS','GOOD','PUBLISHED',now()),
    ('draft','uat','mariana','Mochila gris','Mochila lista para completar sus detalles.',120,'ACCESSORIES','GOOD','DRAFT',now()),
    ('archived','uat','mariana','Apuntes de química','Apuntes del semestre anterior.',50,'BOOKS','GOOD','ARCHIVED',now());
    INSERT INTO "Conversation" (id,"universityId","listingId","buyerId","sellerId","updatedAt","lastMessageSequence") VALUES
    ('cv-shirt','uat','shirt','carlos','mariana',now(),2),
    ('cv-calculator','uat','calculator','mariana','carlos',now(),1);
    INSERT INTO "Message" (id,"conversationId","senderId",body,sequence) VALUES
    ('m1','cv-shirt','carlos','Hola, ¿todavía tienes la sudadera?',1),
    ('m2','cv-shirt','mariana','Sí, podemos acordar la entrega aquí.',2),
    ('m3','cv-calculator','carlos','La calculadora está disponible.',1);
    '''
    docker("exec", database, "psql", "-U", "fixture", "-d", "mercadito", "-v", "ON_ERROR_STOP=1", "-c", sql)
    if check_details:
        def image(color):
            width = height = 400
            def chunk(kind, data):
                return struct.pack(">I", len(data)) + kind + data + struct.pack(">I", zlib.crc32(kind + data) & 0xffffffff)
            pixels = b"".join(b"\0" + bytes(color) * width for _ in range(height))
            return b"\x89PNG\r\n\x1a\n" + chunk(b"IHDR", struct.pack(">IIBBBBB", width, height, 8, 2, 0, 0, 0)) + chunk(b"IDAT", zlib.compress(pixels)) + chunk(b"IEND", b"")
        values = []
        for listing, position, color in [("shirt", 0, (41, 113, 86)), ("shirt", 1, (180, 203, 189)), ("shirt", 2, (200, 210, 190)), ("shirt", 3, (210, 220, 200)), ("shirt", 4, (220, 230, 210)), ("calculator", 0, (218, 221, 226))]:
            values.append("('%s',%d,'image/png',400,400,decode('%s','hex'))" % (listing, position, image(color).hex()))
        photos_sql = 'INSERT INTO "ListingPhoto" ("listingId",position,"mimeType",width,height,data) VALUES ' + ",".join(values)
        docker("exec", database, "psql", "-U", "fixture", "-d", "mercadito", "-v", "ON_ERROR_STOP=1", "-c", photos_sql)
    docker("run", "-d", "--name", web, "--network", network, "--network-alias", "web",
           "-e", "DATABASE_URL=" + url, "-e", "AUTH_SECRET=fixture-session-secret-at-least-thirty-two-characters",
           "-e", "AUTH_URL=http://web:3000", "-e", "AUTH_TRUST_HOST=true",
           "-e", "ACTIVE_UNIVERSITY_SLUG=uat", "-e", "ACTIVE_UNIVERSITY_NAME=UAT",
           "-e", "UAT_LOGIN_ENABLED=true", "-e", "UAT_PRIVACY_URL=https://example.test/privacy",
           web_image)
    containers.append(web)
    ready("exec", web, "node", "-e", "fetch('http://127.0.0.1:3000/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))")
    scripts = ["review-session-surfaces.cjs", "check-session-surfaces.cjs"]
    if check_details:
        scripts.insert(0, "check-listing-details.cjs")
    for script in scripts:
        result = docker("run", "--rm", "--network", network, "-v", str(root / "infra/uat") + ":/qa:ro",
                        "-v", str(output) + ":/out", "mercadito-qa-chromium:20260926", "node", "/qa/" + script)
        print(result.stdout, flush=True)
    checks = r'''
    const assert=require('node:assert/strict');
    async function get(path,who){return fetch('http://127.0.0.1:3000'+path,{redirect:'manual',headers:who?{cookie:'authjs.session-token=fixture-'+who+'-session'}:{}})}
    (async()=>{
      assert.equal((await get('/mercadito')).status,307);
      assert.equal((await get('/api/listings')).status,404);
      assert.equal((await get('/mensajes/cv-shirt')).status,307);
      for(const path of ['/','/mensajes','/publicar','/mis-avisos'])assert.equal((await get(path)).status,200);
      for(const [who,own,other] of [['mariana','Mariana García López','Carlos Méndez Ruiz'],['carlos','Carlos Méndez Ruiz','Mariana García López']]){
        const response=await get('/perfil?userId=other',who);assert.equal(response.status,200);
        const html=await response.text();assert.ok(html.includes(own));assert.ok(!html.includes(other));
        assert.ok(response.headers.get('cache-control').includes('no-store'));
        for(const path of ['/mercadito','/api/auth/session','/api/listings']){
          const res=await get(path,who);assert.equal(res.status,200);const text=await res.text();
          assert.ok(!text.includes(own));assert.ok(!text.includes(other));
        }
      }
      console.log('PASS: anonymous restrictions, real database sessions, own-profile privacy and no full names in catalog/session/API');
    })().catch(e=>{console.error(e);process.exit(1)});
    '''
    print(docker("exec", web, "node", "-e", checks).stdout, flush=True)
finally:
    for name in reversed(containers):
        assert name.startswith(prefix + "-")
        docker("rm", "-f", name, check=False)
    docker("network", "rm", network, check=False)
