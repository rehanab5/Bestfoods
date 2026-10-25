import React, { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Plus, Pencil, Trash2, Loader2 } from "lucide-react";
import { categories, formatPrice } from "@/lib/menuData";
import MenuItemForm from "./MenuItemForm";

export default function MenuItemsManager() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null); // null closed | "new" | item

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { items: rows } = await base44.entities.MenuItem.filter({}, { sort: "sort_order", limit: 200 });
      setItems(rows);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const remove = async (id) => {
    if (!window.confirm("¿Eliminar este producto del menú?")) return;
    await base44.entities.MenuItem.delete(id);
    load();
  };

  const catLabel = (id) => categories.find((c) => c.id === id)?.label || id;

  if (loading) {
    return <div className="flex justify-center py-20"><Loader2 className="h-7 w-7 animate-spin text-muted-foreground" /></div>;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-muted-foreground">{items.length} productos</p>
        <Button size="sm" onClick={() => setEditing("new")}><Plus className="h-4 w-4 mr-1.5" />Nuevo producto</Button>
      </div>

      <div className="grid gap-2">
        {items.map((it) => (
          <div key={it.id} className="flex items-center gap-3 p-3 rounded-xl border border-border bg-card">
            <div className="h-12 w-12 rounded-lg overflow-hidden bg-muted shrink-0">
              {it.image ? (
                <img src={it.image} alt="" className="h-full w-full object-cover" />
              ) : (
                <div className="h-full w-full flex items-center justify-center text-lg">🍕</div>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-medium truncate">{it.name}</p>
              <p className="text-xs text-muted-foreground">
                {catLabel(it.category)} · {formatPrice(Number(it.price))}{it.is_deal ? " · Oferta" : ""}
              </p>
            </div>
            <Button size="icon" variant="ghost" onClick={() => setEditing(it)}><Pencil className="h-4 w-4" /></Button>
            <Button size="icon" variant="ghost" onClick={() => remove(it.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
          </div>
        ))}
        {items.length === 0 && <p className="text-center text-muted-foreground py-12">No hay productos todavía.</p>}
      </div>

      {editing !== null && (
        <MenuItemForm
          item={editing === "new" ? null : editing}
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