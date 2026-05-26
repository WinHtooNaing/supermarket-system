"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Package, Settings, Tags, Users } from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import {
  readSession,
  SESSION_UPDATED_EVENT,
  type SessionUser,
} from "@/lib/auth-session";

const menuItems = [
  { title: "Dashboard", url: "/admin/dashboard", icon: LayoutDashboard },
  { title: "Products", url: "/admin/products", icon: Package },
  { title: "Category", url: "/admin/category", icon: Tags },
  { title: "Sellers", url: "/admin/sellers", icon: Users },
  { title: "Settings", url: "/admin/settings", icon: Settings },
];

export function AppSidebar() {
  const pathname = usePathname();
  const [session, setSession] = useState<SessionUser | null>(null);

  useEffect(() => {
    function syncSession() {
      setSession(readSession());
    }

    syncSession();
    window.addEventListener(SESSION_UPDATED_EVENT, syncSession);
    window.addEventListener("storage", syncSession);

    return () => {
      window.removeEventListener(SESSION_UPDATED_EVENT, syncSession);
      window.removeEventListener("storage", syncSession);
    };
  }, []);

  return (
    <Sidebar className="border-r">
      <SidebarContent>
        <div className="px-4 py-4">
          <h1 className="text-lg font-bold">POS Supermarket</h1>
          <p className="text-xs text-muted-foreground">Admin Panel</p>
        </div>

        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>

          <SidebarMenu>
            {menuItems.map((item) => {
              const isActive = pathname.startsWith(item.url);

              return (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive}
                    className="transition-all"
                  >
                    <Link href={item.url} className="flex items-center gap-3">
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              );
            })}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <div className="flex items-center gap-3 border-t px-4 py-3">
          <Avatar>
            <AvatarFallback>
              {session?.name?.slice(0, 2).toUpperCase() || "AD"}
            </AvatarFallback>
          </Avatar>

          <div className="text-sm">
            <p className="font-medium">{session?.name || "Admin User"}</p>
            <p className="text-xs text-muted-foreground">
              {session?.role === "admin" ? "Administrator" : "Signed In"}
            </p>
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
