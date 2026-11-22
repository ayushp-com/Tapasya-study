"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Search, Plus, Users, Lock, Globe, ArrowLeft, Copy,
  LogOut, Trash2, X, Loader2, RefreshCw, Link2,
  BookOpen, Trophy, Clock3, GraduationCap, MessageCircle,
  Settings, Megaphone, CalendarDays, ChartNoAxesColumn, UserPlus, House,
  ChevronRight, Send, CalendarCheck, Medal, Crown, Smile
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type Group = {
  id: string;
  name: string;
  description: string | null;
  category: string | null;
  goal_hours: number | null;
  max_members: number | null;
  is_public: boolean;
  invite_code: string | null;
  created_by: string;
  created_at: string;
};

type Member = {
  user_id: string;
  role: string | null;
  username: string;
};

type StudySession = {
  id: string;
  group_id: string;
  user_id: string;
  started_at: string;
  ended_at: string | null;
};

type GroupMessage = {
  id: string;
  group_id: string;
  user_id: string;
  content: string;
  created_at: string;
  username: string;
};

const CATEGORIES = [
  "All", "General", "JEE", "NEET", "UPSC",
  "Coding", "College", "Other"
];

// A small, hand-picked static sticker pack for Tapasya.
// Sticker messages are stored as a marker in the existing content column,
// so this works with the current group_messages table (no migration needed).
const CHAT_STICKERS = [
  { id: "focus", emoji: "🎯", label: "Locked in", tone: "from-orange-500/20 to-amber-400/10" },
  { id: "books", emoji: "📚", label: "Book stack", tone: "from-sky-500/20 to-blue-400/10" },
  { id: "coffee", emoji: "☕", label: "Coffee break", tone: "from-amber-600/20 to-orange-400/10" },
  { id: "fire", emoji: "🔥", label: "On fire", tone: "from-orange-500/20 to-red-400/10" },
  { id: "brain", emoji: "🧠", label: "Big brain", tone: "from-violet-500/20 to-fuchsia-400/10" },
  { id: "rocket", emoji: "🚀", label: "Let's go", tone: "from-indigo-500/20 to-sky-400/10" },
  { id: "trophy", emoji: "🏆", label: "W moment", tone: "from-yellow-500/20 to-amber-400/10" },
  { id: "muscle", emoji: "💪", label: "You got this", tone: "from-emerald-500/20 to-green-400/10" },
  { id: "owl", emoji: "🦉", label: "Night owl", tone: "from-violet-500/20 to-indigo-400/10" },
  { id: "sleep", emoji: "😴", label: "Need sleep", tone: "from-slate-500/20 to-blue-400/10" },
  { id: "mindblown", emoji: "🤯", label: "Mind blown", tone: "from-fuchsia-500/20 to-pink-400/10" },
  { id: "salute", emoji: "🫡", label: "Respect", tone: "from-orange-500/20 to-yellow-400/10" },
  { id: "love", emoji: "🫶", label: "Good vibes", tone: "from-pink-500/20 to-rose-400/10" },
  { id: "cry", emoji: "🥲", label: "Pain", tone: "from-blue-500/20 to-cyan-400/10" },
  { id: "check", emoji: "✅", label: "Done", tone: "from-emerald-500/20 to-teal-400/10" },
  { id: "clap", emoji: "👏", label: "Well done", tone: "from-amber-500/20 to-yellow-400/10" },
] as const;

const STICKER_PREFIX = "[[tapasya-sticker:";
const getSticker = (content: string) => {
  const match = content.match(/^\[\[tapasya-sticker:([a-z0-9_-]+)\]\]$/);
  return match ? CHAT_STICKERS.find(sticker => sticker.id === match[1]) ?? null : null;
};

const supabase = createClient();

function StudyLamp({
  active,
  seconds,
}: {
  active: boolean;
  seconds: number;
}) {
  const color = !active
    ? "#626262"
    : seconds < 7200
      ? "#42D66B"
      : seconds < 14400
        ? "#FFD34D"
        : "#FF5548";

  return (
    <div className="relative flex h-[76px] w-[76px] items-center justify-center">
      {active && (
        <div
          className="absolute inset-1 rounded-full blur-2xl animate-pulse"
          style={{ backgroundColor: color, opacity: 0.28 }}
        />
      )}

      <svg
        viewBox="0 0 88 88"
        className="relative z-10 h-[66px] w-[66px]"
        fill="none"
        aria-hidden="true"
      >
        {active && (
          <path
            d="M27 25 L61 25 L76 76 L12 76 Z"
            fill={color}
            opacity="0.18"
          />
        )}
        <path
          d="M31 13 H57 L63 32 H25 L31 13Z"
          fill={active ? color : "#333333"}
          stroke={color}
          strokeWidth="2.5"
          strokeLinejoin="round"
        />
        <path
          d="M44 32 L44 61 L26 61 L26 72"
          stroke={active ? color : "#626262"}
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M26 72 H66"
          stroke={active ? color : "#626262"}
          strokeWidth="3"
          strokeLinecap="round"
        />
        {active && (
          <path
            d="M35 20 H53"
            stroke="#FFFFFF"
            strokeWidth="2"
            strokeLinecap="round"
            opacity="0.8"
          />
        )}
      </svg>
    </div>
  );
}

