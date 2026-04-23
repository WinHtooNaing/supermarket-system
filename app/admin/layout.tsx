import { AppSidebar } from "@/components/app-sidebar";
import AppTopBar from "@/components/app-topbar";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarTrigger />
      <main className="w-full h-screen">
        <AppTopBar />
        {children}
      </main>
    </SidebarProvider>
  );
}
