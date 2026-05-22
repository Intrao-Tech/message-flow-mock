import { toast } from "sonner";
import { useBroadcast, formatTime } from "@/lib/broadcast-store";

export function ReportView() {
  const { messages, appeals } = useBroadcast();

  return (
    <div className="mx-auto w-full max-w-4xl space-y-8">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-foreground">Звіт</h2>
          <p className="text-sm text-muted-foreground">
            Реєстр реакцій та звернень, що формуються прототипом.
          </p>
        </div>
        <button
          onClick={() =>
            toast("Демо: експорт недоступний у прототипі")
          }
          className="rounded-full border border-border bg-card px-4 py-2 text-sm font-medium hover:bg-accent"
        >
          Експортувати в Excel (демо)
        </button>
      </header>

      <section className="space-y-3">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Реакції
        </h3>
        {messages.length === 0 ? (
          <EmptyCard text="Ще немає надісланих розсилок" />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {messages.map((m) => (
              <div key={m.id} className="rounded-xl border border-border bg-card p-4 shadow-sm">
                <p className="line-clamp-2 text-sm text-foreground">{m.text}</p>
                <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                  <span>
                    {m.reactionsEnabled ? "Реакції увімкнено" : "Без реакцій"} ·{" "}
                    {formatTime(m.createdAt)}
                  </span>
                  <span className="font-medium text-foreground">
                    👍 {m.likeCount} | ❤️ {m.superCount}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="space-y-3">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Звернення
        </h3>
        {appeals.length === 0 ? (
          <EmptyCard text="Ще немає поданих звернень" />
        ) : (
          <div className="overflow-x-auto rounded-xl border border-border bg-card shadow-sm">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-left text-xs uppercase text-muted-foreground">
                <tr>
                  <Th>Номер</Th>
                  <Th>Табельний</Th>
                  <Th>Отримувач</Th>
                  <Th>Тема</Th>
                  <Th>Текст</Th>
                  <Th>Час</Th>
                </tr>
              </thead>
              <tbody>
                {appeals.map((a) => (
                  <tr key={a.id} className="border-t border-border">
                    <Td className="font-mono text-xs">{a.ref}</Td>
                    <Td>{a.tabelNumber}</Td>
                    <Td>{a.recipient}</Td>
                    <Td>{a.topic}</Td>
                    <Td className="max-w-[260px] truncate">{a.text}</Td>
                    <Td className="whitespace-nowrap text-xs text-muted-foreground">
                      {formatTime(a.createdAt)}
                    </Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return <th className="px-3 py-2 font-medium">{children}</th>;
}
function Td({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <td className={`px-3 py-2 align-top ${className}`}>{children}</td>;
}
function EmptyCard({ text }: { text: string }) {
  return (
    <div className="rounded-xl border border-dashed border-border bg-card/50 px-4 py-8 text-center text-sm text-muted-foreground">
      {text}
    </div>
  );
}
