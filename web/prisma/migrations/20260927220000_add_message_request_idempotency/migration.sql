ALTER TABLE "Message" ADD COLUMN "clientRequestId" UUID;

CREATE UNIQUE INDEX "Message_clientRequestId_key" ON "Message"("clientRequestId");
