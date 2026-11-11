import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  BookOpen,
  Check,
  CheckCircle2,
  ChevronRight,
  CircleHelp,
  Clock3,
  Plus,
  Sparkles,
  Target,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  getAttendanceRate,
  getAttendanceRisk,
  getRequiredClasses,
  getSafeBunks,
  type AttendanceCounts,
  type AttendanceRisk,
} from "@/lib/attendance";

type Subject = {
  id: string;
  name: string;
  code: string;
  faculty: string;
  color: "green" | "blue" | "amber" | "rose" | "violet";
  present: number;
  absent: number;
};

const STORAGE_KEY = "classmate.attendance.subjects.v1";
const TARGET = 75;

function createSampleSubjects(): Subject[] {
  return [
    { id: "ds", name: "Data Structures", code: "CS 204", faculty: "Dr. N. Sharma", color: "green", present: 18, absent: 4 },
    { id: "math", name: "Engineering Mathematics", code: "MA 201", faculty: "Prof. R. Iyer", color: "blue", present: 23, absent: 9 },
    { id: "dbms", name: "Database Systems", code: "CS 208", faculty: "Dr. P. Mehta", color: "amber", present: 17, absent: 3 },
    { id: "os", name: "Operating Systems", code: "CS 210", faculty: "Prof. A. Rao", color: "rose", present: 14, absent: 5 },
    { id: "comms", name: "Technical Communication", code: "HU 202", faculty: "Ms. S. Kapoor", color: "violet", present: 20, absent: 2 },
  ];
}

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Classmate — Attendance & Bunk Calculator" },
      { name: "description", content: "Track attendance by subject, see how many classes you can safely miss, and plan how to get back on track." },
      { property: "og:title", content: "Classmate — Attendance & Bunk Calculator" },
      { property: "og:description", content: "Know where you stand in every class and how many absences you can safely afford." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AttendanceDashboard,
});

