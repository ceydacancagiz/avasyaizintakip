import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Loader2, CalendarDays } from "lucide-react";

export const Route = createFileRoute("/auth")({
  ssr: false,
  component: AuthPage,
});

function AuthPage() {
  const nav = useNavigate();
  const { session, loading: authLoading } = useAuth();
  const [tab, setTab] = useState<"login" | "register">("login");
  const [loading, setLoading] = useState(false);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [adSoyad, setAdSoyad] = useState("");
  const [departman, setDepartman] = useState("");

  useEffect(() => {
    if (session && !authLoading) nav({ to: "/panel", replace: true });
  }, [session, authLoading, nav]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      toast.error("Giriş başarısız", { description: error.message });
      return;
    }
    toast.success("Hoş geldiniz!");
    nav({ to: "/panel", replace: true });
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adSoyad.trim()) {
      toast.error("Lütfen ad soyad girin");
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/`,
        data: { ad_soyad: adSoyad, departman: departman || "Genel" },
      },
    });
    setLoading(false);
    if (error) {
      toast.error("Kayıt başarısız", { description: error.message });
      return;
    }
    toast.success("Kayıt oluşturuldu", {
      description: "E-postanızı doğrulamanız gerekebilir.",
    });
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background via-background to-secondary/30 px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-8 flex flex-col items-center gap-3 text-center">
          <div className="grid h-14 w-14 place-items-center rounded-2xl bg-primary text-primary-foreground shadow-lg">
            <CalendarDays className="h-7 w-7" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">
              AVASYA
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              İzin Yönetim ve Ortak Takvim
            </p>
          </div>
        </div>

        <Card className="border-border/60 p-6 shadow-xl">
          <Tabs value={tab} onValueChange={(v) => setTab(v as "login" | "register")}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Giriş Yap</TabsTrigger>
              <TabsTrigger value="register">Kayıt Ol</TabsTrigger>
            </TabsList>

            <TabsContent value="login" className="mt-6">
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="l-email">E-posta</Label>
                  <Input
                    id="l-email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="ad.soyad@avasya.com.tr"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="l-pass">Şifre</Label>
                  <Input
                    id="l-pass"
                    type="password"
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
                <Button type="submit" disabled={loading} className="w-full">
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Giriş Yap
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="register" className="mt-6">
              <form onSubmit={handleRegister} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="r-name">Ad Soyad</Label>
                  <Input
                    id="r-name"
                    required
                    value={adSoyad}
                    onChange={(e) => setAdSoyad(e.target.value)}
                    placeholder="Ahmet Yılmaz"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="r-dep">Departman</Label>
                  <Input
                    id="r-dep"
                    value={departman}
                    onChange={(e) => setDepartman(e.target.value)}
                    placeholder="Yazılım Geliştirme"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="r-email">E-posta</Label>
                  <Input
                    id="r-email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="r-pass">Şifre</Label>
                  <Input
                    id="r-pass"
                    type="password"
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
                <Button type="submit" disabled={loading} className="w-full">
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Hesap Oluştur
                </Button>
                <p className="text-center text-xs text-muted-foreground">
                  Kayıt olan ilk kullanıcı otomatik olarak <b>Yönetici</b> yetkisi alır.
                </p>
              </form>
            </TabsContent>
          </Tabs>
        </Card>
      </div>
    </div>
  );
}
