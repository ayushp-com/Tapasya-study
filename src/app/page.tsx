
"use client";

import { useEffect, useRef, useState } from "react";
import {
  Timer, CheckSquare, CalendarDays, Users, Plus, Play, Pause,
  MoreVertical, Pencil, Trash2, ChevronUp, ChevronDown, X,
  PanelRight, Check, ChevronLeft, ChevronRight,
  UserRound, LogOut
} from "lucide-react";
import GroupsPanel from "@/components/groups/GroupsPanel";
import LiveStudyRoom from "@/components/LiveStudyRoom";
import { createClient } from "@/lib/supabase/client";

type Subject = {
  id: number;
  name: string;
  color: string;
  seconds: number;
  targetHours: number;
};

type Task = {
  id: number;
  title: string;
  subject: string;
  deadline: string;
  completed: boolean;
};

const supabase = createClient();

const COLORS = [
  "#FF7628", "#2196F3", "#F5E82E", "#22C55E",
  "#A78BFA", "#EC4899", "#14B8A6", "#F87171"
];

const INITIAL_SUBJECTS: Subject[] = [
  { id: 1, name: "MATHS", color: "#FF7628", seconds: 0, targetHours: 2 },
  { id: 2, name: "PHYSICS", color: "#FF7628", seconds: 0, targetHours: 1 },
  { id: 3, name: "MERN STACK", color: "#2196F3", seconds: 0, targetHours: 3 },
  { id: 4, name: "OTHERS", color: "#F5E82E", seconds: 0, targetHours: 1 },
  { id: 5, name: "DSA", color: "#2196F3", seconds: 0, targetHours: 2 },
];

const dateKey = (date: Date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};

const parseDate = (key: string) => {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d);
};

const formatTime = (seconds: number) => {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
};

function getWeek(date: Date) {
  const monday = new Date(date);
  const day = monday.getDay();
  monday.setDate(monday.getDate() + (day === 0 ? -6 : 1 - day));
  monday.setHours(0, 0, 0, 0);

  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d;
  });
}

function getMonthWeeks(year: number, month: number) {
  const first = new Date(year, month, 1);
  const last = new Date(year, month + 1, 0);

  const start = new Date(first);
  const offset = (first.getDay() + 6) % 7;
  start.setDate(first.getDate() - offset);

  const end = new Date(last);
  const endOffset = (7 - ((last.getDay() + 6) % 7) - 1);
  end.setDate(last.getDate() + endOffset);

  const weeks: Date[][] = [];
  const cursor = new Date(start);

  while (cursor <= end) {
    const week: Date[] = [];

    for (let i = 0; i < 7; i++) {
      week.push(new Date(cursor));
      cursor.setDate(cursor.getDate() + 1);
    }

    weeks.push(week);
  }

  return weeks;
}

function formatDay(date: Date) {
  return date.toLocaleDateString("en-US", {
    day: "2-digit",
    weekday: "short",
  });
}

function monthName(date: Date) {
  return date.toLocaleDateString("en-US", { month: "short" });
}

