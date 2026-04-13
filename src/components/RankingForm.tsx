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
      className={`flex items-center gap-3 bg-white border rounded-xl p-4 shadow-sm select-none touch-none ${isDragging ? "opacity-60" : ""}`}
      {...attributes}
      {...listeners}
    >
      <div className="w-8 h-8 rounded-full bg-red-700 text-white font-bold flex items-center justify-center text-sm">
        {index + 1}
      </div>
      <div className="flex-1 font-medium">{ticket.name}</div>
      <div className="text-neutral-400">&#9776;</div>
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
    <div className="max-w-md mx-auto p-4 pb-32">
      <h1 className="text-2xl font-bold mb-1">Rank the HUA tickets</h1>
      <p className="text-neutral-600 text-sm mb-6">
        Drag from most likely (1) to least likely ({config.ticketCount}) to win. You can only submit once.
      </p>

      {step === "email" && (
        <div className="space-y-3">
          <label htmlFor="email" className="block text-sm font-medium text-neutral-700">
            Harvard Email
          </label>
          <input
            id="email"
            type="email"
            placeholder={`you@${domain}`}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendCode()}
            className="w-full border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-red-700"
          />
          {error && <p className="text-sm text-red-600 font-medium">{error}</p>}
          <button
            onClick={sendCode}
            disabled={loading}
            className="w-full bg-red-700 text-white font-semibold py-3 rounded-xl shadow-lg disabled:opacity-50"
          >
            {loading ? "Sending\u2026" : "Send Verification Code"}
          </button>
        </div>
      )}

      {step === "otp" && (
        <div className="space-y-3">
          <p className="text-sm text-neutral-600">
            We sent a 6-digit code to <strong>{email}</strong>. Check your inbox.
          </p>
          <input
            type="text"
            inputMode="numeric"
            maxLength={6}
            placeholder="Enter 6-digit code"
            value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
            onKeyDown={(e) => e.key === "Enter" && verifyCode()}
            className="w-full border rounded-xl px-4 py-3 text-sm text-center tracking-widest font-mono focus:outline-none focus:ring-2 focus:ring-red-700"
          />
          {error && <p className="text-sm text-red-600 font-medium">{error}</p>}
          <button
            onClick={verifyCode}
            disabled={loading || otp.length !== 6}
            className="w-full bg-red-700 text-white font-semibold py-3 rounded-xl shadow-lg disabled:opacity-50"
          >
            {loading ? "Verifying\u2026" : "Verify Code"}
          </button>
          <button
            onClick={() => { setStep("email"); setOtp(""); setError(""); }}
            className="w-full text-sm text-neutral-500 hover:text-neutral-700"
          >
            Use a different email
          </button>
        </div>
      )}

      {step === "rank" && (
        <>
          <p className="text-sm text-green-700 font-medium mb-4">
            Verified as {email}
          </p>
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
            <SortableContext items={items.map((i) => i.id)} strategy={verticalListSortingStrategy}>
              <div className="space-y-2">
                {items.map((t, i) => (
                  <Row key={t.id} ticket={t} index={i} />
                ))}
              </div>
            </SortableContext>
          </DndContext>

          {error && <p className="mt-4 text-sm text-red-600 font-medium">{error}</p>}

          <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-neutral-50 to-transparent">
            <button
              onClick={submit}
              disabled={loading}
              className="w-full max-w-md mx-auto block bg-red-700 text-white font-semibold py-4 rounded-xl shadow-lg disabled:opacity-50"
            >
              {loading ? "Submitting\u2026" : "Submit Ranking"}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
