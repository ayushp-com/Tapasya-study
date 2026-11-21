
"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Check, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

const exams = [
  "JEE",
  "NEET",
  "UPSC",
  "GATE",
  "CAT",
  "CUET",
  "SSC",
  "Banking",
  "College / University",
  "Other",
];

export default function ProfileSetupPage() {
  const router = useRouter();
  const supabase = createClient();

  const [userId, setUserId] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [username, setUsername] = useState("");
  const [exam, setExam] = useState("");
  const [age, setAge] = useState("");

  const [checking, setChecking] = useState(false);
  const [available, setAvailable] = useState<boolean | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadUser() {
      const { data, error } = await supabase.auth.getUser();

      if (error || !data.user) {
        router.replace("/auth");
        return;
      }

      const user = data.user;
      setUserId(user.id);

      const name =
        user.user_metadata?.full_name ||
        user.user_metadata?.name ||
        user.user_metadata?.display_name ||
        "";

      setDisplayName(name);

      const { data: profile } = await supabase
        .from("profiles")
        .select("username, exam, age, display_name")
        .eq("id", user.id)
        .maybeSingle();

      if (profile?.username && profile?.exam && profile?.age) {
        router.replace("/");
        return;
      }

      if (profile) {
        setUsername(profile.username || "");
        setExam(profile.exam || "");
        setAge(profile.age ? String(profile.age) : "");
        setDisplayName(profile.display_name || name);
      }
    }

    loadUser();
  }, [router, supabase]);

  useEffect(() => {
    const cleanUsername = username.trim().toLowerCase();

    if (
      cleanUsername.length < 3 ||
      cleanUsername.length > 20 ||
      !/^[a-z0-9_]+$/.test(cleanUsername)
    ) {
      setAvailable(null);
      setChecking(false);
      return;
    }

    let cancelled = false;

    const timeout = setTimeout(async () => {
      setChecking(true);

      const { data, error } = await supabase
        .from("profiles")
        .select("id")
        .ilike("username", cleanUsername)
        .neq("id", userId)
        .maybeSingle();

      if (cancelled) return;

      setChecking(false);

      if (error) {
        setAvailable(null);
      } else {
        setAvailable(!data);
      }
    }, 450);

    return () => {
      cancelled = true;
      clearTimeout(timeout);
    };
  }, [username, userId, supabase]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    const cleanUsername = username.trim().toLowerCase();
    const numericAge = Number(age);

    if (!/^[a-z0-9_]{3,20}$/.test(cleanUsername)) {
      setError("Username must be 3–20 characters (letters, numbers or _).");
      return;
    }

    if (available !== true) {
      setError("Please choose an available username.");
      return;
    }

    if (!exam) {
      setError("Please select the exam you're preparing for.");
      return;
    }

    if (!Number.isInteger(numericAge) || numericAge < 13 || numericAge > 100) {
      setError("Please enter a valid age between 13 and 100.");
      return;
    }

    setSaving(true);

    const { data: authData } = await supabase.auth.getUser();

    if (!authData.user || authData.user.id !== userId) {
      setSaving(false);
      setError("Your session expired. Please sign in again.");
      return;
    }

    const { error: saveError } = await supabase
      .from("profiles")
      .upsert(
        {
          id: userId,
          username: cleanUsername,
          display_name: displayName.trim(),
          exam,
          age: numericAge,
        },
        { onConflict: "id" }
      );

    setSaving(false);

    if (saveError) {
      if (saveError.code === "23505") {
        setAvailable(false);
        setError("This username is already taken. Try another one.");
      } else {
        setError(saveError.message);
      }
      return;
    }

    router.replace("/");
    router.refresh();
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#111111] px-5 py-12 text-[#e5e5e5]">
      <section className="w-full max-w-[390px]">
        <p className="text-[13px] font-medium text-[#999999]">
          TAPASYA
        </p>

        <h1 className="mt-3 text-[27px] font-semibold tracking-tight">
          Set up your profile
        </h1>

        <p className="mt-2 text-[13px] text-[#888888]">
          A few details before you start studying.
        </p>

        <form onSubmit={handleSubmit} className="mt-9 space-y-5">
          <div>
            <label className="mb-2 block text-[11px] text-[#999999]">
              DISPLAY NAME
            </label>
            <input
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              required
              maxLength={50}
              placeholder="Your name"
              className="h-11 w-full rounded-md border border-[#303030] bg-[#191919] px-3 text-sm outline-none focus:border-[#D97736]"
            />
          </div>

          <div>
            <label className="mb-2 block text-[11px] text-[#999999]">
              USERNAME
            </label>

            <div className="relative">
              <input
                value={username}
                onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))}
                required
                minLength={3}
                maxLength={20}
                placeholder="e.g. ayush_21"
                className="h-11 w-full rounded-md border border-[#303030] bg-[#191919] px-3 pr-10 text-sm outline-none focus:border-[#D97736]"
              />

              <span className="absolute right-3 top-1/2 -translate-y-1/2">
                {checking && (
                  <Loader2 size={16} className="animate-spin text-[#999999]" />
                )}
                {!checking && available === true && (
                  <Check size={17} className="text-green-500" />
                )}
                {!checking && available === false && (
                  <X size={17} className="text-red-500" />
                )}
              </span>
            </div>

            <p className="mt-2 text-[10px] text-[#777777]">
              3–20 characters. Letters, numbers and underscores only.
            </p>

            {!checking && available === true && (
              <p className="mt-1 text-[11px] text-green-500">
                Username available
              </p>
            )}

            {!checking && available === false && (
              <p className="mt-1 text-[11px] text-red-400">
                Username is already taken or invalid
              </p>
            )}
          </div>

          <div>
            <label className="mb-2 block text-[11px] text-[#999999]">
              WHAT ARE YOU PREPARING FOR?
            </label>

            <select
              value={exam}
              onChange={(e) => setExam(e.target.value)}
              required
              className="h-11 w-full rounded-md border border-[#303030] bg-[#191919] px-3 text-sm text-white outline-none focus:border-[#D97736]"
            >
              <option value="">Select your exam</option>
              {exams.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-2 block text-[11px] text-[#999999]">
              AGE
            </label>

            <input
              type="number"
              value={age}
              onChange={(e) => setAge(e.target.value)}
              min={13}
              max={100}
              required
              placeholder="Enter your age"
              className="h-11 w-full rounded-md border border-[#303030] bg-[#191919] px-3 text-sm outline-none focus:border-[#D97736]"
            />
          </div>

          {error && (
            <p className="rounded-md bg-red-500/10 p-3 text-[12px] text-red-400">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={saving || checking || available !== true}
            className="flex h-11 w-full items-center justify-center gap-2 rounded-md bg-[#D97736] text-sm font-semibold text-white transition hover:bg-[#c66b30] disabled:cursor-not-allowed disabled:opacity-40"
          >
            {saving && <Loader2 size={16} className="animate-spin" />}
            Complete profile
          </button>
        </form>

        <p className="mt-6 text-center text-[10px] text-[#666666]">
          You can update your profile details later.
        </p>
      </section>
    </main>
  );
}
