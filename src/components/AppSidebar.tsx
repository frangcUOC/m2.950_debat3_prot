import { Link, useRouterState } from "@tanstack/react-router";
import { LayoutDashboard, Users, CalendarDays, AlertTriangle, BarChart3, Upload, Activity, ShieldCheck, Bug, Sparkles } from "lucide-react";
import {
  Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupContent, SidebarGroupLabel,
  SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem,
} from "@/components/ui/sidebar";
import { UserMenu } from "@/components/UserMenu";
import { useI18n } from "@/lib/i18n";

const items = [
  { key: "nav.dashboard", url: "/", icon: LayoutDashboard },
  { key: "nav.ingesta", url: "/ingesta", icon: Upload },
  { key: "nav.professionals", url: "/professionals", icon: Users },
  { key: "nav.quadrant", url: "/quadrant", icon: CalendarDays },
  { key: "nav.simulador", url: "/simulador", icon: AlertTriangle },
  { key: "nav.reporting", url: "/reporting", icon: BarChart3 },
  { key: "nav.incidencies", url: "/incidencies", icon: Bug },
  { key: "nav.previsio", url: "/previsio", icon: Sparkles },
  { key: "nav.dades", url: "/dades", icon: ShieldCheck },
];

export function AppSidebar() {
  const path = useRouterState({ select: (r) => r.location.pathname });
  const { t } = useI18n();
  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border">
        <div className="flex items-center gap-2 px-2 py-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Activity className="h-5 w-5" />
          </div>
          <div className="flex flex-col leading-tight group-data-[collapsible=icon]:hidden">
            <span className="font-semibold text-sm">TornAI</span>
            <span className="text-xs text-muted-foreground">{t("app.subtitle")}</span>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>{t("nav.section")}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton asChild isActive={path === item.url} tooltip={t(item.key)}>
                    <Link to={item.url}>
                      <item.icon />
                      <span>{t(item.key)}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="border-t border-sidebar-border">
        <UserMenu />
      </SidebarFooter>
    </Sidebar>
  );
}
