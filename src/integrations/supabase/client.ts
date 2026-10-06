// 100% Local database and authentication client adapter.
// Replaces remote Supabase connections with built-in local database and local storage.

export interface LocalAuthUser {
  id: string;
  aud: string;
  role: string;
  email?: string;
  email_confirmed_at?: string;
  phone?: string;
  confirmed_at?: string;
  last_sign_in_at?: string;
  app_metadata: {
    provider?: string;
    providers?: string[];
    [key: string]: unknown;
  };
  user_metadata: {
    display_name?: string;
    role?: "student" | "teacher" | "admin";
    sub?: string;
    email?: string;
    avatar_url?: string;
    [key: string]: unknown;
  };
  identities?: unknown[];
  created_at: string;
  updated_at: string;
  is_anonymous?: boolean;
}

export interface LocalAuthSession {
  access_token: string;
  token_type: string;
  expires_in: number;
  expires_at?: number;
  refresh_token: string;
  user: LocalAuthUser;
}

type AuthChangeCallback = (
  event: "SIGNED_IN" | "SIGNED_OUT" | "TOKEN_REFRESHED" | "INITIAL_SESSION",
  session: LocalAuthSession | null,
) => void;

const STORAGE_KEYS = [
  "sb-local-auth-token",
  "sb-csjygxumpnonfupobhih-auth-token",
  "skillbridge_local_auth_session",
];

function getStoredSession(): LocalAuthSession | null {
  if (typeof window === "undefined") return null;
  for (const key of STORAGE_KEYS) {
    try {
      const val = localStorage.getItem(key);
      if (val) {
        const parsed = JSON.parse(val);
        if (parsed && (parsed.access_token || parsed.user)) {
          return parsed as LocalAuthSession;
        }
      }
    } catch {
      // ignore
    }
  }
  return null;
}

