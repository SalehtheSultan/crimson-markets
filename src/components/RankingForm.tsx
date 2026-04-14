"use client";
import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  DndContext, closestCenter, KeyboardSensor, PointerSensor, TouchSensor,
  useSensor, useSensors, DragEndEvent, DragStartEvent, DragOverlay,
} from "@dnd-kit/core";
import {
  arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable,
  verticalListSortingStrategy, defaultAnimateLayoutChanges,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { config } from "@/lib/config";

type Ticket = { id: number; name: string; platform_url: string | null };
type AnimateLayoutChangesArgs = Parameters<typeof defaultAnimateLayoutChanges>[0];

function animateLayoutChanges(args: AnimateLayoutChangesArgs) {
  const { isSorting, wasDragging } = args;
  if (isSorting || wasDragging) return defaultAnimateLayoutChanges(args);
  return true;
}

function SortableRow({ ticket, index, isActive }: { ticket: Ticket; index: number; isActive: boolean }) {
  const {
    attributes, listeners, setNodeRef, transform, transition, isDragging,
  } = useSortable({
    id: ticket.id,
    animateLayoutChanges,
    transition: { duration: 250, easing: "cubic-bezier(0.25, 1, 0.5, 1)" },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.3 : 1,
    zIndex: isDragging ? 0 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group relative flex items-center bg-paper p-4 md:p-5 rounded-[8px] shadow-sm border border-transparent select-none touch-none
        ${isActive ? "" : "hover:shadow-md hover:border-primary/10 hover:scale-[1.01]"}
        transition-shadow transition-border duration-200 cursor-grab active:cursor-grabbing`}
      {...attributes}
      {...listeners}
    >
      <div className="flex items-center justify-center w-9 h-9 md:w-10 md:h-10 shrink-0 rounded-full bg-primary text-on-primary font-headline font-bold text-base md:text-lg mr-4 md:mr-6">
        {index + 1}
      </div>
      <div className="flex-grow min-w-0">
        <h3 className="text-[15px] md:text-[17px] font-semibold text-charcoal tracking-tight leading-snug">{ticket.name}</h3>
      </div>
      <div className="text-outline group-hover:text-primary transition-colors flex flex-col gap-[3px] opacity-50 ml-2">
        <div className="w-4 h-[2px] bg-current rounded-full"></div>
        <div className="w-4 h-[2px] bg-current rounded-full"></div>
        <div className="w-4 h-[2px] bg-current rounded-full"></div>
      </div>
    </div>
  );
}

function OverlayRow({ ticket, index }: { ticket: Ticket; index: number }) {
  return (
    <div className="flex items-center bg-paper p-4 md:p-5 rounded-[8px] shadow-2xl border-2 border-primary/20 select-none scale-[1.03] rotate-[1deg]"
      style={{ cursor: "grabbing" }}
    >
      <div className="flex items-center justify-center w-9 h-9 md:w-10 md:h-10 shrink-0 rounded-full bg-primary text-on-primary font-headline font-bold text-base md:text-lg mr-4 md:mr-6">
        {index + 1}
      </div>
      <div className="flex-grow min-w-0">
        <h3 className="text-[15px] md:text-[17px] font-semibold text-primary tracking-tight leading-snug">{ticket.name}</h3>
      </div>
      <div className="text-primary flex flex-col gap-[3px] opacity-70 ml-2">
        <div className="w-4 h-[2px] bg-current rounded-full"></div>
        <div className="w-4 h-[2px] bg-current rounded-full"></div>
        <div className="w-4 h-[2px] bg-current rounded-full"></div>
      </div>
    </div>
  );
}

const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

export default function RankingForm({ tickets }: { tickets: Ticket[] }) {
  const [items, setItems] = useState(tickets);
  const [activeId, setActiveId] = useState<number | null>(null);
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [step, setStep] = useState<"email" | "code" | "rank">("email");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const router = useRouter();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const domain = config.allowedEmailDomain;

  const activeItem = activeId ? items.find((t) => t.id === activeId) : null;
  const activeIndex = activeId ? items.findIndex((t) => t.id === activeId) : -1;

  const onDragStart = useCallback((e: DragStartEvent) => {
    setActiveId(e.active.id as number);
  }, []);

  const onDragEnd = useCallback((e: DragEndEvent) => {
    setActiveId(null);
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    setItems((prev) => {
      const oldIdx = prev.findIndex((t) => t.id === active.id);
      const newIdx = prev.findIndex((t) => t.id === over.id);
      return arrayMove(prev, oldIdx, newIdx);
    });
  }, []);

  const onDragCancel = useCallback(() => setActiveId(null), []);

  async function sendCode() {
    setError("");
    const trimmed = email.toLowerCase().trim();
    if (!EMAIL_REGEX.test(trimmed)) { setError("Please enter a valid email address."); return; }
    if (!trimmed.endsWith(`@${domain}`)) { setError(`Please use your @${domain} email.`); return; }

    setLoading(true);
    const res = await fetch("/api/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: trimmed }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) { setError(data.error || "Failed to send code."); return; }
    setStep("code");
  }

  async function proceedToRank() {
    // Fetch existing rankings for this email
    const trimmed = email.toLowerCase().trim();
    const statusRes = await fetch(`/api/status?email=${encodeURIComponent(trimmed)}`);
    if (statusRes.ok) {
      const statusData = await statusRes.json();
      if (statusData.hasRanked && statusData.rankings?.length > 0) {
        setIsEditing(true);
        // Reorder tickets to match existing rankings
        const rankMap = new Map<number, number>(statusData.rankings.map((r: { ticket_id: number; rank: number }) => [r.ticket_id, r.rank]));
        const sorted = [...tickets].sort((a, b) => {
          const rankA = rankMap.get(a.id) ?? 999;
          const rankB = rankMap.get(b.id) ?? 999;
          return rankA - rankB;
        });
        setItems(sorted);
      }
    }
    setStep("rank");
  }

  async function submit() {
    setError("");
    if (!/^\d{6}$/.test(code.trim())) { setError("Please enter a valid 6-digit code."); return; }

    setLoading(true);
    const rankings = items.map((t, i) => ({ ticketId: t.id, rank: i + 1 }));
    const res = await fetch("/api/rank", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: email.toLowerCase().trim(), code: code.trim(), rankings }),
    });
    if (res.ok) { router.push("/"); }
    else { const data = await res.json(); setError(data.error || "Submission failed."); setLoading(false); }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 md:px-8">
      {/* Header */}
      <div className="mb-8 md:mb-12 text-center pt-4 md:pt-8">
        <h1 className="text-3xl md:text-5xl font-headline font-extrabold tracking-tight text-primary mb-3 md:mb-4">
          Rank the HUA tickets
        </h1>
        <p className="text-slate font-body text-sm md:text-[17px] leading-relaxed max-w-lg mx-auto">
          Drag from most likely <span className="font-bold text-primary">(1)</span> to least likely <span className="font-bold text-primary">({config.ticketCount})</span> to win. You can update your ranking anytime.
        </p>
        <p className="text-[10px] md:text-xs text-slate font-label uppercase tracking-widest mt-2 md:mt-3 flex items-center justify-center gap-1">
          <span className="material-symbols-outlined text-[10px] md:text-xs">shield</span>
          Your ranking is anonymous
        </p>
      </div>

      {step === "email" && (
        <div className="space-y-4 max-w-md mx-auto bg-surface-container-low p-5 md:p-6 rounded-[8px]">
          <label htmlFor="email" className="block text-sm font-label uppercase tracking-wider font-bold text-slate">Harvard Email</label>
          <input id="email" type="email" placeholder={`you@${domain}`} value={email}
            onChange={(e) => setEmail(e.target.value)} onKeyDown={(e) => e.key === "Enter" && sendCode()}
            className="w-full border-none bg-paper rounded-[8px] px-4 md:px-5 py-3.5 md:py-4 text-sm text-charcoal focus:outline-none focus:ring-2 focus:ring-primary shadow-sm" />
          {error && <p className="text-sm text-error font-medium">{error}</p>}
          <button onClick={sendCode} disabled={loading}
            className="w-full bg-primary text-on-primary font-headline font-bold text-base md:text-lg py-3.5 md:py-4 rounded-full shadow-lg disabled:opacity-50 hover:bg-primary-container active:scale-95 transition-all duration-150 mt-2">
            {loading ? "Sending\u2026" : "Send Verification Code"}
          </button>
        </div>
      )}

      {step === "code" && (
        <div className="space-y-4 max-w-md mx-auto bg-surface-container-low p-5 md:p-6 rounded-[8px]">
          <p className="text-sm text-slate">We sent a 6-digit code to <strong className="text-charcoal">{email}</strong></p>
          <input type="text" inputMode="numeric" autoComplete="one-time-code" maxLength={6} placeholder="000000"
            value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
            onKeyDown={(e) => { if (e.key === "Enter" && code.length === 6) proceedToRank(); }}
            className="w-full border-none bg-paper rounded-[8px] px-4 md:px-5 py-4 md:py-5 text-center tracking-[0.5em] font-mono text-2xl text-charcoal focus:outline-none focus:ring-2 focus:ring-primary shadow-sm" />
          {error && <p className="text-sm text-error font-medium">{error}</p>}
          <button onClick={proceedToRank} disabled={code.length !== 6}
            className="w-full bg-primary text-on-primary font-headline font-bold text-base md:text-lg py-3.5 md:py-4 rounded-full shadow-lg disabled:opacity-50 hover:bg-primary-container active:scale-95 transition-all duration-150 mt-2">
            Continue
          </button>
          <button onClick={() => { setStep("email"); setCode(""); setError(""); }}
            className="w-full text-sm font-label text-slate hover:text-primary transition-colors">Use a different email</button>
        </div>
      )}

      {step === "rank" && (
        <>
          <div className="text-center mb-4 space-y-1">
            <p className="text-sm text-primary font-medium flex items-center justify-center gap-2">
              <span className="material-symbols-outlined text-sm">verified</span> {email}
            </p>
            {isEditing && (
              <p className="text-xs text-slate font-label flex items-center justify-center gap-1">
                <span className="material-symbols-outlined text-xs">edit</span>
                Editing your previous ranking
              </p>
            )}
          </div>

          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={onDragStart}
            onDragEnd={onDragEnd}
            onDragCancel={onDragCancel}
          >
            <SortableContext items={items.map((i) => i.id)} strategy={verticalListSortingStrategy}>
              <div className="space-y-2.5 pb-28">
                {items.map((t, i) => (
                  <SortableRow key={t.id} ticket={t} index={i} isActive={t.id === activeId} />
                ))}
              </div>
            </SortableContext>

            <DragOverlay
              dropAnimation={{
                duration: 300,
                easing: "cubic-bezier(0.18, 0.67, 0.6, 1.22)",
              }}
            >
              {activeItem ? <OverlayRow ticket={activeItem} index={activeIndex} /> : null}
            </DragOverlay>
          </DndContext>

          {error && (
            <div className="fixed bottom-24 left-4 right-4 z-50 flex justify-center">
              <p className="text-sm text-error font-medium bg-error-container px-4 py-3 rounded-[8px] shadow-lg max-w-md w-full text-center">{error}</p>
            </div>
          )}

          <div className="fixed bottom-0 left-0 right-0 py-4 md:py-6 px-4 md:px-6 glass-nav border-t border-outline-variant flex justify-center items-center z-40">
            <button onClick={submit} disabled={loading}
              className="w-full max-w-[420px] bg-primary text-on-primary py-3.5 md:py-4 px-8 rounded-full font-headline font-bold text-base md:text-lg shadow-xl hover:bg-primary-container active:scale-95 transition-all duration-150 disabled:opacity-50">
              {loading ? "Submitting\u2026" : isEditing ? "Update Ranking" : "Submit Ranking"}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
