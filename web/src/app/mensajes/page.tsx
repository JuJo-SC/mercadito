import { PublicFeatureIntro } from "@/components/public-feature-guide";
import { listConversationsForStudent } from "@/features/conversations/lib/conversations";
import { getActiveStudent } from "@/features/auth/lib/require-student";
import { ConversationInbox } from "@/features/conversations/components/conversation-inbox";
import { SiteFooter, SiteHeader } from "@/components/site-header";

export const dynamic = "force-dynamic";

export default async function MessagesPage() {
  const student = await getActiveStudent();
  if (!student) return <PublicFeatureIntro feature="messages" />;

  const conversations = await listConversationsForStudent(
    student.id,
    student.universityId,
  );

  const unreadMessageCount = conversations.reduce(
    (total, conversation) => total + conversation.unreadCount,
    0,
  );

  return (
    <>
      <SiteHeader signedIn userName={student.name} universityName={student.university.name} unreadMessageCount={unreadMessageCount} />
      <main className="messages-page page-width task-page">
        <ConversationInbox
          initialConversations={conversations}
          currentUserId={student.id}
        />
      </main>
      <SiteFooter />
    </>
  );
}
