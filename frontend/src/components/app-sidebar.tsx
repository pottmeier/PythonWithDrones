import { Home, FileSearchIcon, Award, Github } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

const items = [
  {
    title: "Home",
    url: `${basePath}/`,
    icon: Home,
  },
  {
    title: "Progress",
    url: `${basePath}/progress`,
    icon: Award,
  },
  {
    title: "Documentation",
    url: `${basePath}/documentation`,
    icon: FileSearchIcon,
  },
];

export function AppSidebar() {
  return (
    <Sidebar className="fixed left-0 top-0 z-50 h-dvh w-64">
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Python with Drones</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <a
                      href={item.url}
                      className="flex items-center gap-3 px-3 py-6 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-md"
                    >
                      <item.icon className="scale-125" />
                      <span className="text-lg font-medium">{item.title}</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <div className="mt-auto flex justify-center pb-6">
          <a
            href="https://github.com/pottmeier/PythonWithDrones"
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-col items-center"
          >
            <Github className="w-6 h-6" />
            <span className="text-xs mt-1 text-muted-foreground">
              GitHub
            </span>
          </a>
        </div>
      </SidebarContent>
    </Sidebar>
  );
}
