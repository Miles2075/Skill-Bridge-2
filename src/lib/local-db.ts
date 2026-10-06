export type LocalRole = "admin" | "teacher" | "student";

export interface LocalUser {
  id: string;
  email: string;
  user_metadata: {
    display_name: string;
    email: string;
    role: LocalRole;
    avatar_url?: string;
  };
  created_at: string;
  updated_at: string;
}

interface StoredUser extends LocalUser {
  passwordHash: string;
}

const USERS_KEY = "skillbridge_local_users";
const SESSION_KEY = "skillbridge_local_session";
const ALL_SESSION_KEYS = [
  "skillbridge_local_session",
  "skillbridge_local_auth_session",
  "sb-local-auth-token",
  "sb-csjygxumpnonfupobhih-auth-token",
];

function readUsers(): StoredUser[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(USERS_KEY);
    return raw ? (JSON.parse(raw) as StoredUser[]) : [];
  } catch {
    return [];
  }
}

function writeUsers(users: StoredUser[]) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

function makeId() {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `user_${Date.now()}_${Math.random().toString(36).slice(2)}`;
}

async function hashPassword(password: string) {
  const data = new TextEncoder().encode(password);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

export async function createLocalUser(params: {
  email: string;
  password: string;
  name?: string;
  role?: LocalRole;
}): Promise<{ user?: LocalUser; error?: string }> {
  const email = params.email.trim().toLowerCase();
  const users = readUsers();

  if (users.some((user) => user.email === email)) {
    return { error: "An account with this email already exists." };
  }

  const now = new Date().toISOString();
  const displayName = params.name?.trim() || email.split("@")[0] || "Learner";
  const user: LocalUser = {
    id: makeId(),
    email,
    user_metadata: {
      display_name: displayName,
      email,
      role: params.role ?? "student",
    },
    created_at: now,
    updated_at: now,
  };

  users.push({ ...user, passwordHash: await hashPassword(params.password) });
  writeUsers(users);
  setLocalSession(user);
  return { user };
}

export async function signInLocalUser(params: {
  email: string;
  password: string;
}): Promise<{ user?: LocalUser; error?: string }> {
  const email = params.email.trim().toLowerCase();
  const passwordHash = await hashPassword(params.password);
  const user = readUsers().find(
    (candidate) => candidate.email === email && candidate.passwordHash === passwordHash,
  );

  if (!user) return { error: "Invalid email or password." };

  const { passwordHash: _passwordHash, ...safeUser } = user;
  setLocalSession(safeUser);
  return { user: safeUser };
}

export function setLocalSession(user: LocalUser) {
  if (typeof window === "undefined") return;
  const now = new Date().toISOString();
  const role = user.user_metadata?.role || "student";
  const displayName = user.user_metadata?.display_name || user.email.split("@")[0] || "Learner";

  const sessionData = {
    access_token: `sb_token_${user.id}_${Date.now()}`,
    token_type: "bearer",
    expires_in: 86400 * 30,
    expires_at: Math.floor(Date.now() / 1000) + 86400 * 30,
    refresh_token: `sb_ref_${user.id}_${Date.now()}`,
    user: {
      id: user.id,
      aud: "authenticated",
      role: "authenticated",
      email: user.email,
      email_confirmed_at: now,
      phone: "",
      confirmed_at: now,
      last_sign_in_at: now,
      app_metadata: { provider: "email", providers: ["email"] },
      user_metadata: {
        display_name: displayName,
        email: user.email,
        role,
        avatar_url: user.user_metadata?.avatar_url,
        sub: user.id,
      },
      identities: [],
      created_at: user.created_at || now,
      updated_at: user.updated_at || now,
      is_anonymous: false,
    },
  };

  localStorage.setItem(SESSION_KEY, JSON.stringify(user));
  localStorage.setItem("skillbridge_local_auth_session", JSON.stringify(sessionData));
  localStorage.setItem("sb-local-auth-token", JSON.stringify(sessionData));
  localStorage.setItem("sb-csjygxumpnonfupobhih-auth-token", JSON.stringify(sessionData));

  try {
    document.cookie = `sb-local-auth-token=${encodeURIComponent(JSON.stringify(sessionData))}; path=/; max-age=2592000; SameSite=Lax`;
    document.cookie = `skillbridge_role=${role}; path=/; max-age=2592000; SameSite=Lax`;
  } catch {
    // ignore
  }

  window.dispatchEvent(new CustomEvent("local_auth_changed"));
  window.dispatchEvent(new Event("storage"));
}

export function getLocalSession(): LocalUser | null {
  if (typeof window === "undefined") return null;

  for (const key of ALL_SESSION_KEYS) {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) continue;
      const parsed = JSON.parse(raw);
      if (!parsed) continue;

      if (parsed.email && parsed.user_metadata?.role) {
        return parsed as LocalUser;
      }

      const u = parsed.user || (parsed.access_token ? parsed : null);
      if (u && (u.email || u.id)) {
        const role = (u.user_metadata?.role as LocalRole) || "student";
        const displayName = u.user_metadata?.display_name || u.email?.split("@")[0] || "Learner";
        const localUser: LocalUser = {
          id: u.id || "00000000-0000-4000-a000-000000000001",
          email: u.email || "student@skillbridge.edu",
          user_metadata: {
            display_name: displayName,
            email: u.email || "student@skillbridge.edu",
            role,
          },
          created_at: u.created_at || new Date().toISOString(),
          updated_at: u.updated_at || new Date().toISOString(),
        };
        try {
          localStorage.setItem(SESSION_KEY, JSON.stringify(localUser));
        } catch {
          // ignore
        }
        return localUser;
      }
    } catch {
      // ignore
    }
  }

  return null;
}

