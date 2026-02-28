"use client";

import { useState, useEffect, useRef } from "react";
import { supabase } from "../utils/supabase";

const CATEGORIES = [
  "Harassment",
  "Stray Dogs",
  "Potholes",
  "Construction",
  "Poor Lighting",
  "Flooding",
  "Accident",
];

interface Review {
  id: string;
  user_id: string;
  title: string;
  description: string;
  category: string;
  rating: number;
  location: string;
  coordinates: string | null;
  image_url: string | null;
  created_at: string;
}

interface EditForm {
  title: string;
  description: string;
  category: string;
  rating: number;
}

interface Props {
  userId: string;
  onClose: () => void;
  onReviewsChanged: () => void; // re-fetch map markers after edit/delete
}

// ── Star rating picker ────────────────────────────────────────────────────────
function StarPicker({
  value,
  onChange,
}: {
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((s) => (
        <button
          key={s}
          type="button"
          onClick={() => onChange(s)}
          className="text-2xl leading-none transition-transform active:scale-90"
        >
          <span className={s <= value ? "text-amber-400" : "text-gray-300"}>★</span>
        </button>
      ))}
    </div>
  );
}

// ── Category badge colours ────────────────────────────────────────────────────
const catColour: Record<string, string> = {
  Harassment: "bg-red-100 text-red-700",
  "Stray Dogs": "bg-orange-100 text-orange-700",
  Potholes: "bg-yellow-100 text-yellow-700",
  Construction: "bg-sky-100 text-sky-700",
  "Poor Lighting": "bg-violet-100 text-violet-700",
  Flooding: "bg-blue-100 text-blue-700",
  Accident: "bg-rose-100 text-rose-700",
};

