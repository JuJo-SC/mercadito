ALTER TABLE "ListingPhoto"
ADD COLUMN "position" INTEGER NOT NULL DEFAULT 0;

ALTER TABLE "ListingPhoto"
DROP CONSTRAINT "ListingPhoto_pkey";

ALTER TABLE "ListingPhoto"
ADD CONSTRAINT "ListingPhoto_pkey" PRIMARY KEY ("listingId", "position");
