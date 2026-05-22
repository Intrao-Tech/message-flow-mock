import { createContext, useContext, useMemo, useState, type ReactNode } from "react";

export type ReactionKind = "like" | "super";

export interface BroadcastMessage {
  id: string;
  text: string;
  reactionsEnabled: boolean;
  createdAt: number;
  likeCount: number;
  superCount: number;
  userReaction: ReactionKind | null;
}

export interface Appeal {
  id: string;
  ref: string;
  tabelNumber: string;
  recipient: string;
  topic: string;
  text: string;
  createdAt: number;
}

interface Ctx {
  messages: BroadcastMessage[];
  appeals: Appeal[];
  sendBroadcast: (text: string, reactionsEnabled: boolean) => void;
  setReaction: (messageId: string, kind: ReactionKind) => void;
  addAppeal: (a: Omit<Appeal, "id" | "ref" | "createdAt">) => string;
}

const BroadcastCtx = createContext<Ctx | null>(null);

export function BroadcastProvider({ children }: { children: ReactNode }) {
  const [messages, setMessages] = useState<BroadcastMessage[]>([]);
  const [appeals, setAppeals] = useState<Appeal[]>([]);

  const value = useMemo<Ctx>(
    () => ({
      messages,
      appeals,
      sendBroadcast: (text, reactionsEnabled) => {
        setMessages((prev) => [
          ...prev,
          {
            id: crypto.randomUUID(),
            text,
            reactionsEnabled,
            createdAt: Date.now(),
            likeCount: 100,
            superCount: 20,
            userReaction: null,
          },
        ]);
      },
      setReaction: (messageId, kind) => {
        setMessages((prev) =>
          prev.map((m) => {
            if (m.id !== messageId) return m;
            const prevReaction = m.userReaction;
            let likeCount = m.likeCount;
            let superCount = m.superCount;
            let next: ReactionKind | null = kind;

            if (prevReaction === kind) {
              next = null;
              if (kind === "like") likeCount -= 1;
              else superCount -= 1;
            } else {
              if (prevReaction === "like") likeCount -= 1;
              if (prevReaction === "super") superCount -= 1;
              if (kind === "like") likeCount += 1;
              else superCount += 1;
            }
            return { ...m, userReaction: next, likeCount, superCount };
          }),
        );
      },
      addAppeal: (a) => {
        const ref = `#ZV-${Math.floor(100000 + Math.random() * 900000)}`;
        const id = crypto.randomUUID();
        setAppeals((prev) => [...prev, { ...a, id, ref, createdAt: Date.now() }]);
        return ref;
      },
    }),
    [messages, appeals],
  );

  return <BroadcastCtx.Provider value={value}>{children}</BroadcastCtx.Provider>;
}

export function useBroadcast() {
  const c = useContext(BroadcastCtx);
  if (!c) throw new Error("useBroadcast must be inside BroadcastProvider");
  return c;
}

export function formatTime(ts: number) {
  return new Date(ts).toLocaleTimeString("uk-UA", { hour: "2-digit", minute: "2-digit" });
}
