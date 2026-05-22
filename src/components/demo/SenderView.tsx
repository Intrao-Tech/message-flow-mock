import { useState } from "react";
import { toast } from "sonner";
import { PhoneFrame } from "./PhoneFrame";
import { useBroadcast, formatTime } from "@/lib/broadcast-store";
import { Switch } from "@/components/ui/switch";

export function SenderView() {
  const { messages, sendBroadcast } = useBroadcast();
  const [text, setText] = useState("");
  const [reactionsEnabled, setReactionsEnabled] = useState(true);

  const onSend = () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    sendBroadcast(trimmed, reactionsEnabled);
    setText("");
    toast.success("Розсилку надіслано.");
  };

  return (
    <PhoneFrame title="Інформ-бот · Адмін">
      <div className="flex flex-1 flex-col chat-pattern">
        <div className="border-b border-border bg-card/80 px-4 py-3">
          <h2 className="text-sm font-semibold text-foreground">Нова інформаційна розсилка</h2>
          <p className="text-xs text-muted-foreground">Співробітник ВК</p>
        </div>

        <div className="flex-1 overflow-y-auto px-3 py-3 space-y-2">
          {messages.length === 0 ? (
            <p className="mt-8 text-center text-xs text-muted-foreground">
              Ще немає надісланих розсилок
            </p>
          ) : (
            messages.map((m) => (
              <div key={m.id} className="ml-auto max-w-[85%] animate-bubble">
                <div className="rounded-2xl rounded-br-md bg-primary px-3 py-2 text-sm text-primary-foreground shadow-sm">
                  {m.text}
                </div>
                <div className="mt-1 flex items-center justify-end gap-2 text-[10px] text-muted-foreground">
                  <span>{m.reactionsEnabled ? "реакції увімкнено" : "без реакцій"}</span>
                  <span>·</span>
                  <span>{formatTime(m.createdAt)}</span>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="border-t border-border bg-card px-3 py-3 space-y-3">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={3}
            placeholder="Введіть текст повідомлення…"
            className="w-full resize-none rounded-2xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
          />
          <div className="flex items-center justify-between text-xs">
            <label className="flex items-center gap-2 text-foreground">
              <Switch checked={reactionsEnabled} onCheckedChange={setReactionsEnabled} />
              <span>Додавати реакції до розсилки</span>
            </label>
          </div>
          <button
            onClick={onSend}
            disabled={!text.trim()}
            className="w-full rounded-full bg-primary py-2.5 text-sm font-semibold text-primary-foreground transition hover:opacity-90 disabled:opacity-40"
          >
            Надіслати розсилку
          </button>
        </div>
      </div>
    </PhoneFrame>
  );
}
