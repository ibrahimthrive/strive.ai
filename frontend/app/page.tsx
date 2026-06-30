import { Suspense } from "react";

import ChatInterface from "@/components/ChatInterface";
import StriveSplash from "@/components/brand/StriveSplash";
import { ConversationsProvider } from "@/lib/conversations-context";

export default function HomePage() {
  return (
    <ConversationsProvider>
      <Suspense fallback={<StriveSplash />}>
        <ChatInterface />
      </Suspense>
    </ConversationsProvider>
  );
}
