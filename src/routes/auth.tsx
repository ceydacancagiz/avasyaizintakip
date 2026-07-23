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
import { Loader2 } from "lucide-react";

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
      description: "Hesabınız hazır. Giriş yapabilirsiniz.",
    });
    setTab("login");
  };

  return (
    <div className="dark relative flex min-h-screen items-center justify-center overflow-hidden bg-black px-4 py-10">
      {/* Ambient glow */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <div className="h-[50rem] w-[50rem] rounded-full bg-brand-red/10 blur-[120px]" />
      </div>
      <div className="pointer-events-none absolute left-0 top-0 h-full w-full bg-[radial-gradient(circle_at_50%_0%,rgba(255,255,255,0.04),transparent_40%)]" />

      <div className="relative z-10 w-full max-w-md">
        <div className="mb-8 flex flex-col items-center gap-4 text-center">
          <div className="relative">
            <div className="absolute inset-0 rounded-3xl bg-brand-red/20 blur-xl" />
            <img
              src="/icon-512.png"
              alt="AVASYA TEKNOLOJİ İzin Takip"
              className="relative h-24 w-24 rounded-2xl shadow-2xl shadow-black/40"
            />
          </div>
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-white">
              AVASYA <span className="text-brand-red">TEKNOLOJİ</span>
            </h1>
            <p className="mt-1 text-sm font-medium text-white/60">
              İzin Yönetim ve Ortak Takvim
            </p>
          </div>
        </div>

        <Card className="border-white/10 bg-white/5 p-6 shadow-2xl shadow-black/50 backdrop-blur-md">
          <Tabs value={tab} onValueChange={(v) => setTab(v as "login" | "register")}>
            <TabsList className="grid w-full grid-cols-2 bg-white/10">
              <TabsTrigger value="login" className="data-[state=active]:bg-white data-[state=active]:text-black">
                Giriş Yap
              </TabsTrigger>
              <TabsTrigger value="register" className="data-[state=active]:bg-white data-[state=active]:text-black">
                Kayıt Ol
              </TabsTrigger>
            </TabsList>

            <TabsContent value="login" className="mt-6">
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="l-email" className="text-white/80">
                    E-posta
                  </Label>
                  <Input
                    id="l-email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="ad.soyad@avasya.com.tr"
                    className="border-white/10 bg-white/5 text-white placeholder:text-white/30 focus-visible:ring-brand-red"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="l-pass" className="text-white/80">
                    Şifre
                  </Label>
                  <Input
                    id="l-pass"
                    type="password"
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="border-white/10 bg-white/5 text-white placeholder:text-white/30 focus-visible:ring-brand-red"
                  />
                </div>
                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-white text-black hover:bg-white/90"
                >
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Giriş Yap
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="register" className="mt-6">
              <form onSubmit={handleRegister} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="r-name" className="text-white/80">
                    Ad Soyad
                  </Label>
                  <Input
                    id="r-name"
                    required
                    value={adSoyad}
                    onChange={(e) => setAdSoyad(e.target.value)}
                    placeholder="Ahmet Yılmaz"
                    className="border-white/10 bg-white/5 text-white placeholder:text-white/30 focus-visible:ring-brand-red"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="r-dep" className="text-white/80">
                    Departman
                  </Label>
                  <Input
                    id="r-dep"
                    value={departman}
                    onChange={(e) => setDepartman(e.target.value)}
                    placeholder="Yazılım Geliştirme"
                    className="border-white/10 bg-white/5 text-white placeholder:text-white/30 focus-visible:ring-brand-red"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="r-email" className="text-white/80">
                    E-posta
                  </Label>
                  <Input
                    id="r-email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="ad.soyad@avasya.com.tr"
                    className="border-white/10 bg-white/5 text-white placeholder:text-white/30 focus-visible:ring-brand-red"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="r-pass" className="text-white/80">
                    Şifre
                  </Label>
                  <Input
                    id="r-pass"
                    type="password"
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="border-white/10 bg-white/5 text-white placeholder:text-white/30 focus-visible:ring-brand-red"
                  />
                </div>
                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-white text-black hover:bg-white/90"
                >
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Hesap Oluştur
                </Button>
                <p className="text-center text-xs text-white/50">
                  Kayıt olan ilk kullanıcı otomatik olarak <b className="text-white/80">Yönetici</b> yetkisi alır.
                </p>
              </form>
            </TabsContent>
          </Tabs>
        </Card>

        <p className="mt-6 text-center text-xs text-white/30">
          © {new Date().getFullYear()} AVASYA TEKNOLOJİ. Tüm hakları saklıdır.
        </p>
      </div>
    </div>
  );
}
