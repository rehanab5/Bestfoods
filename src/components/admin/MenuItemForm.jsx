import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Loader2, Upload } from "lucide-react";
import { categories } from "@/lib/menuData";

const EMPTY = {
  name: "", name_en: "", description: "", description_en: "",
  price: "", category: "kebab", image: "", is_deal: false, badge: "", sort_order: 0,
};

export default function MenuItemForm({ item, onClose, onSaved }) {
  const qc = useQueryClient();
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    setForm(item ? { ...EMPTY, ...item, price: item.price ?? "" } : EMPTY);
  }, [item]);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const onFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadPublicFile({ file });
      set("image", file_url);
    } finally {
      setUploading(false);
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!form.name || form.price === "") return;
    setSaving(true);
    try {
      const payload = { ...form, price: Number(form.price), sort_order: Number(form.sort_order || 0) };
      if (item) await base44.entities.MenuItem.update(item.id, payload);
      else await base44.entities.MenuItem.create(payload);
      qc.invalidateQueries({ queryKey: ["menuData"] });
      onSaved();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{item ? "Editar producto" : "Nuevo producto"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="grid gap-4 py-2">
          <div className="grid gap-2">
            <Label>Nombre (ES) *</Label>
            <Input value={form.name} onChange={(e) => set("name", e.target.value)} required />
          </div>
          <div className="grid gap-2">
            <Label>Name (EN)</Label>
            <Input value={form.name_en} onChange={(e) => set("name_en", e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-2">
              <Label>Precio (€) *</Label>
              <Input type="number" step="0.01" min="0" value={form.price} onChange={(e) => set("price", e.target.value)} required />
            </div>
            <div className="grid gap-2">
              <Label>Categoría</Label>
              <Select value={form.category} onValueChange={(v) => set("category", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid gap-2">
            <Label>Descripción (ES)</Label>
            <Textarea rows={2} value={form.description} onChange={(e) => set("description", e.target.value)} />
          </div>
          <div className="grid gap-2">
            <Label>Description (EN)</Label>
            <Textarea rows={2} value={form.description_en} onChange={(e) => set("description_en", e.target.value)} />
          </div>
          <div className="grid gap-2">
            <Label>Imagen</Label>
            <div className="flex items-center gap-3">
              <div className="h-14 w-14 rounded-lg overflow-hidden bg-muted shrink-0">
                {form.image ? <img src={form.image} alt="" className="h-full w-full object-cover" /> : null}
              </div>
              <Label className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-input cursor-pointer text-sm">
                {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                Subir imagen
                <input type="file" accept="image/*" className="hidden" onChange={onFile} disabled={uploading} />
              </Label>
              {form.image && <Button type="button" variant="ghost" size="sm" onClick={() => set("image", "")}>Quitar</Button>}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-2">
              <Label>Insignia</Label>
              <Input value={form.badge} onChange={(e) => set("badge", e.target.value)} placeholder="Nuevo, Popular…" />
            </div>
            <div className="grid gap-2">
              <Label>Orden</Label>
              <Input type="number" value={form.sort_order} onChange={(e) => set("sort_order", e.target.value)} />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Switch checked={!!form.is_deal} onCheckedChange={(v) => set("is_deal", v)} />
            <Label>Marcar como oferta</Label>
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