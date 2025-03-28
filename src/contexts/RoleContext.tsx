import React, {
  createContext,
  useContext,
  useState,
  ReactNode,
  useEffect,
} from "react";
import { supabase } from "@/integrations/supabase/client";

type Role = "kr_admin" | "kr_manager" | "kr_member";

interface RoleContextType {
  role: Role;
  setRole: (role: Role) => void;
  canAccess: (feature: string) => boolean;
  getRoleDisplay: () => string;
}

const RoleContext = createContext<RoleContextType | undefined>(undefined);

const featurePermissions = {
  kr_admin: [
    "*",
    "dashboard",
    "settings",
    "members",
    "manage_members",
    "tournaments",
    "schedule",
    "leave_request, manage_user-reports",
  ], // All access
  kr_manager: [
    "dashboard",
    "announcement",
    "attendance",
    "noc",
    "leave_request",
    "members",
    "tournaments",
    "members.view",
    "manage_members",
    "manage_members.view",
    "members.edit",
    "schedule",
    "update_logs",
  ],
  kr_member: [
    "dashboard",
    "announcement.view",
    "attendance",
    "noc",
    "leave_request",
    "update_logs",
    // UI testing purposes it should be
    // "members.view",
    // "manage_members",
    // "manage_members.view",
    // "members.edit",
  ],
};

const roleDisplayNames = {
  kr_admin: "KR Admin",
  kr_manager: "KR Manager",
  kr_member: "KR Member",
};

export function RoleProvider({ children }: { children: ReactNode }) {
  const [role, setRole] = useState<Role>(null);
  const [user, setUser] = useState<null | object>(null);

  // Initialize role from local storage or session if available
  useEffect(() => {
    const initializeRole = async () => {
      // Try to get role from Supabase session
      const { data } = await supabase.auth.getSession();
      if (!data?.session) return;
      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", data.session.user.id)
        .single();

      // if (profile?.role) {
      //   setRole(profile.role as Role);
      // }

      if (profile?.role) {
        setRole(profile?.role as any);
      } else {
        setRole("kr_member"); // Default to kr_member if no role exists
      }
    };

    initializeRole();
  }, []);

  const canAccess = (feature: string) => {
    console.log(feature, "feature", role);
    if (role === "kr_admin" || role === null) return true;
    console.log("s");
    const permissions = featurePermissions[role] || [];
    return (
      permissions.includes(feature) ||
      permissions.includes(feature.split(".")[0])
    );
  };

  const getRoleDisplay = () => {
    return roleDisplayNames[role];
  };

  // Update user metadata when role changes
  // useEffect(() => {
  //   const updateUserMetadata = async () => {
  //     const { data } = await supabase.auth.getUser();
  //     if (data.user) {
  //       await supabase.auth.updateUser({
  //         data: { role }
  //       });
  //     }
  //   };

  //   updateUserMetadata();
  // }, [role]);

  return (
    <RoleContext.Provider value={{ role, setRole, canAccess, getRoleDisplay }}>
      {children}
    </RoleContext.Provider>
  );
}

export function useRole() {
  const context = useContext(RoleContext);
  if (context === undefined) {
    throw new Error("useRole must be used within a RoleProvider");
  }
  return context;
}
