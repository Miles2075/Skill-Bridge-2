import { lmsDB } from "@/lib/lms-db.server";

// Server-side local database client replacing Supabase Admin.
// Runs 100% locally against lmsDB with zero external network or configuration requirements.

class ServerTableQueryBuilder<T = unknown> implements PromiseLike<{
  data: T | null;
  error: { message: string } | null;
}> {
  private tableName: string;
  private action: "select" | "insert" | "update" | "upsert" | "delete" = "select";
  private selectedColumns?: string;
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
      const res = lmsDB.queryTable(this.tableName, {
        action: this.action,
        columns: this.selectedColumns as string,
        filters: (Object.keys(this.filterValues).length > 0
          ? this.filterValues
          : undefined) as Record<string, unknown>,
        values: this.payloadValues,
        onConflict: this.conflictKey as string,
      });

      let finalData = res.data;
      if (Array.isArray(finalData)) {
        if (this.isSingle) {
          finalData = finalData.length > 0 ? finalData[0] : null;
        } else if (this.isMaybeSingle) {
          finalData = finalData.length > 0 ? finalData[0] : null;
        }
      }

      const result = { data: finalData as T, error: res.error };
      return onfulfilled ? onfulfilled(result) : (result as unknown as TResult1);
    } catch (err: unknown) {
      const errorResult = {
        data: null,
        error: { message: err instanceof Error ? err.message : "Database error" },
      };
      if (onfulfilled) return onfulfilled(errorResult);
      if (onrejected) return onrejected(err);
      throw err;
    }
  }
}

export const supabaseAdmin = {
  from<T = unknown>(tableName: string) {
    return new ServerTableQueryBuilder<T>(tableName);
  },
  auth: {
    async getUser(token?: string) {
      if (!token) return { data: { user: null }, error: { message: "No token provided" } };
      const res = lmsDB.validateSession(token);
      return {
        data: { user: res?.user ?? null },
        error: res ? null : { message: "Invalid session" },
      };
    },
  },
};
