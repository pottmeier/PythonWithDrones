"use client";

import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import DarkModeToggle from "@/components/ui/darkModeToggle";
import { AppSidebar } from "@/components/app-sidebar";

export default function DocumentationPage() {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
        <AppSidebar />

        <div className="flex flex-1 flex-col">
          <header className="p-4 flex items-center justify-between border-b">
            <SidebarTrigger />
            <DarkModeToggle />
          </header>

          <main className="flex-1 p-4 flex flex-col gap-6"></main>
        </div>
      </div>
    </SidebarProvider>
  );
}
