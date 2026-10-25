import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Mail, Phone, MapPin, Clock, Send, Loader2 } from "lucide-react";
import { restaurantInfo } from "@/lib/menuData";
import { useMenuData } from "@/lib/useMenuData";
import { useLang } from "@/lib/LanguageContext";
import { toast } from "sonner";

export default function Contact() {
  const { t } = useLang();
  const { data } = useMenuData();
  const locations = data?.locations || [];
  const [sending, setSending] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const set = (k) => (e) => setForm((p) => ({ ...p, [k]: e.target.value }));

  const handleSubmit = (e) => {
    e.preventDefault();
    setSending(true);
    setTimeout(() => {
      setSending(false);
      setForm({ name: "", email: "", message: "" });
      toast.success(t("contact.sent"));
    }, 500);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="md:max-w-3xl mx-auto px-4 md:px-6 py-6 md:py-10">
        <h1 className="font-display text-4xl md:text-5xl tracking-wide mb-4">
          {t("contact.title")}
        </h1>
        <p className="text-muted-foreground mb-8">
          {t("contact.desc")}
        </p>

        <div className="grid sm:grid-cols-2 gap-4 mb-8">
          <Card>
            <CardContent className="p-5 flex items-start gap-3">
              <div className="w-10 h-10 bg-primary/15 rounded-lg flex items-center justify-center flex-shrink-0">
                <Phone className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="font-bold text-base">{t("contact.phone")}</p>
                <a href={`tel:+34${restaurantInfo.phone.replace(/\s/g, "")}`} className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  {restaurantInfo.phone}
                </a>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-5 flex items-start gap-3">
              <div className="w-10 h-10 bg-primary/15 rounded-lg flex items-center justify-center flex-shrink-0">
                <Mail className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="font-bold text-base">{t("contact.email")}</p>
                <a href="mailto:hola@bestfoods.es" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  hola@bestfoods.es
                </a>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-5 flex items-start gap-3">
              <div className="w-10 h-10 bg-primary/15 rounded-lg flex items-center justify-center flex-shrink-0">
                <Clock className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="font-bold text-base">{t("contact.hours")}</p>
                <p className="text-sm text-muted-foreground">
                  {restaurantInfo.hoursLunch} · {restaurantInfo.hoursDinner}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-5 flex items-start gap-3">
              <div className="w-10 h-10 bg-primary/15 rounded-lg flex items-center justify-center flex-shrink-0">
                <MapPin className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="font-bold text-base">{t("contact.locations")}</p>
                <p className="text-sm text-muted-foreground">{t("contact.locationsDesc")}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="mb-8">
          <CardContent className="p-5">
            <p className="font-bold text-base mb-4">{t("contact.writeMessage")}</p>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">{t("contact.name")}</Label>
                  <Input value={form.name} onChange={set("name")} placeholder={t("contact.namePh")} className="h-10" required />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">{t("checkout.email")}</Label>
                  <Input type="email" value={form.email} onChange={set("email")} placeholder="email@ejemplo.com" className="h-10" required />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">{t("contact.message")}</Label>
                <Textarea value={form.message} onChange={set("message")} placeholder={t("contact.messagePh")} rows={4} required />
              </div>
              <Button type="submit" className="w-full rounded-full h-12 gap-2" disabled={sending}>
                {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                {t("contact.send")}
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="space-y-3">
          {locations.map((loc) => (
            <div key={loc.id} className="rounded-xl border border-border bg-card p-4 flex items-start gap-3">
              <MapPin className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium text-foreground">{loc.name}</p>
                <p className="text-sm text-muted-foreground">{loc.address}</p>
                <a href={`tel:+34${loc.phone.replace(/\s/g, "")}`} className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  {loc.phone}
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}