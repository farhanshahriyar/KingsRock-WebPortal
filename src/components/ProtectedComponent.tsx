import { ReactNode } from "react";
import { useRole } from "@/contexts/RoleContext";

interface ProtectedComponentProps {
  feature: string;
  children: ReactNode;
  fallback?: ReactNode;
}

export function ProtectedComponent({ feature, children, fallback = null }: ProtectedComponentProps) {
  const { canAccess } = useRole();
  
  if (!canAccess(feature)) {
    return fallback;
  }
  
  return <>{children}</>;
}