export default function GroupsPanel() {
  const [tab, setTab] = useState<"discover" | "mine">("discover");
  const [groups, setGroups] = useState<Group[]>([]);
  const [myGroupIds, setMyGroupIds] = useState<string[]>([]);
  const [members, setMembers] = useState<Record<string, Member[]>>({});
  const [username, setUsername] = useState("");
  const [userId, setUserId] = useState("");
  const [studySessions, setStudySessions] = useState<StudySession[]>([]);
  const [clockNow, setClockNow] = useState(0);
  const [messages, setMessages] = useState<GroupMessage[]>([]);
  const [messageDraft, setMessageDraft] = useState("");
  const [sendingMessage, setSendingMessage] = useState(false);
  const [showStickerPicker, setShowStickerPicker] = useState(false);
  const [chatError, setChatError] = useState("");
  const [attendanceDate, setAttendanceDate] = useState(() => new Date().toISOString().slice(0, 10));

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const [showCreate, setShowCreate] = useState(false);
  const [showJoinCode, setShowJoinCode] = useState(false);
  const [inviteInput, setInviteInput] = useState("");
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [roomTab, setRoomTab] = useState<"home" | "attendance" | "rankings" | "invite" | "chat" | "settings">("home");
  const [inviteResult, setInviteResult] = useState("");

  const [form, setForm] = useState({
    name: "",
    description: "",
    category: "General",
    goalHours: "2",
    isPublic: true,
    unlimited: false,
    maxMember: "30",
  });

  useEffect(() => {
    setClockNow(Date.now());
    const timer = window.setInterval(() => setClockNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const loadGroups = useCallback(async (showLoader = true) => {
    if (showLoader) setLoading(true);
    setError("");

    try {
      const { data: authData, error: authError } =
        await supabase.auth.getUser();

      if (authError) throw authError;

      const user = authData.user;
      if (!user) {
        setError("Please sign in to use Groups.");
        setLoading(false);
        return;
      }

      setUserId(user.id);

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("username")
        .eq("id", user.id)
        .maybeSingle();

      if (profileError) throw profileError;
      setUsername(profile?.username ?? "student");

      // Fetch groups visible to this user.
      const { data: groupData, error: groupError } = await supabase
        .from("study_groups")
        .select("*")
        .order("created_at", { ascending: false });

      if (groupError) throw groupError;

      // Fetch the current user's memberships.
      const { data: membershipData, error: membershipError } =
        await supabase
          .from("group_members")
          .select("group_id, role")
          .eq("user_id", user.id);

      if (membershipError) throw membershipError;

      const membershipIds = (membershipData ?? []).map(
        (item: { group_id: string }) => item.group_id
      );

      setMyGroupIds(membershipIds);
      setGroups((groupData ?? []) as Group[]);

      // Fetch usernames for visible group members.
      const visibleGroupIds = (groupData ?? []).map(
        (group: Group) => group.id
      );

      if (visibleGroupIds.length) {
        const { data: memberData, error: memberError } = await supabase
          .from("group_members")
          .select("group_id, user_id, role")
          .in("group_id", visibleGroupIds);

        if (memberError) throw memberError;

        const memberRows = memberData ?? [];
        const userIds = [
          ...new Set(memberRows.map((m: { user_id: string }) => m.user_id))
        ];

        let profileMap: Record<string, string> = {};

        if (userIds.length) {
          const { data: profileRows, error: profilesError } = await supabase
            .from("profiles")
            .select("id, username")
            .in("id", userIds);

          if (profilesError) throw profilesError;

          for (const p of profileRows ?? []) {
            profileMap[p.id] = p.username ?? "student";
          }
        }

        const grouped: Record<string, Member[]> = {};

        for (const member of memberRows) {
          if (!grouped[member.group_id]) {
            grouped[member.group_id] = [];
          }

          grouped[member.group_id].push({
            user_id: member.user_id,
            role: member.role,
            username: profileMap[member.user_id] ?? "student",
          });
        }

        setMembers(grouped);
      } else {
        setMembers({});
      }
    } catch (err: any) {
      console.error("Groups load error:", err);
      setError(err.message ?? "Could not load groups.");
    } finally {
      if (showLoader) setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadGroups();

    // Live updates when another user creates/deletes a group or joins/leaves.
    const channel = supabase
      .channel("tapasya-groups-live")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "study_groups" },
        () => loadGroups(false)
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "group_members" },
        () => loadGroups(false)
      )
      .subscribe();

    // Fallback refresh for projects where Supabase Realtime is not enabled.
    const refreshTimer = window.setInterval(() => loadGroups(false), 20000);
    const handleFocus = () => loadGroups(false);
    window.addEventListener("focus", handleFocus);

    return () => {
      window.clearInterval(refreshTimer);
      window.removeEventListener("focus", handleFocus);
      supabase.removeChannel(channel);
    };
  }, [loadGroups]);

  const loadStudySessions = useCallback(async () => {
    if (!selectedGroup?.id) {
      setStudySessions([]);
      return;
    }

    const { data, error: sessionsError } = await supabase
      .from("study_sessions")
      .select("id, group_id, user_id, started_at, ended_at")
      .eq("group_id", selectedGroup.id)
      .order("started_at", { ascending: false });

    if (sessionsError) {
      console.error("Study sessions load error:", sessionsError);
      return;
    }

    setStudySessions((data ?? []) as StudySession[]);
  }, [selectedGroup?.id]);

  useEffect(() => {
    if (!selectedGroup?.id) {
      setStudySessions([]);
      return;
    }

    loadStudySessions();

    // Realtime updates when a member starts/stops studying.
    const channel = supabase
      .channel(`study-sessions-${selectedGroup.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "study_sessions",
          filter: `group_id=eq.${selectedGroup.id}`,
        },
        () => loadStudySessions()
      )
      .subscribe();

    // Fallback polling in case Realtime is not enabled for study_sessions.
    const refreshTimer = window.setInterval(loadStudySessions, 3000);

    return () => {
      window.clearInterval(refreshTimer);
      supabase.removeChannel(channel);
    };
  }, [selectedGroup?.id, loadStudySessions]);

  const activeSessions = useMemo(
    () => studySessions.filter(session => session.ended_at === null),
    [studySessions]
  );

  const formatStudyTime = (seconds: number) => {
    const safeSeconds = Math.max(0, seconds);
    const hours = Math.floor(safeSeconds / 3600);
    const minutes = Math.floor((safeSeconds % 3600) / 60);
    const remainingSeconds = safeSeconds % 60;

    return [
      String(hours).padStart(2, "0"),
      String(minutes).padStart(2, "0"),
      String(remainingSeconds).padStart(2, "0"),
    ].join(":");
  };

  const getSessionElapsed = (session: StudySession) =>
    Math.max(
      0,
      Math.floor(
        (clockNow - new Date(session.started_at).getTime()) / 1000
      )
    );

  const getMemberStudyTime = (memberId: string) => {
    const today = new Date(clockNow);

    return studySessions
      .filter(session => {
        if (session.user_id !== memberId || !session.ended_at) return false;

        const startedAt = new Date(session.started_at);
        return (
          startedAt.getFullYear() === today.getFullYear() &&
          startedAt.getMonth() === today.getMonth() &&
          startedAt.getDate() === today.getDate()
        );
      })
      .reduce((total, session) => {
        const start = new Date(session.started_at).getTime();
        const end = new Date(session.ended_at!).getTime();
        return total + Math.max(0, Math.floor((end - start) / 1000));
      }, 0);
  };

  const loadMessages = useCallback(async () => {
    if (!selectedGroup?.id) {
      setMessages([]);
      return;
    }
    const { data, error: messageError } = await supabase
      .from("group_messages")
      .select("id, group_id, user_id, content, created_at")
      .eq("group_id", selectedGroup.id)
      .order("created_at", { ascending: false })
      .limit(150);
    if (messageError) {
      setChatError(messageError.message);
      return;
    }
    const rows = data ?? [];
    const ids = [...new Set(rows.map((row: any) => row.user_id))];
    let names: Record<string, string> = {};
    if (ids.length) {
      const { data: profiles, error: profileError } = await supabase
        .from("profiles")
        .select("id, username")
        .in("id", ids);
      if (profileError) {
        setChatError(profileError.message);
        return;
      }
      for (const profile of profiles ?? []) names[profile.id] = profile.username ?? "student";
    }
    setMessages(rows.slice().reverse().map((row: any) => ({ ...row, username: names[row.user_id] ?? "student" })));
    setChatError("");
  }, [selectedGroup?.id]);

  useEffect(() => {
    if (!selectedGroup?.id || roomTab !== "chat") return;
    loadMessages();
    const channel = supabase
      .channel(`group-chat-${selectedGroup.id}`)
      .on("postgres_changes", {
        event: "*", schema: "public", table: "group_messages",
        filter: `group_id=eq.${selectedGroup.id}`,
      }, () => loadMessages())
      .subscribe();
    const fallback = window.setInterval(loadMessages, 8000);
    return () => {
      window.clearInterval(fallback);
      supabase.removeChannel(channel);
    };
  }, [selectedGroup?.id, roomTab, loadMessages]);

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault();
    const content = messageDraft.trim();
    if (!content || !selectedGroup || sendingMessage) return;
    setSendingMessage(true);
    setChatError("");
    const { error: insertError } = await supabase.from("group_messages").insert({
      group_id: selectedGroup.id,
      user_id: userId,
      content,
    });
    if (insertError) setChatError(insertError.message);
    else {
      setMessageDraft("");
      await loadMessages();
    }
    setSendingMessage(false);
  }

  async function sendSticker(stickerId: string) {
    if (!selectedGroup || !userId || sendingMessage) return;
    setSendingMessage(true);
    setChatError("");
    const content = `${STICKER_PREFIX}${stickerId}]]`;
    const { error: insertError } = await supabase.from("group_messages").insert({
      group_id: selectedGroup.id,
      user_id: userId,
      content,
    });
    if (insertError) {
      setChatError(insertError.message);
    } else {
      setShowStickerPicker(false);
      await loadMessages();
    }
    setSendingMessage(false);
  }

  const memberTotals = useMemo(() => {
    const totals: Record<string, number> = {};
    for (const session of studySessions) {
      const start = new Date(session.started_at).getTime();
      const end = session.ended_at ? new Date(session.ended_at).getTime() : clockNow;
      totals[session.user_id] = (totals[session.user_id] ?? 0) + Math.max(0, Math.floor((end - start) / 1000));
    }
    return totals;
  }, [studySessions, clockNow]);

  const attendanceRows = useMemo(() => {
    return (members[selectedGroup?.id ?? ""] ?? []).map(member => {
      const sessions = studySessions.filter(session => {
        if (session.user_id !== member.user_id) return false;
        return new Date(session.started_at).toLocaleDateString("en-CA") === attendanceDate;
      });
      const seconds = sessions.reduce((sum, session) => {
        const start = new Date(session.started_at).getTime();
        const end = session.ended_at ? new Date(session.ended_at).getTime() : clockNow;
        return sum + Math.max(0, Math.floor((end - start) / 1000));
      }, 0);
      return { ...member, seconds, present: seconds > 0, sessions: sessions.length };
    });
  }, [members, selectedGroup?.id, studySessions, attendanceDate, clockNow]);

  const rankingRows = useMemo(() => {
    return (members[selectedGroup?.id ?? ""] ?? [])
      .map(member => ({ ...member, seconds: memberTotals[member.user_id] ?? 0 }))
      .sort((a, b) => b.seconds - a.seconds);
  }, [members, selectedGroup?.id, memberTotals]);

  const filteredGroups = useMemo(() => {
    return groups.filter(group => {
      const isMine = myGroupIds.includes(group.id);

      if (tab === "mine" && !isMine) return false;
      if (tab === "discover" && !group.is_public) return false;

      const matchesSearch =
        group.name.toLowerCase().includes(search.toLowerCase()) ||
        (group.description ?? "").toLowerCase().includes(search.toLowerCase());

      const matchesCategory =
        category === "All" || group.category === category;

      return matchesSearch && matchesCategory;
    });
  }, [groups, myGroupIds, tab, search, category]);

  async function createGroup(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    setNotice("");

    try {
      const { data, error: rpcError } = await supabase.rpc(
        "create_study_group",
        {
          p_name: form.name.trim(),
          p_description: form.description.trim(),
          p_category: form.category,
          p_goal_hours: Number(form.goalHours) || 2,
          p_max_member: form.unlimited ? null : Number(form.maxMember),
          p_is_public: form.isPublic,
        }
      );

      if (rpcError) throw rpcError;

      const created = Array.isArray(data) ? data[0] : data;

      setShowCreate(false);
      setForm({
        name: "",
        description: "",
        category: "General",
        goalHours: "2",
        isPublic: true,
        unlimited: false,
        maxMember: "30",
      });

      setNotice("Your group has been created.");
      await loadGroups();

      if (created?.group_id) {
        const group = groups.find(g => g.id === created.group_id);
        if (group) setSelectedGroup(group);
      }
    } catch (err: any) {
      setError(err.message ?? "Could not create group.");
    } finally {
      setBusy(false);
    }
  }

  async function joinGroup(group: Group) {
    setBusy(true);
    setError("");
    setNotice("");

    try {
      const { error: rpcError } = await supabase.rpc("join_study_group", {
        p_group_id: group.id,
        p_invite_code: null,
      });

      if (rpcError) throw rpcError;

      setNotice(`You joined ${group.name}.`);
      await loadGroups();
    } catch (err: any) {
      setError(err.message ?? "Could not join this group.");
    } finally {
      setBusy(false);
    }
  }

  async function joinByCode(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    setNotice("");

    try {
      const { data, error: rpcError } = await supabase.rpc(
        "join_study_group_by_code",
        { p_invite_code: inviteInput.trim().toUpperCase() }
      );

      if (rpcError) throw rpcError;

      setShowJoinCode(false);
      setInviteInput("");
      setTab("mine");
      setNotice("You joined the private group.");
      await loadGroups();

      const joined = groups.find(g => g.id === data);
      if (joined) setSelectedGroup(joined);
    } catch (err: any) {
      setError(err.message ?? "Invalid invite code.");
    } finally {
      setBusy(false);
    }
  }

  async function leaveGroup(group: Group) {
    if (!confirm(`Leave "${group.name}"?`)) return;

    setBusy(true);
    setError("");

    try {
      const { error: deleteError } = await supabase
        .from("group_members")
        .delete()
        .eq("group_id", group.id)
        .eq("user_id", userId)
        .eq("role", "member");

      if (deleteError) throw deleteError;

      setSelectedGroup(null);
      setNotice("You left the group.");
      await loadGroups();
    } catch (err: any) {
      setError(
        err.message ??
        "Could not leave the group. Group owners cannot leave their own group."
      );
    } finally {
      setBusy(false);
    }
  }

  async function deleteGroup(group: Group) {
    if (!confirm(`Permanently delete "${group.name}"?`)) return;

    setBusy(true);
    setError("");

    try {
      const { error: deleteError } = await supabase
        .from("study_groups")
        .delete()
        .eq("id", group.id)
        .eq("created_by", userId);

      if (deleteError) throw deleteError;

      setSelectedGroup(null);
      setNotice("Group deleted.");
      await loadGroups();
    } catch (err: any) {
      setError(err.message ?? "Could not delete group.");
    } finally {
      setBusy(false);
    }
  }

  function copyInvite(code: string) {
    navigator.clipboard.writeText(code);
    setNotice("Invite code copied.");
  }

  const isOwner = (group: Group) => group.created_by === userId;
  const myGroups = groups.filter(g => myGroupIds.includes(g.id));

  function memberCount(group: Group) {
    return members[group.id]?.length ?? 0;
  }

  function GroupCard({ group }: { group: Group }) {
    const count = memberCount(group);
    const full = group.max_members !== null && count >= group.max_members;
    const leader = (members[group.id] ?? []).find(member => member.role === "owner");
    const createdAt = new Date(group.created_at);
    const elapsed = Math.max(0, Date.now() - createdAt.getTime());
    const minutes = Math.floor(elapsed / 60000);
    const timeLabel =
      minutes < 1 ? "Just now" :
      minutes < 60 ? `${minutes}m ago` :
      minutes < 1440 ? `${Math.floor(minutes / 60)}h ago` :
      `${Math.floor(minutes / 1440)}d ago`;

    return (
      <button
        onClick={() => { setRoomTab("home"); setSelectedGroup(group); }}
        className="group w-full rounded-xl border border-[#242424] bg-[#1b1b1b] px-4 py-3.5 text-left transition hover:border-[#383838] hover:bg-[#202020] sm:px-5 sm:py-4"
      >
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold text-[#D97736]">
              {group.category ?? "General"}
            </p>
            <h3 className="mt-1 truncate text-[14px] font-semibold text-[#e7e7e7] sm:text-[15px]">
              {group.name}
            </h3>
          </div>
          <div className="shrink-0 text-right">
            <p className="text-[10px] text-[#999999]">{timeLabel}</p>
            <p className="mt-0.5 text-[9px] text-[#777777]">
              {group.is_public ? "Public" : "Private"}
            </p>
          </div>
        </div>

        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[10px] text-[#a0a0a0] sm:text-[11px]">
          <span>Goal {group.goal_hours ?? 2}h</span>
          <span>
            Members {count}/{group.max_members ?? "∞"}
          </span>
          <span>Group leader @{leader?.username ?? "student"}</span>
          {full && <span className="font-medium text-[#D97736]">Full</span>}
        </div>

        {group.description && (
          <p className="mt-3 line-clamp-1 text-[10px] leading-5 text-[#888888] sm:text-[11px]">
            {group.description}
          </p>
        )}
      </button>
    );
  }

  return (
    <section className={`${selectedGroup ? "w-full px-0 py-0" : "w-full max-w-none px-4 py-5 sm:px-5"} text-[#d0d0d0]`}>
      {selectedGroup ? (
        <div className="relative min-h-[calc(100vh-112px)] pb-24">
          {roomTab === "home" ? (
            <>
              <header className="grid h-[58px] grid-cols-[40px_1fr_40px] items-center px-4">
                <button
                  onClick={() => { setSelectedGroup(null); setRoomTab("home"); }}
                  className="flex h-9 w-9 items-center justify-center text-[#aaaaaa] transition hover:text-white"
                  aria-label="Back to groups"
                >
                  <ArrowLeft size={19} />
                </button>
                <h1 className="truncate text-center text-[14px] font-semibold text-[#e8e8e8]">
                  {selectedGroup.name}
                </h1>
                <button
                  onClick={() => setRoomTab("settings")}
                  className="flex h-9 w-9 items-center justify-center justify-self-end text-[#aaaaaa] hover:text-white"
                  aria-label="Group settings"
                >
                  <Settings size={18} />
                </button>
              </header>

              <button
                type="button"
                onClick={() => setRoomTab("settings")}
                className="mx-4 mt-3 flex w-[calc(100%-2rem)] items-center gap-2 rounded-lg bg-[#202020] px-3 py-3 text-left transition hover:bg-[#262626]"
              >
                <Megaphone size={15} className="shrink-0 text-[#D97736]" />
                <span className="min-w-0 flex-1 truncate text-[11px] text-[#bdbdbd]">
                  {selectedGroup.description || "Group introduction / rules"}
                </span>
                <ChevronRight size={15} className="shrink-0 text-[#777777]" />
              </button>

              <div className="mt-4 flex items-center gap-3 px-3">
                <p className="text-[11px] font-medium text-[#c8c8c8]">
                  Studying{" "}
                  <span className="text-[#D97736]">
                    {activeSessions.length} members
                  </span>
                </p>
                <button
                  onClick={() => {
                    loadGroups(false);
                    loadStudySessions();
                  }}
                  className="flex h-7 w-7 items-center justify-center rounded-full bg-[#202020] text-[#888888] hover:text-white"
                  aria-label="Refresh group members"
                >
                  <RefreshCw size={12} />
                </button>
                <span className="ml-auto flex h-8 w-8 items-center justify-center rounded-lg bg-[#202020] text-[14px]" aria-hidden="true">
                  😅
                </span>
              </div>

              <div className="mt-4 flex flex-wrap items-start gap-x-8 gap-y-6 px-4 sm:px-[60px]">
                {(members[selectedGroup.id] ?? []).map(member => {
                  const activeSession = activeSessions.find(
                    session => session.user_id === member.user_id
                  );
                  const isStudying = Boolean(activeSession);
                  // Today's finished sessions + the currently running one.
                  const studySeconds =
                    getMemberStudyTime(member.user_id) +
                    (activeSession ? getSessionElapsed(activeSession) : 0);

                  return (
                    <div
                      key={member.user_id}
                      className={`flex h-[150px] w-[106px] flex-col items-center justify-start pt-2 text-center ${
                        member.user_id === userId
                          ? "rounded-md border border-[#555555]"
                          : "border border-transparent"
                      }`}
                    >
                      <StudyLamp active={isStudying} seconds={studySeconds} />
                      <p className="mt-1 max-w-[100px] truncate text-[10px] font-medium text-[#a9a9a9]">
                        @{member.username}
                        {member.user_id === userId ? " · You" : ""}
                      </p>
                      <p className="mt-1 font-mono text-[10px] tabular-nums text-[#888888]">
                        {formatStudyTime(studySeconds)}
                      </p>
                      {isStudying && (
                        <span className="mt-1 text-[8px] font-medium tracking-wide text-[#42D66B]">
                          STUDYING
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>

              <nav className="fixed bottom-5 left-1/2 z-30 flex -translate-x-1/2 items-center gap-1 rounded-full border border-[#303030] bg-[#202020]/95 p-1.5 shadow-2xl backdrop-blur">
                {([
                  { id: "home", label: "Home", icon: House },
                  { id: "attendance", label: "Attendance", icon: CalendarDays },
                  { id: "rankings", label: "Rankings", icon: ChartNoAxesColumn },
                  { id: "invite", label: "Invite", icon: UserPlus },
                  { id: "chat", label: "Chat", icon: MessageCircle },
                ] as const).map(item => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setRoomTab(item.id)}
                      className={`flex min-w-[61px] flex-col items-center justify-center gap-1 rounded-full px-2.5 py-2 transition ${roomTab === item.id ? "bg-[#3a3a3a] text-white" : "text-[#999999] hover:text-white"}`}
                    >
                      <Icon size={17} />
                      <span className="text-[8px] font-medium">{item.label}</span>
                    </button>
                  );
                })}
              </nav>
            </>
          ) : roomTab === "settings" ? (
            <div className="mx-auto max-w-2xl">
              <div className="flex items-center gap-3 border-b border-[#292929] pb-4">
                <button onClick={() => setRoomTab("home")} className="text-[#999999] hover:text-white"><ArrowLeft size={18} /></button>
                <h2 className="text-[14px] font-semibold text-white">Group settings</h2>
              </div>
              <div className="mt-5 rounded-lg bg-[#202020] p-4">
                <p className="text-[10px] text-[#888888]">GROUP INTRODUCTION / RULES</p>
                <p className="mt-2 text-[12px] text-[#dddddd]">{selectedGroup.description || "No introduction added yet."}</p>
                <p className="mt-4 text-[10px] text-[#888888]">{selectedGroup.is_public ? "Public group" : "Private group"} · {selectedGroup.category ?? "General"}</p>
                <p className="mt-1 text-[10px] text-[#888888]">Study goal: {selectedGroup.goal_hours ?? 2} hours/day</p>
              </div>
              {isOwner(selectedGroup) && (
                <div className="mt-4 rounded-lg border border-[#303030] bg-[#191919] p-4">
                  <p className="text-[10px] text-[#888888]">INVITE CODE</p>
                  <div className="mt-2 flex items-center justify-between gap-3">
                    <code className="text-lg tracking-[3px] text-white">{selectedGroup.invite_code ?? "Unavailable"}</code>
                    <button onClick={() => selectedGroup.invite_code && copyInvite(selectedGroup.invite_code)} className="flex items-center gap-2 rounded-md bg-[#303030] px-3 py-2 text-[10px] text-white"><Copy size={12}/> Copy</button>
                  </div>
                  <p className="mt-2 text-[10px] text-[#777777]">Share this code with students you want to invite. No QR code.</p>
                </div>
              )}
              <div className="mt-5 space-y-2">
                {(members[selectedGroup.id] ?? []).map(member => (
                  <div key={member.user_id} className="flex items-center justify-between rounded-lg bg-[#202020] px-3 py-3 text-[11px]">
                    <span className="text-[#dddddd]">@{member.username}{member.user_id === userId ? " · You" : ""}</span>
                    <span className="text-[9px] text-[#D97736]">{member.role === "owner" ? "OWNER" : "MEMBER"}</span>
                  </div>
                ))}
              </div>
              <div className="mt-6 flex flex-wrap gap-2">
                {myGroupIds.includes(selectedGroup.id) && !isOwner(selectedGroup) && <button onClick={() => leaveGroup(selectedGroup)} disabled={busy} className="rounded-md bg-[#292929] px-4 py-2.5 text-[11px] text-white"><LogOut size={13} className="mr-2 inline"/>Leave group</button>}
                {isOwner(selectedGroup) && <button onClick={() => deleteGroup(selectedGroup)} disabled={busy} className="rounded-md border border-red-900/50 px-4 py-2.5 text-[11px] text-red-400"><Trash2 size={13} className="mr-2 inline"/>Delete group</button>}
              </div>
            </div>
          ) : roomTab === "attendance" ? (
            <div className="mx-auto w-full max-w-6xl px-5 py-7 lg:px-8">
              <div className="mb-5 flex items-center gap-3">
                <button onClick={() => setRoomTab("home")} className="text-[#999999] hover:text-white"><ArrowLeft size={18}/></button>
                <div><h2 className="text-[16px] font-semibold text-white">Attendance</h2><p className="mt-1 text-[10px] text-[#777777]">Daily study activity of group members</p></div>
              </div>
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#303030] bg-[#191919] p-3">
                <label className="text-[10px] text-[#999999]">SELECT DATE</label>
                <input type="date" value={attendanceDate} onChange={e => setAttendanceDate(e.target.value)} className="rounded-md border border-[#383838] bg-[#111111] px-3 py-2 text-[11px] text-white outline-none" />
              </div>
              <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div className="rounded-xl border border-[#292929] bg-[#1d1d1d] p-4 sm:p-5"><p className="text-[9px] text-[#777777]">Present</p><p className="mt-1 text-xl font-semibold text-[#42D66B]">{attendanceRows.filter(row => row.present).length}</p></div>
                <div className="rounded-xl border border-[#292929] bg-[#1d1d1d] p-4 sm:p-5"><p className="text-[9px] text-[#777777]">Not studied</p><p className="mt-1 text-xl font-semibold text-[#aaaaaa]">{attendanceRows.filter(row => !row.present).length}</p></div>
                <div className="rounded-xl border border-[#292929] bg-[#1d1d1d] p-4 sm:p-5"><p className="text-[9px] text-[#777777]">Total members</p><p className="mt-1 text-xl font-semibold text-white">{attendanceRows.length}</p></div>
              </div>
              <div className="overflow-hidden rounded-xl border border-[#2d2d2d] bg-[#151515]">
                {attendanceRows.map(row => <div key={row.user_id} className="flex items-center gap-3 border-b border-[#292929] px-4 py-4 last:border-0 sm:px-5"><span className={`h-2 w-2 rounded-full ${row.present ? "bg-[#42D66B]" : "bg-[#555555]"}`}/><span className="flex-1 text-[11px] text-[#dddddd]">@{row.username}{row.user_id === userId ? " · You" : ""}</span><span className="font-mono text-[10px] text-[#aaaaaa]">{formatStudyTime(row.seconds)}</span><span className={`w-16 text-right text-[9px] ${row.present ? "text-[#42D66B]" : "text-[#777777]"}`}>{row.present ? "PRESENT" : "—"}</span></div>)}
                {!attendanceRows.length && <p className="p-6 text-center text-[11px] text-[#777777]">No group members found.</p>}
              </div>
              <p className="mt-3 text-[9px] leading-4 text-[#666666]">Attendance is calculated from recorded study sessions. A member is marked present after starting a study session on the selected date.</p>
            </div>
          ) : roomTab === "rankings" ? (
            <div className="mx-auto w-full max-w-6xl px-5 py-7 lg:px-8">
              <div className="mb-5 flex items-center gap-3"><button onClick={() => setRoomTab("home")} className="text-[#999999] hover:text-white"><ArrowLeft size={18}/></button><div><h2 className="text-[16px] font-semibold text-white">Study rankings</h2><p className="mt-1 text-[10px] text-[#777777]">All-time recorded study time</p></div></div>
              <div className="space-y-2">
                {rankingRows.map((row, index) => <div key={row.user_id} className={`flex items-center gap-3 rounded-xl border px-4 py-4 sm:px-5 ${row.user_id === userId ? "border-[#D97736]/50 bg-[#D97736]/[0.07]" : "border-[#2d2d2d] bg-[#191919]"}`}><div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#252525] text-[11px] font-semibold text-[#cccccc]">{index === 0 ? <Crown size={15} className="text-[#FFD34D]"/> : index + 1}</div><div className="min-w-0 flex-1"><p className="truncate text-[11px] font-medium text-white">@{row.username}{row.user_id === userId ? " · You" : ""}</p><p className="mt-1 text-[9px] text-[#777777]">{row.role === "owner" ? "Group leader" : "Member"}</p></div><span className="font-mono text-[11px] font-semibold text-[#D97736]">{formatStudyTime(row.seconds)}</span></div>)}
                {!rankingRows.length && <p className="rounded-xl border border-[#2d2d2d] p-6 text-center text-[11px] text-[#777777]">No rankings yet. Start studying to appear here.</p>}
              </div>
              <p className="mt-3 text-[9px] text-[#666666]">Rankings use the study sessions recorded for this group.</p>
            </div>
          ) : roomTab === "invite" ? (
            <div className="mx-auto w-full max-w-4xl px-5 py-7 lg:px-8">
              <div className="mb-5 flex items-center gap-3"><button onClick={() => setRoomTab("home")} className="text-[#999999] hover:text-white"><ArrowLeft size={18}/></button><div><h2 className="text-[16px] font-semibold text-white">Invite to group</h2><p className="mt-1 text-[10px] text-[#777777]">Bring your study partners together</p></div></div>
              <div className="rounded-xl border border-[#303030] bg-[#191919] p-4"><div className="flex items-center gap-2 text-[#D97736]"><UserPlus size={17}/><span className="text-[11px] font-semibold text-white">Group invite code</span></div><p className="mt-3 text-[10px] text-[#888888]">Share this code with people you want to invite.</p><div className="mt-3 flex items-center justify-between gap-3 rounded-lg bg-[#111111] p-3"><code className="text-xl font-semibold tracking-[4px] text-white">{selectedGroup.invite_code ?? "Unavailable"}</code><button disabled={!selectedGroup.invite_code} onClick={() => selectedGroup.invite_code && copyInvite(selectedGroup.invite_code)} className="flex items-center gap-2 rounded-md bg-[#D97736] px-3 py-2 text-[10px] font-semibold text-black disabled:opacity-40"><Copy size={12}/> Copy</button></div><button onClick={() => selectedGroup.invite_code && navigator.share ? navigator.share({ title: `Join ${selectedGroup.name} on Tapasya`, text: `Join my Tapasya study group ${selectedGroup.name} with code ${selectedGroup.invite_code}` }).catch(() => {}) : selectedGroup.invite_code && copyInvite(selectedGroup.invite_code)} className="mt-3 w-full rounded-md border border-[#383838] py-2.5 text-[10px] text-[#cccccc] hover:bg-[#252525]">Share invite</button></div>
              <div className="mt-4 rounded-xl border border-[#303030] bg-[#191919] p-4"><p className="text-[10px] font-semibold text-white">Members ({(members[selectedGroup.id] ?? []).length})</p><div className="mt-3 space-y-2">{(members[selectedGroup.id] ?? []).map(member => <div key={member.user_id} className="flex items-center justify-between text-[10px]"><span className="text-[#cccccc]">@{member.username}</span><span className="text-[#D97736]">{member.role === "owner" ? "LEADER" : "MEMBER"}</span></div>)}</div></div>
              <p className="mt-3 text-[9px] text-[#666666]">No QR code — invite using the code above.</p>
            </div>
          ) : (
            <div className="mx-auto flex h-[calc(100dvh-250px)] min-h-[560px] w-full max-w-7xl flex-col px-5 py-6 lg:px-8">
              <div className="mb-4 flex items-center gap-3"><button onClick={() => setRoomTab("home")} className="text-[#999999] hover:text-white"><ArrowLeft size={18}/></button><div><h2 className="text-[16px] font-semibold text-white">Group chat</h2><p className="mt-1 text-[10px] text-[#777777]">Messages are visible to group members</p></div><button onClick={loadMessages} className="ml-auto rounded-md bg-[#202020] p-2 text-[#999999] hover:text-white"><RefreshCw size={14}/></button></div>
              {chatError && <p className="mb-3 rounded-md border border-red-900/40 bg-red-950/20 p-2 text-[10px] text-red-300">{chatError}</p>}
              <div className="min-h-0 flex-1 space-y-3 overflow-y-auto rounded-xl border border-[#2d2d2d] bg-[#151515] p-4 lg:p-6">
                {messages.map(message => {
                  const sticker = getSticker(message.content);
                  return (
                    <div key={message.id} className={`flex ${message.user_id === userId ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-[85%] rounded-xl px-3 py-2 ${sticker ? "min-w-[104px] bg-transparent" : message.user_id === userId ? "bg-[#D97736]/20" : "bg-[#252525]"}`}>
                        <p className="mb-1 text-[9px] font-semibold text-[#D97736]">
                          @{message.username}{message.user_id === userId ? " · You" : ""}
                        </p>
                        {sticker ? (
                          <div className={`flex h-[104px] w-[104px] items-center justify-center rounded-2xl border border-white/[0.07] bg-gradient-to-br ${sticker.tone} shadow-lg`}>
                            <span role="img" aria-label={sticker.label} className="select-none text-[56px] leading-none drop-shadow-md">{sticker.emoji}</span>
                          </div>
                        ) : (
                          <p className="whitespace-pre-wrap break-words text-[11px] text-[#e0e0e0]">{message.content}</p>
                        )}
                        <p className="mt-1 text-right text-[8px] text-[#777777]">
                          {new Date(message.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </p>
                      </div>
                    </div>
                  );
                })}
                {!messages.length && <p className="py-12 text-center text-[11px] text-[#777777]">No messages yet. Say hello 👋</p>}
              </div>

              {showStickerPicker && (
                <div className="mt-3 shrink-0 rounded-xl border border-[#303030] bg-[#191919] p-3 shadow-xl">
                  <div className="mb-3 flex items-center justify-between">
                    <div>
                      <p className="text-[11px] font-semibold text-white">Tapasya stickers</p>
                      <p className="mt-0.5 text-[9px] text-[#777777]">A hand-picked set. No random uploads.</p>
                    </div>
                    <button type="button" onClick={() => setShowStickerPicker(false)} className="rounded-md p-1.5 text-[#888888] hover:bg-[#292929] hover:text-white" aria-label="Close stickers">
                      <X size={15}/>
                    </button>
                  </div>
                  <div className="grid grid-cols-4 gap-2 sm:grid-cols-8">
                    {CHAT_STICKERS.map(sticker => (
                      <button
                        key={sticker.id}
                        type="button"
                        disabled={sendingMessage}
                        onClick={() => sendSticker(sticker.id)}
                        title={sticker.label}
                        className={`group flex min-h-[76px] flex-col items-center justify-center gap-1 rounded-xl border border-white/[0.06] bg-gradient-to-br ${sticker.tone} transition hover:-translate-y-0.5 hover:border-[#D97736]/50 disabled:opacity-40`}
                      >
                        <span className="text-[29px] leading-none transition group-hover:scale-110">{sticker.emoji}</span>
                        <span className="max-w-full truncate px-1 text-[8px] text-[#b7b7b7]">{sticker.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <form onSubmit={sendMessage} className="mt-3 flex shrink-0 gap-2">
                <button
                  type="button"
                  onClick={() => setShowStickerPicker(value => !value)}
                  className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border transition ${showStickerPicker ? "border-[#D97736] bg-[#D97736]/15 text-[#F0A06B]" : "border-[#383838] bg-[#191919] text-[#aaaaaa] hover:border-[#D97736]/60 hover:text-white"}`}
                  aria-label="Open stickers"
                  title="Stickers"
                >
                  <Smile size={18}/>
                </button>
                <input
                  value={messageDraft}
                  onChange={e => setMessageDraft(e.target.value)}
                  maxLength={1000}
                  placeholder="Write a message..."
                  className="h-11 min-w-0 flex-1 rounded-lg border border-[#383838] bg-[#191919] px-3 text-[11px] text-white outline-none focus:border-[#D97736]"
                />
                <button disabled={!messageDraft.trim() || sendingMessage} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-[#D97736] text-black disabled:opacity-40">
                  {sendingMessage ? <Loader2 size={15} className="animate-spin"/> : <Send size={15}/>}
                </button>
              </form>
            </div>
          )}
        </div>
      ) : (
        <>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-xl font-semibold text-white">{tab === "mine" ? "My groups" : "Study groups"}</h1>
              <p className="mt-1 text-[11px] text-[#888888]">
                Study together. Stay accountable.
              </p>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setShowJoinCode(true)}
                className="flex items-center gap-2 rounded-md border border-[#383838] px-3 py-2.5 text-[10px] text-[#cccccc] hover:bg-[#252525]"
              >
                <Link2 size={13} /> Join with code
              </button>

              <button
                onClick={() => setShowCreate(true)}
                className="flex items-center gap-2 rounded-md bg-[#D97736] px-3 py-2.5 text-[10px] font-semibold text-black hover:bg-[#e58a4e]"
              >
                <Plus size={14} /> Create group
              </button>
            </div>
          </div>

          <div className="mt-6 flex gap-5 border-b border-[#292929]">
            <button
              onClick={() => setTab("discover")}
              className={`border-b-2 pb-3 text-[11px] ${
                tab === "discover"
                  ? "border-[#D97736] text-white"
                  : "border-transparent text-[#777777]"
              }`}
            >
              Discover
            </button>
            <button
              onClick={() => setTab("mine")}
              className={`border-b-2 pb-3 text-[11px] ${
                tab === "mine"
                  ? "border-[#D97736] text-white"
                  : "border-transparent text-[#777777]"
              }`}
            >
              My Groups ({myGroups.length})
            </button>
          </div>

          <div className="mt-5 flex flex-col gap-3 sm:flex-row">
            <div className="flex flex-1 items-center gap-2 rounded-md border border-[#333333] bg-[#181818] px-3">
              <Search size={14} className="text-[#777777]" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search groups..."
                className="h-10 w-full bg-transparent text-[11px] text-white outline-none placeholder:text-[#666666]"
              />
            </div>

            <select
              value={category}
              onChange={e => setCategory(e.target.value)}
              className="rounded-md border border-[#333333] bg-[#181818] px-3 text-[11px] text-[#cccccc] outline-none"
            >
              {CATEGORIES.map(item => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>

            <button
              onClick={loadGroups}
              className="flex h-10 items-center justify-center rounded-md border border-[#333333] px-3 text-[#888888] hover:text-white"
              title="Refresh groups"
            >
              <RefreshCw size={14} />
            </button>
          </div>

          {error && (
            <div className="mt-4 rounded-md border border-red-900/50 bg-red-950/20 px-3 py-2 text-[11px] text-red-300">
              {error}
            </div>
          )}

          {notice && (
            <div className="mt-4 rounded-md border border-[#36533c] bg-[#17251a] px-3 py-2 text-[11px] text-[#a8d6ad]">
              {notice}
            </div>
          )}

          {loading ? (
            <div className="flex min-h-[250px] items-center justify-center text-[#888888]">
              <Loader2 size={20} className="animate-spin" />
            </div>
          ) : filteredGroups.length ? (
            <div className="mt-5 flex flex-col gap-3">
              {filteredGroups.map(group => (
                <GroupCard key={group.id} group={group} />
              ))}
            </div>
          ) : (
            <div className="flex min-h-[260px] flex-col items-center justify-center text-center">
              <Users size={25} className="text-[#555555]" />
              <h3 className="mt-4 text-[13px] font-medium text-[#cccccc]">
                {tab === "mine" ? "No groups yet" : "No groups found"}
              </h3>
              <p className="mt-2 max-w-[250px] text-[10px] leading-5 text-[#777777]">
                {tab === "mine"
                  ? "Create a group or discover one to start studying together."
                  : "Try another search or create a new group."}
              </p>
            </div>
          )}
        </>
      )}

      {/* CREATE GROUP MODAL */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/75 p-4">
          <form
            onSubmit={createGroup}
            className="my-auto w-full max-w-[430px] rounded-xl border border-[#383838] bg-[#1d1d1d] p-5 shadow-2xl"
          >
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h2 className="text-[15px] font-semibold text-white">
                  Create a group
                </h2>
                <p className="mt-1 text-[10px] text-[#777777]">
                  Build your own study community.
                </p>
              </div>
              <button type="button" onClick={() => setShowCreate(false)}>
                <X size={17} className="text-[#888888]" />
              </button>
            </div>

            <label className="mb-1.5 block text-[10px] text-[#999999]">
              GROUP NAME
            </label>
            <input
              required
              minLength={3}
              maxLength={40}
              value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. Night Owls"
              className="mb-4 h-10 w-full rounded-md border border-[#383838] bg-[#141414] px-3 text-[12px] text-white outline-none focus:border-[#D97736]"
            />

            <label className="mb-1.5 block text-[10px] text-[#999999]">
              DESCRIPTION
            </label>
            <textarea
              rows={3}
              maxLength={180}
              value={form.description}
              onChange={e => setForm({ ...form, description: e.target.value })}
              placeholder="What is this group about?"
              className="mb-4 w-full resize-none rounded-md border border-[#383838] bg-[#141414] p-3 text-[12px] text-white outline-none focus:border-[#D97736]"
            />

            <div className="mb-4 grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1.5 block text-[10px] text-[#999999]">
                  CATEGORY
                </label>
                <select
                  value={form.category}
                  onChange={e => setForm({ ...form, category: e.target.value })}
                  className="h-10 w-full rounded-md border border-[#383838] bg-[#141414] px-2 text-[11px] text-white outline-none"
                >
                  {CATEGORIES.filter(c => c !== "All").map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1.5 block text-[10px] text-[#999999]">
                  DAILY STUDY GOAL
                </label>
                <input
                  type="number"
                  min="1"
                  max="24"
                  value={form.goalHours}
                  onChange={e => setForm({ ...form, goalHours: e.target.value })}
                  className="h-10 w-full rounded-md border border-[#383838] bg-[#141414] px-3 text-[11px] text-white outline-none"
                />
              </div>
            </div>

            <label className="mb-2 block text-[10px] text-[#999999]">
              VISIBILITY
            </label>
            <div className="mb-4 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setForm({ ...form, isPublic: true })}
                className={`rounded-md border p-3 text-left ${
                  form.isPublic
                    ? "border-[#D97736] bg-[#D97736]/10"
                    : "border-[#383838] bg-[#151515]"
                }`}
              >
                <Globe size={15} className="mb-2 text-[#D97736]" />
                <p className="text-[11px] text-white">Public</p>
                <p className="mt-1 text-[9px] text-[#777777]">
                  Anyone can discover
                </p>
              </button>

              <button
                type="button"
                onClick={() => setForm({ ...form, isPublic: false })}
                className={`rounded-md border p-3 text-left ${
                  !form.isPublic
                    ? "border-[#D97736] bg-[#D97736]/10"
                    : "border-[#383838] bg-[#151515]"
                }`}
              >
                <Lock size={15} className="mb-2 text-[#D97736]" />
                <p className="text-[11px] text-white">Private</p>
                <p className="mt-1 text-[9px] text-[#777777]">
                  Invite code required
                </p>
              </button>
            </div>

            <label className="mb-2 block text-[10px] text-[#999999]">
              MEMBER LIMIT
            </label>
            <div className="mb-3 flex items-center gap-2">
              <input
                type="checkbox"
                checked={form.unlimited}
                onChange={e => setForm({ ...form, unlimited: e.target.checked })}
                className="accent-[#D97736]"
              />
              <span className="text-[11px] text-[#cccccc]">
                Unlimited members
              </span>
            </div>

            {!form.unlimited && (
              <input
                required
                type="number"
                min="2"
                max="10000"
                value={form.maxMember}
                onChange={e => setForm({ ...form, maxMember: e.target.value })}
                placeholder="Maximum members"
                className="mb-5 h-10 w-full rounded-md border border-[#383838] bg-[#141414] px-3 text-[11px] text-white outline-none focus:border-[#D97736]"
              />
            )}

            <button
              disabled={busy}
              type="submit"
              className="flex h-10 w-full items-center justify-center gap-2 rounded-md bg-[#D97736] text-[11px] font-semibold text-black hover:bg-[#e58a4e] disabled:opacity-50"
            >
              {busy && <Loader2 size={14} className="animate-spin" />}
              Create group
            </button>
          </form>
        </div>
      )}

      {/* JOIN BY CODE MODAL */}
      {showJoinCode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4">
          <form
            onSubmit={joinByCode}
            className="w-full max-w-[360px] rounded-xl border border-[#383838] bg-[#1d1d1d] p-5"
          >
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-[14px] font-semibold text-white">
                Join private group
              </h2>
              <button type="button" onClick={() => setShowJoinCode(false)}>
                <X size={17} className="text-[#888888]" />
              </button>
            </div>

            <p className="mb-4 text-[11px] leading-5 text-[#888888]">
              Enter the invite code shared by the group owner.
            </p>

            <input
              required
              maxLength={10}
              value={inviteInput}
              onChange={e => setInviteInput(e.target.value.toUpperCase())}
              placeholder="ENTER CODE"
              className="mb-4 h-12 w-full rounded-md border border-[#383838] bg-[#141414] px-3 text-center font-mono text-[16px] tracking-[4px] text-white outline-none focus:border-[#D97736]"
            />

            <button
              disabled={busy}
              type="submit"
              className="h-10 w-full rounded-md bg-[#D97736] text-[11px] font-semibold text-black disabled:opacity-50"
            >
              {busy ? "Joining..." : "Join group"}
            </button>
          </form>
        </div>
      )}

      {busy && (
        <div className="fixed bottom-5 right-5 z-[60] flex items-center gap-2 rounded-md border border-[#383838] bg-[#222222] px-3 py-2 text-[10px] text-[#cccccc]">
          <Loader2 size={13} className="animate-spin" />
          Please wait...
        </div>
      )}
    </section>
  );
}