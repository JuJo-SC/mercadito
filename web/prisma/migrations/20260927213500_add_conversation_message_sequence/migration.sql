ALTER TABLE "Conversation"
ADD COLUMN "lastMessageSequence" INTEGER NOT NULL DEFAULT 0;

ALTER TABLE "Message"
ADD COLUMN "sequence" INTEGER NOT NULL DEFAULT 0;

WITH ordered_messages AS (
  SELECT
    "id",
    ROW_NUMBER() OVER (
      PARTITION BY "conversationId"
      ORDER BY "createdAt" ASC, "id" ASC
    )::INTEGER AS "sequence"
  FROM "Message"
)
UPDATE "Message" AS message
SET "sequence" = ordered_messages."sequence"
FROM ordered_messages
WHERE message."id" = ordered_messages."id";

UPDATE "Conversation" AS conversation
SET "lastMessageSequence" = COALESCE(
  (
    SELECT MAX(message."sequence")
    FROM "Message" AS message
    WHERE message."conversationId" = conversation."id"
  ),
  0
);

DROP INDEX IF EXISTS "Message_conversationId_createdAt_id_idx";

CREATE UNIQUE INDEX "Message_conversationId_sequence_key"
ON "Message"("conversationId", "sequence");

CREATE FUNCTION public.mercadito_assign_message_sequence()
RETURNS trigger AS $function$
BEGIN
  UPDATE "Conversation"
  SET "lastMessageSequence" = "lastMessageSequence" + 1
  WHERE "id" = NEW."conversationId"
  RETURNING "lastMessageSequence" INTO NEW."sequence";

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Cannot sequence a message without conversation %', NEW."conversationId";
  END IF;

  RETURN NEW;
END;
$function$ LANGUAGE plpgsql;

CREATE TRIGGER "Message_assign_sequence_before_insert"
BEFORE INSERT ON "Message"
FOR EACH ROW
EXECUTE FUNCTION public.mercadito_assign_message_sequence();
