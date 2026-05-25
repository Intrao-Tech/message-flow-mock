import { useEffect, useMemo, useRef, useState } from "react";
import { Mic, RotateCcw, Send, Sparkles, BookOpen } from "lucide-react";
import yuriiPhoto from "@/assets/exec-yurii.png";
import oleksiiPhoto from "@/assets/exec-oleksii.png";
import yuliaPhoto from "@/assets/exec-yulia.png";

type Executive = {
  id: string;
  name: string;
  position: string;
  initials: string;
  photo?: string;
  questions: string[];
  answers: string[];
};

const EXECUTIVES: Executive[] = [
  {
    id: "ceo",
    name: "Юрій Ріженков",
    position: "Головний виконавчий директор (CEO)",
    initials: "ЮР",
    photo: yuriiPhoto,
    questions: [
      "Які ключові пріоритети компанії на цей квартал?",
      "Як компанія реагує на поточні ринкові виклики?",
      "Чи плануються зміни в структурі управління?",
    ],
    answers: [
      "Цього кварталу фокус на трьох напрямах: безпека виробництва, виконання плану з відвантажень і запуск ключових інвестиційних проєктів. Прошу керівників підрозділів тримати ці цілі в пріоритеті та щотижня звітувати про прогрес.",
      "Ми адаптуємо виробничі плани під попит і працюємо над диверсифікацією ринків збуту. Головне зараз — гнучкість і збереження операційної ефективності без компромісів щодо безпеки.",
      "Суттєвих змін у структурі не передбачається. Ми точково посилюємо команди в напрямах сталого розвитку та цифровізації. Про будь-які рішення команда дізнається першою.",
    ],
  },
  {
    id: "cso",
    name: "Олексій Комлик",
    position: "Директор зі сталого розвитку (CSO)",
    initials: "ОК",
    photo: oleksiiPhoto,
    questions: [
      "Які цілі зі сталого розвитку на цей рік?",
      "Як ми зменшуємо вуглецевий слід?",
      "Що нового в програмах охорони праці?",
    ],
    answers: [
      "Ключові цілі — зниження викидів CO₂, підвищення енергоефективності та розвиток програм циркулярної економіки. Ми рухаємось згідно із затвердженою стратегією декарбонізації і йдемо в графіку.",
      "Через модернізацію обладнання, перехід на зеленішу енергію та оптимізацію логістики. Кожен підрозділ має власні цільові показники, і ми відстежуємо їх щомісяця.",
      "Ми посилюємо культуру безпеки: оновлюємо навчання, впроваджуємо цифровий моніторинг ризиків. Безпека людей — беззаперечний пріоритет, вищий за будь-які виробничі показники.",
    ],
  },
  {
    id: "cfo",
    name: "Юлія Данкова",
    position: "Фінансовий директор (CFO)",
    initials: "ЮД",
    photo: yuliaPhoto,
    questions: [
      "Який стан бюджету на наступний рік?",
      "Чи погоджено фінансування нового проєкту?",
      "Як ми оптимізуємо витрати?",
    ],
    answers: [
      "Бюджет на наступний рік у фінальній стадії погодження. Ми зберігаємо консервативний підхід до витрат і пріоритезуємо інвестиції з найшвидшою окупністю. Деталі доведемо до підрозділів після затвердження.",
      "Проєкт проходить фінальну оцінку рентабельності. Попередньо фінансування підтверджено за умови виконання контрольних показників першого етапу. Рішення очікуємо найближчим часом.",
      "Фокус на ефективності закупівель, енергоспоживанні та автоматизації процесів. Мета — скоротити операційні витрати без впливу на виробництво та людей.",
    ],
  },
];

type Msg = { id: string; role: "user" | "assistant"; text: string; execId: string };
type Status = "idle" | "listening" | "thinking" | "speaking";

const STATUS_LABEL: Record<Status, string> = {
  idle: "Готовий допомогти",
  listening: "Слухаю…",
  thinking: "Думаю…",
  speaking: "Відповідає…",
};

