import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { User, Trash2, ShieldCheck, Loader2, Save, MapPin, ChevronDown, Check } from "lucide-react";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { base44 } from "@/api/base44Client";
import { useLang } from "@/lib/LanguageContext";
import { useMenuData } from "@/lib/useMenuData";
import { getProfile, saveProfile, clearProfile } from "@/lib/profileStorage";
import OrderHistorySection from "@/components/OrderHistorySection";
import { toast } from "sonner";

export default function Settings() {
  const { t } = useLang();
  const { data } = useMenuData();
  const locations = data?.locations || [];
  const [deleting, setDeleting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [locationDrawerOpen, setLocationDrawerOpen] = useState(false);
  const [profile, setProfile] = useState(() => getProfile());
  const set = (k) => (e) => setProfile((p) => ({ ...p, [k]: e.target.value }));

  const handleSave = () => {
    setSaving(true);
    toast.success(t("account.saved"));
    try {
      saveProfile(profile);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await base44.functions.invoke("deleteAccount", {});
      clearProfile();
      toast.success("Cuenta eliminada correctamente");
      try {
        await base44.auth.logout("/");
      } catch {
        /* app is public; logout may be a no-op */
      }
    } catch (e) {
      const msg = e?.response?.data?.error || e?.message || "No se pudo eliminar la cuenta";
      toast.error("Error al eliminar la cuenta", { description: msg });
      setDeleting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="md:max-w-2xl mx-auto px-4 md:px-6 py-6 md:py-10">
        <h1 className="font-display text-4xl tracking-wide mb-2">{t("account.title")}</h1>
        <p className="text-sm text-muted-foreground mb-8">{t("account.subtitle")}</p>

        <Card className="mb-6">
          <CardContent className="p-5 space-y-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary/15 rounded-lg flex items-center justify-center">
                <User className="w-5 h-5 text-primary" />
              </div>
              <p className="font-bold text-base">{t("account.personal")}</p>
            </div>

            <div className="grid sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">{t("checkout.name")}</Label>
                <Input value={profile.name} onChange={set("name")} placeholder="Nombre Apellidos" className="h-10" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">{t("checkout.phone")}</Label>
                <Input value={profile.phone} onChange={set("phone")} placeholder="612 345 678" className="h-10" />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label className="text-xs">{t("checkout.email")}</Label>
                <Input type="email" value={profile.email} onChange={set("email")} placeholder="email@ejemplo.com" className="h-10" />
              </div>
            </div>

            <div className="pt-2 border-t border-border/60">
              <p className="font-bold text-base mb-3 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-primary" /> {t("account.defaultAddress")}
              </p>
              <div className="grid sm:grid-cols-2 gap-3">
                <div className="space-y-1.5 sm:col-span-2">
                  <Label className="text-xs">{t("checkout.street")}</Label>
                  <Input value={profile.street} onChange={set("street")} placeholder="C/Askao 4" className="h-10" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">{t("checkout.floor")}</Label>
                  <Input value={profile.floor} onChange={set("floor")} placeholder="3º B" className="h-10" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">{t("checkout.area")}</Label>
                  <Input value={profile.area} onChange={set("area")} placeholder="Casco Viejo" className="h-10" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">{t("checkout.zip")}</Label>
                  <Input value={profile.zip} onChange={set("zip")} placeholder="48005" className="h-10" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">{t("account.defaultLocation")}</Label>
                  {/* Mobile: bottom sheet picker */}
                  <button
                    type="button"
                    onClick={() => setLocationDrawerOpen(true)}
                    className="md:hidden flex h-10 w-full items-center justify-between rounded-md border border-input bg-transparent px-3 text-sm text-left"
                  >
                    <span className={profile.location ? "text-foreground" : "text-muted-foreground"}>
                      {profile.location || "—"}
                    </span>
                    <ChevronDown className="w-4 h-4 opacity-50" />
                  </button>
                  <Drawer open={locationDrawerOpen} onOpenChange={setLocationDrawerOpen}>
                    <DrawerContent className="max-h-[70vh]">
                      <DrawerHeader>
                        <DrawerTitle>{t("account.defaultLocation")}</DrawerTitle>
                      </DrawerHeader>
                      <div className="overflow-y-auto px-4 pb-6 space-y-1">
                        {locations.map((l) => (
                          <button
                            key={l.id}
                            type="button"
                            onClick={() => {
                              setProfile((p) => ({ ...p, location: l.name }));
                              setLocationDrawerOpen(false);
                            }}
                            className={`flex items-center gap-3 w-full p-3 rounded-xl text-left text-sm transition-colors ${
                              profile.location === l.name
                                ? "bg-primary/10 text-primary font-semibold"
                                : "hover:bg-muted"
                            }`}
                          >
                            <MapPin className="w-4 h-4 flex-shrink-0" />
                            <span className="flex-1">{l.name}</span>
                            {profile.location === l.name && <Check className="w-4 h-4" />}
                          </button>
                        ))}
                      </div>
                    </DrawerContent>
                  </Drawer>
                  {/* Desktop: Radix Select */}
                  <div className="hidden md:block">
                    <Select
                      value={profile.location}
                      onValueChange={(val) => set("location")({ target: { value: val } })}
                    >
                      <SelectTrigger className="h-10 w-full">
                        <SelectValue placeholder="—" />
                      </SelectTrigger>
                      <SelectContent>
                        {locations.map((l) => (
                          <SelectItem key={l.id} value={l.name}>{l.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </div>

            <Button className="w-full rounded-full h-12 gap-2" onClick={handleSave} disabled={saving}>
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {t("account.save")}
            </Button>
          </CardContent>
        </Card>

        <OrderHistorySection />

        <Card className="mb-6">
          <CardContent className="p-5 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary/15 rounded-lg flex items-center justify-center">
                <ShieldCheck className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="font-bold text-base">{t("settings.account")}</p>
                <p className="text-xs text-muted-foreground">{t("settings.accountDesc")}</p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <ShieldCheck className="w-3.5 h-3.5 text-primary" />
              {t("settings.secure")}
            </div>
          </CardContent>
        </Card>

        <Card className="border-destructive/30">
          <CardContent className="p-5 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-destructive/15 rounded-lg flex items-center justify-center">
                <Trash2 className="w-5 h-5 text-destructive" />
              </div>
              <div>
                <p className="font-bold text-base text-destructive">{t("settings.delete")}</p>
                <p className="text-xs text-muted-foreground">{t("settings.deleteDesc")}</p>
              </div>
            </div>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" className="rounded-full gap-2 border-destructive/40 text-destructive hover:bg-destructive/10">
                  <Trash2 className="w-4 h-4" /> {t("settings.deleteBtn")}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>{t("settings.deleteTitle")}</AlertDialogTitle>
                  <AlertDialogDescription>{t("settings.deleteDialog")}</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel disabled={deleting}>{t("settings.cancel")}</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDelete}
                    disabled={deleting}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90 gap-2"
                  >
                    {deleting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" /> {t("settings.deleting")}
                      </>
                    ) : (
                      <>
                        <Trash2 className="w-4 h-4" /> {t("settings.confirm")}
                      </>
                    )}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}