function AttendanceDashboard() {
  const [subjects, setSubjects] = useState<Subject[]>(() => createSampleSubjects());
  const [ready, setReady] = useState(false);
  const [selectedId, setSelectedId] = useState("ds");
  const [addOpen, setAddOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newCode, setNewCode] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed: unknown = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.every(isSubject)) {
          setSubjects(parsed);
          if (parsed.length > 0 && !parsed.some((subject) => subject.id === selectedId)) {
            setSelectedId(parsed[0].id);
          }
        }
      }
    } catch {
      // Keep the in-memory sample data if browser storage is unavailable.
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(subjects));
      setSaved(true);
      const timeout = window.setTimeout(() => setSaved(false), 1600);
      return () => window.clearTimeout(timeout);
    } catch {
      setSaved(false);
    }
  }, [ready, subjects]);

  const selected = subjects.find((subject) => subject.id === selectedId) ?? subjects[0];
  const overall = useMemo(() => {
    const counts = subjects.reduce((result, subject) => ({
      present: result.present + subject.present,
      absent: result.absent + subject.absent,
    }), { present: 0, absent: 0 });
    return { ...counts, rate: getAttendanceRate(counts), safeBunks: getSafeBunks(counts) };
  }, [subjects]);
  const needsAttention = subjects.filter((subject) => getAttendanceRisk(subject) === "below-target").length;

  function updateAttendance(id: string, status: "present" | "absent") {
    setSubjects((current) => current.map((subject) => subject.id === id
      ? { ...subject, [status]: subject[status] + 1 }
      : subject));
  }

  function addSubject(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const name = newName.trim();
    const code = newCode.trim().toUpperCase();
    if (!name || !code) return;
    const subject: Subject = {
      id: `subject-${Date.now()}`,
      name,
      code,
      faculty: "Add faculty name",
      color: (["green", "blue", "amber", "rose", "violet"] as const)[subjects.length % 5],
      present: 0,
      absent: 0,
    };
    setSubjects((current) => [...current, subject]);
    setSelectedId(subject.id);
    setNewName("");
    setNewCode("");
    setAddOpen(false);
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border/80 bg-card/75">
        <div className="mx-auto flex h-[68px] max-w-[1440px] items-center justify-between px-5 sm:px-8 lg:px-12">
          <a href="/" className="flex items-center gap-3" aria-label="Classmate home">
            <span className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground"><BookOpen className="size-[18px]" /></span>
            <span className="text-[17px] font-semibold">classmate<span className="text-primary">.</span></span>
          </a>
          <div className="flex items-center gap-3 text-xs font-medium text-muted-foreground sm:gap-5 sm:text-sm">
            <span className="hidden items-center gap-2 sm:flex"><span className="size-2 rounded-full bg-attendance-safe" /> Semester 4 · 2025–26</span>
            <span className="flex items-center gap-1.5"><span className={`size-1.5 rounded-full ${ready ? "bg-attendance-safe" : "bg-attendance-watch"}`} />{saved ? "Saved" : ready ? "Up to date" : "Loading"}</span>
            <span className="flex size-8 items-center justify-center rounded-full bg-accent text-xs font-semibold text-accent-foreground">BM</span>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1440px] px-5 pb-14 pt-9 sm:px-8 lg:px-12 lg:pt-12">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-5">
          <div>
            <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.08em] text-primary">
              <Sparkles className="size-3.5" /> Your semester, at a glance
            </div>
            <h1 className="attendance-display text-4xl font-medium leading-tight sm:text-5xl">Attendance, <span className="text-primary">figured out.</span></h1>
            <p className="mt-3 max-w-xl text-sm leading-6 text-muted-foreground sm:text-base">One class at a time. Keep an eye on every subject and know exactly where you stand.</p>
          </div>
          <div className="flex items-center gap-2.5 rounded-lg border border-border bg-card px-3.5 py-2.5 text-sm shadow-sm">
            <Target className="size-4 text-primary" />
            <span className="text-muted-foreground">Minimum required</span>
            <strong className="ml-1 tabular-nums">{TARGET}%</strong>
          </div>
        </div>

        <section aria-label="Overall attendance summary" className="mb-8 grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-border bg-border md:grid-cols-4">
          <SummaryMetric label="Overall attendance" value={`${Math.round(overall.rate * 100)}%`} detail={`${overall.present} of ${overall.present + overall.absent} classes`} icon={<Target className="size-[17px]" />} accent="primary" />
          <SummaryMetric label="Classes you can miss" value={String(overall.safeBunks)} detail="and still stay at 75%" icon={<ArrowDownRight className="size-[17px]" />} accent="safe" />
          <SummaryMetric label="Subjects on track" value={`${subjects.length - needsAttention} / ${subjects.length}`} detail="above the required mark" icon={<CheckCircle2 className="size-[17px]" />} accent="safe" />
          <SummaryMetric label="Need a little care" value={String(needsAttention)} detail={needsAttention > 0 ? "below 75% right now" : "all above the minimum"} icon={<AlertTriangle className="size-[17px]" />} accent={needsAttention > 0 ? "watch" : "safe"} />
        </section>

        <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_360px] xl:gap-10">
          <section aria-labelledby="subjects-heading" className="min-w-0">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div><h2 id="subjects-heading" className="text-lg font-semibold">Your subjects</h2><p className="mt-0.5 text-xs text-muted-foreground">Tap a subject to log a class</p></div>
              <Button variant="outline" size="sm" onClick={() => setAddOpen((open) => !open)} aria-expanded={addOpen}><Plus className="size-4" /> Add subject</Button>
            </div>

            {addOpen && (
              <form onSubmit={addSubject} className="mb-4 grid gap-3 rounded-lg border border-border bg-card p-4 sm:grid-cols-[1fr_150px_auto] sm:items-end">
                <label className="grid gap-1.5 text-xs font-medium text-muted-foreground">Subject name<Input autoFocus value={newName} onChange={(event) => setNewName(event.target.value)} placeholder="e.g. Computer Networks" required maxLength={60} /></label>
                <label className="grid gap-1.5 text-xs font-medium text-muted-foreground">Course code<Input value={newCode} onChange={(event) => setNewCode(event.target.value)} placeholder="CS 302" required maxLength={16} /></label>
                <Button type="submit"><Plus className="size-4" /> Add</Button>
              </form>
            )}

            <div className="overflow-hidden rounded-lg border border-border bg-card">
              <div className="hidden grid-cols-[minmax(180px,1.5fr)_minmax(90px,0.8fr)_minmax(130px,1.2fr)_74px_24px] items-center gap-4 border-b border-border bg-muted/50 px-5 py-3 text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground md:grid">
                <span>Subject</span><span>Attendance</span><span>Classes attended</span><span>Safe bunks</span><span />
              </div>
              <div className="divide-y divide-border">
                {subjects.map((subject) => <SubjectRow key={subject.id} subject={subject} active={subject.id === selected?.id} onSelect={() => setSelectedId(subject.id)} />)}
                {subjects.length === 0 && <div className="px-5 py-12 text-center text-sm text-muted-foreground">Add your first subject to start tracking.</div>}
              </div>
              <div className="flex items-center gap-2 border-t border-border bg-muted/35 px-5 py-3 text-xs text-muted-foreground"><CircleHelp className="size-3.5 shrink-0" /> Safe bunks are calculated to keep you at or above 75%.</div>
            </div>
          </section>

          <aside className="lg:sticky lg:top-6">
            {selected ? <SelectedSubject subject={selected} onLog={updateAttendance} /> : <div className="rounded-lg border border-border bg-card p-6 text-sm text-muted-foreground">Add a subject to begin logging attendance.</div>}
            <div className="mt-5 border-l-2 border-accent pl-4 py-1">
              <div className="flex items-center gap-2 text-xs font-semibold"><Clock3 className="size-3.5 text-primary" /> A tiny reminder</div>
              <p className="mt-1.5 text-xs leading-5 text-muted-foreground">A missed class is just one data point. Keep showing up and your numbers will follow.</p>
            </div>
          </aside>
        </div>
        <footer className="mt-12 flex flex-wrap items-center justify-between gap-2 border-t border-border pt-4 text-[11px] text-muted-foreground"><span>Made for the days you do the math twice.</span><span>Your attendance stays on this device.</span></footer>
      </main>
    </div>
  );
}

