ALTER TABLE "Listing"
ADD COLUMN "submissionId" TEXT NOT NULL DEFAULT (gen_random_uuid()::text),
ADD COLUMN "submissionHash" VARCHAR(64);

CREATE UNIQUE INDEX "Listing_sellerId_submissionId_key"
ON "Listing"("sellerId", "submissionId");