export default function Home() {
  const [subjects, setSubjects] = useState<Subject[]>(INITIAL_SUBJECTS);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [activeSubject, setActiveSubject] = useState<number | null>(null);
  const studySessionRunRef = useRef(0);
  const hasInitializedStudySessionRef = useRef(false);

  const [ready, setReady] = useState(false);
  const [todayLabel, setTodayLabel] = useState("");
  const [todayKey, setTodayKey] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [week, setWeek] = useState<Date[]>([]);

  const [calendarStart, setCalendarStart] = useState<Date | null>(null);
  const [calendarSelectedDate, setCalendarSelectedDate] = useState("");
  const [calendarModal, setCalendarModal] = useState(false);

  const [selectedTab, setSelectedTab] = useState("Timer");
  const [menuId, setMenuId] = useState<number | null>(null);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [profileUsername, setProfileUsername] = useState("");
  const [profileEmail, setProfileEmail] = useState("");
  const [loggingOut, setLoggingOut] = useState(false);

  const [subjectModal, setSubjectModal] = useState(false);
  const [editingSubjectId, setEditingSubjectId] = useState<number | null>(null);
  const [subjectName, setSubjectName] = useState("");
  const [subjectColor, setSubjectColor] = useState(COLORS[0]);
  const [target, setTarget] = useState("2");

  const [taskModal, setTaskModal] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState<number | null>(null);
  const [taskTitle, setTaskTitle] = useState("");
  const [taskSubject, setTaskSubject] = useState("");
  const [taskDate, setTaskDate] = useState("");

  // Load the signed-in user's identity for the profile menu.
  useEffect(() => {
    let cancelled = false;

    const loadProfileIdentity = async () => {
      const { data, error } = await supabase.auth.getUser();
      if (error || !data.user || cancelled) return;

      setProfileEmail(data.user.email ?? "");

      const { data: profile } = await supabase
        .from("profiles")
        .select("username")
        .eq("id", data.user.id)
        .maybeSingle();

      if (!cancelled) {
        setProfileUsername(profile?.username || data.user.user_metadata?.username || "Student");
      }
    };

    void loadProfileIdentity();
    return () => { cancelled = true; };
  }, []);

  const handleLogout = async () => {
    if (loggingOut) return;
    setLoggingOut(true);
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error("Could not log out:", error);
      setLoggingOut(false);
      return;
    }
    window.location.assign("/auth");
  };

  // Initialize dates and load saved data only on the client.
  useEffect(() => {
    const now = new Date();
    const currentKey = dateKey(now);

    setTodayKey(currentKey);
    setSelectedDate(currentKey);
    setCalendarSelectedDate(currentKey);
    setTaskDate(currentKey);
    setWeek(getWeek(now));
    setCalendarStart(new Date(now.getFullYear(), now.getMonth(), 1));

    setTodayLabel(
      now.toLocaleDateString("en-US", {
        weekday: "short",
        month: "2-digit",
        day: "2-digit",
      })
    );

    try {
      const savedSubjects = localStorage.getItem("tapasya-subjects");
      const savedTasks = localStorage.getItem("tapasya-tasks");

      if (savedSubjects) {
        const parsed = JSON.parse(savedSubjects);
        if (Array.isArray(parsed)) {
          setSubjects(parsed.map((s: Subject) => ({
            ...s,
            seconds: Number(s.seconds) || 0,
            targetHours: Number(s.targetHours) || 0,
          })));
        }
      }

      if (savedTasks) {
        const parsed = JSON.parse(savedTasks);
        if (Array.isArray(parsed)) {
          setTasks(parsed.map((t: Task & { date?: string }) => ({
            ...t,
            deadline: t.deadline || t.date || "",
          })));
        }
      }
    } catch (error) {
      console.error("Could not load saved data:", error);
    }

    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    localStorage.setItem("tapasya-subjects", JSON.stringify(subjects));
  }, [subjects, ready]);

  useEffect(() => {
    if (!ready) return;
    localStorage.setItem("tapasya-tasks", JSON.stringify(tasks));
  }, [tasks, ready]);

  // Sync the local focus timer with Supabase so group rooms can show live study time.
  useEffect(() => {
    if (activeSubject === null && !hasInitializedStudySessionRef.current) {
      hasInitializedStudySessionRef.current = true;
      return;
    }
    hasInitializedStudySessionRef.current = true;
    const runId = ++studySessionRunRef.current;

    const syncStudySession = async () => {
      const { data: authData, error: authError } = await supabase.auth.getUser();
      if (authError || !authData.user) {
        if (authError) console.error("Could not identify user for study session:", authError);
        return;
      }

      const userId = authData.user.id;

      if (activeSubject === null) {
        const { error } = await supabase
          .from("study_sessions")
          .update({ ended_at: new Date().toISOString() })
          .eq("user_id", userId)
          .is("ended_at", null);
        if (error) console.error("Could not stop study session:", error);
        return;
      }

      const { data: memberships, error: membershipError } = await supabase
        .from("group_members")
        .select("group_id")
        .eq("user_id", userId);

      if (membershipError) {
        console.error("Could not load groups for study session:", membershipError);
        return;
      }
      if (studySessionRunRef.current !== runId) return;

      const groupIds = [...new Set((memberships ?? []).map(row => row.group_id))];
      if (!groupIds.length) return;

      // Close any previous active session before opening the new subject session.
      const { error: closeError } = await supabase
        .from("study_sessions")
        .update({ ended_at: new Date().toISOString() })
        .eq("user_id", userId)
        .is("ended_at", null);
      if (closeError) console.error("Could not close previous study session:", closeError);
      if (studySessionRunRef.current !== runId) return;

      const startedAt = new Date().toISOString();
      const { data: createdSessions, error: insertError } = await supabase
        .from("study_sessions")
        .insert(groupIds.map(group_id => ({
          group_id,
          user_id: userId,
          started_at: startedAt,
          ended_at: null,
        })))
        .select("id");

      if (insertError) {
        console.error("Could not start group study session:", insertError);
        return;
      }

      if (studySessionRunRef.current !== runId && createdSessions?.length) {
        const { error: stopError } = await supabase
          .from("study_sessions")
          .update({ ended_at: new Date().toISOString() })
          .in("id", createdSessions.map(row => row.id));
        if (stopError) console.error("Could not close a just-created study session:", stopError);
      }
    };

    void syncStudySession();
  }, [activeSubject]);

  // Study timer
  useEffect(() => {
    if (activeSubject === null) return;

    const interval = setInterval(() => {
      setSubjects(current =>
        current.map(subject =>
          subject.id === activeSubject
            ? { ...subject, seconds: subject.seconds + 1 }
            : subject
        )
      );
    }, 1000);

    return () => clearInterval(interval);
  }, [activeSubject]);

  const totalSeconds = subjects.reduce((sum, s) => sum + s.seconds, 0);

  // SUBJECT MANAGEMENT
  function openAddSubject() {
    setEditingSubjectId(null);
    setSubjectName("");
    setSubjectColor(COLORS[0]);
    setTarget("2");
    setSubjectModal(true);
  }

  function openEditSubject(subject: Subject) {
    setEditingSubjectId(subject.id);
    setSubjectName(subject.name);
    setSubjectColor(subject.color);
    setTarget(String(subject.targetHours ?? 0));
    setMenuId(null);
    setSubjectModal(true);
  }

  function saveSubject() {
    const clean = subjectName.trim();
    const hours = Number(target);

    if (!clean || !Number.isFinite(hours) || hours < 0 || hours > 24) return;

    if (editingSubjectId !== null) {
      const oldName = subjects.find(s => s.id === editingSubjectId)?.name;

      setSubjects(current => current.map(s =>
        s.id === editingSubjectId
          ? { ...s, name: clean, color: subjectColor, targetHours: hours }
          : s
      ));

      if (oldName && oldName !== clean) {
        setTasks(current => current.map(t =>
          t.subject === oldName ? { ...t, subject: clean } : t
        ));
      }
    } else {
      setSubjects(current => [...current, {
        id: Date.now(),
        name: clean,
        color: subjectColor,
        seconds: 0,
        targetHours: hours,
      }]);
    }

    setSubjectModal(false);
  }

  function deleteSubject(id: number) {
    if (!window.confirm("Delete this subject and its recorded study time?")) return;

    const subject = subjects.find(s => s.id === id);
    setSubjects(current => current.filter(s => s.id !== id));

    if (activeSubject === id) setActiveSubject(null);

    if (subject) {
      setTasks(current => current.map(t =>
        t.subject === subject.name ? { ...t, subject: "" } : t
      ));
    }

    setMenuId(null);
  }

  function moveSubject(index: number, direction: -1 | 1) {
    const next = index + direction;
    if (next < 0 || next >= subjects.length) return;

    setSubjects(current => {
      const updated = [...current];
      [updated[index], updated[next]] = [updated[next], updated[index]];
      return updated;
    });

    setMenuId(null);
  }

  // TASK MANAGEMENT
  function openAddTask(subject: string, date?: string) {
    setEditingTaskId(null);
    setTaskTitle("");
    setTaskSubject(subject);
    setTaskDate(date || selectedDate || todayKey);
    setTaskModal(true);
  }

  function openEditTask(task: Task) {
    setEditingTaskId(task.id);
    setTaskTitle(task.title);
    setTaskSubject(task.subject);
    setTaskDate(task.deadline);
    setTaskModal(true);
  }

  function saveTask() {
    const clean = taskTitle.trim();
    if (!clean || !taskDate) return;

    if (editingTaskId !== null) {
      setTasks(current => current.map(t =>
        t.id === editingTaskId
          ? { ...t, title: clean, subject: taskSubject, deadline: taskDate }
          : t
      ));
    } else {
      setTasks(current => [{
        id: Date.now(),
        title: clean,
        subject: taskSubject,
        deadline: taskDate,
        completed: false,
      }, ...current]);
    }

    setTaskModal(false);
  }

  function toggleTask(id: number) {
    setTasks(current => current.map(t =>
      t.id === id ? { ...t, completed: !t.completed } : t
    ));
  }

  function deleteTask(id: number) {
    setTasks(current => current.filter(t => t.id !== id));
  }

  // WEEKLY PLANNER
  function changeWeek(direction: number) {
    if (!week.length) return;

    const next = new Date(week[0]);
    next.setDate(next.getDate() + direction * 7);

    const newWeek = getWeek(next);
    setWeek(newWeek);
    setSelectedDate(dateKey(newWeek[0]));
  }

  function goToToday() {
    const now = new Date();
    setWeek(getWeek(now));
    setSelectedDate(dateKey(now));
  }

  // CALENDAR
  function changeCalendarMonth(direction: number) {
    if (!calendarStart) return;

    setCalendarStart(new Date(
      calendarStart.getFullYear(),
      calendarStart.getMonth() + direction,
      1
    ));
  }

  function goToCalendarToday() {
    const now = new Date();
    setCalendarStart(new Date(now.getFullYear(), now.getMonth(), 1));
    setCalendarSelectedDate(dateKey(now));
  }

  function openCalendarDate(key: string) {
    setCalendarSelectedDate(key);
    setTaskDate(key);
    setCalendarModal(true);
  }

  const calendarMonths = calendarStart
    ? [
        new Date(calendarStart.getFullYear(), calendarStart.getMonth(), 1),
        new Date(calendarStart.getFullYear(), calendarStart.getMonth() + 1, 1),
      ]
    : [];


  return (
    <main
      className="min-h-screen bg-[#111111] text-[#d0d0d0]"
      onClick={() => {
        if (menuId !== null) setMenuId(null);
        if (profileMenuOpen) setProfileMenuOpen(false);
      }}
    >
      {/* NAVIGATION */}
      <header className="sticky top-0 z-30 flex h-[54px] items-center justify-between border-b border-[#242424] bg-[#111111] px-3">
        <div className="flex h-full items-center gap-1 overflow-x-auto">
          {[
            { name: "Timer", icon: Timer },
            { name: "To-Do", icon: CheckSquare },
            { name: "Calendar", icon: CalendarDays },
            { name: "Groups", icon: Users },
          ].map(({ name, icon: Icon }) => (
            <button
              key={name}
              onClick={() => setSelectedTab(name)}
              className={`flex h-[34px] items-center gap-1.5 rounded-md px-3 text-[12px] font-medium ${
                selectedTab === name
                  ? "bg-[#292929] text-white"
                  : "text-[#777777] hover:bg-[#1d1d1d] hover:text-white"
              }`}
            >
              <Icon size={14} />
              {name}
            </button>
          ))}

          {selectedTab !== "Groups" && (
            <>
              <div className="mx-2 h-5 w-px bg-[#292929]" />

              <button
                onClick={() =>
                  selectedTab === "To-Do"
                    ? openAddTask("")
                    : openAddSubject()
                }
                className="flex h-8 w-8 items-center justify-center rounded text-[#999999] hover:bg-[#292929] hover:text-white"
                title="Add"
              >
                <Plus size={17} />
              </button>
            </>
          )}
        </div>

        <div className="relative shrink-0">
          <button
            type="button"
            onClick={event => {
              event.stopPropagation();
              setProfileMenuOpen(open => !open);
            }}
            aria-label="Open profile menu"
            aria-expanded={profileMenuOpen}
            className="flex h-9 items-center gap-2 rounded-full border border-[#303030] bg-[#191919] px-2.5 text-[#cfcfcf] transition hover:border-[#505050] hover:bg-[#242424]"
          >
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#303030] text-[#FF7628]">
              <UserRound size={14} />
            </span>
            <span className="hidden max-w-[110px] truncate text-[11px] font-medium sm:block">
              {profileUsername ? `@${profileUsername}` : "Profile"}
            </span>
            <ChevronDown size={13} className={`text-[#888888] transition-transform ${profileMenuOpen ? "rotate-180" : ""}`} />
          </button>

          {profileMenuOpen && (
            <div
              onClick={event => event.stopPropagation()}
              className="absolute right-0 top-11 z-50 w-[250px] overflow-hidden rounded-xl border border-[#353535] bg-[#1c1c1c] shadow-[0_16px_50px_rgba(0,0,0,0.55)]"
            >
              <div className="border-b border-[#303030] px-4 py-4">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#30251f] text-[#FF7628]">
                    <UserRound size={19} />
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-[13px] font-semibold text-white">
                      {profileUsername ? `@${profileUsername}` : "Your profile"}
                    </p>
                    <p className="mt-0.5 truncate text-[11px] text-[#888888]">
                      {profileEmail || "Tapasya account"}
                    </p>
                  </div>
                </div>
              </div>

              {/* <button
                type="button"
                onClick={() => {
                  setProfileMenuOpen(false);
                  window.location.assign("/auth/setup");
                }}
                className="flex w-full items-center gap-3 px-4 py-3 text-left text-[12px] text-[#d0d0d0] transition hover:bg-[#292929]"
              >
                <UserRound size={15} className="text-[#999999]" />
                
              </button> */}

              <div className="mx-3 border-t border-[#303030]" />

              <button
                type="button"
                onClick={handleLogout}
                disabled={loggingOut}
                className="flex w-full items-center gap-3 px-4 py-3 text-left text-[12px] text-[#ff7777] transition hover:bg-[#2b2020] disabled:cursor-wait disabled:opacity-60"
              >
                <LogOut size={15} />
                {loggingOut ? "Logging out..." : "Log out"}
              </button>
            </div>
          )}
        </div>
      </header>

      {/* TIMER PAGE */}
      {selectedTab === "Timer" && (
        <>
          {activeSubject !== null ? (
            <>
              {(() => {
                const runningSubject = subjects.find(subject => subject.id === activeSubject);
                return (
                  <>
                    <div className="flex h-[38px] items-center gap-3 px-4 text-[12px] text-[#c9c9c9]">
                      <span className="font-semibold">{runningSubject?.name ?? "Study session"}</span>
                      <span className="font-mono tabular-nums">{formatTime(runningSubject?.seconds ?? totalSeconds)}</span>
                      <div className="flex-1" />
                    </div>
                    <section className="mx-3 mb-2 flex min-h-[94px] items-center justify-between rounded-xl bg-[#151515] px-4 py-3">
                      <div>
                        <p className="text-[11px] font-medium text-[#cccccc]">Current focus time</p>
                        <p className="mt-1 font-mono text-[32px] font-semibold leading-none tracking-tight text-[#e6e6e6]">{formatTime(totalSeconds)}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-mono text-[12px] text-[#FF7628]">{formatTime(runningSubject?.seconds ?? totalSeconds)}</p>
                        <p className="mt-1 text-[9px] text-[#777777]">{runningSubject?.name ?? "STUDYING"}</p>
                      </div>
                    </section>
                    <LiveStudyRoom activeSubjectName={runningSubject?.name ?? null} onPause={() => setActiveSubject(null)} />
                  </>
                );
              })()}
            </>
          ) : (
          <>
          <section className="relative h-[150px] bg-[#151515]">
            <span className="absolute left-4 top-3 rounded-full bg-[#292929] px-2 py-0.5 text-[11px] text-[#aaaaaa]">
              D-?
            </span>

            <p className="absolute left-1/2 top-4 -translate-x-1/2 text-[13px] font-medium text-[#cccccc]">
              {todayLabel}
            </p>

            <button className="absolute right-3 top-3 text-[#aaaaaa] hover:text-white">
              <PanelRight size={17} />
            </button>

            <div className="absolute left-1/2 top-[62px] -translate-x-1/2 text-center">
              <p className="font-mono text-[38px] font-semibold tracking-tight text-[#e6e6e6] sm:text-[40px]">
                {formatTime(totalSeconds)}
              </p>
            </div>
          </section>

          {subjects.map((subject, index) => {
            const active = activeSubject === subject.id;

            return (
              <div key={subject.id} className="group relative flex h-[48px] items-center px-4 hover:bg-[#191919]">
                <button
                  onClick={() => setActiveSubject(active ? null : subject.id)}
                  className="flex h-[26px] w-[26px] shrink-0 items-center justify-center rounded-full text-[#111111]"
                  style={{ backgroundColor: subject.color }}
                >
                  {active
                    ? <Pause size={13} fill="currentColor" />
                    : <Play size={13} fill="currentColor" className="ml-0.5" />}
                </button>

                <span className="ml-2 text-[13px] font-medium text-[#c6c6c6]">
                  {subject.name}
                </span>

                <div className="flex-1" />

                <span className="font-mono text-[13px] tabular-nums text-[#c5c5c5]">
                  {formatTime(subject.seconds)}
                </span>

                <div className="relative ml-2">
                  <button
                    onClick={e => {
                      e.stopPropagation();
                      setMenuId(menuId === subject.id ? null : subject.id);
                    }}
                    className="flex h-8 w-5 items-center justify-center text-[#888888] hover:text-white"
                  >
                    <MoreVertical size={15} />
                  </button>

                  {menuId === subject.id && (
                    <div onClick={e => e.stopPropagation()} className="absolute right-0 top-8 z-20 w-[165px] rounded-md border border-[#353535] bg-[#222222] py-1 shadow-xl">
                      <button onClick={() => openEditSubject(subject)} className="flex w-full items-center gap-2 px-3 py-2 text-left text-[12px] hover:bg-[#333333]">
                        <Pencil size={13} /> Edit subject
                      </button>
                      <button onClick={() => moveSubject(index, -1)} disabled={index === 0} className="flex w-full items-center gap-2 px-3 py-2 text-left text-[12px] hover:bg-[#333333] disabled:opacity-30">
                        <ChevronUp size={13} /> Move up
                      </button>
                      <button onClick={() => moveSubject(index, 1)} disabled={index === subjects.length - 1} className="flex w-full items-center gap-2 px-3 py-2 text-left text-[12px] hover:bg-[#333333] disabled:opacity-30">
                        <ChevronDown size={13} /> Move down
                      </button>
                      <div className="my-1 border-t border-[#383838]" />
                      <button onClick={() => deleteSubject(subject.id)} className="flex w-full items-center gap-2 px-3 py-2 text-left text-[12px] text-red-400 hover:bg-[#333333]">
                        <Trash2 size={13} /> Delete subject
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          <div className="px-4 pt-[18px]">
            <button
              onClick={() => subjects.length ? openEditSubject(subjects[0]) : openAddSubject()}
              className="flex items-center gap-1.5 rounded-md bg-[#292929] px-2.5 py-1.5 text-[11px] text-[#aaaaaa] hover:bg-[#363636] hover:text-white"
            >
              <Pencil size={11} /> Edit subject
            </button>
          </div>
          </>
          )}
        </>
      )}

      {/* WEEKLY TO-DO PLANNER */}
      {selectedTab === "To-Do" && (
        <section className="w-full">
          <div className="px-3 pb-3 pt-3">
            <h1 className="text-[15px] font-semibold text-[#dddddd]">
              {selectedDate ? parseDate(selectedDate).toLocaleDateString("en-US", {
                weekday: "short", month: "2-digit", day: "2-digit"
              }) : ""}
            </h1>
          </div>

          <div className="grid grid-cols-7 border-b border-[#242424]">
            {week.map(day => {
              const key = dateKey(day);
              const selected = selectedDate === key;
              const isToday = todayKey === key;

              return (
                <button
                  key={key}
                  onClick={() => setSelectedDate(key)}
                  className="relative flex h-[60px] flex-col items-center justify-center gap-1 text-[10px] text-[#999999] hover:bg-[#1b1b1b]"
                >
                  <span className={selected ? "text-white" : ""}>{formatDay(day)}</span>
                  <span className={`flex h-[22px] w-[22px] items-center justify-center rounded-md ${
                    selected ? "bg-[#333333] text-white" : "bg-[#242424] text-[#777777]"
                  }`}>
                    {day.getDate()}
                  </span>
                  {(selected || isToday) && (
                    <span className="absolute bottom-0 h-[2px] w-5 rounded-full bg-white" />
                  )}
                </button>
              );
            })}
          </div>

          <div className="flex items-center justify-between px-3 py-2">
            <button onClick={() => changeWeek(-1)} className="text-[11px] text-[#888888] hover:text-white">
              ← Previous week
            </button>
            <button onClick={goToToday} className="text-[11px] text-[#aaaaaa] hover:text-white">
              Today
            </button>
            <button onClick={() => changeWeek(1)} className="text-[11px] text-[#888888] hover:text-white">
              Next week →
            </button>
          </div>

          <div className="w-full">
            {subjects.map(subject => (
              <div key={subject.id} className="grid min-h-[58px] grid-cols-[minmax(112px,1.2fr)_repeat(7,minmax(0,1fr))] border-b border-[#242424]">
                <div className="flex items-start gap-1.5 px-3 pt-3">
                  <span className="mt-[2px] h-[13px] w-[3px] shrink-0 rounded-full" style={{ backgroundColor: subject.color }} />
                  <span className="truncate text-[12px] font-medium text-[#c8c8c8]">{subject.name}</span>
                  <button onClick={() => openAddTask(subject.name)} className="ml-0.5 flex h-[15px] w-[15px] shrink-0 items-center justify-center rounded border border-[#777777] text-[#aaaaaa] hover:border-white hover:text-white">
                    <Plus size={11} />
                  </button>
                </div>

                {week.map(day => {
                  const key = dateKey(day);
                  const dayTasks = tasks.filter(t => t.subject === subject.name && t.deadline === key);

                  return (
                    <div key={key} onClick={() => setSelectedDate(key)} className={`min-w-0 border-l border-[#202020] px-1 py-1.5 ${selectedDate === key ? "bg-[#1a1a1a]" : ""}`}>
                      <div className="flex flex-col gap-1">
                        {dayTasks.map(task => (
                          <div key={task.id} className="group/task flex min-w-0 items-start gap-1 rounded-sm bg-[#252525] px-1 py-1">
                            <button onClick={e => { e.stopPropagation(); toggleTask(task.id); }} className={`mt-[1px] shrink-0 ${task.completed ? "text-[#D97736]" : "text-[#777777]"}`}>
                              <Check size={10} />
                            </button>
                            <button onClick={e => { e.stopPropagation(); openEditTask(task); }} className={`min-w-0 break-words text-left text-[9px] leading-[13px] ${task.completed ? "text-[#777777] line-through" : "text-[#cccccc]"}`}>
                              {task.title}
                            </button>
                            <button onClick={e => { e.stopPropagation(); deleteTask(task.id); }} className="ml-auto hidden shrink-0 text-[#777777] hover:text-red-400 group-hover/task:block">
                              <X size={10} />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* MONTHLY CALENDAR */}
      {selectedTab === "Calendar" && (
        <section className="w-full">
          {/* Month navigation */}
          <div className="flex items-center justify-between px-3 py-3">
            <h1 className="text-[15px] font-semibold text-[#dddddd]">
              {calendarStart?.toLocaleDateString("en-US", { month: "short" }) ?? ""}
            </h1>

            <div className="flex items-center gap-3">
              <button onClick={goToCalendarToday} className="text-[11px] text-[#888888] hover:text-white">
                Today
              </button>
              <button onClick={() => changeCalendarMonth(-1)} className="text-[#888888] hover:text-white">
                <ChevronLeft size={16} />
              </button>
              <button onClick={() => changeCalendarMonth(1)} className="text-[#888888] hover:text-white">
                <ChevronRight size={16} />
              </button>
            </div>
          </div>

          {/* Two continuous months */}
          {calendarMonths.map((month, monthIndex) => {
            const year = month.getFullYear();
            const monthNumber = month.getMonth();
            const weeks = getMonthWeeks(year, monthNumber);

            return (
              <div key={`${year}-${monthNumber}`} className="w-full">
                {monthIndex > 0 && (
                  <div className="border-b border-[#242424] px-3 py-3">
                    <h2 className="text-[14px] font-semibold text-[#dddddd]">
                      {monthName(month)}
                    </h2>
                  </div>
                )}

                {/* Weekday headings */}
                <div className="grid grid-cols-7 border-b border-[#242424]">
                  {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day, i) => (
                    <div key={day} className={`flex h-[32px] items-center justify-center text-[10px] ${
                      i >= 5 ? "text-[#777777]" : "text-[#aaaaaa]"
                    }`}>
                      {day}
                    </div>
                  ))}
                </div>

                {/* Calendar week rows */}
                {weeks.map((days, weekIndex) => (
                  <div key={weekIndex} className="grid grid-cols-7 border-b border-[#242424]">
                    {days.map((day, dayIndex) => {
                      const key = dateKey(day);
                      const inMonth = day.getMonth() === monthNumber;
                      const isToday = key === todayKey;
                      const selected = key === calendarSelectedDate;

                      const dayTasks = tasks.filter(t => t.deadline === key);

                      return (
                        <button
                          key={key}
                          onClick={() => openCalendarDate(key)}
                          className={`relative flex min-h-[74px] min-w-0 flex-col items-stretch px-1.5 pt-2 text-left transition hover:bg-[#1c1c1c] sm:min-h-[90px] sm:px-2 ${
                            !inMonth ? "opacity-25" : ""
                          } ${selected ? "bg-[#191919]" : ""}`}
                        >
                          <div className="flex justify-center">
                            <span className={`flex h-[20px] min-w-[20px] items-center justify-center rounded-full text-[10px] ${
                              isToday
                                ? "bg-[#eeeeee] font-semibold text-[#111111]"
                                : selected
                                ? "bg-[#333333] text-white"
                                : dayIndex >= 5
                                ? "text-[#777777]"
                                : "text-[#c5c5c5]"
                            }`}>
                              {day.getDate()}
                            </span>
                          </div>

                          {/* Task bars */}
                          <div className="mt-1 flex min-w-0 flex-col gap-[3px]">
                            {dayTasks.slice(0, 2).map(task => {
                              const subject = subjects.find(s => s.name === task.subject);
                              const barColor = subject?.color ?? "#D97736";

                              return (
                                <div
                                  key={task.id}
                                  onClick={e => {
                                    e.stopPropagation();
                                    openEditTask(task);
                                  }}
                                  className="flex h-[13px] min-w-0 items-center gap-1 overflow-hidden rounded-[3px] px-1 text-[8px] sm:text-[9px]"
                                  style={{
                                    backgroundColor: `${barColor}30`,
                                    color: barColor,
                                  }}
                                >
                                  {task.completed && <Check size={9} className="shrink-0" />}
                                  <span className={`truncate ${task.completed ? "line-through opacity-60" : ""}`}>
                                    {task.title}
                                  </span>
                                </div>
                              );
                            })}

                            {dayTasks.length > 2 && (
                              <span className="px-1 text-[8px] text-[#888888]">
                                +{dayTasks.length - 2} more
                              </span>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                ))}
              </div>
            );
          })}

          {/* Calendar footer */}
          <div className="flex items-center justify-between px-3 py-3 text-[10px] text-[#777777]">
            <span>{tasks.length} scheduled tasks</span>
            <button
              onClick={() => openCalendarDate(calendarSelectedDate || todayKey)}
              className="flex items-center gap-1.5 rounded-md bg-[#292929] px-2.5 py-1.5 text-[#bbbbbb] hover:bg-[#383838] hover:text-white"
            >
              <Plus size={12} /> Add task
            </button>
          </div>
        </section>
      )}

      {/* GROUPS */}
      {selectedTab === "Groups" && <GroupsPanel />}

      {/* SUBJECT MODAL */}
      {subjectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
          <div className="w-full max-w-[360px] rounded-lg border border-[#383838] bg-[#202020] p-5 shadow-2xl">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-[14px] font-medium text-white">
                {editingSubjectId === null ? "Add subject" : "Edit subject"}
              </h2>
              <button onClick={() => setSubjectModal(false)} className="text-[#888888] hover:text-white">
                <X size={17} />
              </button>
            </div>

            <label className="mb-2 block text-[11px] text-[#999999]">SUBJECT NAME</label>
            <input
              autoFocus
              value={subjectName}
              onChange={e => setSubjectName(e.target.value)}
              maxLength={30}
              placeholder="Subject name"
              className="mb-5 w-full rounded border border-[#3a3a3a] bg-[#151515] px-3 py-2.5 text-[13px] text-white outline-none focus:border-[#D97736]"
            />

            <label className="mb-3 block text-[11px] text-[#999999]">SUBJECT COLOR</label>
            <div className="mb-5 flex flex-wrap gap-3">
              {COLORS.map(c => (
                <button
                  key={c}
                  onClick={() => setSubjectColor(c)}
                  className={`h-6 w-6 rounded-full ${subjectColor === c ? "ring-2 ring-white ring-offset-2 ring-offset-[#202020]" : ""}`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>

            <label className="mb-2 block text-[11px] text-[#999999]">DAILY TARGET (HOURS)</label>
            <input
              type="number"
              min="0"
              max="24"
              step="0.5"
              value={target}
              onChange={e => setTarget(e.target.value)}
              className="mb-6 w-full rounded border border-[#3a3a3a] bg-[#151515] px-3 py-2.5 text-[13px] text-white outline-none focus:border-[#D97736]"
            />

            <button
              onClick={saveSubject}
              disabled={!subjectName.trim() || !Number.isFinite(Number(target)) || Number(target) < 0 || Number(target) > 24}
              className="w-full rounded bg-[#D97736] py-2.5 text-[12px] font-medium text-white hover:bg-[#c56a30] disabled:opacity-40"
            >
              Save
            </button>
          </div>
        </div>
      )}

      {/* TASK MODAL */}
      {taskModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
          <div className="w-full max-w-[360px] rounded-lg border border-[#383838] bg-[#202020] p-5 shadow-2xl">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-[14px] font-medium text-white">
                {editingTaskId === null ? "Add task" : "Edit task"}
              </h2>
              <button onClick={() => setTaskModal(false)} className="text-[#888888] hover:text-white">
                <X size={17} />
              </button>
            </div>

            <label className="mb-2 block text-[11px] text-[#999999]">TASK</label>
            <input
              autoFocus
              value={taskTitle}
              onChange={e => setTaskTitle(e.target.value)}
              onKeyDown={e => e.key === "Enter" && saveTask()}
              maxLength={100}
              placeholder="What do you need to do?"
              className="mb-5 w-full rounded border border-[#3a3a3a] bg-[#151515] px-3 py-2.5 text-[13px] text-white outline-none focus:border-[#D97736]"
            />

            <label className="mb-2 block text-[11px] text-[#999999]">SUBJECT</label>
            <select
              value={taskSubject}
              onChange={e => setTaskSubject(e.target.value)}
              className="mb-5 w-full rounded border border-[#3a3a3a] bg-[#151515] px-3 py-2.5 text-[13px] text-white outline-none focus:border-[#D97736]"
            >
              <option value="">No subject</option>
              {subjects.map(s => (
                <option key={s.id} value={s.name}>{s.name}</option>
              ))}
            </select>

            <label className="mb-2 block text-[11px] text-[#999999]">DATE</label>
            <input
              type="date"
              value={taskDate}
              onChange={e => setTaskDate(e.target.value)}
              className="mb-6 w-full rounded border border-[#3a3a3a] bg-[#151515] px-3 py-2.5 text-[13px] text-white outline-none focus:border-[#D97736]"
            />

            <button
              onClick={saveTask}
              disabled={!taskTitle.trim() || !taskDate}
              className="w-full rounded bg-[#D97736] py-2.5 text-[12px] font-medium text-white hover:bg-[#c56a30] disabled:opacity-40"
            >
              Save task
            </button>
          </div>
        </div>
      )}

      {/* CALENDAR DATE MODAL */}
      {calendarModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
          <div className="w-full max-w-[390px] rounded-lg border border-[#383838] bg-[#202020] p-5 shadow-2xl">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h2 className="text-[14px] font-medium text-white">
                  {calendarSelectedDate
                    ? parseDate(calendarSelectedDate).toLocaleDateString("en-US", {
                        weekday: "long",
                        month: "long",
                        day: "numeric",
                      })
                    : "Selected date"}
                </h2>
                <p className="mt-1 text-[11px] text-[#777777]">
                  Tasks scheduled for this day
                </p>
              </div>
              <button onClick={() => setCalendarModal(false)} className="text-[#888888] hover:text-white">
                <X size={17} />
              </button>
            </div>

            <div className="mb-5 max-h-[240px] space-y-2 overflow-y-auto">
              {tasks.filter(t => t.deadline === calendarSelectedDate).map(task => {
                const subject = subjects.find(s => s.name === task.subject);

                return (
                  <div key={task.id} className="flex items-center gap-2 rounded bg-[#292929] p-2.5">
                    <button onClick={() => toggleTask(task.id)} className={task.completed ? "text-[#D97736]" : "text-[#777777]"}>
                      <Check size={14} />
                    </button>
                    <button onClick={() => { setCalendarModal(false); openEditTask(task); }} className={`min-w-0 flex-1 truncate text-left text-[12px] ${task.completed ? "text-[#777777] line-through" : "text-[#dddddd]"}`}>
                      {task.title}
                    </button>
                    {subject && (
                      <span className="h-2 w-2 rounded-full" style={{ backgroundColor: subject.color }} />
                    )}
                    <button onClick={() => deleteTask(task.id)} className="text-[#777777] hover:text-red-400">
                      <Trash2 size={13} />
                    </button>
                  </div>
                );
              })}

              {tasks.filter(t => t.deadline === calendarSelectedDate).length === 0 && (
                <p className="py-6 text-center text-[12px] text-[#777777]">
                  No tasks scheduled for this day.
                </p>
              )}
            </div>

            <button
              onClick={() => {
                setCalendarModal(false);
                openAddTask("", calendarSelectedDate);
              }}
              className="flex w-full items-center justify-center gap-2 rounded bg-[#D97736] py-2.5 text-[12px] font-medium text-white hover:bg-[#c56a30]"
            >
              <Plus size={14} /> Add task
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
