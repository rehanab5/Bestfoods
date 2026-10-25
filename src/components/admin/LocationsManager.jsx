import React, { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Plus, Pencil, Trash2, Loader2, MapPin } from "lucide-react";
import LocationForm from "./LocationForm";

export default function LocationsManager() {
  const qc = useQueryClient();
  const [locs, setLocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { items: rows } = await base44.entities.Location.filter({}, { sort: "sort_order", limit: 50 });
      setLocs(rows);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const remove = async (id) => {
    if (!window.confirm("¿Eliminar este local?")) return;
    await base44.entities.Location.delete(id);
    qc.invalidateQueries({ queryKey: ["menuData"] });
    load();
  };

  if (loading) {
    return <div className="flex justify-center py-20"><Loader2 className="h-7 w-7 animate-spin text-muted-foreground" /></div>;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-muted-foreground">{locs.length} locales</p>
        <Button size="sm" onClick={() => setEditing("new")}><Plus className="h-4 w-4 mr-1.5" />Nuevo local</Button>
      </div>
      <div className="grid gap-2">
        {locs.map((l) => (
          <div key={l.id} className="flex items-center gap-3 p-3 rounded-xl border border-border bg-card">
            <div className="h-10 w-10 rounded-lg bg-secondary flex items-center justify-center shrink-0">
              <MapPin className="h-5 w-5 text-primary" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-medium truncate">{l.name}</p>
              <p className="text-xs text-muted-foreground truncate">
                {l.address}{l.area ? ` · ${l.area}` : ""}{l.phone ? ` · ${l.phone}` : ""}
              </p>
            </div>
            <Button size="icon" variant="ghost" onClick={() => setEditing(l)}><Pencil className="h-4 w-4" /></Button>
            <Button size="icon" variant="ghost" onClick={() => remove(l.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
          </div>
        ))}
        {locs.length === 0 && <p className="text-center text-muted-foreground py-12">No hay locales.</p>}
      </div>
      {editing !== null && (
        <LocationForm
          loc={editing === "new" ? null : editing}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            load();
          }}
        />
      )}
    </div>
  );
}