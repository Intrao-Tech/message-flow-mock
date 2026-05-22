import type { ReactNode } from "react";

export function PhoneFrame({ children, title = "Інформ-бот" }: { children: ReactNode; title?: string }) {
  return (
    <div className="mx-auto w-full max-w-[400px] overflow-hidden rounded-[2.5rem] border-8 border-neutral-800 bg-neutral-900 shadow-2xl">
      <div className="flex h-6 items-center justify-center bg-neutral-900 text-[10px] text-neutral-400">
        •••
      </div>
      <div className="flex h-[640px] flex-col bg-white">
        <div className="flex items-center gap-3 border-b border-border bg-primary px-4 py-3 text-primary-foreground">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20 text-lg font-semibold">
            ІБ
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-semibold">{title}</span>
            <span className="text-xs text-white/70">онлайн</span>
          </div>
        </div>
        {children}
      </div>
    </div>
  );
}
