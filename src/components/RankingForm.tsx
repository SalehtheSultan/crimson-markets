"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { supabaseBrowser } from "@/lib/supabase-browser";
import { config } from "@/lib/config";

type Ticket = { id: number; name: string; platform_url: string | null };

function Row({ ticket, index }: { ticket: Ticket; index: number }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: ticket.id });
  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`group relative flex items-center bg-paper p-5 rounded-[8px] shadow-sm transition-all duration-200 hover:scale-[1.01] hover:shadow-lg border border-transparent hover:border-primary/10 cursor-grab active:cursor-grabbing select-none touch-none ${isDragging ? "opacity-60 z-10 shadow-xl" : ""}`}
      {...attributes}
      {...listeners}
    >
      <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary text-on-primary font-headline font-bold text-lg mr-6">
        {index + 1}
      </div>
      <div className="flex-grow">
        <h3 className="text-[17px] font-semibold text-charcoal tracking-tight">{ticket.name}</h3>
      </div>
      <div className="text-outline group-hover:text-primary transition-colors flex flex-col gap-[3px] opacity-70">
        <div className="w-4 h-[2px] bg-current rounded-full"></div>
        <div className="w-4 h-[2px] bg-current rounded-full"></div>
      </div>
    </div>
  );
}

const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