function SummaryMetric({ label, value, detail, icon, accent }: { label: string; value: string; detail: string; icon: ReactNode; accent: "primary" | "safe" | "watch" }) {
  const color = accent === "primary" ? "text-primary" : accent === "safe" ? "text-attendance-safe" : "text-attendance-watch";
  return <div className="bg-card px-4 py-4 sm:px-5 sm:py-5"><div className={`mb-3 ${color}`}>{icon}</div><div className="tabular-nums text-3xl font-semibold leading-none sm:text-[34px]">{value}</div><div className="mt-2 text-xs font-medium sm:text-sm">{label}</div><div className="mt-1 text-[11px] text-muted-foreground sm:text-xs">{detail}</div></div>;
}

function SubjectRow({ subject, active, onSelect }: { subject: Subject; active: boolean; onSelect: () => void }) {
  const counts: AttendanceCounts = subject;
  const rate = getAttendanceRate(counts);
  const risk = getAttendanceRisk(counts);
  const colors = riskColors(risk);
  const percent = Math.round(rate * 100);
  const total = subject.present + subject.absent;
  return (
    <button onClick={onSelect} aria-pressed={active} className={`grid w-full grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-2 px-4 py-4 text-left transition-colors hover:bg-muted/55 sm:px-5 md:grid-cols-[minmax(180px,1.5fr)_minmax(90px,0.8fr)_minmax(130px,1.2fr)_74px_24px] md:gap-4 ${active ? "bg-accent/35" : "bg-card"}`}>
      <span className="flex min-w-0 items-center gap-3"><span className={`hidden size-1.5 shrink-0 rounded-full md:block bg-subject-${subject.color}`} /><span className="min-w-0"><span className="block truncate text-sm font-semibold">{subject.name}</span><span className="mt-0.5 block text-[11px] text-muted-foreground">{subject.code}<span className="mx-1.5">·</span>{subject.faculty}</span></span></span>
      <span className="text-right md:text-left"><span className={`block tabular-nums text-sm font-semibold ${colors.text}`}>{percent}%</span><span className="hidden md:block"><StatusPill risk={risk} /></span></span>
      <span className="col-span-2 flex items-center gap-2 md:col-span-1"><span className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted"><span className={`block h-full rounded-full transition-all ${colors.bar}`} style={{ width: `${Math.min(100, percent)}%` }} /></span><span className="min-w-10 text-right text-[10px] tabular-nums text-muted-foreground md:min-w-0 md:w-11">{subject.present}/{total}</span></span>
      <span className="hidden md:block"><strong className={`tabular-nums ${getSafeBunks(counts) === 0 ? "text-attendance-risk" : "text-foreground"}`}>{getSafeBunks(counts)}</strong></span>
      <span className="hidden text-muted-foreground md:block"><ChevronRight className={`size-4 transition-transform ${active ? "translate-x-0.5 text-primary" : ""}`} /></span>
      <span className="col-span-2 md:hidden"><StatusPill risk={risk} /></span>
    </button>
  );
}

