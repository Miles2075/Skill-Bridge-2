import { useEffect, useState } from "react";
import {
  clearLocalSession,
  getLocalSession,
  getLocalUserRole,
  type LocalRole,
  type LocalUser,
} from "@/lib/local-db";

export type Role = LocalRole;

export function useAuth() {
  const [user, setUser] = useState<LocalUser | null>(null);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const sync = () => {
      const current = getLocalSession();
      setUser(current);
      setRoles(current ? [getLocalUserRole(current)] : []);
      setLoading(false);
    };

    window.addEventListener("local_auth_changed", sync);
    window.addEventListener("storage", sync);
    sync();
    return () => {
      window.removeEventListener("local_auth_changed", sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const signOut = async () => {
    clearLocalSession();
    window.location.href = "/auth";
  };

  const primaryRole: Role = roles.includes("admin")
    ? "admin"
    : roles.includes("teacher")
      ? "teacher"
      : "student";
  const isTeacher = primaryRole === "teacher" || primaryRole === "admin";
  const isAdmin = primaryRole === "admin";
  const isStudent = !isTeacher;

  return {
    user,
    roles,
    loading,
    isTeacher,
    isAdmin,
    isStudent,
    primaryRole,
    signOut,
  };
}
