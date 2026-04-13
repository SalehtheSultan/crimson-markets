"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent
} from "@dnd-kit/core";
import {
  arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

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
      <div className="text-neutral-400">☰</div>
    </div>
  );
}

export default function RankingForm({ tickets }: { tickets: Ticket[] }) {
  const [items, setItems] = useState(tickets);
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  function onDragEnd(e: DragEndEvent) {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const oldIdx = items.findIndex(t => t.id === active.id);
    const newIdx = items.findIndex(t => t.id === over.id);
    setItems(arrayMove(items, oldIdx, newIdx));
  }

  async function submit() {
    setSubmitting(true);
    const rankings = items.map((t, i) => ({ ticketId: t.id, rank: i + 1 }));
    const res = await fetch("/api/rank", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rankings }),
    });
    if (res.ok) router.push("/");
    else { setSubmitting(false); alert("Submission failed."); }
  }

  return (
    <div className="max-w-md mx-auto p-4 pb-32">
      <h1 className="text-2xl font-bold mb-1">Rank the HUA tickets</h1>
      <p className="text-neutral-600 text-sm mb-6">
        Drag from most likely (1) to least likely (7) to win. You can only submit once.
      </p>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
        <SortableContext items={items.map(i => i.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-2">
            {items.map((t, i) => <Row key={t.id} ticket={t} index={i} />)}
          </div>
        </SortableContext>
      </DndContext>

      <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-neutral-50 to-transparent">
        <button
          onClick={submit}
          disabled={submitting}
          className="w-full max-w-md mx-auto block bg-red-700 text-white font-semibold py-4 rounded-xl shadow-lg disabled:opacity-50"
        >
          {submitting ? "Submitting…" : "Submit Ranking"}
        </button>
      </div>
    </div>
  );
}