function SelectedSubject({ subject, onLog }: { subject: Subject; onLog: (id: string, status: "present" | "absent") => void }) {
  const counts: AttendanceCounts = subject;
  const rate = getAttendanceRate(counts);
  const risk = getAttendanceRisk(counts);
  const colors = riskColors(risk);
  const percent = Math.round(rate * 100);
  const total = subject.present + subject.absent;
  const safeBunks = getSafeBunks(counts);
  const required = getRequiredClasses(counts);
  const circumference = 2 * Math.PI * 43;

  return (
    <section aria-label={`${subject.name} details`} className="overflow-hidden rounded-lg border border-border bg-card">
      <div className="border-b border-border px-5 pb-4 pt-5"><div className="flex items-start justify-between gap-3"><div className="min-w-0"><div className="mb-2 flex items-center gap-2"><span className={`size-2 rounded-full bg-subject-${subject.color}`} /><span className="text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">{subject.code}</span></div><h2 className="truncate text-lg font-semibold">{subject.name}</h2><p className="mt-1 text-xs text-muted-foreground">{subject.faculty}</p></div><StatusPill risk={risk} /></div></div>
      <div className="px-5 py-5">
        <div className="flex items-center gap-4">
          <div className="relative flex size-[108px] shrink-0 items-center justify-center">
            <svg viewBox="0 0 100 100" className="absolute inset-0 size-full -rotate-90" aria-hidden="true"><circle cx="50" cy="50" r="43" fill="none" stroke="var(--color-muted)" strokeWidth="7" /><circle cx="50" cy="50" r="43" fill="none" className={colors.stroke} strokeWidth="7" strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={circumference * (1 - rate)} /></svg>
            <div className="text-center"><div className="tabular-nums text-[26px] font-semibold leading-none">{percent}<span className="text-sm">%</span></div><div className="mt-1 text-[9px] uppercase tracking-[0.06em] text-muted-foreground">attendance</div></div>
          </div>
          <div className="min-w-0 flex-1"><div className="text-xs text-muted-foreground">Classes attended</div><div className="mt-1 tabular-nums text-xl font-semibold">{subject.present}<span className="px-1.5 text-muted-foreground">/</span><span className="text-base font-medium text-muted-foreground">{total}</span></div><div className="mt-2 inline-flex items-center gap-1.5 text-[11px] text-muted-foreground"><span className="inline-block size-1.5 rounded-full bg-attendance-safe" /> {subject.present} present <span className="mx-1">·</span><span className="inline-block size-1.5 rounded-full bg-attendance-risk" /> {subject.absent} absent</div></div>
        </div>
        <div className="my-5 grid grid-cols-2 divide-x divide-border border-y border-border py-3.5"><div className="pr-3"><div className="flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-[0.06em] text-muted-foreground"><ArrowDownRight className="size-3" /> Safe to miss</div><div className={`mt-1.5 text-2xl font-semibold tabular-nums ${safeBunks === 0 ? "text-attendance-risk" : "text-foreground"}`}>{safeBunks}<span className="ml-1 text-xs font-medium text-muted-foreground">classes</span></div></div><div className="pl-4"><div className="flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-[0.06em] text-muted-foreground"><ArrowUpRight className="size-3" /> To reach 75%</div><div className="mt-1.5 text-2xl font-semibold tabular-nums">{required}<span className="ml-1 text-xs font-medium text-muted-foreground">classes</span></div></div></div>
        <div className={`rounded-md px-3.5 py-3 ${colors.soft}`}><p className={`text-xs font-semibold ${colors.text}`}>{risk === "on-track" ? "You’re in a good spot." : risk === "caution" ? "You’re getting close to the line." : "A little catch-up will help."}</p><p className="mt-1 text-[11px] leading-4 text-muted-foreground">{risk === "below-target" ? `Attend ${required} classes in a row to get back to the 75% minimum.` : safeBunks > 0 ? `${safeBunks} more ${safeBunks === 1 ? "absence" : "absences"} before you reach the minimum.` : "Attend your next class to keep your attendance above the minimum."}</p></div>
        <div className="mt-5"><div className="mb-2 text-xs font-semibold">Log a class</div><div className="grid grid-cols-2 gap-2"><Button className="bg-attendance-safe text-primary-foreground hover:bg-attendance-safe/90" onClick={() => onLog(subject.id, "present")}><Check className="size-4" /> Present</Button><Button variant="outline" className="border-attendance-risk/35 text-attendance-risk hover:bg-attendance-risk-soft" onClick={() => onLog(subject.id, "absent")}><X className="size-4" /> Absent</Button></div></div>
      </div>
    </section>
  );
}

