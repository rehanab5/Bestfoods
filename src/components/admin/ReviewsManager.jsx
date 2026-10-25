import React, { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Star, Trash2, Loader2, Check, X } from "lucide-react";

const FILTERS = [
  { id: "pending", label: "Pendientes" },
  { id: "approved", label: "Aprobadas" },
  { id: "all", label: "Todas" },
];

export default function ReviewsManager() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("pending");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { items: rows } = await base44.entities.Review.filter({}, { sort: "-created_date", limit: 200 });
      setReviews(rows);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const setApproved = async (id, approved) => {
    await base44.entities.Review.update(id, { approved });
    load();
  };

  const remove = async (id) => {
    if (!window.confirm("¿Eliminar esta reseña?")) return;
    await base44.entities.Review.delete(id);
    load();
  };

  const shown = reviews.filter((r) =>
    filter === "all" ? true : filter === "pending" ? !r.approved : r.approved
  );

  if (loading) {
    return <div className="flex justify-center py-20"><Loader2 className="h-7 w-7 animate-spin text-muted-foreground" /></div>;
  }

  return (
    <div>
      <div className="flex items-center gap-1.5 mb-4">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium ${filter === f.id ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-secondary"}`}
          >
            {f.label}
          </button>
        ))}
      </div>
      <div className="grid gap-2">
        {shown.map((r) => (
          <div key={r.id} className="p-3 rounded-xl border border-border bg-card">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-medium truncate">{r.author}</p>
                  <span className="inline-flex items-center gap-0.5">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} className={`h-3 w-3 ${i < (r.rating || 0) ? "fill-primary text-primary" : "text-muted-foreground/40"}`} />
                    ))}
                  </span>
                </div>
                {r.location_name && <p className="text-xs text-muted-foreground">{r.location_name}</p>}
                <p className="text-sm mt-1">{r.description}</p>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                {r.approved ? (
                  <Button size="sm" variant="outline" onClick={() => setApproved(r.id, false)}><X className="h-4 w-4 mr-1" />Ocultar</Button>
                ) : (
                  <Button size="sm" onClick={() => setApproved(r.id, true)}><Check className="h-4 w-4 mr-1" />Aprobar</Button>
                )}
                <Button size="icon" variant="ghost" onClick={() => remove(r.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
              </div>
            </div>
          </div>
        ))}
        {shown.length === 0 && <p className="text-center text-muted-foreground py-12">No hay reseñas en esta vista.</p>}
      </div>
    </div>
  );
}