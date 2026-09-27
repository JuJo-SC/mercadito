-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "UniversityStatus" AS ENUM ('PENDING_REVIEW', 'ACTIVE', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "UniversityApplicationStatus" AS ENUM ('PENDING', 'REVIEWING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('STUDENT', 'UNIVERSITY_ADMIN', 'PLATFORM_ADMIN');

-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('ACTIVE', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "ListingStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'RESERVED', 'SOLD', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "ListingCategory" AS ENUM ('BOOKS', 'TECHNOLOGY', 'HOME', 'CLOTHING', 'ACCESSORIES', 'SERVICES', 'OTHER');

-- CreateEnum
CREATE TYPE "ItemCondition" AS ENUM ('NEW', 'LIKE_NEW', 'GOOD', 'FAIR');

-- CreateTable
CREATE TABLE "University" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "websiteUrl" TEXT,
    "status" "UniversityStatus" NOT NULL DEFAULT 'PENDING_REVIEW',
    "isDemo" BOOLEAN NOT NULL DEFAULT false,
    "identityKey" TEXT,
    "studentStatusClaim" TEXT,
    "studentStatusValue" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "University_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UniversityApplication" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "websiteUrl" TEXT NOT NULL,
    "contactName" TEXT NOT NULL,
    "contactEmail" TEXT NOT NULL,
    "privacyAcceptedAt" TIMESTAMP(3) NOT NULL,
    "status" "UniversityApplicationStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UniversityApplication_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT,
    "emailVerified" TIMESTAMP(3),
    "image" TEXT,
    "universityId" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'STUDENT',
    "status" "UserStatus" NOT NULL DEFAULT 'ACTIVE',
    "isDemo" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Account" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VerificationToken" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);

-- CreateTable
CREATE TABLE "Listing" (
    "id" TEXT NOT NULL,
    "universityId" TEXT NOT NULL,
    "sellerId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "price" DECIMAL(10,2) NOT NULL,
    "currency" VARCHAR(3) NOT NULL DEFAULT 'MXN',
    "category" "ListingCategory" NOT NULL,
    "condition" "ItemCondition" NOT NULL,
    "status" "ListingStatus" NOT NULL DEFAULT 'DRAFT',
    "imageUrl" TEXT,
    "isDemo" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Listing_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Favorite" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "listingId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Favorite_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "University_slug_key" ON "University"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "University_identityKey_key" ON "University"("identityKey");

-- CreateIndex
CREATE INDEX "University_status_slug_idx" ON "University"("status", "slug");

-- CreateIndex
CREATE UNIQUE INDEX "UniversityApplication_slug_key" ON "UniversityApplication"("slug");

-- CreateIndex
CREATE INDEX "UniversityApplication_status_createdAt_idx" ON "UniversityApplication"("status", "createdAt");

-- CreateIndex
CREATE INDEX "UniversityApplication_contactEmail_status_idx" ON "UniversityApplication"("contactEmail", "status");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_universityId_status_idx" ON "User"("universityId", "status");

-- CreateIndex
CREATE INDEX "User_universityId_role_idx" ON "User"("universityId", "role");

-- CreateIndex
CREATE INDEX "Account_userId_idx" ON "Account"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Account_provider_providerAccountId_key" ON "Account"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "Session_sessionToken_key" ON "Session"("sessionToken");

-- CreateIndex
CREATE INDEX "Session_userId_idx" ON "Session"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_token_key" ON "VerificationToken"("token");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_identifier_token_key" ON "VerificationToken"("identifier", "token");

-- CreateIndex
CREATE INDEX "Listing_universityId_status_createdAt_idx" ON "Listing"("universityId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "Listing_universityId_category_status_idx" ON "Listing"("universityId", "category", "status");

-- CreateIndex
CREATE INDEX "Listing_sellerId_status_idx" ON "Listing"("sellerId", "status");

-- CreateIndex
CREATE INDEX "Favorite_listingId_idx" ON "Favorite"("listingId");

-- CreateIndex
CREATE UNIQUE INDEX "Favorite_userId_listingId_key" ON "Favorite"("userId", "listingId");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_universityId_fkey" FOREIGN KEY ("universityId") REFERENCES "University"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Account" ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Listing" ADD CONSTRAINT "Listing_universityId_fkey" FOREIGN KEY ("universityId") REFERENCES "University"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Listing" ADD CONSTRAINT "Listing_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Favorite" ADD CONSTRAINT "Favorite_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Favorite" ADD CONSTRAINT "Favorite_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "Listing"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Clearly synthetic records let the marketplace demonstrate its flow before a campus joins.
INSERT INTO "University" ("id", "name", "slug", "status", "isDemo", "createdAt", "updatedAt")
VALUES ('demo-university', 'Comunidad de demostración', 'demo', 'ACTIVE', TRUE, NOW(), NOW());

INSERT INTO "User" ("id", "name", "universityId", "role", "status", "isDemo", "createdAt", "updatedAt")
VALUES ('demo-seller', 'Vendedor de ejemplo', 'demo-university', 'STUDENT', 'ACTIVE', TRUE, NOW(), NOW());

INSERT INTO "Listing" ("id", "universityId", "sellerId", "title", "description", "price", "currency", "category", "condition", "status", "isDemo", "createdAt", "updatedAt")
VALUES
  ('demo-book', 'demo-university', 'demo-seller', 'Cálculo: una variable', 'Libro de ejemplo para ilustrar cómo se vería una publicación. Precio y disponibilidad ficticios.', 320.00, 'MXN', 'BOOKS', 'GOOD', 'PUBLISHED', TRUE, NOW(), NOW()),
  ('demo-calculator', 'demo-university', 'demo-seller', 'Calculadora científica', 'Calculadora de muestra en buen estado. Este anuncio pertenece a la demostración y no es una oferta real.', 450.00, 'MXN', 'TECHNOLOGY', 'GOOD', 'PUBLISHED', TRUE, NOW(), NOW()),
  ('demo-lamp', 'demo-university', 'demo-seller', 'Lámpara de escritorio', 'Lámpara de ejemplo para lectura nocturna. Precio, artículo y disponibilidad son ficticios.', 220.00, 'MXN', 'HOME', 'LIKE_NEW', 'PUBLISHED', TRUE, NOW(), NOW()),
  ('demo-lab-coat', 'demo-university', 'demo-seller', 'Bata de laboratorio', 'Bata de muestra para mostrar condición, categoría y precio. Anuncio demostrativo; no contactar a un vendedor real.', 180.00, 'MXN', 'CLOTHING', 'GOOD', 'PUBLISHED', TRUE, NOW(), NOW()),
  ('demo-headphones', 'demo-university', 'demo-seller', 'Audífonos con cable', 'Ejemplo de publicación para tecnología usada. El artículo, el precio y su disponibilidad son ficticios.', 150.00, 'MXN', 'TECHNOLOGY', 'FAIR', 'PUBLISHED', TRUE, NOW(), NOW()),
  ('demo-backpack', 'demo-university', 'demo-seller', 'Mochila para clases', 'Mochila de demostración para representar un anuncio con descripción breve y condición visible.', 280.00, 'MXN', 'ACCESSORIES', 'LIKE_NEW', 'PUBLISHED', TRUE, NOW(), NOW());