function saveStoredSession(session: LocalAuthSession | null) {
  if (typeof window === "undefined") return;
  for (const key of STORAGE_KEYS) {
    try {
      if (session) {
        localStorage.setItem(key, JSON.stringify(session));
      } else {
        localStorage.removeItem(key);
      }
    } catch {
      // ignore
    }
  }

  try {
    if (session?.user) {
      const role =
        (session.user.user_metadata?.role as "student" | "teacher" | "admin") || "student";
      const localUser = {
        id: session.user.id,
        email: session.user.email || "",
        user_metadata: {
          display_name:
            session.user.user_metadata?.display_name ||
            session.user.email?.split("@")[0] ||
            "Learner",
          email: session.user.email || "",
          role,
        },
        created_at: session.user.created_at,
        updated_at: session.user.updated_at,
      };
      localStorage.setItem("skillbridge_local_session", JSON.stringify(localUser));
      document.cookie = `sb-local-auth-token=${encodeURIComponent(JSON.stringify(session))}; path=/; max-age=2592000; SameSite=Lax`;
      document.cookie = `skillbridge_role=${role}; path=/; max-age=2592000; SameSite=Lax`;
    } else {
      localStorage.removeItem("skillbridge_local_session");
      document.cookie = "sb-local-auth-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
      document.cookie = "skillbridge_role=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    }
  } catch {
    // ignore
  }
  window.dispatchEvent(new CustomEvent("local_auth_changed"));
  window.dispatchEvent(new Event("storage"));
}

class ClientQueryBuilder<T = unknown> implements PromiseLike<{
  data: T | null;
  error: { message: string } | null;
}> {
  private tableName: string;
  private action: "select" | "insert" | "update" | "upsert" | "delete" = "select";
  private selectedColumns = "*";
  private filterValues: Record<string, unknown> = {};
  private payloadValues?: unknown;
  private conflictKey?: string;
  private isSingle = false;
  private isMaybeSingle = false;

  constructor(tableName: string) {
    this.tableName = tableName;
  }

  select(columns = "*") {
    this.selectedColumns = columns;
    this.action = "select";
    return this;
  }

  eq(column: string, value: unknown) {
    this.filterValues[column] = value;
    return this;
  }

  update(values: unknown) {
    this.action = "update";
    this.payloadValues = values;
    return this;
  }

  insert(values: unknown) {
    this.action = "insert";
    this.payloadValues = values;
    return this;
  }

  upsert(values: unknown, options?: { onConflict?: string }) {
    this.action = "upsert";
    this.payloadValues = values;
    if (options?.onConflict) {
      this.conflictKey = options.onConflict;
    }
    return this;
  }

  delete() {
    this.action = "delete";
    return this;
  }

  single() {
    this.isSingle = true;
    return this;
  }

  maybeSingle() {
    this.isMaybeSingle = true;
    return this;
  }

  async then<TResult1 = { data: T | null; error: { message: string } | null }, TResult2 = never>(
    onfulfilled?:
      | ((value: {
          data: T | null;
          error: { message: string } | null;
        }) => TResult1 | PromiseLike<TResult1>)
      | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null,
  ): Promise<TResult1 | TResult2> {
    try {
      // Client-side query over local API endpoint
      const session = getStoredSession();
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (session?.access_token) {
        headers["Authorization"] = `Bearer ${session.access_token}`;
      }

      let data: unknown = null;
      let error: { message: string } | null = null;

      try {
        const response = await fetch("/api/lms/query", {
          method: "POST",
          headers,
          body: JSON.stringify({
            table: this.tableName,
            action: this.action,
            columns: this.selectedColumns,
            filters: Object.keys(this.filterValues).length > 0 ? this.filterValues : undefined,
            values: this.payloadValues,
            onConflict: this.conflictKey,
          }),
        });

        if (response.ok) {
          const json = await response.json();
          data = json.data;
          error = json.error;
        } else {
          error = { message: `Request failed with status ${response.status}` };
        }
      } catch (networkErr: unknown) {
        // Fallback for special offline client queries
        if (this.tableName === "user_roles" && session?.user) {
          const role = session.user.user_metadata?.role || "student";
          data = [{ role }];
          error = null;
        } else if (this.tableName === "purchases") {
          data = [];
          error = null;
        } else {
          error = { message: networkErr instanceof Error ? networkErr.message : "Network error" };
        }
      }

      if (Array.isArray(data)) {
        if (this.isSingle || this.isMaybeSingle) {
          data = data.length > 0 ? data[0] : null;
        }
      }

      const result = { data: data as T, error };
      return onfulfilled ? onfulfilled(result) : (result as unknown as TResult1);
    } catch (err: unknown) {
      const errorResult = {
        data: null,
        error: { message: err instanceof Error ? err.message : "Query error" },
      };
      if (onfulfilled) return onfulfilled(errorResult);
      if (onrejected) return onrejected(err);
      throw err;
    }
  }
}

class LocalSupabaseAuth {
  private listeners = new Set<AuthChangeCallback>();

  constructor() {
    if (typeof window !== "undefined") {
      window.addEventListener("storage", () => {
        const session = getStoredSession();
        this.notifyListeners("SIGNED_IN", session);
      });
    }
  }

  private notifyListeners(
    event: "SIGNED_IN" | "SIGNED_OUT" | "TOKEN_REFRESHED" | "INITIAL_SESSION",
    session: LocalAuthSession | null,
  ) {
    for (const listener of this.listeners) {
      try {
        listener(event, session);
      } catch (err) {
        console.error("Auth listener error:", err);
      }
    }
  }

  async getSession(): Promise<{ data: { session: LocalAuthSession | null }; error: null }> {
    const session = getStoredSession();
    return { data: { session }, error: null };
  }

  async getUser(): Promise<{ data: { user: LocalAuthUser | null }; error: null }> {
    const session = getStoredSession();
    return { data: { user: session?.user ?? null }, error: null };
  }

  async signInWithPassword(credentials: { email: string; password?: string }): Promise<{
    data: { user: LocalAuthUser | null; session: LocalAuthSession | null };
    error: { message: string } | null;
  }> {
    try {
      const res = await fetch("/api/lms/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(credentials),
      });

      const json = await res.json();
      if (!res.ok || json.error) {
        return {
          data: { user: null, session: null },
          error: { message: json.error || "Invalid email or password" },
        };
      }

      const { user, session: backendSession, roles } = json;
      const role = roles?.[0] || user.user_metadata?.role || "student";
      const displayName = user.user_metadata?.display_name || user.email.split("@")[0] || "Learner";

      const authUser: LocalAuthUser = {
        id: user.id,
        aud: "authenticated",
        role: "authenticated",
        email: user.email,
        email_confirmed_at: user.created_at,
        created_at: user.created_at,
        updated_at: user.updated_at,
        app_metadata: { provider: "email", providers: ["email"] },
        user_metadata: {
          ...user.user_metadata,
          role,
          display_name: displayName,
          sub: user.id,
          email: user.email,
        },
      };

      const authSession: LocalAuthSession = {
        access_token: backendSession.token,
        token_type: "bearer",
        expires_in: 86400 * 30,
        expires_at: Math.floor(new Date(backendSession.expires_at).getTime() / 1000),
        refresh_token: backendSession.token,
        user: authUser,
      };

      saveStoredSession(authSession);
      this.notifyListeners("SIGNED_IN", authSession);

      return { data: { user: authUser, session: authSession }, error: null };
    } catch (err: unknown) {
      return {
        data: { user: null, session: null },
        error: { message: err instanceof Error ? err.message : "Connection error" },
      };
    }
  }

  async signUp(params: {
    email: string;
    password?: string;
    options?: { data?: Record<string, unknown> };
  }): Promise<{
    data: { user: LocalAuthUser | null; session: LocalAuthSession | null };
    error: { message: string } | null;
  }> {
    try {
      const res = await fetch("/api/lms/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: params.email,
          password: params.password,
          metadata: params.options?.data,
        }),
      });

      const json = await res.json();
      if (!res.ok || json.error) {
        return {
          data: { user: null, session: null },
          error: { message: json.error || "Registration failed" },
        };
      }

      const { user, session: backendSession, roles } = json;
      const role = roles?.[0] || user.user_metadata?.role || "student";
      const displayName = user.user_metadata?.display_name || user.email.split("@")[0] || "Learner";

      const authUser: LocalAuthUser = {
        id: user.id,
        aud: "authenticated",
        role: "authenticated",
        email: user.email,
        email_confirmed_at: user.created_at,
        created_at: user.created_at,
        updated_at: user.updated_at,
        app_metadata: { provider: "email", providers: ["email"] },
        user_metadata: {
          ...user.user_metadata,
          role,
          display_name: displayName,
          sub: user.id,
          email: user.email,
        },
      };

      const authSession: LocalAuthSession = {
        access_token: backendSession.token,
        token_type: "bearer",
        expires_in: 86400 * 30,
        expires_at: Math.floor(new Date(backendSession.expires_at).getTime() / 1000),
        refresh_token: backendSession.token,
        user: authUser,
      };

      saveStoredSession(authSession);
      this.notifyListeners("SIGNED_IN", authSession);

      return { data: { user: authUser, session: authSession }, error: null };
    } catch (err: unknown) {
      return {
        data: { user: null, session: null },
        error: { message: err instanceof Error ? err.message : "Connection error" },
      };
    }
  }

  async signOut(): Promise<{ error: null }> {
    const session = getStoredSession();
    if (session?.access_token) {
      fetch("/api/lms/auth/logout", {
        method: "POST",
        headers: { Authorization: `Bearer ${session.access_token}` },
      }).catch(() => {});
    }

    saveStoredSession(null);
    this.notifyListeners("SIGNED_OUT", null);
    return { error: null };
  }

  onAuthStateChange(callback: AuthChangeCallback): {
    data: { subscription: { unsubscribe: () => void } };
  } {
    this.listeners.add(callback);
    // Fire immediately with initial session
    const current = getStoredSession();
    try {
      callback("INITIAL_SESSION", current);
    } catch {
      // ignore
    }

    return {
      data: {
        subscription: {
          unsubscribe: () => {
            this.listeners.delete(callback);
          },
        },
      },
    };
  }
}

export const supabase = {
  auth: new LocalSupabaseAuth(),
  from<T = unknown>(tableName: string) {
    return new ClientQueryBuilder<T>(tableName);
  },
};
