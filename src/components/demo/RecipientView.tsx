import { useEffect, useMemo, useRef, useState } from "react";
import { PhoneFrame } from "./PhoneFrame";
import { useBroadcast, type BroadcastMessage, type ReactionKind, formatTime } from "@/lib/broadcast-store";

// Chat item kinds rendered in the recipient view
type ChatItem =
  | { kind: "broadcast"; message: BroadcastMessage }
  | { kind: "bot"; id: string; text: string; counter?: { like: number; super: number } }
  | { kind: "user"; id: string; text: string }
  | { kind: "summary"; id: string; recipient: string; topic: string; text: string };

// Feedback flow steps
type FlowStep =
  | null
  | "tabel"
  | "code"
  | "recipient"
  | "topic"
  | "text"
  | "confirm"
  | "done";

interface FlowState {
  step: FlowStep;
  tabel?: string;
  code?: string;
  recipient?: string;
  topic?: string;
  text?: string;
  // which message originated this flow (for context only)
  fromMessageId?: string;
}

const TOPICS = ["Умови праці", "Оплата", "Безпека", "Соціальні питання", "Інше"];

export function RecipientView() {
  const { messages, setReaction, addAppeal } = useBroadcast();

  // Persistent local chat items (bot replies, user replies, summary cards)
  const [extra, setExtra] = useState<ChatItem[]>([]);
  // Per-broadcast "reaction acknowledged" bot reply id (so we update its counter live)
  const ackIdRef = useRef<Map<string, string>>(new Map());

  const [flow, setFlow] = useState<FlowState>({ step: null });
  const [inputValue, setInputValue] = useState("");

  const scrollRef = useRef<HTMLDivElement>(null);

  // Merge broadcasts + extras into a single ordered timeline
  const items: ChatItem[] = useMemo(() => {
    const broadcasts: ChatItem[] = messages.map((m) => ({ kind: "broadcast", message: m }));
    // Insert extras after the broadcast they relate to is tricky; simpler: order by appearance
    // We append extras after broadcasts since they are user-driven post-broadcast.
    return [...broadcasts, ...extra];
  }, [messages, extra]);

  // Update ack counter text when message counts change
  useEffect(() => {
    setExtra((prev) =>
      prev.map((it) => {
        if (it.kind === "bot" && it.counter) {
          const msg = messages.find((m) => ackIdRef.current.get(m.id) === it.id);
          if (msg) return { ...it, counter: { like: msg.likeCount, super: msg.superCount } };
        }
        return it;
      }),
    );
  }, [messages]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [items, flow.step]);

  const pushBot = (text: string, counter?: { like: number; super: number }) => {
    const id = crypto.randomUUID();
    setExtra((p) => [...p, { kind: "bot", id, text, counter }]);
    return id;
  };
  const pushUser = (text: string) => {
    setExtra((p) => [...p, { kind: "user", id: crypto.randomUUID(), text }]);
  };

  const handleReaction = (msg: BroadcastMessage, kind: ReactionKind) => {
    const wasActive = msg.userReaction === kind;
    setReaction(msg.id, kind);

    if (wasActive) return; // removing — no extra bot ack

    // Compute counts after this change
    const like = msg.likeCount + (kind === "like" ? 1 : 0) - (msg.userReaction === "like" ? 1 : 0);
    const sup = msg.superCount + (kind === "super" ? 1 : 0) - (msg.userReaction === "super" ? 1 : 0);

    // If we already have an ack bubble for this message, don't add another
    const existing = ackIdRef.current.get(msg.id);
    if (existing) return;

    const id = pushBot("Вашу реакцію зараховано!", { like, super: sup });
    ackIdRef.current.set(msg.id, id);
  };

  const startFlow = (msgId: string) => {
    setFlow({ step: "tabel", fromMessageId: msgId });
    pushBot(
      "Для звернення потрібна авторизація (вимога сервісу зворотного зв'язку). Введіть ваш табельний номер.",
    );
    setInputValue("");
  };

  const cancelFlow = () => {
    setFlow({ step: null });
    setInputValue("");
    pushBot("Сценарій звернення скасовано.");
  };

  const submitText = () => {
    const v = inputValue.trim();
    if (!v) return;
    if (flow.step === "tabel") {
      if (!/^\d{4,8}$/.test(v)) return;
      pushUser(v);
      setFlow({ ...flow, tabel: v, step: "code" });
      pushBot("Ми надіслали код підтвердження у СМС. Введіть код.");
      setInputValue("");
    } else if (flow.step === "code") {
      if (!/^\d{4,6}$/.test(v)) return;
      pushUser("•".repeat(v.length));
      setFlow({ ...flow, code: v, step: "recipient" });
      pushBot("Кому надіслати звернення?");
      setInputValue("");
    } else if (flow.step === "text") {
      pushUser(v);
      const next = { ...flow, text: v, step: "confirm" as const };
      setFlow(next);
      pushBot("Перевірте звернення перед надсиланням:");
      setExtra((p) => [
        ...p,
        {
          kind: "summary",
          id: crypto.randomUUID(),
          recipient: next.recipient ?? "",
          topic: next.topic ?? "",
          text: next.text ?? "",
        },
      ]);
      setInputValue("");
    }
  };

  const pickRecipient = (r: string) => {
    pushUser(r);
    setFlow({ ...flow, recipient: r, step: "topic" });
    pushBot("Оберіть тему звернення.");
  };
  const pickTopic = (t: string) => {
    pushUser(t);
    setFlow({ ...flow, topic: t, step: "text" });
    pushBot("Опишіть ваше звернення.");
  };

  const confirmSend = () => {
    const ref = addAppeal({
      tabelNumber: flow.tabel ?? "",
      recipient: flow.recipient ?? "",
      topic: flow.topic ?? "",
      text: flow.text ?? "",
    });
    pushUser("Надіслати");
    pushBot(`Ваше звернення зареєстровано. Номер: ${ref}. Відповідь надійде у цей чат.`);
    setFlow({ step: null });
  };

  const renderInputArea = () => {
    if (flow.step === "tabel") {
      return (
        <TextInput
          value={inputValue}
          onChange={setInputValue}
          onSend={submitText}
          placeholder="4–8 цифр"
          inputMode="numeric"
        />
      );
    }
    if (flow.step === "code") {
      return (
        <TextInput
          value={inputValue}
          onChange={setInputValue}
          onSend={submitText}
          placeholder="Код з СМС"
          inputMode="numeric"
        />
      );
    }
    if (flow.step === "recipient") {
      return (
        <OptionRow
          options={["Керівництву підприємства", "МІХ"]}
          onPick={pickRecipient}
          onCancel={cancelFlow}
        />
      );
    }
    if (flow.step === "topic") {
      return <OptionRow options={TOPICS} onPick={pickTopic} onCancel={cancelFlow} />;
    }
    if (flow.step === "text") {
      return (
        <TextInput
          value={inputValue}
          onChange={setInputValue}
          onSend={submitText}
          placeholder="Опишіть звернення…"
          multiline
        />
      );
    }
    if (flow.step === "confirm") {
      return (
        <div className="flex gap-2">
          <button
            onClick={cancelFlow}
            className="flex-1 rounded-full border border-border bg-card py-2 text-sm font-medium"
          >
            Скасувати
          </button>
          <button
            onClick={confirmSend}
            className="flex-1 rounded-full bg-primary py-2 text-sm font-semibold text-primary-foreground"
          >
            Надіслати
          </button>
        </div>
      );
    }
    return (
      <p className="text-center text-xs text-muted-foreground">
        Натисніть реакцію або «Є запитання» під повідомленням бота
      </p>
    );
  };

  return (
    <PhoneFrame>
      <div className="flex flex-1 flex-col overflow-hidden chat-pattern">
        <div ref={scrollRef} className="flex-1 overflow-y-auto px-3 py-3 space-y-3">
          {items.length === 0 && (
            <p className="mt-8 text-center text-xs text-muted-foreground">
              Поки повідомлень немає. Надішліть розсилку з вкладки «Співробітник ВК».
            </p>
          )}
          {items.map((it, idx) => {
            if (it.kind === "broadcast") {
              const m = it.message;
              return (
                <div key={m.id} className="animate-bubble">
                  <BotBubble text={m.text} time={formatTime(m.createdAt)} />
                  {m.reactionsEnabled && (
                    <div className="mt-1.5 ml-1 flex flex-wrap gap-1.5">
                      <ReactionChip
                        emoji="👍"
                        label="Лайк"
                        active={m.userReaction === "like"}
                        onClick={() => handleReaction(m, "like")}
                      />
                      <ReactionChip
                        emoji="❤️"
                        label="Супер"
                        active={m.userReaction === "super"}
                        onClick={() => handleReaction(m, "super")}
                      />
                      <ReactionChip
                        emoji="❓"
                        label="Є запитання"
                        onClick={() => startFlow(m.id)}
                        disabled={flow.step !== null}
                      />
                    </div>
                  )}
                </div>
              );
            }
            if (it.kind === "bot") {
              return (
                <div key={it.id} className="animate-bubble">
                  <BotBubble text={it.text} />
                  {it.counter && (
                    <div className="ml-3 mt-1 text-xs text-muted-foreground">
                      👍 {it.counter.like} | ❤️ {it.counter.super}
                    </div>
                  )}
                </div>
              );
            }
            if (it.kind === "user") {
              return (
                <div key={it.id} className="animate-bubble flex justify-end">
                  <div className="max-w-[80%] rounded-2xl rounded-br-md bg-primary px-3 py-2 text-sm text-primary-foreground shadow-sm">
                    {it.text}
                  </div>
                </div>
              );
            }
            if (it.kind === "summary") {
              return (
                <div key={it.id} className="animate-bubble">
                  <div className="max-w-[90%] rounded-2xl rounded-bl-md border border-border bg-card px-3 py-2 text-xs shadow-sm space-y-1">
                    <Row label="Отримувач" value={it.recipient} />
                    <Row label="Тема" value={it.topic} />
                    <Row label="Текст" value={it.text} />
                  </div>
                </div>
              );
            }
            return null;
          })}
        </div>
        <div className="border-t border-border bg-card px-3 py-3 space-y-2">
          {flow.step !== null && flow.step !== "confirm" && (
            <button
              onClick={cancelFlow}
              className="text-[11px] text-muted-foreground underline underline-offset-2 hover:text-foreground"
            >
              Скасувати сценарій
            </button>
          )}
          {renderInputArea()}
        </div>
      </div>
    </PhoneFrame>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-2">
      <span className="w-20 shrink-0 font-medium text-muted-foreground">{label}:</span>
      <span className="text-foreground break-words">{value}</span>
    </div>
  );
}

