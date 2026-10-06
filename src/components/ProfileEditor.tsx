import { useState } from "react";
import { Loader2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { lmsClient } from "@/lib/lms-client";
import { updateLocalSessionProfile, type LocalUser } from "@/lib/local-db";

export function ProfileEditor({
  user,
  accent = "indigo",
  roleLabel,
}: {
  user: LocalUser;
  accent?: "indigo" | "teal";
  roleLabel: string;
}) {
  const [name, setName] = useState(user.user_metadata?.display_name || "");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const styles =
    accent === "teal"
      ? {
          button: "bg-teal-700 hover:bg-teal-800 text-white",
          text: "text-teal-700",
        }
      : {
          button: "bg-indigo-600 hover:bg-indigo-700 text-white",
          text: "text-indigo-700",
        };

  async function save() {
    const displayName = name.trim();
    if (!displayName) {
      setMessage("Please enter your name.");
      return;
    }

    setSaving(true);
    setMessage("");
    try {
      await lmsClient.updateProfile({ displayName });
      updateLocalSessionProfile({ displayName });
      setMessage("Profile updated successfully.");
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Unable to update profile.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-2xs">
      <div className="min-w-0 space-y-4">
        <div>
          <h2 className="text-base font-bold text-slate-900">Personal Information</h2>
          <p className="mt-1 text-xs text-slate-500">
            Update how your profile appears across Skillbridge.
          </p>
        </div>

        <div>
          <label className="text-xs font-bold text-slate-700">Display Name</label>
          <Input
            value={name}
            maxLength={80}
            onChange={(e) => setName(e.target.value)}
            className="mt-1.5"
          />
        </div>

        <div>
          <label className="text-xs font-bold text-slate-700">Email</label>
          <Input value={user.email} disabled className="mt-1.5 bg-slate-50" />
        </div>

        <div className="flex items-center justify-between gap-3">
          <span className={`text-xs ${styles.text}`}>{message}</span>
          <Button onClick={() => void save()} disabled={saving} className={styles.button}>
            {saving ? (
              <Loader2 className="mr-2 size-4 animate-spin" />
            ) : (
              <Save className="mr-2 size-4" />
            )}
            Save Profile
          </Button>
        </div>
      </div>

      <div className="mt-5 border-t border-slate-100 pt-4 text-[11px] text-slate-500">
        Account type: <span className="font-semibold text-slate-700">{roleLabel}</span>
      </div>
    </div>
  );
}
