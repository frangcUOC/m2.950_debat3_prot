import { Moon, Sun, LogOut, User2, Settings2, Languages, Check } from "lucide-react";
import { useTheme } from "@/lib/theme";
import { useI18n, LANG_LABELS, type Lang } from "@/lib/i18n";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SidebarMenu, SidebarMenuButton, SidebarMenuItem, useSidebar } from "@/components/ui/sidebar";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { toast } from "sonner";

const mockSession = {
  name: "Admin Demo",
  email: "admin@tornai.cat",
  role: "Coordinador/a de torns",
  center: "Hospital Central",
};

export function UserMenu() {
  const { theme, toggle } = useTheme();
  const { lang, setLang, t } = useI18n();
  const { state } = useSidebar();
  const collapsed = state === "collapsed";

  const initials = mockSession.name
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const handleLogout = () => {
    toast.success(t("user.logout.toast"), { description: t("user.logout.toast.desc") });
  };

  const isDark = theme === "dark";
  const langs: Lang[] = ["ca", "es", "en"];

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              tooltip={mockSession.name}
              className="data-[state=open]:bg-sidebar-accent"
            >
              <Avatar className="h-8 w-8 rounded-md">
                <AvatarFallback className="rounded-md bg-primary text-primary-foreground text-xs font-semibold">
                  {initials}
                </AvatarFallback>
              </Avatar>
              {!collapsed && (
                <div className="flex flex-col leading-tight text-left min-w-0">
                  <span className="text-sm font-medium truncate">{mockSession.name}</span>
                  <span className="text-xs text-muted-foreground truncate">{mockSession.role}</span>
                </div>
              )}
              <Settings2 className="ml-auto opacity-60 group-data-[collapsible=icon]:hidden" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent side="right" align="end" className="w-64">
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col gap-1">
                <p className="text-sm font-semibold">{mockSession.name}</p>
                <p className="text-xs text-muted-foreground">{mockSession.email}</p>
                <p className="text-xs text-muted-foreground">
                  {mockSession.role} · {mockSession.center}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />

            <DropdownMenuLabel className="text-xs text-muted-foreground font-normal">
              {t("user.appearance")}
            </DropdownMenuLabel>
            <DropdownMenuItem onClick={toggle}>
              {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              <span>{isDark ? t("user.theme.light") : t("user.theme.dark")}</span>
            </DropdownMenuItem>

            <DropdownMenuSeparator />
            <DropdownMenuLabel className="text-xs text-muted-foreground font-normal flex items-center gap-1.5">
              <Languages className="h-3.5 w-3.5" /> {t("user.language")}
            </DropdownMenuLabel>
            {langs.map((l) => (
              <DropdownMenuItem key={l} onClick={() => setLang(l)}>
                <span className="w-4">{lang === l && <Check className="h-4 w-4" />}</span>
                <span>{LANG_LABELS[l]}</span>
              </DropdownMenuItem>
            ))}

            <DropdownMenuSeparator />
            <DropdownMenuItem disabled>
              <User2 className="h-4 w-4" />
              <span>{t("user.profile")}</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive">
              <LogOut className="h-4 w-4" />
              <span>{t("user.logout")}</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