export default function RankingForm({ tickets }: { tickets: Ticket[] }) {
  const [items, setItems] = useState(tickets);
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState<"email" | "otp" | "rank">("email");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const domain = config.allowedEmailDomain;

  function onDragEnd(e: DragEndEvent) {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const oldIdx = items.findIndex((t) => t.id === active.id);
    const newIdx = items.findIndex((t) => t.id === over.id);
    setItems(arrayMove(items, oldIdx, newIdx));
  }

  async function sendCode() {
    setError("");
    const trimmed = email.toLowerCase().trim();

    if (!EMAIL_REGEX.test(trimmed)) {
      setError("Please enter a valid email address.");
      return;
    }
    if (!trimmed.endsWith(`@${domain}`)) {
      setError(`Please use your @${domain} email.`);
      return;
    }
    if (trimmed.length > 254) {
      setError("Email address is too long.");
      return;
    }

    setLoading(true);
    const { error: otpError } = await supabaseBrowser.auth.signInWithOtp({
      email: trimmed,
    });
    setLoading(false);
    if (otpError) {
      setError(otpError.message);
      return;
    }
    setStep("otp");
  }

  async function verifyCode() {
    setError("");
    const code = otp.trim();
    if (!/^\d{6}$/.test(code)) {
      setError("Please enter a valid 6-digit code.");
      return;
    }

    setLoading(true);
    const { error: verifyError } = await supabaseBrowser.auth.verifyOtp({
      email: email.toLowerCase().trim(),
      token: code,
      type: "email",
    });
    setLoading(false);
    if (verifyError) {
      setError("Invalid or expired code. Please try again.");
      return;
    }
    setStep("rank");
  }

  async function submit() {
    setError("");
    setLoading(true);

    const { data: { session } } = await supabaseBrowser.auth.getSession();
    if (!session) {
      setError("Session expired. Please verify your email again.");
      setStep("email");
      setLoading(false);
      return;
    }

    const rankings = items.map((t, i) => ({ ticketId: t.id, rank: i + 1 }));
    const res = await fetch("/api/rank", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ rankings }),
    });

    if (res.ok) {
      router.push("/");
    } else {
      const data = await res.json();
      setError(data.error || "Submission failed.");
      setLoading(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 md:px-8">
      {/* Header */}
      <div className="mb-12 text-center pt-8">
        <h1 className="text-4xl md:text-5xl font-headline font-extrabold tracking-tight text-primary mb-4">
          Rank the HUA tickets
        </h1>
        <p className="text-slate font-body text-[17px] leading-relaxed max-w-lg mx-auto">
          Drag from most likely <span className="font-bold text-primary">(1)</span> to least likely <span className="font-bold text-primary">({config.ticketCount})</span> to win. You can only submit once.
        </p>
        <p className="text-xs text-slate font-label uppercase tracking-widest mt-3 flex items-center justify-center gap-1">
          <span className="material-symbols-outlined text-xs">shield</span>
          Your ranking is anonymous
        </p>
      </div>

      {step === "email" && (
        <div className="space-y-4 max-w-md mx-auto bg-surface-container-low p-6 rounded-[8px]">
          <label htmlFor="email" className="block text-sm font-label uppercase tracking-wider font-bold text-slate">
            Harvard Email
          </label>
          <input
            id="email"
            type="email"
            placeholder={`you@${domain}`}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendCode()}
            className="w-full border-none bg-paper rounded-[8px] px-5 py-4 text-sm text-charcoal focus:outline-none focus:ring-2 focus:ring-primary shadow-sm"
          />
          {error && <p className="text-sm text-error font-medium">{error}</p>}
          <button
            onClick={sendCode}
            disabled={loading}
            className="w-full bg-primary text-on-primary font-headline font-bold text-lg py-4 rounded-full shadow-lg disabled:opacity-50 hover:bg-primary-container active:scale-95 transition-all duration-150 mt-4"
          >
            {loading ? "Sending\u2026" : "Send Verification Code"}
          </button>
        </div>
      )}

      {step === "otp" && (
        <div className="space-y-4 max-w-md mx-auto bg-surface-container-low p-6 rounded-[8px]">
          <p className="text-sm text-slate">
            We sent a 6-digit code to <strong className="text-charcoal">{email}</strong>. Check your inbox.
          </p>
          <input
            type="text"
            inputMode="numeric"
            maxLength={6}
            placeholder="Enter 6-digit code"
            value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
            onKeyDown={(e) => e.key === "Enter" && verifyCode()}
            className="w-full border-none bg-paper rounded-[8px] px-5 py-4 text-center tracking-[0.5em] font-mono text-lg text-charcoal focus:outline-none focus:ring-2 focus:ring-primary shadow-sm"
          />
          {error && <p className="text-sm text-error font-medium">{error}</p>}
          <button
            onClick={verifyCode}
            disabled={loading || otp.length !== 6}
            className="w-full bg-primary text-on-primary font-headline font-bold text-lg py-4 rounded-full shadow-lg disabled:opacity-50 hover:bg-primary-container active:scale-95 transition-all duration-150 mt-4"
          >
            {loading ? "Verifying\u2026" : "Verify Code"}
          </button>
          <button
            onClick={() => { setStep("email"); setOtp(""); setError(""); }}
            className="w-full text-sm font-label uppercase tracking-wide text-slate hover:text-primary transition-colors mt-2"
          >
            Use a different email
          </button>
        </div>
      )}

      {step === "rank" && (
        <>
          <p className="text-sm text-primary font-medium mb-4 text-center flex items-center justify-center gap-2">
            <span className="material-symbols-outlined text-sm">verified</span> Verified as {email}
          </p>
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
            <SortableContext items={items.map((i) => i.id)} strategy={verticalListSortingStrategy}>
              <div className="space-y-3 pb-8">
                {items.map((t, i) => (
                  <Row key={t.id} ticket={t} index={i} />
                ))}
              </div>
            </SortableContext>
          </DndContext>

          <div className="mb-24"></div>

          {error && <p className="mt-4 text-sm text-error font-medium text-center bg-error-container p-4 rounded-[8px]">{error}</p>}

          {/* Fixed Action Bar */}
          <div className="fixed bottom-0 left-0 right-0 py-6 px-6 glass-nav border-t border-outline-variant flex justify-center items-center z-40">
            <button
              onClick={submit}
              disabled={loading}
              className="w-full max-w-[420px] bg-primary text-on-primary py-4 px-8 rounded-full font-headline font-bold text-lg shadow-xl hover:bg-primary-container active:scale-95 transition-all duration-150 disabled:opacity-50"
            >
              {loading ? "Submitting\u2026" : "Submit Ranking"}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
