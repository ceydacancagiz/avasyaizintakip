import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import {
  CalendarDays,
  LayoutDashboard,
  CalendarClock,
  FileText,
  PlusCircle,
  CheckSquare,
  User,
  LogOut,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

const baseItems = [
  { title: "Panel", url: "/panel", icon: LayoutDashboard },
  { title: "Ortak Takvim", url: "/takvim", icon: CalendarClock },
  { title: "Yeni İzin Talebi", url: "/yeni-talep", icon: PlusCircle },
  { title: "Taleplerim", url: "/taleplerim", icon: FileText },
];

export function AppSidebar() {
  const { profile, isManager, signOut } = useAuth();
  const nav = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isActive = (u: string) => pathname === u || pathname.startsWith(u + "/");
  const mainItems = isManager
    ? baseItems.filter((i) => i.url !== "/taleplerim")
    : baseItems;

  const handleSignOut = async () => {
    await signOut();
    toast.success("Çıkış yapıldı");
    nav({ to: "/auth", replace: true });
  };

  const initials = (profile?.ad_soyad ?? "?")
    .split(" ")
    .map((s) => s[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border/60 px-3 py-4">
        <div className="flex items-center gap-2.5">
          <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
            <CalendarDays className="h-5 w-5" />
          </div>
          <div className="min-w-0 group-data-[collapsible=icon]:hidden">
            <p className="truncate text-sm font-bold tracking-tight text-sidebar-foreground">
              AVASYA TEKNOLOJİ
            </p>
            <p className="truncate text-[11px] text-sidebar-foreground/70">
              İzin Yönetimi
            </p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Menü</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainItems.map((item) => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive(item.url)}
                    tooltip={item.title}
                  >
                    <Link to={item.url}>
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {isManager && (
          <SidebarGroup>
            <SidebarGroupLabel>Yönetici</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive("/onay-paneli")}
                    tooltip="Onay Paneli"
                  >
                    <Link to="/onay-paneli">
                      <CheckSquare />
                      <span>Onay Paneli</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border/60">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild tooltip="Profil" size="lg">
              <Link to="/profil">
                <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-sidebar-accent text-xs font-semibold text-sidebar-accent-foreground">
                  {initials}
                </div>
                <div className="flex min-w-0 flex-col leading-tight">
                  <span className="truncate text-sm font-medium">
                    {profile?.ad_soyad ?? "Kullanıcı"}
                  </span>
                  <span className="truncate text-[11px] text-sidebar-foreground/60">
                    {isManager ? "Yönetici" : "Çalışan"}
                  </span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={handleSignOut} tooltip="Çıkış">
              <LogOut />
              <span>Çıkış Yap</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}

export { User };
