
import React, { createContext, useContext, useState, ReactNode, useEffect } from "react";
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
  kr_admin: ["*"], // All access
  kr_manager: [
    "dashboard",
    "announcement",
    "attendance",
    "noc",
    "leave_request",
    "members",
    "tournaments",
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
  ],
};

const roleDisplayNames = {
  kr_admin: "KR Admin",
  kr_manager: "KR Manager",
  kr_member: "KR Member",
};

export function RoleProvider({ children }: { children: ReactNode }) {
  const [role, setRole] = useState<Role>("kr_member");

  // Initialize role from local storage or session if available
  useEffect(() => {
    const initializeRole = async () => {
      // Try to get role from Supabase session
      const { data } = await supabase.auth.getSession();
      if (data.session?.user?.user_metadata?.role) {
        setRole(data.session.user.user_metadata.role as Role);
      }
    };

    initializeRole();
  }, []);

  const canAccess = (feature: string) => {
    if (role === "kr_admin") return true;
    const permissions = featurePermissions[role] || [];
    return permissions.includes(feature) || permissions.includes(feature.split(".")[0]);
  };

  const getRoleDisplay = () => {
    return roleDisplayNames[role];
  };

  // Update user metadata when role changes
  useEffect(() => {
    const updateUserMetadata = async () => {
      const { data } = await supabase.auth.getUser();
      if (data.user) {
        await supabase.auth.updateUser({
          data: { role }
        });
      }
    };

    updateUserMetadata();
  }, [role]);

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