function Avatar({
  exec,
  size = 56,
  ring = false,
  pulsing = false,
  onClick,
}: {
  exec: Executive;
  size?: number;
  ring?: boolean;
  pulsing?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative inline-flex items-center justify-center rounded-full transition ${
        onClick ? "cursor-pointer" : "cursor-default"
      }`}
      style={{ width: size, height: size }}
    >
      {ring && (
        <span
          className={`absolute inset-0 rounded-full ring-4 ring-sky-400/60 ${
            pulsing ? "animate-pulse" : ""
          }`}
          style={{ boxShadow: "0 0 30px 6px rgba(96,165,250,0.55)" }}
        />
      )}
      <span
        className="relative overflow-hidden rounded-full bg-gradient-to-br from-sky-400 to-blue-600 text-white font-semibold flex items-center justify-center"
        style={{ width: size, height: size, fontSize: size * 0.32 }}
      >
        {exec.photo ? (
          <img src={exec.photo} alt={exec.name} className="h-full w-full object-cover" />
        ) : (
          exec.initials
        )}
      </span>
    </button>
  );
}

function SoundWave({ active }: { active: boolean }) {
  return (
    <div className="flex h-5 items-end gap-[3px]">
      {[0, 1, 2, 3, 4, 5, 6].map((i) => (
        <span
          key={i}
          className={`w-[3px] rounded-full bg-sky-500 ${active ? "animate-wave" : "opacity-40"}`}
          style={{
            animationDelay: `${i * 80}ms`,
            height: active ? "100%" : "30%",
          }}
        />
      ))}
    </div>
  );
}

const SR_CTOR: any =
  typeof window !== "undefined"
    ? (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    : null;
const SPEECH_SUPPORTED = Boolean(SR_CTOR);

export function VoiceAssistantView() {
  const [selectedId, setSelectedId] = useState(EXECUTIVES[0].id);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [status, setStatus] = useState<Status>("idle");
  const [input, setInput] = useState("");
  const [listening, setListening] = useState(false);
  const [micError, setMicError] = useState<string | null>(null);
  const [pointers, setPointers] = useState<Record<string, number>>({
    ceo: 0,
    cso: 0,
    cfo: 0,
  });
  const recognitionRef = useRef<any>(null);
  const finalTextRef = useRef<string>("");
  const feedRef = useRef<HTMLDivElement>(null);
  const selectedIdRef = useRef(selectedId);

  const selected = useMemo(
    () => EXECUTIVES.find((e) => e.id === selectedId)!,
    [selectedId],
  );
  const feed = messages.filter((m) => m.execId === selectedId);

  useEffect(() => {
    feedRef.current?.scrollTo({ top: feedRef.current.scrollHeight, behavior: "smooth" });
  }, [feed.length, status]);

  // Stop any active recognition when switching executive or unmounting.
  const stopRecognition = () => {
    const rec = recognitionRef.current;
    if (rec) {
      try {
        rec.onresult = null;
        rec.onend = null;
        rec.onerror = null;
        rec.stop();
      } catch {
        /* ignore */
      }
      recognitionRef.current = null;
    }
    setListening(false);
  };

  useEffect(() => {
    selectedIdRef.current = selectedId;
    stopRecognition();
    setInput("");
    finalTextRef.current = "";
    setStatus("idle");
    if (typeof window !== "undefined") window.speechSynthesis?.cancel();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId]);

  useEffect(() => {
    return () => {
      stopRecognition();
      if (typeof window !== "undefined") window.speechSynthesis?.cancel();
    };
  }, []);

  const speak = (text: string) => {
    try {
      if (typeof window === "undefined" || !window.speechSynthesis) return;
      const u = new SpeechSynthesisUtterance(text);
      u.lang = "uk-UA";
      const v = window.speechSynthesis.getVoices().find((v) => v.lang?.startsWith("uk"));
      if (v) u.voice = v;
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(u);
    } catch {
      /* ignore */
    }
  };

  const handleAsk = (question: string) => {
    const q = question.trim();
    if (!q) return;
    setInput("");
    finalTextRef.current = "";
    const execId = selectedIdRef.current;
    const exec = EXECUTIVES.find((e) => e.id === execId)!;
    const userMsg: Msg = { id: crypto.randomUUID(), role: "user", text: q, execId };
    setMessages((m) => [...m, userMsg]);
    setStatus("thinking");

    setTimeout(() => {
      setStatus("speaking");
      let idx = 0;
      setPointers((p) => {
        idx = p[execId] ?? 0;
        return { ...p, [execId]: (idx + 1) % exec.answers.length };
      });
      const answer = exec.answers[idx % exec.answers.length];
      const aiMsg: Msg = {
        id: crypto.randomUUID(),
        role: "assistant",
        text: answer,
        execId,
      };
      setMessages((m) => [...m, aiMsg]);
      speak(answer);
      const duration = Math.min(6000, 1500 + answer.length * 30);
      setTimeout(() => setStatus("idle"), duration);
    }, 1000);
  };

  const startListening = () => {
    if (!SPEECH_SUPPORTED) return;
    if (listening) {
      stopRecognition();
      return;
    }
    setMicError(null);
    finalTextRef.current = "";
    setInput("");

    const rec = new SR_CTOR();
    rec.lang = "uk-UA";
    rec.interimResults = true;
    rec.continuous = false;

    rec.onresult = (e: any) => {
      let interim = "";
      let finalText = finalTextRef.current;
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const r = e.results[i];
        if (r.isFinal) finalText += r[0].transcript;
        else interim += r[0].transcript;
      }
      finalTextRef.current = finalText;
      setInput((finalText + interim).trim());
    };

    rec.onerror = (e: any) => {
      if (e?.error === "not-allowed" || e?.error === "service-not-allowed") {
        setMicError("Доступ до мікрофона відхилено");
      } else if (e?.error === "no-speech") {
        setMicError("Не вдалося розпізнати мовлення");
      }
      setListening(false);
      setStatus("idle");
      recognitionRef.current = null;
    };

    rec.onend = () => {
      setListening(false);
      setStatus("idle");
      const finalQ = finalTextRef.current.trim();
      recognitionRef.current = null;
      if (finalQ) handleAsk(finalQ);
    };

    recognitionRef.current = rec;
    setListening(true);
    setStatus("listening");
    try {
      rec.start();
    } catch (err) {
      setListening(false);
      setStatus("idle");
      recognitionRef.current = null;
    }
  };

  const reset = () => {
    stopRecognition();
    if (typeof window !== "undefined") window.speechSynthesis?.cancel();
    setPointers((p) => ({ ...p, [selectedId]: 0 }));
    setMessages((m) => m.filter((msg) => msg.execId !== selectedId));
    setStatus("idle");
    setInput("");
    finalTextRef.current = "";
  };



  return (
    <div className="mx-auto max-w-6xl">
      <style>{`
        @keyframes wave { 0%,100%{height:30%} 50%{height:100%} }
        .animate-wave { animation: wave 0.9s ease-in-out infinite; }
        @keyframes glow-pulse { 0%,100%{ box-shadow: 0 0 40px 6px rgba(96,165,250,0.5)} 50%{ box-shadow: 0 0 60px 14px rgba(96,165,250,0.85)} }
        .glow-pulse { animation: glow-pulse 1.4s ease-in-out infinite; }
      `}</style>

      {/* Header */}
      <div className="mb-6 flex items-center justify-between gap-3 rounded-2xl border border-sky-100 bg-white/70 px-5 py-4 backdrop-blur">
        <div>
          <h2 className="font-[Poppins,system-ui] text-xl font-semibold text-slate-900">
            Голосовий помічник керівництва
          </h2>
          <p className="text-xs text-slate-500">Корпоративний AI-асистент</p>
        </div>
        <span className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-sky-500 to-blue-600 px-3 py-1 text-xs font-semibold text-white shadow">
          <Sparkles className="h-3 w-3" /> AI
        </span>
      </div>

      {/* Executive switcher */}
      <div className="mb-6 flex flex-wrap items-start justify-center gap-4 sm:gap-8">
        {EXECUTIVES.map((e) => {
          const active = e.id === selectedId;
          return (
            <div key={e.id} className="flex w-28 flex-col items-center text-center sm:w-36">
              <Avatar
                exec={e}
                size={72}
                ring={active}
                onClick={() => setSelectedId(e.id)}
              />
              <div className="mt-2 text-xs font-semibold text-slate-900 sm:text-sm">
                {e.name}
              </div>
              <div className="text-[10px] leading-tight text-slate-500 sm:text-xs">
                {e.position}
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        {/* Knowledge panel */}
        <aside className="rounded-2xl border border-sky-100 bg-white/70 p-4 backdrop-blur">
          <div className="mb-3 flex items-center gap-2 text-xs text-slate-600">
            <BookOpen className="h-4 w-4 text-sky-600" />
            <span>
              <strong className="text-slate-900">База знань:</strong> 247 документів, оновлено
              сьогодні
            </span>
          </div>
          <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
            Приклади запитань
          </div>
          <ul className="space-y-2">
            {selected.questions.map((q) => (
              <li key={q}>
                <button
                  onClick={() => handleAsk(q)}
                  disabled={status !== "idle"}
                  className="w-full rounded-xl border border-sky-100 bg-sky-50/50 px-3 py-2 text-left text-xs text-slate-700 transition hover:border-sky-300 hover:bg-sky-50 disabled:opacity-50"
                >
                  {q}
                </button>
              </li>
            ))}
          </ul>
        </aside>

        {/* Main assistant */}
        <section className="rounded-2xl border border-sky-100 bg-gradient-to-b from-white/90 to-sky-50/60 p-6 backdrop-blur">
          {/* Central avatar */}
          <div className="flex flex-col items-center">
            <div
              className={`relative rounded-full p-2 ${status === "speaking" ? "glow-pulse" : ""}`}
            >
              <Avatar
                exec={selected}
                size={140}
                ring
                pulsing={status === "speaking" || status === "listening"}
              />
            </div>
            <div className="mt-4 font-[Poppins,system-ui] text-lg font-semibold text-slate-900">
              {selected.name}
            </div>
            <div className="text-xs text-slate-500">{selected.position}</div>
            <div className="mt-3 flex items-center gap-2 rounded-full bg-white px-4 py-1.5 text-xs font-medium text-sky-700 shadow-sm">
              <SoundWave active={status === "speaking" || status === "listening"} />
              {STATUS_LABEL[status]}
            </div>
          </div>

          {/* Chat feed */}
          <div
            ref={feedRef}
            className="mt-6 h-72 space-y-3 overflow-y-auto rounded-xl bg-white/70 p-4"
          >
            {feed.length === 0 && (
              <div className="flex h-full items-center justify-center text-center text-xs text-slate-400">
                Поставте запитання голосом або текстом — {selected.name} відповість.
              </div>
            )}
            {feed.map((m) => (
              <div
                key={m.id}
                className={`flex items-end gap-2 ${m.role === "user" ? "justify-end" : "justify-start"}`}
              >
                {m.role === "assistant" && <Avatar exec={selected} size={28} />}
                <div
                  className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm shadow-sm ${
                    m.role === "user"
                      ? "rounded-br-sm bg-gradient-to-br from-sky-500 to-blue-600 text-white"
                      : "rounded-bl-sm bg-white text-slate-800 border border-slate-100"
                  }`}
                >
                  {m.text}
                </div>
              </div>
            ))}
            {status === "thinking" && (
              <div className="flex items-end gap-2">
                <Avatar exec={selected} size={28} />
                <div className="rounded-2xl rounded-bl-sm border border-slate-100 bg-white px-3 py-2 text-sm text-slate-500">
                  <span className="inline-flex gap-1">
                    <span className="h-2 w-2 animate-bounce rounded-full bg-sky-400" style={{ animationDelay: "0ms" }} />
                    <span className="h-2 w-2 animate-bounce rounded-full bg-sky-400" style={{ animationDelay: "120ms" }} />
                    <span className="h-2 w-2 animate-bounce rounded-full bg-sky-400" style={{ animationDelay: "240ms" }} />
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Controls */}
          <div className="mt-5 flex flex-col items-center gap-3">
            <button
              onClick={startListening}
              disabled={status === "thinking" || status === "speaking"}
              className={`relative flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-sky-500 to-blue-600 text-white shadow-lg transition active:scale-95 disabled:opacity-50 ${
                listening ? "animate-pulse ring-4 ring-sky-300" : ""
              }`}
              aria-label="Записати голос"
            >
              <Mic className="h-7 w-7" />
            </button>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleAsk(input);
              }}
              className="flex w-full max-w-xl items-center gap-2"
            >
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Введіть запитання…"
                className="flex-1 rounded-full border border-sky-200 bg-white px-4 py-2 text-sm outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
              />
              <button
                type="submit"
                disabled={!input.trim() || status === "thinking" || status === "speaking"}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-sky-600 text-white shadow disabled:opacity-40"
              >
                <Send className="h-4 w-4" />
              </button>
            </form>

            <button
              onClick={reset}
              className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800"
            >
              <RotateCcw className="h-3.5 w-3.5" /> Почати спочатку
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
