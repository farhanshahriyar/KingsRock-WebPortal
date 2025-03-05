
import { Home, Users, Calendar, FileText, Megaphone, Trophy, Clock, CalendarRange, History, Plus } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSubMenu,
  useSidebar,
} from "@/components/ui/sidebar";
import { useRole } from "@/contexts/RoleContext";

const menuItems = [
  { title: "Dashboard", icon: Home, path: "/", feature: "dashboard" },
  // { title: "KR Announcement", icon: Megaphone, path: "/announcement", feature: "announcement" },
  { title: "Attendance", icon: Calendar, path: "/attendance", feature: "attendance" },
  { title: "NOC List", icon: FileText, path: "/noc", feature: "noc" },
  { title: "Leave Request", icon: FileText, path: "/leave-request", feature: "leave_request" },
  // { title: "Members", icon: Users, path: "/members", feature: "members" },
  // { title: "Tournaments", icon: Trophy, path: "/tournaments-matches", feature: "tournaments" },
  // {
  //   title: "Schedule",
  //   icon: Clock,
  //   path: "/schedule",
  //   feature: "schedule",
  //   submenu: [
  //     { title: "Schedule List", path: "/schedule", feature: "schedule" },
  //     { 
  //       title: "Schedule Requests", 
  //       path: "/request-schedule", 
  //       icon: CalendarRange,
  //       feature: "schedule.requests"
  //     },
  //   ],
  // },
  {
    title: "Update Logs",
    icon: History,
    path: "/update-logs",
    feature: "update_logs",
    // submenu: [
    //   { title: "View Logs", path: "/update-logs", feature: "update_logs" },
    //   // { 
    //   //   title: "Add Update Log", 
    //   //   path: "/add-updatelogs", 
    //   //   icon: Plus,
    //   //   feature: "update_logs.add"
    //   // },
    // ],
  },
];

export function SidebarNavigation() {
  const navigate = useNavigate();
  const location = useLocation();
  const { canAccess } = useRole();
  const { setOpenMobile, isMobile } = useSidebar();
  
  // Improved path matching to handle active states correctly
  const isPathActive = (path: string) => {
    // Exact match for dashboard
    if (path === "/" && location.pathname === "/") {
      return true;
    }
    // For other routes, check if the pathname starts with the path (excluding root)
    return path !== "/" && location.pathname.startsWith(path);
  };

  const handleNavigation = (path: string) => {
    navigate(path);
    // Close mobile sidebar after navigation
    if (isMobile) {
      setOpenMobile(false);
    }
  };

  return (
    <SidebarMenu>
      {menuItems.map((item) => (
        canAccess(item.feature) && (
          <SidebarMenuItem key={item.title}>
            {item.submenu ? (
              <SidebarSubMenu
                trigger={
                  <SidebarMenuButton 
                    className={isPathActive(item.path) ? "bg-accent" : ""}
                    tooltip={item.title}
                  >
                    <item.icon className="w-4 h-4 mr-2" />
                    <span>{item.title}</span>
                  </SidebarMenuButton>
                }
              >
                {item.submenu.map((subItem) => (
                  canAccess(subItem.feature) && (
                    <SidebarMenuItem key={subItem.title}>
                      <SidebarMenuButton
                        className={location.pathname === subItem.path ? "bg-accent" : ""}
                        onClick={() => handleNavigation(subItem.path)}
                      >
                        {subItem.icon && <subItem.icon className="w-4 h-4 mr-2" />}
                        <span>{subItem.title}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  )
                ))}
              </SidebarSubMenu>
            ) : (
              <SidebarMenuButton
                className={isPathActive(item.path) ? "bg-accent" : ""}
                onClick={() => handleNavigation(item.path)}
                tooltip={item.title}
              >
                <item.icon className="w-4 h-4 mr-2" />
                <span>{item.title}</span>
              </SidebarMenuButton>
            )}
          </SidebarMenuItem>
        )
      ))}
    </SidebarMenu>
  );
}
