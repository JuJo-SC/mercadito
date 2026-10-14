CREATE TABLE "StudentPrivateProfile" (
    "userId" TEXT NOT NULL,
    "fullName" VARCHAR(180) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "StudentPrivateProfile_pkey" PRIMARY KEY ("userId")
);
ALTER TABLE "StudentPrivateProfile" ADD CONSTRAINT "StudentPrivateProfile_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
