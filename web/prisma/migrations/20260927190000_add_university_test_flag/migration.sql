ALTER TABLE "University" ADD COLUMN "isTest" BOOLEAN NOT NULL DEFAULT false;
UPDATE "University"
SET "isTest" = true
WHERE "slug" = 'uman' AND "isDemo" = false;
