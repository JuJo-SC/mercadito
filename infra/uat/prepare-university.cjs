// Run through stdin in the web container; never pass DATABASE_URL as an argument.
const { Client } = require("pg");
const countsSql = 'SELECT u.slug, (SELECT COUNT(*)::int FROM "User" s WHERE s."universityId"=u.id) AS users, (SELECT COUNT(*)::int FROM "Listing" l WHERE l."universityId"=u.id) AS listings, (SELECT COUNT(*)::int FROM "Conversation" c WHERE c."universityId"=u.id) AS conversations FROM "University" u WHERE u.slug=$1';

async function main() {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  try {
    if (!process.argv.includes("--apply")) {
      const uman = await client.query(countsSql, ["uman"]);
      const uat = await client.query('SELECT slug FROM "University" WHERE slug=$1', ["uat"]);
      console.log(JSON.stringify({ readOnly: true, uatExists: Boolean(uat.rowCount), uman: uman.rows }));
      return;
    }
    await client.query("BEGIN");
    const before = await client.query(countsSql, ["uman"]);
    const existing = await client.query('SELECT "identityKey", "isDemo", "isTest", "status", "studentStatusClaim", "studentStatusValue" FROM "University" WHERE slug=$1', ["uat"]);
    if (existing.rowCount && (existing.rows[0].identityKey !== "uat" || existing.rows[0].isDemo || existing.rows[0].isTest || existing.rows[0].status !== "ACTIVE" || existing.rows[0].studentStatusClaim !== "uat_student_verified" || existing.rows[0].studentStatusValue !== "true")) {
      throw new Error("Ya existe un registro UAT distinto; revisar sin sobrescribir.");
    }
    if (!existing.rowCount) {
      await client.query('INSERT INTO "University" (id,name,slug,"websiteUrl",status,"isDemo","isTest","identityKey","studentStatusClaim","studentStatusValue","createdAt","updatedAt") VALUES ($1,$2,$3,$4,$5,false,false,$3,$6,$7,NOW(),NOW())',
        ["uat-university", "Universidad Autónoma de Tamaulipas", "uat", "https://www.uat.edu.mx", "ACTIVE", "uat_student_verified", "true"]);
    }
    const after = await client.query(countsSql, ["uman"]);
    if (JSON.stringify(before.rows) !== JSON.stringify(after.rows)) throw new Error("Cambió el recuento UMAN.");
    await client.query("COMMIT");
    console.log(JSON.stringify({ uatPrepared: true, umanPreserved: after.rows, activeCommunityUnchanged: true }));
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    await client.end();
  }
}
main().catch(() => { console.error("No se preparó la universidad; transacción revertida."); process.exitCode = 1; });
