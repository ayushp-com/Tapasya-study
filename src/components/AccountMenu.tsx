
"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Settings,
  UserRound,
  LogOut,
  GraduationCap,
  CalendarDays,
  ChevronRight,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type Profile = {
  username: string | null;
  display_name: string | null;
  exam: string | null;
  age: number | null;
};

export default function AccountMenu() {
  const [open, setOpen] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const menuRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    function handleOutsideClick(event: MouseEvent) {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  useEffect(() => {
    if (!open || profile) return;

    let cancelled = false;

    async function loadProfile() {
      setLoading(true);

      try {
        const supabase = createClient();

        const {
          data: { user },
          error: authError,
        } = await supabase.auth.getUser();

        if (authError) throw authError;

        if (!user) {
          if (!cancelled) setProfile(null);
          return;
        }

        const { data, error } = await supabase
          .from("profiles")
          .select("username, display_name, exam, age")
          .eq("id", user.id)
          .single();

        if (error) throw error;

        if (!cancelled) setProfile(data as Profile);
      } catch (error) {
        console.error("Could not load profile:", error);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadProfile();

    return () => {
      cancelled = true;
    };
  }, [open, profile]);

  async function handleLogout() {
    setLoggingOut(true);

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signOut();

      if (error) throw error;

      router.replace("/auth");
      router.refresh();
    } catch (error) {
      console.error("Logout failed:", error);
      setLoggingOut(false);
    }
  }

  return (
    <div ref={menuRef} className="relative">
      <button
        onClick={() => setOpen((current) => !current)}
        aria-label="Account menu"
        aria-expanded={open}
        className={`flex h-8 w-8 items-center justify-center rounded-md transition ${
          open
            ? "bg-[#292929] text-white"
            : "text-[#888888] hover:bg-[#222222] hover:text-white"
        }`}
      >
        <Settings size={17} />
      </button>

      {open && (
        <div className="absolute right-0 top-10 z-50 w-[260px] overflow-hidden rounded-lg border border-[#333333] bg-[#1b1b1b] shadow-2xl">

          {/* Profile */}
          <div className="border-b border-[#303030] p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#292929] text-[#D97736]">
                <UserRound size={19} />
              </div>

              <div className="min-w-0">
                <p className="truncate text-[13px] font-semibold text-white">
                  {loading
                    ? "Loading profile..."
                    : profile?.username
                    ? `@${profile.username}`
                    : "Your account"}
                </p>

                <p className="mt-0.5 truncate text-[11px] text-[#777777]">
                  {profile?.display_name || "Tapasya member"}
                </p>
              </div>
            </div>

            <div className="mt-4 space-y-2">
              {profile?.exam && (
                <div className="flex items-center gap-2 text-[11px] text-[#999999]">
                  <GraduationCap size={13} />
                  <span>{profile.exam}</span>
                </div>
              )}

              {profile?.age != null && (
                <div className="flex items-center gap-2 text-[11px] text-[#999999]">
                  <CalendarDays size={13} />
                  <span>{profile.age} years old</span>
                </div>
              )}
            </div>
          </div>

          {/* Menu items */}
          <div className="p-1.5">
            <button
              onClick={() => {
                setOpen(false);
                router.push("/profile");
              }}
              className="flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-left text-[12px] text-[#cccccc] transition hover:bg-[#292929] hover:text-white"
            >
              <UserRound size={15} className="text-[#888888]" />
              View profile
              <ChevronRight size={14} className="ml-auto text-[#666666]" />
            </button>

            <button
              onClick={() => {
                setOpen(false);
                router.push("/settings");
              }}
              className="flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-left text-[12px] text-[#cccccc] transition hover:bg-[#292929] hover:text-white"
            >
              <Settings size={15} className="text-[#888888]" />
              Settings
              <ChevronRight size={14} className="ml-auto text-[#666666]" />
            </button>
          </div>

          <div className="border-t border-[#303030] p-1.5">
            <button
              onClick={handleLogout}
              disabled={loggingOut}
              className="flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-left text-[12px] text-red-400 transition hover:bg-[#302020] disabled:opacity-50"
            >
              <LogOut size={15} />
              {loggingOut ? "Logging out..." : "Log out"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
