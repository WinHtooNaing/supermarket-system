"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { LayoutDashboard, Package, Tags, Users, Settings } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

const menuItems = [
  { title: "Dashboard", url: "/admin/dashboard", icon: LayoutDashboard },
  { title: "Products", url: "/admin/products", icon: Package },
  { title: "Category", url: "/admin/category", icon: Tags },
  { title: "Sellers", url: "/admin/sellers", icon: Users },
  { title: "Settings", url: "/admin/settings", icon: Settings },
];

export function AppSidebar() {
  const pathname = usePathname();

  return (
    <Sidebar className="border-r">
      <SidebarContent>
        {/* 🔷 LOGO / TITLE */}
        <div className="px-4 py-4">
          <h1 className="text-lg font-bold">🛒 Supermarket</h1>
          <p className="text-xs text-muted-foreground">Admin Panel</p>
        </div>

        {/* 🔹 MENU */}
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
                      <item.icon className="w-4 h-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              );
            })}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>

      {/* 🔻 FOOTER (USER PROFILE) */}
      <SidebarFooter>
        <div className="flex items-center gap-3 px-4 py-3 border-t">
          <Avatar>
            <AvatarFallback>W</AvatarFallback>
          </Avatar>

          <div className="text-sm">
            <p className="font-medium">Win Htoo</p>
            <p className="text-xs text-muted-foreground">Admin</p>
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