export function clearLocalSession() {
  if (typeof window === "undefined") return;
  for (const key of ALL_SESSION_KEYS) {
    try {
      localStorage.removeItem(key);
    } catch {
      // ignore
    }
  }
  try {
    document.cookie = "sb-local-auth-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    document.cookie = "skillbridge_role=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
  } catch {
    // ignore
  }
  window.dispatchEvent(new CustomEvent("local_auth_changed"));
  window.dispatchEvent(new Event("storage"));
}

export function getLocalUserRole(user: LocalUser | null): LocalRole {
  return user?.user_metadata?.role ?? "student";
}

export function updateLocalSessionProfile(params: {
  displayName?: string;
  avatarUrl?: string | null;
}) {
  if (typeof window === "undefined") return;

  try {
    const current = getLocalSession();
    if (!current) return;
    if (params.displayName !== undefined) current.user_metadata.display_name = params.displayName;
    if (params.avatarUrl !== undefined) {
      if (params.avatarUrl === null) delete current.user_metadata.avatar_url;
      else current.user_metadata.avatar_url = params.avatarUrl;
    }
    current.updated_at = new Date().toISOString();
    localStorage.setItem(SESSION_KEY, JSON.stringify(current));

    const users = readUsers();
    const index = users.findIndex((item) => item.id === current.id);
    if (index >= 0) {
      users[index] = {
        ...users[index],
        ...current,
        user_metadata: { ...users[index].user_metadata, ...current.user_metadata },
      };
      writeUsers(users);
    }

    for (const key of [
      "sb-local-auth-token",
      "sb-csjygxumpnonfupobhih-auth-token",
      "skillbridge_local_auth_session",
    ]) {
      const raw = localStorage.getItem(key);
      if (!raw) continue;
      const session = JSON.parse(raw);
      if (session?.user?.id === current.id) {
        session.user.user_metadata = { ...session.user.user_metadata, ...current.user_metadata };
        session.user.updated_at = current.updated_at;
        localStorage.setItem(key, JSON.stringify(session));
      }
    }
  } catch {
    // ignore local session sync failures
  }
  window.dispatchEvent(new CustomEvent("local_auth_changed"));
  window.dispatchEvent(new Event("storage"));
}
