import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Toaster } from "@/components/ui/sonner";
import { BroadcastProvider } from "@/lib/broadcast-store";
import { SenderView } from "@/components/demo/SenderView";
import { RecipientView } from "@/components/demo/RecipientView";
import { ReportView } from "@/components/demo/ReportView";

export const Route = createFileRoute("/")({
  component: Index,
});

type Tab = "sender" | "recipient" | "report";

const TABS: { id: Tab; label: string }[] = [
  { id: "sender", label: "Співробітник ВК" },
  { id: "recipient", label: "Користувач" },
  { id: "report", label: "Звіт" },
];

function Index() {
  const [tab, setTab] = useState<Tab>("sender");

  return (
    <BroadcastProvider>
      <div className="min-h-screen bg-background">
        <Toaster position="top-center" />
        <header className="border-b border-border bg-card/70 backdrop-blur">
          <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-lg font-semibold text-foreground">
                Інформ-бот · Демо корпоративної розсилки
              </h1>
              <p className="text-xs text-muted-foreground">
                Прототип: реакції, звернення, звітність. Стан зберігається у пам'яті браузера.
              </p>
            </div>
            <div className="inline-flex rounded-full border border-border bg-muted p-1 text-sm">
              {TABS.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className={`rounded-full px-3 py-1.5 text-xs font-medium transition sm:text-sm ${
                    tab === t.id
                      ? "bg-primary text-primary-foreground shadow"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-6xl px-4 py-6">
          {/* Desktop: two phones side by side */}
          <div className="hidden lg:block">
            {tab === "report" ? (
              <ReportView />
            ) : (
              <div className="grid grid-cols-2 gap-8">
                <div>
                  <SectionLabel
                    title="Співробітник ВК"
                    active={tab === "sender"}
                  />
                  <SenderView />
                </div>
                <div>
                  <SectionLabel
                    title="Користувач"
                    active={tab === "recipient"}
                  />
                  <RecipientView />
                </div>
              </div>
            )}
          </div>

          {/* Mobile / tablet: one view at a time */}
          <div className="lg:hidden">
            {tab === "sender" && <SenderView />}
            {tab === "recipient" && <RecipientView />}
            {tab === "report" && <ReportView />}
          </div>
        </main>
      </div>
    </BroadcastProvider>
  );
}

function SectionLabel({ title, active }: { title: string; active: boolean }) {
  return (
    <div className="mb-3 flex items-center justify-center gap-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
      <span className={active ? "text-primary" : ""}>{title}</span>
      {active && <span className="h-1 w-1 rounded-full bg-primary" />}
    </div>
  );
}