function StatusPill({ risk }: { risk: AttendanceRisk }) {
  const label = risk === "on-track" ? "On track" : risk === "caution" ? "Close" : "Below 75%";
  const className = risk === "on-track" ? "bg-attendance-safe-soft text-attendance-safe" : risk === "caution" ? "bg-attendance-watch-soft text-attendance-watch" : "bg-attendance-risk-soft text-attendance-risk";
  const icon = risk === "on-track" ? <CheckCircle2 className="size-3" /> : risk === "caution" ? <AlertTriangle className="size-3" /> : <ArrowUpRight className="size-3" />;
  return <span className={`inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2 py-1 text-[10px] font-semibold ${className}`}>{icon}{label}</span>;
}

function riskColors(risk: AttendanceRisk) {
  if (risk === "on-track") return { text: "text-attendance-safe", bar: "bg-attendance-safe", stroke: "stroke-attendance-safe", soft: "bg-attendance-safe-soft" };
  if (risk === "caution") return { text: "text-attendance-watch", bar: "bg-attendance-watch", stroke: "stroke-attendance-watch", soft: "bg-attendance-watch-soft" };
  return { text: "text-attendance-risk", bar: "bg-attendance-risk", stroke: "stroke-attendance-risk", soft: "bg-attendance-risk-soft" };
}

function isSubject(value: unknown): value is Subject {
  if (!value || typeof value !== "object") return false;
  const subject = value as Partial<Subject>;
  return typeof subject.id === "string"
    && typeof subject.name === "string"
    && typeof subject.code === "string"
    && typeof subject.faculty === "string"
    && ["green", "blue", "amber", "rose", "violet"].includes(subject.color ?? "")
    && Number.isInteger(subject.present) && (subject.present ?? -1) >= 0
    && Number.isInteger(subject.absent) && (subject.absent ?? -1) >= 0;
}