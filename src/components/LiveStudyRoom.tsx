"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowLeftRight, Users, Globe, ChevronDown, Loader2, Pause } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type PresenceStudent = {
  userId: string;
  username: string;
  studying: boolean;
  subject: string | null;
  studyStartedAt: string | null;
  onlineSince: string;
};

type StudyGroup = { id: string; name: string };
type GroupMember = { group_id: string; user_id: string };

const supabase = createClient();

function formatDuration(totalSeconds: number) {
  const seconds = Math.max(0, Math.floor(totalSeconds));
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function Lamp({ active }: { active: boolean }) {
  const color = active ? "#FF7628" : "#55585D";
  return (
    <svg viewBox="0 0 64 64" className="h-[58px] w-[58px]" fill="none" aria-hidden="true">
      {active && <path d="M17 18H47L59 58H5L17 18Z" fill="#FF7628" opacity=".10" />}
      <path d="M23 8H41L46 25H18L23 8Z" stroke={color} strokeWidth="2.2" strokeLinejoin="round" />
      <path d="M32 25V48M14 48H50M14 48V56M50 48V56M10 56H54" stroke={color} strokeWidth="2.2" strokeLinecap="round" />
      {active && <path d="M25 13H39" stroke="#FFB17D" strokeWidth="2" strokeLinecap="round" />}
    </svg>
  );
}

export default function LiveStudyRoom({ activeSubjectName, onPause }: { activeSubjectName: string | null; onPause: () => void }) {
  const [students, setStudents] = useState<PresenceStudent[]>([]);
  const [myGroups, setMyGroups] = useState<StudyGroup[]>([]);
  const [groupMembers, setGroupMembers] = useState<GroupMember[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState("");
  const [view, setView] = useState<"global" | "groups">("global");
  const [currentUserId, setCurrentUserId] = useState("");
  const [studyStartedAt, setStudyStartedAt] = useState<string | null>(null);
  const [clockNow, setClockNow] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setStudyStartedAt(activeSubjectName ? new Date().toISOString() : null);
  }, [activeSubjectName]);

  const loadMyGroups = useCallback(async (userId: string) => {
    const { data: memberships, error: membershipError } = await supabase
      .from("group_members")
      .select("group_id, user_id")
      .eq("user_id", userId);
    if (membershipError) {
      console.error("Could not load your group memberships:", membershipError);
      return;
    }

    const ownMemberships = (memberships ?? []) as GroupMember[];
    const ids = [...new Set(ownMemberships.map(row => row.group_id))];
    if (!ids.length) {
      setGroupMembers([]);
      setMyGroups([]);
      setSelectedGroupId("");
      return;
    }

    const { data: allMembers, error: allMembersError } = await supabase
      .from("group_members")
      .select("group_id, user_id")
      .in("group_id", ids);
    if (allMembersError) {
      console.error("Could not load group members:", allMembersError);
      return;
    }
    setGroupMembers((allMembers ?? []) as GroupMember[]);

    const { data: groups, error: groupsError } = await supabase
      .from("study_groups")
      .select("id, name")
      .in("id", ids)
      .order("created_at", { ascending: false });
    if (groupsError) {
      console.error("Could not load your groups:", groupsError);
      return;
    }

    const available = (groups ?? []) as StudyGroup[];
    setMyGroups(available);
    setSelectedGroupId(current => current && available.some(group => group.id === current) ? current : available[0]?.id ?? "");
  }, []);

  useEffect(() => {
    let alive = true;
    let channel: ReturnType<typeof supabase.channel> | null = null;

    async function connectPresence() {
      try {
        const { data: authData, error: authError } = await supabase.auth.getUser();
        if (authError) throw authError;
        const user = authData.user;
        if (!user || !alive) {
          if (alive) setLoading(false);
          return;
        }

        setCurrentUserId(user.id);
        const { data: profile } = await supabase.from("profiles").select("username").eq("id", user.id).maybeSingle();
        const username = profile?.username || user.user_metadata?.username || "student";
        if (!alive) return;
        await loadMyGroups(user.id);

        channel = supabase.channel("tapasya-live-study-room", {
          config: { presence: { key: user.id } },
        });

        const publishPresence = async () => {
          if (!alive || !channel) return;
          const payload: PresenceStudent = {
            userId: user.id,
            username,
            studying: Boolean(activeSubjectName),
            subject: activeSubjectName,
            studyStartedAt: activeSubjectName ? studyStartedAt : null,
            onlineSince: new Date().toISOString(),
          };
          await channel.track(payload);
        };

        channel
          .on("presence", { event: "sync" }, () => {
            if (!channel) return;
            const state = channel.presenceState<PresenceStudent>();
            const online = Object.values(state).flat().map(item => item as PresenceStudent);
            const unique = new Map<string, PresenceStudent>();
            online.forEach(item => unique.set(item.userId, item));
            setStudents([...unique.values()].sort((a, b) => Number(b.studying) - Number(a.studying) || a.username.localeCompare(b.username)));
          })
          .subscribe(async status => {
            if (status === "SUBSCRIBED") await publishPresence();
          });

        const refresh = window.setInterval(publishPresence, 10000);
        const onVisibility = () => {
          if (document.visibilityState === "visible") publishPresence();
        };
        document.addEventListener("visibilitychange", onVisibility);
        setLoading(false);

        return () => {
          window.clearInterval(refresh);
          document.removeEventListener("visibilitychange", onVisibility);
        };
      } catch (error) {
        console.error("Live study room error:", error);
        if (alive) setLoading(false);
      }
    }

    let cleanupPresence: (() => void) | undefined;
    connectPresence().then(cleanup => { cleanupPresence = cleanup; });

    return () => {
      alive = false;
      cleanupPresence?.();
      if (channel) supabase.removeChannel(channel);
    };
  }, [loadMyGroups, activeSubjectName, studyStartedAt]);

  useEffect(() => {
    setClockNow(Date.now());
    const timer = window.setInterval(() => setClockNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const visibleStudents = useMemo(() => {
    if (view === "global") return students;
    const memberIds = new Set(groupMembers.filter(member => member.group_id === selectedGroupId).map(member => member.user_id));
    return students.filter(student => memberIds.has(student.userId));
  }, [view, students, groupMembers, selectedGroupId]);

  const studyingCount = visibleStudents.filter(student => student.studying).length;

  return (
    <section className="w-full bg-[#111111] px-3 pb-4 pt-1 sm:px-4">
      <div className="mx-auto w-full max-w-none">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#242424] pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-[14px] font-semibold text-[#e5e5e5]">{view === "global" ? "Everyone on Tapasya" : "My study groups"}</h2>
            <span className="flex items-center gap-1 rounded-full bg-[#1d2a20] px-2 py-1 text-[9px] font-medium text-[#69d78a]"><span className="h-1.5 w-1.5 rounded-full bg-[#42D66B]" /> LIVE</span>
          </div>
          <p className="mt-1 text-[10px] text-[#777777]">{visibleStudents.length} online · {studyingCount} studying</p>
        </div>

        <div className="flex items-center gap-2">
          {view === "groups" && myGroups.length > 0 && (
            <div className="relative">
              <select value={selectedGroupId} onChange={event => setSelectedGroupId(event.target.value)} className="max-w-[150px] appearance-none rounded-md border border-[#333333] bg-[#1a1a1a] py-2 pl-2.5 pr-7 text-[10px] text-[#cccccc] outline-none">
                {myGroups.map(group => <option key={group.id} value={group.id}>{group.name}</option>)}
              </select>
              <ChevronDown size={12} className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-[#888888]" />
            </div>
          )}
          <button onClick={() => setView(current => current === "global" ? "groups" : "global")} title={view === "global" ? "Show my groups" : "Show everyone"} className="flex h-9 w-9 items-center justify-center rounded-md border border-[#333333] bg-[#1b1b1b] text-[#aaaaaa] transition hover:border-[#FF7628] hover:text-[#FF7628]">
            <ArrowLeftRight size={15} />
          </button>
          <button onClick={onPause} title="Pause study timer" className="flex h-9 items-center gap-2 rounded-md bg-[#FF7628] px-3 text-[10px] font-semibold text-black transition hover:bg-[#ff8b4a]">
            <Pause size={13} fill="currentColor" /> Pause
          </button>
        </div>
      </div>

      {view === "groups" && myGroups.length === 0 ? (
        <div className="flex min-h-[230px] flex-col items-center justify-center text-center">
          <Users size={25} className="text-[#555555]" />
          <p className="mt-3 text-[12px] text-[#cccccc]">You haven't joined any groups yet</p>
          <p className="mt-1 text-[10px] text-[#777777]">Join or create a group to study with your people.</p>
        </div>
      ) : loading ? (
        <div className="flex min-h-[230px] items-center justify-center text-[#777777]"><Loader2 size={18} className="animate-spin" /></div>
      ) : visibleStudents.length === 0 ? (
        <div className="flex min-h-[230px] flex-col items-center justify-center text-center">
          <Globe size={24} className="text-[#555555]" />
          <p className="mt-3 text-[12px] text-[#cccccc]">No one is online right now</p>
          <p className="mt-1 text-[10px] text-[#777777]">Keep Tapasya open and invite your friends.</p>
        </div>
      ) : (
        <div className="mt-4 grid grid-cols-3 gap-x-2 gap-y-5 sm:grid-cols-5 md:grid-cols-7 lg:grid-cols-9">
          {visibleStudents.map(student => {
            const elapsed = student.studying && student.studyStartedAt ? Math.floor((clockNow - new Date(student.studyStartedAt).getTime()) / 1000) : 0;
            const mine = student.userId === currentUserId;
            return (
              <div key={student.userId} className={`flex min-w-0 flex-col items-center rounded-lg px-1 py-2 text-center ${mine ? "border border-[#4a3325] bg-[#1c1713]" : "border border-transparent"}`}>
                <Lamp active={student.studying} />
                <p className={`mt-1 max-w-full truncate text-[10px] font-semibold ${student.studying ? "text-[#FF7628]" : "text-[#777777]"}`}>@{student.username}{mine ? " · You" : ""}</p>
                <p className={`mt-0.5 font-mono text-[9px] tabular-nums ${student.studying ? "text-[#FF7628]" : "text-[#666666]"}`}>{student.studying ? formatDuration(elapsed) : "Online"}</p>
                {student.studying && <p className="mt-0.5 max-w-full truncate text-[8px] text-[#999999]">{student.subject || "Studying"}</p>}
              </div>
            );
          })}
        </div>
      )}
      <p className="mt-6 border-t border-[#202020] pt-3 text-[9px] text-[#5f5f5f]">Online students are shown here. Studying users appear in orange; idle users appear in grey.</p>
      </div>
    </section>
  );
}