export default function MyReviewsModal({ userId, onClose, onReviewsChanged }: Props) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<EditForm | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const fetchMyReviews = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("review")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    if (!error && data) setReviews(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchMyReviews();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  // ── Edit handlers ─────────────────────────────────────────────────────────
  const startEdit = (r: Review) => {
    setEditingId(r.id);
    setDeletingId(null);
    setEditForm({
      title: r.title,
      description: r.description,
      category: r.category,
      rating: r.rating,
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditForm(null);
  };

  const saveEdit = async (id: string) => {
    if (!editForm) return;
    setSaving(true);
    const { error } = await supabase
      .from("review")
      .update({
        title: editForm.title,
        description: editForm.description,
        category: editForm.category,
        rating: editForm.rating,
      })
      .eq("id", id);
    setSaving(false);
    if (!error) {
      setEditingId(null);
      setEditForm(null);
      await fetchMyReviews();
      onReviewsChanged();
    }
  };

  // ── Delete handlers ───────────────────────────────────────────────────────
  const confirmDelete = async (id: string) => {
    setDeleting(true);
    const { error } = await supabase.from("review").delete().eq("id", id);
    setDeleting(false);
    setDeletingId(null);
    if (!error) {
      setReviews((prev) => prev.filter((r) => r.id !== id));
      onReviewsChanged();
    }
  };

  return (
    /* Backdrop */
    <div
      className="fixed inset-0 z-[3000] flex flex-col"
      style={{ background: "rgba(0,0,0,0.55)", backdropFilter: "blur(4px)" }}
    >
      {/* Drawer panel */}
      <div
        className="mt-auto w-full bg-white rounded-t-3xl flex flex-col overflow-hidden"
        style={{ maxHeight: "92dvh" }}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1 shrink-0">
          <div className="w-10 h-1 bg-gray-300 rounded-full" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-2 pb-4 border-b border-gray-100 shrink-0">
          <div>
            <h2 className="text-lg font-extrabold text-gray-800">My Reports</h2>
            {!loading && (
              <p className="text-xs text-gray-400 font-medium mt-0.5">
                {reviews.length} report{reviews.length !== 1 ? "s" : ""} submitted
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
          >
            <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <svg className="animate-spin h-8 w-8 text-emerald-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            </div>
          ) : reviews.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3 px-6 text-center">
              <span className="text-5xl">📋</span>
              <p className="text-gray-500 font-semibold">No reports yet</p>
              <p className="text-gray-400 text-sm">Issues you report will appear here.</p>
            </div>
          ) : (
            /* Horizontal card carousel */
            <div
              ref={scrollRef}
              className="flex gap-4 overflow-x-auto px-5 py-5 snap-x snap-mandatory"
              style={{ WebkitOverflowScrolling: "touch", scrollbarWidth: "none" }}
            >
              {reviews.map((review) => {
                const isEditing = editingId === review.id;
                const isDeleteConfirm = deletingId === review.id;

                return (
                  <div
                    key={review.id}
                    className="snap-start shrink-0 w-[calc(100vw-2.5rem)] max-w-sm bg-white border border-gray-200 rounded-2xl shadow-md flex flex-col overflow-hidden"
                  >
                    {/* Image */}
                    {review.image_url && (
                      <div className="relative w-full h-40 bg-gray-100 shrink-0">
                        <img
                          src={review.image_url}
                          alt={review.title}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
                      </div>
                    )}

                    <div className="flex-1 flex flex-col p-4 gap-3 overflow-y-auto">
                      {isEditing && editForm ? (
                        /* ── Edit Form ── */
                        <div className="flex flex-col gap-3">
                          <p className="text-xs font-bold text-emerald-600 uppercase tracking-wider">Editing</p>

                          <input
                            value={editForm.title}
                            onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                            placeholder="Title"
                            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-400 text-gray-800"
                          />

                          <select
                            value={editForm.category}
                            onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-400 text-gray-800"
                          >
                            {CATEGORIES.map((c) => (
                              <option key={c} value={c}>{c}</option>
                            ))}
                          </select>

                          <div>
                            <p className="text-xs text-gray-500 font-semibold mb-1">Severity</p>
                            <StarPicker
                              value={editForm.rating}
                              onChange={(v) => setEditForm({ ...editForm, rating: v })}
                            />
                          </div>

                          <textarea
                            value={editForm.description}
                            onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                            placeholder="Description"
                            rows={3}
                            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-400 text-gray-800 resize-none"
                          />

                          <div className="flex gap-2 mt-1">
                            <button
                              onClick={() => saveEdit(review.id)}
                              disabled={saving}
                              className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold rounded-xl transition-colors disabled:opacity-60"
                            >
                              {saving ? "Saving…" : "Save"}
                            </button>
                            <button
                              onClick={cancelEdit}
                              className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-bold rounded-xl transition-colors"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : isDeleteConfirm ? (
                        /* ── Delete Confirm ── */
                        <div className="flex flex-col gap-4 py-2">
                          <div className="flex flex-col items-center gap-2 text-center">
                            <span className="text-3xl">🗑️</span>
                            <p className="font-bold text-gray-800">Delete this report?</p>
                            <p className="text-xs text-gray-500">This action cannot be undone.</p>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => confirmDelete(review.id)}
                              disabled={deleting}
                              className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white text-sm font-bold rounded-xl transition-colors disabled:opacity-60"
                            >
                              {deleting ? "Deleting…" : "Yes, Delete"}
                            </button>
                            <button
                              onClick={() => setDeletingId(null)}
                              className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-bold rounded-xl transition-colors"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        /* ── Normal view ── */
                        <>
                          {/* Category + rating row */}
                          <div className="flex items-center justify-between gap-2 flex-wrap">
                            <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${catColour[review.category] ?? "bg-gray-100 text-gray-600"}`}>
                              {review.category}
                            </span>
                            <span className="text-sm font-bold text-amber-400 tracking-wide">
                              {"★".repeat(review.rating)}
                              <span className="text-gray-300">{"★".repeat(5 - review.rating)}</span>
                            </span>
                          </div>

                          <h3 className="font-extrabold text-gray-800 text-base leading-snug">{review.title}</h3>

                          {review.description && (
                            <p className="text-sm text-gray-600 leading-relaxed line-clamp-3">{review.description}</p>
                          )}

                          <div className="flex items-start gap-1.5 text-xs text-gray-500 mt-auto">
                            <svg className="w-3.5 h-3.5 mt-0.5 shrink-0 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            <span className="line-clamp-2">{review.location || "Unknown location"}</span>
                          </div>

                          <p className="text-[10px] text-gray-400 font-medium">
                            {new Date(review.created_at).toLocaleDateString("en-IN", {
                              day: "numeric", month: "short", year: "numeric",
                            })}
                          </p>

                          {/* Action buttons */}
                          <div className="flex gap-2 pt-1 border-t border-gray-100 mt-1">
                            <button
                              onClick={() => startEdit(review)}
                              className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold rounded-xl transition-colors"
                            >
                              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                              Edit
                            </button>
                            <button
                              onClick={() => { setDeletingId(review.id); setEditingId(null); }}
                              className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-red-50 hover:bg-red-100 text-red-600 text-xs font-bold rounded-xl transition-colors"
                            >
                              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                              Delete
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Dot indicators */}
        {reviews.length > 1 && !loading && (
          <div className="flex justify-center gap-1.5 py-3 shrink-0">
            {reviews.map((_, i) => (
              <div
                key={i}
                className="w-1.5 h-1.5 rounded-full bg-gray-300"
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
