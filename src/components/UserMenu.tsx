import { Moon, Sun, LogOut, User2, Settings2, Monitor } from "lucide-react";
import { useTheme } from "@/lib/theme";
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
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";

// Sessió simulada (no hi ha auth real)
const mockSession = {
  name: "Admin Demo",
  email: "admin@tornai.cat",
  role: "Coordinador/a de torns",
  center: "Hospital Central",
};

export function UserMenu() {
  const { theme, toggle, setTheme } = useTheme();
  const { state } = useSidebar();
  const collapsed = state === "collapsed";

  const initials = mockSession.name
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const handleLogout = () => {
    toast.success("Sessió tancada", {
      description: "S'ha tancat la sessió simulada correctament.",
    });
  };

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
          <DropdownMenuContent
            side="right"
            align="end"
            className="w-64"
          >
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
              Aparença
            </DropdownMenuLabel>
            <div className="flex items-center justify-between px-2 py-1.5">
              <div className="flex items-center gap-2 text-sm">
                {theme === "dark" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
                <span>Mode fosc</span>
              </div>
              <Switch checked={theme === "dark"} onCheckedChange={toggle} />
            </div>
            <DropdownMenuItem onClick={() => setTheme("light")}>
              <Sun className="h-4 w-4" />
              <span>Tema clar</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setTheme("dark")}>
              <Moon className="h-4 w-4" />
              <span>Tema fosc</span>
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => {
                const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
                setTheme(prefersDark ? "dark" : "light");
                toast.info("Tema sincronitzat amb el sistema");
              }}
            >
              <Monitor className="h-4 w-4" />
              <span>Seguir sistema</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem disabled>
              <User2 className="h-4 w-4" />
              <span>Perfil (pròximament)</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive">
              <LogOut className="h-4 w-4" />
              <span>Tanca la sessió</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
