import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";

const EMPTY = { name: "", address: "", area: "", phone: "", lat: "", lng: "", sort_order: 0 };

export default function LocationForm({ loc, onClose, onSaved }) {
  const qc = useQueryClient();
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setForm(loc ? { ...EMPTY, ...loc } : EMPTY);
  }, [loc]);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.address) return;
    setSaving(true);
    try {
      const payload = {
        ...form,
        lat: form.lat === "" ? undefined : Number(form.lat),
        lng: form.lng === "" ? undefined : Number(form.lng),
        sort_order: Number(form.sort_order || 0),
      };
      if (loc) await base44.entities.Location.update(loc.id, payload);
      else await base44.entities.Location.create(payload);
      qc.invalidateQueries({ queryKey: ["menuData"] });
      onSaved();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{loc ? "Editar local" : "Nuevo local"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="grid gap-4 py-2">
          <div className="grid gap-2"><Label>Nombre *</Label><Input value={form.name} onChange={(e) => set("name", e.target.value)} required /></div>
          <div className="grid gap-2"><Label>Dirección *</Label><Input value={form.address} onChange={(e) => set("address", e.target.value)} required /></div>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-2"><Label>Zona</Label><Input value={form.area} onChange={(e) => set("area", e.target.value)} placeholder="Casco Viejo" /></div>
            <div className="grid gap-2"><Label>Teléfono</Label><Input value={form.phone} onChange={(e) => set("phone", e.target.value)} /></div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="grid gap-2"><Label>Latitud</Label><Input type="number" step="any" value={form.lat} onChange={(e) => set("lat", e.target.value)} /></div>
            <div className="grid gap-2"><Label>Longitud</Label><Input type="number" step="any" value={form.lng} onChange={(e) => set("lng", e.target.value)} /></div>
            <div className="grid gap-2"><Label>Orden</Label><Input type="number" value={form.sort_order} onChange={(e) => set("sort_order", e.target.value)} /></div>
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={onClose}>Cancelar</Button>
            <Button type="submit" disabled={saving}>{saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}Guardar</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}