function BotBubble({ text, time }: { text: string; time?: string }) {
  return (
    <div className="max-w-[85%]">
      <div className="rounded-2xl rounded-bl-md bg-card px-3 py-2 text-sm text-foreground shadow-sm border border-border/60">
        {text}
      </div>
      {time && <div className="ml-2 mt-0.5 text-[10px] text-muted-foreground">{time}</div>}
    </div>
  );
}

function ReactionChip({
  emoji,
  label,
  active,
  onClick,
  disabled,
}: {
  emoji: string;
  label: string;
  active?: boolean;
  onClick?: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs transition disabled:opacity-40 ${
        active
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border bg-card text-foreground hover:border-primary/50"
      }`}
    >
      <span>{emoji}</span>
      <span>{label}</span>
    </button>
  );
}

function TextInput({
  value,
  onChange,
  onSend,
  placeholder,
  inputMode,
  multiline,
}: {
  value: string;
  onChange: (v: string) => void;
  onSend: () => void;
  placeholder?: string;
  inputMode?: "text" | "numeric";
  multiline?: boolean;
}) {
  return (
    <div className="flex items-end gap-2">
      {multiline ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={2}
          className="flex-1 resize-none rounded-2xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
        />
      ) : (
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          inputMode={inputMode}
          onKeyDown={(e) => e.key === "Enter" && onSend()}
          className="flex-1 rounded-full border border-border bg-background px-4 py-2 text-sm outline-none focus:border-primary"
        />
      )}
      <button
        onClick={onSend}
        disabled={!value.trim()}
        className="h-9 rounded-full bg-primary px-4 text-sm font-semibold text-primary-foreground disabled:opacity-40"
      >
        ↑
      </button>
    </div>
  );
}

function OptionRow({
  options,
  onPick,
  onCancel: _onCancel,
}: {
  options: string[];
  onPick: (v: string) => void;
  onCancel: () => void;
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((o) => (
        <button
          key={o}
          onClick={() => onPick(o)}
          className="rounded-full border border-primary/40 bg-card px-3 py-1.5 text-xs font-medium text-foreground hover:bg-primary hover:text-primary-foreground transition"
        >
          {o}
        </button>
      ))}
    </div>
  );
}
