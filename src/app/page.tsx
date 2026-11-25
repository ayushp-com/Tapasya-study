"use client";

import { useEffect, useRef, useState } from "react";
import {
  Timer, CheckSquare, CalendarDays, Users, Plus, Play, Pause,
  MoreVertical, Pencil, Trash2, ChevronUp, ChevronDown, X,
  PanelRight, Check, ChevronLeft, ChevronRight,
  UserRound, LogOut, Globe2, Share2, Download, Sun, Moon, Contrast,
  BarChart3, Activity, BookOpen, Coffee, Clock3, RefreshCw, MessageSquare
} from "lucide-react";
import GroupsPanel from "@/components/groups/GroupsPanel";
import LiveStudyRoom from "@/components/LiveStudyRoom";
import CommunityPanel from "@/components/community/CommunityPanel";
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

type WorldStudySession = {
  id: string;
  user_id: string;
  username: string;
  subject_name: string;
  started_at: string;
  ended_at: string | null;
};

const supabase = createClient();

const COLORS = [
  "#FF7628", "#2196F3", "#F5E82E", "#22C55E",
  "#A78BFA", "#EC4899", "#14B8A6", "#F87171"
];

const INITIAL_SUBJECTS: Subject[] = [
  { id: 1, name: "PHYSICS", color: "#2196F3", seconds: 0, targetHours: 1 },
  { id: 2, name: "CHEMISTRY", color: "#22C55E", seconds: 0, targetHours: 1 },
  { id: 3, name: "MATHS", color: "#FF7628", seconds: 0, targetHours: 2 },
];

const EXAM_DEFAULT_SUBJECTS: Record<string, { name: string; color: string; targetHours: number }[]> = {
  "JEE": [
    { name: "PHYSICS", color: "#2196F3", targetHours: 1 },
    { name: "CHEMISTRY", color: "#22C55E", targetHours: 1 },
    { name: "MATHEMATICS", color: "#FF7628", targetHours: 2 },
  ],
  "NEET": [
    { name: "PHYSICS", color: "#2196F3", targetHours: 1 },
    { name: "CHEMISTRY", color: "#22C55E", targetHours: 1 },
    { name: "BIOLOGY", color: "#A78BFA", targetHours: 2 },
  ],
  "UPSC": [
    { name: "POLITY", color: "#2196F3", targetHours: 1 },
    { name: "HISTORY", color: "#F59E0B", targetHours: 1 },
    { name: "GEOGRAPHY", color: "#22C55E", targetHours: 1 },
    { name: "ECONOMY", color: "#A78BFA", targetHours: 1 },
    { name: "ENVIRONMENT", color: "#14B8A6", targetHours: 1 },
    { name: "CURRENT AFFAIRS", color: "#EC4899", targetHours: 1 },
  ],
  "GATE": [
    { name: "ENGINEERING MATHEMATICS", color: "#2196F3", targetHours: 1 },
    { name: "GENERAL APTITUDE", color: "#22C55E", targetHours: 1 },
    { name: "CORE SUBJECT", color: "#FF7628", targetHours: 2 },
  ],
  "CAT": [
    { name: "QUANTITATIVE APTITUDE", color: "#2196F3", targetHours: 1 },
    { name: "VARC", color: "#22C55E", targetHours: 1 },
    { name: "DILR", color: "#FF7628", targetHours: 1 },
  ],
  "CUET": [
    { name: "LANGUAGE", color: "#2196F3", targetHours: 1 },
    { name: "DOMAIN SUBJECTS", color: "#22C55E", targetHours: 2 },
    { name: "GENERAL TEST", color: "#FF7628", targetHours: 1 },
  ],
  "SSC": [
    { name: "QUANTITATIVE APTITUDE", color: "#2196F3", targetHours: 1 },
    { name: "REASONING", color: "#22C55E", targetHours: 1 },
    { name: "ENGLISH", color: "#FF7628", targetHours: 1 },
    { name: "GENERAL AWARENESS", color: "#A78BFA", targetHours: 1 },
  ],
  "Banking": [
    { name: "QUANTITATIVE APTITUDE", color: "#2196F3", targetHours: 1 },
    { name: "REASONING", color: "#22C55E", targetHours: 1 },
    { name: "ENGLISH", color: "#FF7628", targetHours: 1 },
    { name: "BANKING AWARENESS", color: "#A78BFA", targetHours: 1 },
  ],
  "College / University": [
    { name: "SUBJECT 1", color: "#2196F3", targetHours: 1 },
    { name: "SUBJECT 2", color: "#22C55E", targetHours: 1 },
    { name: "SUBJECT 3", color: "#FF7628", targetHours: 1 },
  ],
  "Other": [
    { name: "SUBJECT 1", color: "#2196F3", targetHours: 1 },
    { name: "SUBJECT 2", color: "#22C55E", targetHours: 1 },
    { name: "SUBJECT 3", color: "#FF7628", targetHours: 1 },
  ],
};

function createDefaultSubjects(exam: string): Subject[] {
  return (EXAM_DEFAULT_SUBJECTS[exam] ?? EXAM_DEFAULT_SUBJECTS.Other).map((subject, index) => ({
    id: index + 1,
    ...subject,
    seconds: 0,
  }));
}

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

// ===== SHARE CARD (story-size 1080 x 1920) =====
type ShareSubject = {
  name: string;
  color: string;
  seconds: number;
  targetHours: number;
};

type ShareThemeId = "ember" | "ocean" | "neon";

type Theme = {
  id: ShareThemeId;
  label: string;
  accent: string;
  accent2: string;
  bg: string;
};

const SHARE_THEMES: Theme[] = [
  { id: "ember", label: "Ember", accent: "#FF7628", accent2: "#FFC14D", bg: "#1a0d07" },
  { id: "ocean", label: "Ocean", accent: "#2196F3", accent2: "#5EEAD4", bg: "#07121d" },
  { id: "neon", label: "Neon", accent: "#A78BFA", accent2: "#F472B6", bg: "#150b21" },
];

type ShareCardInput = {
  username: string;
  subjects: ShareSubject[];
  theme?: ShareThemeId;
  siteLabel?: string;
};

const W = 1080;
const H = 1920;
const SANS = "ui-sans-serif, -apple-system, 'Segoe UI', Roboto, sans-serif";
const MONO = "ui-monospace, Menlo, Consolas, monospace";

// Mascot "Tapi" levels, driven by total study time.
const LEVELS = [
  { min: 0, rank: "BOOTING UP", bubble: "5 more mins?" },
  { min: 1200, rank: "WARMING UP", bubble: "warming up!" },
  { min: 3600, rank: "LOCKED IN", bubble: "locked in." },
  { min: 3 * 3600, rank: "ON FIRE", bubble: "no days off." },
  { min: 6 * 3600, rank: "ABSOLUTE BEAST", bubble: "built different." },
];

function getLevel(totalSeconds: number) {
  let level = 0;
  LEVELS.forEach((l, i) => {
    if (totalSeconds >= l.min) level = i;
  });
  return level;
}

function hexA(hex: string, a: number) {
  const h = hex.replace("#", "");
  const n = parseInt(h.length === 3 ? h.split("").map(c => c + c).join("") : h, 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
}

function setSpacing(ctx: CanvasRenderingContext2D, px: number) {
  (ctx as unknown as { letterSpacing: string }).letterSpacing = `${px}px`;
}

function rr(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  if (typeof ctx.roundRect === "function") ctx.roundRect(x, y, w, h, r);
  else ctx.rect(x, y, w, h);
}

function fitText(ctx: CanvasRenderingContext2D, text: string, maxW: number) {
  if (ctx.measureText(text).width <= maxW) return text;
  let t = text;
  while (t.length > 1 && ctx.measureText(t + "…").width > maxW) t = t.slice(0, -1);
  return t + "…";
}

function flamePath(ctx: CanvasRenderingContext2D, cx: number, cy: number, s: number) {
  ctx.beginPath();
  ctx.moveTo(cx, cy - s * 0.95);
  ctx.bezierCurveTo(cx + s * 0.25, cy - s * 0.55, cx + s * 0.85, cy - s * 0.25, cx + s * 0.8, cy + s * 0.25);
  ctx.bezierCurveTo(cx + s * 0.75, cy + s * 0.75, cx + s * 0.35, cy + s * 0.95, cx, cy + s * 0.95);
  ctx.bezierCurveTo(cx - s * 0.35, cy + s * 0.95, cx - s * 0.75, cy + s * 0.75, cx - s * 0.8, cy + s * 0.25);
  ctx.bezierCurveTo(cx - s * 0.85, cy - s * 0.25, cx - s * 0.25, cy - s * 0.55, cx, cy - s * 0.95);
  ctx.closePath();
}

function star(ctx: CanvasRenderingContext2D, x: number, y: number, r: number) {
  ctx.beginPath();
  for (let i = 0; i < 8; i++) {
    const a = (Math.PI / 4) * i - Math.PI / 2;
    const rad = i % 2 === 0 ? r : r * 0.3;
    const px = x + Math.cos(a) * rad;
    const py = y + Math.sin(a) * rad;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
}

// "Tapi" - a little flame spirit whose mood depends on study time.
function drawMascot(ctx: CanvasRenderingContext2D, cx: number, cy: number, s: number, level: number, theme: Theme) {
  // ground shadow
  ctx.fillStyle = "rgba(0,0,0,0.45)";
  ctx.beginPath();
  ctx.ellipse(cx, cy + s * 1.12, s * 0.7, s * 0.12, 0, 0, Math.PI * 2);
  ctx.fill();

  // sparkles around (more sparkles = higher level)
  const spots = [
    [-1.35, -0.7, 26], [1.4, -0.2, 30], [-1.2, 0.5, 18], [1.25, 0.8, 22],
    [-0.9, -1.1, 16], [0.95, -1.05, 20], [-1.55, -0.1, 14], [1.6, 0.4, 16],
  ];
  const count = Math.min(spots.length, 2 + level * 2);
  for (let i = 0; i < count; i++) {
    const [dx, dy, r] = spots[i];
    ctx.fillStyle = i % 2 === 0 ? theme.accent2 : "#ffffff";
    ctx.globalAlpha = 0.9;
    star(ctx, cx + dx * s * 0.8, cy + dy * s * 0.8, r);
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  // body with glow
  ctx.save();
  ctx.shadowColor = hexA(theme.accent, 0.85);
  ctx.shadowBlur = 70 + level * 15;
  const body = ctx.createLinearGradient(cx, cy - s, cx, cy + s);
  body.addColorStop(0, theme.accent2);
  body.addColorStop(1, theme.accent);
  ctx.fillStyle = body;
  flamePath(ctx, cx, cy, s);
  ctx.fill();
  ctx.restore();

  // inner highlight flame
  ctx.fillStyle = "rgba(255,255,255,0.22)";
  flamePath(ctx, cx, cy + s * 0.25, s * 0.6);
  ctx.fill();

  const ink = "#2a1208";
  const ey = cy + s * 0.12;
  const ex = s * 0.27;
  const er = s * 0.14;

  if (level === 0) {
    // sleepy closed eyes
    ctx.strokeStyle = ink;
    ctx.lineWidth = s * 0.05;
    ctx.lineCap = "round";
    [-1, 1].forEach(side => {
      ctx.beginPath();
      ctx.arc(cx + side * ex, ey, er * 0.85, 0.15 * Math.PI, 0.85 * Math.PI);
      ctx.stroke();
    });
    ctx.fillStyle = "rgba(255,255,255,0.85)";
    ctx.font = `800 ${Math.round(s * 0.28)}px ${SANS}`;
    ctx.textAlign = "left";
    ctx.fillText("z", cx + s * 0.62, cy - s * 0.5);
    ctx.font = `800 ${Math.round(s * 0.2)}px ${SANS}`;
    ctx.fillText("z", cx + s * 0.88, cy - s * 0.72);
    ctx.textAlign = "center";
  } else if (level <= 2) {
    [-1, 1].forEach(side => {
      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.arc(cx + side * ex, ey, er, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = ink;
      ctx.beginPath();
      ctx.arc(cx + side * ex + side * -er * 0.1, ey + er * 0.1, er * 0.55, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.arc(cx + side * ex - er * 0.15, ey - er * 0.15, er * 0.2, 0, Math.PI * 2);
      ctx.fill();
    });
    if (level === 2) {
      // determined brows
      ctx.strokeStyle = ink;
      ctx.lineWidth = s * 0.055;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(cx - ex - er, ey - er * 1.8);
      ctx.lineTo(cx - ex + er, ey - er * 1.3);
      ctx.moveTo(cx + ex + er, ey - er * 1.8);
      ctx.lineTo(cx + ex - er, ey - er * 1.3);
      ctx.stroke();
    }
  } else {
    // sunglasses = flex mode
    ctx.fillStyle = "#0a0a0a";
    [-1, 1].forEach(side => {
      rr(ctx, cx + side * ex - er * 1.4, ey - er * 1.0, er * 2.8, er * 2.0, er * 0.7);
      ctx.fill();
    });
    ctx.strokeStyle = "#0a0a0a";
    ctx.lineWidth = s * 0.04;
    ctx.beginPath();
    ctx.moveTo(cx - ex + er * 1.4, ey - er * 0.2);
    ctx.lineTo(cx + ex - er * 1.4, ey - er * 0.2);
    ctx.stroke();
    ctx.strokeStyle = "rgba(255,255,255,0.55)";
    ctx.lineWidth = s * 0.03;
    ctx.lineCap = "round";
    [-1, 1].forEach(side => {
      ctx.beginPath();
      ctx.moveTo(cx + side * ex - er * 0.7, ey - er * 0.6);
      ctx.lineTo(cx + side * ex - er * 0.2, ey - er * 0.6);
      ctx.stroke();
    });
  }

  // cheeks
  if (level > 0) {
    ctx.fillStyle = "rgba(255,80,110,0.35)";
    [-1, 1].forEach(side => {
      ctx.beginPath();
      ctx.ellipse(cx + side * (ex + er * 1.1), ey + er * 2.1, er * 0.7, er * 0.4, 0, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  // mouth
  const my = ey + er * 2.5;
  if (level === 0) {
    ctx.fillStyle = ink;
    ctx.beginPath();
    ctx.ellipse(cx, my, s * 0.045, s * 0.055, 0, 0, Math.PI * 2);
    ctx.fill();
  } else if (level <= 2) {
    ctx.strokeStyle = ink;
    ctx.lineWidth = s * 0.05;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.arc(cx, my - s * 0.07, s * 0.13, 0.15 * Math.PI, 0.85 * Math.PI);
    ctx.stroke();
  } else {
    ctx.fillStyle = ink;
    ctx.beginPath();
    ctx.arc(cx, my - s * 0.09, s * 0.17, 0, Math.PI);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "#ff6b81";
    ctx.beginPath();
    ctx.ellipse(cx, my + s * 0.04, s * 0.07, s * 0.04, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  // crown for the top level
  if (level >= 4) {
    const w = s * 0.34;
    const h = s * 0.3;
    const bx = cx;
    const by = cy - s * 0.86;
    const pts: [number, number][] = [
      [-w, 0], [-w, -h], [-w / 2, -h * 0.45], [0, -h * 1.2], [w / 2, -h * 0.45], [w, -h], [w, 0],
    ];
    ctx.fillStyle = "#FFD54A";
    ctx.strokeStyle = "#8a5a00";
    ctx.lineWidth = 5;
    ctx.lineJoin = "round";
    ctx.beginPath();
    pts.forEach(([px, py], i) => {
      if (i === 0) ctx.moveTo(bx + px, by + py);
      else ctx.lineTo(bx + px, by + py);
    });
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }
}

function drawBubble(ctx: CanvasRenderingContext2D, text: string, mascotX: number, mascotY: number, s: number) {
  ctx.font = `800 34px ${SANS}`;
  const bw = ctx.measureText(text).width + 60;
  const bh = 78;
  let bx = mascotX + s * 0.95;
  bx = Math.min(bx, W - 70 - bw);
  const by = mascotY - s * 1.0;

  ctx.save();
  ctx.translate(bx + bw / 2, by + bh / 2);
  ctx.rotate(-0.05);
  ctx.translate(-(bx + bw / 2), -(by + bh / 2));

  ctx.fillStyle = "#ffffff";
  rr(ctx, bx, by, bw, bh, 28);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(bx + 22, by + bh - 2);
  ctx.lineTo(bx + 72, by + bh - 2);
  ctx.lineTo(bx + 2, by + bh + 38);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = "#151515";
  ctx.textAlign = "center";
  ctx.fillText(text, bx + bw / 2, by + bh / 2 + 12);
  ctx.restore();
}

function drawShareCard(input: ShareCardInput): HTMLCanvasElement | null {
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  const theme = SHARE_THEMES.find(t => t.id === input.theme) ?? SHARE_THEMES[0];
  const subjects = input.subjects;
  const totalSeconds = subjects.reduce((sum, s) => sum + s.seconds, 0);
  const level = getLevel(totalSeconds);
  const info = LEVELS[level];

  // ---------- background ----------
  const bg = ctx.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0, theme.bg);
  bg.addColorStop(1, "#070707");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  const glow = ctx.createRadialGradient(W / 2, 600, 20, W / 2, 600, 760);
  glow.addColorStop(0, hexA(theme.accent, 0.3));
  glow.addColorStop(1, hexA(theme.accent, 0));
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, W, H);

  const glow2 = ctx.createRadialGradient(W / 2, H, 10, W / 2, H, 700);
  glow2.addColorStop(0, hexA(theme.accent2, 0.14));
  glow2.addColorStop(1, hexA(theme.accent2, 0));
  ctx.fillStyle = glow2;
  ctx.fillRect(0, 0, W, H);

  ctx.fillStyle = "rgba(255,255,255,0.05)";
  for (let x = 30; x < W; x += 60) {
    for (let y = 30; y < H; y += 60) {
      ctx.beginPath();
      ctx.arc(x, y, 2, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  ctx.textAlign = "center";

  // ---------- header ----------
  setSpacing(ctx, 10);
  ctx.fillStyle = theme.accent;
  ctx.font = `800 34px ${SANS}`;
  ctx.fillText("TAPASYA", W / 2, 292);
  setSpacing(ctx, 0);

  ctx.fillStyle = "#8a8a8a";
  ctx.font = `500 28px ${SANS}`;
  ctx.fillText(
    new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" }),
    W / 2,
    338
  );

  // ---------- mascot + bubble ----------
  const mx = W / 2;
  const my = 560;
  const ms = 135;
  drawMascot(ctx, mx, my, ms, level, theme);
  drawBubble(ctx, info.bubble, mx, my, ms);
  ctx.textAlign = "center";

  // ---------- rank pill ----------
  ctx.font = `800 34px ${SANS}`;
  setSpacing(ctx, 6);
  const pillW = ctx.measureText(info.rank).width + 90;
  const pillX = (W - pillW) / 2;
  const pillY = 748;
  const pillGrad = ctx.createLinearGradient(pillX, 0, pillX + pillW, 0);
  pillGrad.addColorStop(0, theme.accent);
  pillGrad.addColorStop(1, theme.accent2);
  ctx.fillStyle = pillGrad;
  rr(ctx, pillX, pillY, pillW, 66, 33);
  ctx.fill();
  ctx.fillStyle = "#1a0d05";
  ctx.fillText(info.rank, W / 2 + 3, pillY + 45);
  setSpacing(ctx, 0);

  // ---------- username + time ----------
  ctx.fillStyle = "#e6e6e6";
  ctx.font = `700 46px ${SANS}`;
  ctx.fillText(fitText(ctx, `@${input.username || "student"}`, 800), W / 2, 900);

  ctx.save();
  ctx.shadowColor = hexA(theme.accent, 0.55);
  ctx.shadowBlur = 40;
  ctx.fillStyle = "#ffffff";
  ctx.font = `800 170px ${MONO}`;
  ctx.fillText(formatTime(totalSeconds), W / 2, 1060);
  ctx.restore();

  ctx.fillStyle = "#8a8a8a";
  ctx.font = `500 32px ${SANS}`;
  ctx.fillText("total focused study time", W / 2, 1112);

  // ---------- stat chips ----------
  const totalTargetSeconds = subjects.reduce((sum, s) => sum + (s.targetHours || 0) * 3600, 0);
  const goalPct = totalTargetSeconds > 0 ? Math.min(999, Math.round((totalSeconds / totalTargetSeconds) * 100)) : null;
  const studied = subjects.filter(s => s.seconds > 0);
  const top = [...studied].sort((a, b) => b.seconds - a.seconds)[0];

  const chips = [
    { value: goalPct === null ? "—" : `${goalPct}%`, label: "DAILY GOAL", color: theme.accent2 },
    { value: String(studied.length), label: "SUBJECTS", color: "#ffffff" },
    { value: top ? top.name : "—", label: "MVP SUBJECT", color: "#ffffff" },
  ];
  const chipW = 293;
  const chipH = 118;
  const chipY = 1170;
  chips.forEach((chip, i) => {
    const x = 80 + i * (chipW + 20);
    ctx.fillStyle = "rgba(255,255,255,0.05)";
    rr(ctx, x, chipY, chipW, chipH, 24);
    ctx.fill();
    ctx.strokeStyle = "rgba(255,255,255,0.1)";
    ctx.lineWidth = 2;
    rr(ctx, x, chipY, chipW, chipH, 24);
    ctx.stroke();

    ctx.fillStyle = chip.color;
    ctx.font = `800 48px ${SANS}`;
    ctx.fillText(fitText(ctx, chip.value, chipW - 36), x + chipW / 2, chipY + 62);

    setSpacing(ctx, 3);
    ctx.fillStyle = "#808080";
    ctx.font = `700 21px ${SANS}`;
    ctx.fillText(chip.label, x + chipW / 2 + 1, chipY + 97);
    setSpacing(ctx, 0);
  });

  // ---------- subject bars ----------
  const rows = [...studied].sort((a, b) => b.seconds - a.seconds).slice(0, 3);
  if (rows.length === 0) {
    ctx.fillStyle = "#777777";
    ctx.font = `500 34px ${SANS}`;
    ctx.fillText("Start a timer to build your card", W / 2, 1440);
  } else {
    const maxSeconds = rows[0].seconds;
    rows.forEach((subject, i) => {
      const y = 1366 + i * 92;
      ctx.textAlign = "left";
      ctx.fillStyle = "#e0e0e0";
      ctx.font = `700 30px ${SANS}`;
      ctx.fillText(fitText(ctx, subject.name, 560), 80, y);

      ctx.textAlign = "right";
      ctx.fillStyle = "#bdbdbd";
      ctx.font = `600 30px ${MONO}`;
      ctx.fillText(formatTime(subject.seconds), W - 80, y);

      ctx.fillStyle = "rgba(255,255,255,0.08)";
      rr(ctx, 80, y + 20, W - 160, 16, 8);
      ctx.fill();

      ctx.save();
      ctx.shadowColor = hexA(subject.color, 0.6);
      ctx.shadowBlur = 16;
      ctx.fillStyle = subject.color;
      rr(ctx, 80, y + 20, Math.max(16, ((W - 160) * subject.seconds) / maxSeconds), 16, 8);
      ctx.fill();
      ctx.restore();
    });
    ctx.textAlign = "center";
  }

  // ---------- footer / CTA ----------
  ctx.textAlign = "center";
  ctx.fillStyle = "#b5b5b5";
  ctx.font = `600 32px ${SANS}`;
  ctx.fillText("Don't study alone. Study together.", W / 2, 1660);

  const label = (input.siteLabel || "tapasya").toUpperCase();
  ctx.font = `800 30px ${SANS}`;
  setSpacing(ctx, 4);
  const urlW = ctx.measureText(label).width + 80;
  const urlX = (W - urlW) / 2;
  const urlGrad = ctx.createLinearGradient(urlX, 0, urlX + urlW, 0);
  urlGrad.addColorStop(0, theme.accent);
  urlGrad.addColorStop(1, theme.accent2);
  ctx.fillStyle = urlGrad;
  rr(ctx, urlX, 1696, urlW, 64, 32);
  ctx.fill();
  ctx.fillStyle = "#1a0d05";
  ctx.fillText(label, W / 2 + 2, 1738);
  setSpacing(ctx, 0);

  return canvas;
}

export default function Home() {
  const [subjects, setSubjects] = useState<Subject[]>(INITIAL_SUBJECTS);
  const [subjectsLoaded, setSubjectsLoaded] = useState(false);
  const savedSubjectConfigRef = useRef("");
  const [tasks, setTasks] = useState<Task[]>([]);
  const [activeSubject, setActiveSubject] = useState<number | null>(null);
  const [activeSessionStartedAt, setActiveSessionStartedAt] = useState<string | null>(null);
  const studySessionRunRef = useRef(0);
  const hasInitializedStudySessionRef = useRef(false);

  const [ready, setReady] = useState(false);
  const [authReady, setAuthReady] = useState(false);
  const [todayLabel, setTodayLabel] = useState("");
  const [todayKey, setTodayKey] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [week, setWeek] = useState<Date[]>([]);

  const [calendarStart, setCalendarStart] = useState<Date | null>(null);
  const [calendarSelectedDate, setCalendarSelectedDate] = useState("");
  const [calendarModal, setCalendarModal] = useState(false);

  const [selectedTab, setSelectedTab] = useState("Timer");
  const [worldActivityPeriod, setWorldActivityPeriod] = useState<"today" | "yesterday">("today");
  const [menuId, setMenuId] = useState<number | null>(null);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [appTheme, setAppTheme] = useState<"dark" | "light" | "amoled">("amoled");
  const [themeReady, setThemeReady] = useState(false);
  const [profileUsername, setProfileUsername] = useState("");
  const [profileEmail, setProfileEmail] = useState("");
  const [loggingOut, setLoggingOut] = useState(false);
  const [breakDialog, setBreakDialog] = useState<{ mode: "stop" | "logout" | "recovery"; startedAt: string | null } | null>(null);
  const [selectedBreakReason, setSelectedBreakReason] = useState("Short break");
  const [breakOtherText, setBreakOtherText] = useState("");
  const [breakSaving, setBreakSaving] = useState(false);

  // Share study card
  const [shareOpen, setShareOpen] = useState(false);
  const [shareBusy, setShareBusy] = useState(false);
  const [shareImage, setShareImage] = useState("");
  const [shareTheme, setShareTheme] = useState<ShareThemeId>("ember");

  // Personal analytics: recorded focus sessions + device-local in-app navigation.
  const [analyticsRange, setAnalyticsRange] = useState<"today" | "7d" | "30d">("today");
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [analyticsError, setAnalyticsError] = useState("");
  const [analyticsSessions, setAnalyticsSessions] = useState<Array<{
    id: string; subject_name: string; started_at: string; ended_at: string | null;
    break_reason?: string | null; end_type?: string | null;
  }>>([]);
  const [appActivity, setAppActivity] = useState<Array<{ tab: string; at: string }>>([]);
  const [analyticsRefresh, setAnalyticsRefresh] = useState(0);

  // World page: live public study activity (opt-in visibility is enforced by RLS).
  const [worldSessions, setWorldSessions] = useState<WorldStudySession[]>([]);
  const [worldLoading, setWorldLoading] = useState(false);
  const [worldError, setWorldError] = useState("");

  // Today's personal totals use the same global session records as the World page.
  const [todayStudySessions, setTodayStudySessions] = useState<WorldStudySession[]>([]);
  const [dailyNow, setDailyNow] = useState(0);

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

  // Restore and persist the app appearance without changing study data.
  useEffect(() => {
    try {
      const savedTheme = localStorage.getItem("tapasya-app-theme");
      if (savedTheme === "light" || savedTheme === "amoled") setAppTheme(savedTheme);
    } catch (error) { console.error("Could not load appearance preference:", error); }
    finally { setThemeReady(true); }
  }, []);

  useEffect(() => {
    if (!themeReady) return;
    try { localStorage.setItem("tapasya-app-theme", appTheme); }
    catch (error) { console.error("Could not save appearance preference:", error); }
  }, [appTheme, themeReady]);

  // Enforce authentication AND completed onboarding before the dashboard mounts.
  // A valid Google session alone is not enough: username, exam and age are required.
  useEffect(() => {
    let active = true;

    const checkSessionAndProfile = async () => {
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      if (!active) return;

      if (sessionError || !sessionData.session) {
        window.location.replace("/auth");
        return;
      }

      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (!active) return;

      if (userError || !userData.user) {
        window.location.replace("/auth");
        return;
      }

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("username, exam, age")
        .eq("id", userData.user.id)
        .maybeSingle();

      if (!active) return;

      if (profileError) {
        console.error("Dashboard profile verification failed:", profileError);
        window.location.replace("/auth?error=profile");
        return;
      }

      const hasUsername =
        typeof profile?.username === "string" && profile.username.trim().length > 0;
      const hasExam =
        typeof profile?.exam === "string" && profile.exam.trim().length > 0;
      const hasAge =
        profile?.age !== null &&
        profile?.age !== undefined &&
        Number.isFinite(Number(profile.age));

      if (!hasUsername || !hasExam || !hasAge) {
        window.location.replace("/auth/setup");
        return;
      }

      setAuthReady(true);
    };

    void checkSessionAndProfile();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (!active) return;

      if (event === "SIGNED_OUT") {
        window.location.replace("/auth");
      }
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  // Load profile identity and exam-based subjects from Supabase.
  useEffect(() => {
    if (!authReady) return;
    let cancelled = false;

    const loadProfile = async () => {
      const { data, error } = await supabase.auth.getUser();
      if (error || !data.user || cancelled) return;

      const user = data.user;
      setProfileEmail(user.email ?? "");

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("username, exam, subjects")
        .eq("id", user.id)
        .maybeSingle();

      if (cancelled) return;
      if (profileError) console.error("Could not load profile subjects:", profileError);
      setProfileUsername(
        typeof profile?.username === "string" && profile.username.trim()
          ? profile.username.trim()
          : "Student"
      );

      try {
        const savedSubjectsRaw = localStorage.getItem("tapasya-subjects");
        const savedSubjects = savedSubjectsRaw ? JSON.parse(savedSubjectsRaw) : null;
        const localList = Array.isArray(savedSubjects) ? savedSubjects : [];
        const remoteList = Array.isArray(profile?.subjects) ? profile.subjects : [];

        const normalize = (items: any[]): Subject[] => items
          .filter(item => item && typeof item.name === "string" && item.name.trim())
          .map((item, index) => ({
            id: Number(item.id) || index + 1,
            name: item.name.trim(),
            color: typeof item.color === "string" ? item.color : COLORS[index % COLORS.length],
            seconds: Math.max(0, Number(item.seconds) || 0),
            targetHours: Math.max(0, Number(item.targetHours) || 1),
          }));

        let chosen: Subject[];
        if (remoteList.length > 0) {
          const localByName = new Map<string, Subject>(normalize(localList).map(item => [item.name.toLowerCase(), item] as const));
          chosen = normalize(remoteList).map((item, index) => {
            const local = localByName.get(item.name.toLowerCase());
            return { ...item, id: item.id || local?.id || index + 1, seconds: local?.seconds ?? item.seconds };
          });
        } else {
          const oldDefault = localList.length === 3 &&
            ["PHYSICS", "CHEMISTRY", "MATHS"].every(name =>
              localList.some((item: any) => String(item?.name || "").toUpperCase() === name)
            );
          chosen = localList.length > 0 && !oldDefault
            ? normalize(localList)
            : createDefaultSubjects(profile?.exam || "Other");
        }

        if (!cancelled) {
          setSubjects(chosen);
          setSubjectsLoaded(true);
        }
      } catch (loadError) {
        console.error("Could not restore subjects:", loadError);
        if (!cancelled) {
          setSubjects(createDefaultSubjects(profile?.exam || "Other"));
          setSubjectsLoaded(true);
        }
      }
    };

    void loadProfile();
    return () => { cancelled = true; };
  }, [authReady]);

  const finishLogout = async (reason: string) => {
    if (loggingOut) return;
    setLoggingOut(true);

    try {
      const { data: authData, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;

      if (authData.user) {
        const endedAt = new Date().toISOString();
        const updates = { ended_at: endedAt, break_reason: reason, end_type: "logout" };
        const [globalResult, groupResult] = await Promise.all([
          supabase.from("global_study_sessions").update(updates)
            .eq("user_id", authData.user.id).is("ended_at", null),
          supabase.from("study_sessions").update(updates)
            .eq("user_id", authData.user.id).is("ended_at", null),
        ]);
        if (globalResult.error) throw globalResult.error;
        if (groupResult.error) throw groupResult.error;
      }

      const { error: signOutError } = await supabase.auth.signOut();
      if (signOutError) throw signOutError;
      window.location.assign("/auth");
    } catch (error) {
      console.error("Could not complete logout and close study sessions:", error);
      setLoggingOut(false);
      setSelectedBreakReason(reason);
      setBreakDialog({ mode: "logout", startedAt: activeSessionStartedAt });
    }
  };

  const handleLogout = () => {
    if (loggingOut) return;
    setProfileMenuOpen(false);
    setSelectedBreakReason("Short break");
    setBreakDialog({ mode: "logout", startedAt: activeSessionStartedAt });
  };

  const saveBreakReason = async () => {
    if (!breakDialog || breakSaving) return;
    setBreakSaving(true);
    const reason = selectedBreakReason === "Other" && breakOtherText.trim()
      ? `Other: ${breakOtherText.trim()}`
      : selectedBreakReason;

    try {
      const { data: authData, error: authError } = await supabase.auth.getUser();
      if (authError) throw authError;
      if (authData.user && breakDialog.mode === "recovery" && breakDialog.startedAt) {
        const [globalResult, groupResult] = await Promise.all([
          supabase.from("global_study_sessions").update({ break_reason: reason })
            .eq("user_id", authData.user.id).eq("started_at", breakDialog.startedAt).eq("end_type", "unexpected"),
          supabase.from("study_sessions").update({ break_reason: reason })
            .eq("user_id", authData.user.id).eq("started_at", breakDialog.startedAt).eq("end_type", "unexpected"),
        ]);
        if (globalResult.error) throw globalResult.error;
        if (groupResult.error) throw groupResult.error;
      } else if (authData.user && breakDialog.mode === "stop" && breakDialog.startedAt) {
        const [globalResult, groupResult] = await Promise.all([
          supabase.from("global_study_sessions").update({ break_reason: reason, end_type: "manual" })
            .eq("user_id", authData.user.id).eq("started_at", breakDialog.startedAt),
          supabase.from("study_sessions").update({ break_reason: reason, end_type: "manual" })
            .eq("user_id", authData.user.id).eq("started_at", breakDialog.startedAt),
        ]);
        if (globalResult.error) throw globalResult.error;
        if (groupResult.error) throw groupResult.error;
      }

      const mode = breakDialog.mode;
      setBreakDialog(null);
      setBreakOtherText("");
      if (mode === "logout") await finishLogout(reason);
    } catch (error) {
      console.error("Could not save break reason:", error);
      // Keep the dialog open so the user can retry.
    } finally {
      setBreakSaving(false);
    }
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
      const savedTasks = localStorage.getItem("tapasya-tasks");

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
    if (!ready || !subjectsLoaded || !authReady) return;

    try {
      localStorage.setItem("tapasya-subjects", JSON.stringify(subjects));
    } catch (error) {
      console.error("Could not save local subjects:", error);
    }

    // Save subject settings only; the timer ticks every second and should not cause DB writes.
    const config = subjects.map(({ id, name, color, targetHours }) => ({ id, name, color, targetHours }));
    const signature = JSON.stringify(config);
    if (signature === savedSubjectConfigRef.current) return;
    savedSubjectConfigRef.current = signature;

    void (async () => {
      const { data: authData } = await supabase.auth.getUser();
      if (!authData.user) return;
      const { error } = await supabase
        .from("profiles")
        .update({ subjects: config })
        .eq("id", authData.user.id);
      if (error) {
        console.error("Could not sync subjects to profile:", error);
        savedSubjectConfigRef.current = "";
      }
    })();
  }, [subjects, ready, subjectsLoaded, authReady]);

  useEffect(() => {
    if (!ready) return;
    localStorage.setItem("tapasya-tasks", JSON.stringify(tasks));
  }, [tasks, ready]);

  // Use one stop path for every timer control so the break prompt is consistent.
  const stopActiveStudySession = () => {
    if (activeSubject === null) return;
    const startedAt = activeSessionStartedAt;
    setActiveSubject(null);
    setActiveSessionStartedAt(null);
    setSelectedBreakReason("Short break");
    setBreakOtherText("");
    setBreakDialog({ mode: "stop", startedAt });
  };

  // One timestamp is shared by the dashboard timer, group sessions, World, and live presence.
  const toggleSubjectTimer = (subjectId: number) => {
    if (activeSubject === subjectId) {
      stopActiveStudySession();
      return;
    }

    setActiveSessionStartedAt(new Date().toISOString());
    setActiveSubject(subjectId);
  };

  const activeSubjectNameForSync = subjects.find(subject => subject.id === activeSubject)?.name ?? null;

  // Sync the local focus timer with Supabase so group rooms can show live study time.
  useEffect(() => {
    if (!authReady) return;
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

      const startedAt = activeSessionStartedAt ?? new Date().toISOString();
      const { data: createdSessions, error: insertError } = await supabase
        .from("study_sessions")
        .insert(groupIds.map(group_id => ({
          group_id,
          user_id: userId,
          started_at: startedAt,
          ended_at: null,
          last_heartbeat_at: new Date().toISOString(),
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
  }, [activeSubject, activeSessionStartedAt, authReady]);

  // Publish the current timer as a global study session for the World page.
  // This is separate from group_sessions so students without groups are included too.
  useEffect(() => {
    if (!authReady) return;
    let cancelled = false;

    const syncGlobalStudySession = async () => {
      const { data: authData, error: authError } = await supabase.auth.getUser();
      if (authError || !authData.user || cancelled) return;

      const userId = authData.user.id;

      if (activeSubject === null) {
        const { error } = await supabase
          .from("global_study_sessions")
          .update({ ended_at: new Date().toISOString() })
          .eq("user_id", userId)
          .is("ended_at", null);
        if (error) console.error("Could not stop global study session:", error);
        return;
      }

      if (!activeSubjectNameForSync) return;

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("username")
        .eq("id", userId)
        .maybeSingle();

      if (profileError) {
        console.error("Could not load username for World study session:", profileError);
        return;
      }
      if (cancelled) return;

      // Close any stale active row before publishing the new subject.
      const { error: closeError } = await supabase
        .from("global_study_sessions")
        .update({ ended_at: new Date().toISOString() })
        .eq("user_id", userId)
        .is("ended_at", null);

      if (closeError) {
        console.error("Could not close previous global study session:", closeError);
        return;
      }
      if (cancelled) return;

      const { error: insertError } = await supabase
        .from("global_study_sessions")
        .insert({
          user_id: userId,
          username: profile?.username || "Student",
          subject_name: activeSubjectNameForSync,
          started_at: activeSessionStartedAt ?? new Date().toISOString(),
          ended_at: null,
          last_heartbeat_at: new Date().toISOString(),
        });

      if (insertError) console.error("Could not publish global study session:", insertError);
    };

    void syncGlobalStudySession();
    return () => { cancelled = true; };
  }, [activeSubject, activeSessionStartedAt, activeSubjectNameForSync, authReady]);

  // Refresh the heartbeat while this focus timer is running.
  // If the tab/browser closes or the device loses internet, these writes stop.
  // A Supabase cron job (added by the SQL migration) closes rows that go stale.
  useEffect(() => {
    if (!authReady || activeSubject === null) return;

    let disposed = false;
    let heartbeatInFlight = false;

    const sendHeartbeat = async () => {
      if (disposed || heartbeatInFlight) return;
      heartbeatInFlight = true;

      try {
        const { data: authData, error: authError } = await supabase.auth.getUser();
        if (authError || !authData.user || disposed) {
          if (authError) console.error("Could not authenticate study heartbeat:", authError);
          return;
        }

        const heartbeatAt = new Date().toISOString();
        const userId = authData.user.id;

        const [globalResult, groupResult] = await Promise.all([
          supabase
            .from("global_study_sessions")
            .update({ last_heartbeat_at: heartbeatAt })
            .eq("user_id", userId)
            .is("ended_at", null),
          supabase
            .from("study_sessions")
            .update({ last_heartbeat_at: heartbeatAt })
            .eq("user_id", userId)
            .is("ended_at", null),
        ]);

        if (globalResult.error) {
          console.error("Could not send World session heartbeat:", globalResult.error);
        }
        if (groupResult.error) {
          console.error("Could not send group session heartbeat:", groupResult.error);
        }
      } catch (heartbeatError) {
        console.error("Study session heartbeat failed:", heartbeatError);
      } finally {
        heartbeatInFlight = false;
      }
    };

    // Send one immediately, then every 30 seconds.
    void sendHeartbeat();
    const interval = window.setInterval(() => { void sendHeartbeat(); }, 30_000);
    const handleOnline = () => { void sendHeartbeat(); };

    window.addEventListener("online", handleOnline);

    return () => {
      disposed = true;
      window.clearInterval(interval);
      window.removeEventListener("online", handleOnline);
    };
  }, [authReady, activeSubject, activeSessionStartedAt]);

  // Ask for the reason when a previous session was closed by heartbeat cleanup.
  useEffect(() => {
    if (!authReady) return;
    let cancelled = false;
    const checkUnexpectedSession = async () => {
      const { data: authData } = await supabase.auth.getUser();
      if (!authData.user || cancelled) return;
      const { data, error } = await supabase
        .from("global_study_sessions")
        .select("started_at, ended_at, end_type, break_reason")
        .eq("user_id", authData.user.id)
        .eq("end_type", "unexpected")
        .is("break_reason", null)
        .order("ended_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) {
        console.error("Could not check for an interrupted session:", error);
        return;
      }
      if (!cancelled && data?.started_at) {
        setSelectedBreakReason("Short break");
        setBreakDialog(current => current ?? { mode: "recovery", startedAt: data.started_at });
      }
    };
    void checkUnexpectedSession();
    return () => { cancelled = true; };
  }, [authReady]);


  // Record in-app navigation locally. This tracks Tapasya sections, not browser tabs.
  useEffect(() => {
    if (!authReady) return;
    let cancelled = false;
    const recordTabVisit = async () => {
      const { data } = await supabase.auth.getUser();
      if (cancelled || !data.user) return;
      const key = `tapasya-app-activity:${data.user.id}`;
      try {
        const raw = localStorage.getItem(key);
        const previous = raw ? JSON.parse(raw) : [];
        const events = Array.isArray(previous) ? previous : [];
        const next = [...events, { tab: selectedTab, at: new Date().toISOString() }].slice(-3000);
        localStorage.setItem(key, JSON.stringify(next));
        setAppActivity(next);
      } catch (error) {
        console.error("Could not record app navigation:", error);
      }
    };
    void recordTabVisit();
    return () => { cancelled = true; };
  }, [authReady, selectedTab]);

  // Load this user's focus sessions for the selected analytics period.
  useEffect(() => {
    if (!authReady || selectedTab !== "Analysis") return;
    let cancelled = false;
    const loadPersonalAnalytics = async () => {
      setAnalyticsLoading(true);
      setAnalyticsError("");
      const { data: authData, error: authError } = await supabase.auth.getUser();
      if (authError || !authData.user) {
        if (!cancelled) {
          setAnalyticsError("Could not verify your account. Please refresh and try again.");
          setAnalyticsLoading(false);
        }
        return;
      }

      const now = new Date();
      const start = new Date(now);
      start.setHours(0, 0, 0, 0);
      if (analyticsRange !== "today") start.setDate(start.getDate() - (analyticsRange === "7d" ? 6 : 29));

      try {
        const [{ data: sessions, error: sessionError }, { data: legacySessions, error: legacyError }] = await Promise.all([
          supabase
            .from("global_study_sessions")
            .select("id, subject_name, started_at, ended_at, break_reason, end_type")
            .eq("user_id", authData.user.id)
            .gte("started_at", start.toISOString())
            .order("started_at", { ascending: true })
            .limit(2000),
          supabase
            .from("study_sessions")
            .select("id, started_at, ended_at")
            .eq("user_id", authData.user.id)
            .gte("started_at", start.toISOString())
            .order("started_at", { ascending: true })
            .limit(2000)
        ]);

        if (sessionError) throw sessionError;
        if (legacyError) console.warn("Could not load older group study history:", legacyError);
        if (cancelled) return;

        const key = `tapasya-app-activity:${authData.user.id}`;
        let localEvents: Array<{ tab: string; at: string }> = [];
        try {
          const raw = localStorage.getItem(key);
          const parsed = raw ? JSON.parse(raw) : [];
          if (Array.isArray(parsed)) localEvents = parsed.filter(
            (item: any) => item && typeof item.tab === "string" && typeof item.at === "string"
          );
        } catch (storageError) {
          console.warn("Could not read local app activity:", storageError);
        }

        const combinedSessions = [
          ...((sessions ?? []) as typeof analyticsSessions),
          ...((legacySessions ?? []).map(row => ({
            id: `legacy-${row.id}`,
            subject_name: "Study session",
            started_at: row.started_at,
            ended_at: row.ended_at,
            break_reason: null,
            end_type: null,
          })))
        ];
        const uniqueSessions = new Map<string, typeof combinedSessions[number]>();
        combinedSessions.forEach(session => {
          const key = `${session.started_at}:${session.ended_at ?? "active"}`;
          const existing = uniqueSessions.get(key);
          if (!existing || (existing.id.startsWith("legacy-") && !session.id.startsWith("legacy-"))) {
            uniqueSessions.set(key, session);
          }
        });
        setAnalyticsSessions(Array.from(uniqueSessions.values()).sort(
          (a, b) => new Date(a.started_at).getTime() - new Date(b.started_at).getTime()
        ));
        setAppActivity(localEvents);
      } catch (error) {
        console.error("Could not load personal analytics:", error);
        if (!cancelled) setAnalyticsError("Study history could not be loaded. Check your Supabase connection and try again.");
      } finally {
        if (!cancelled) setAnalyticsLoading(false);
      }
    };

    void loadPersonalAnalytics();
    return () => { cancelled = true; };
  }, [authReady, selectedTab, analyticsRange, analyticsRefresh]);

  // Load this user's sessions for today. The Timer page uses this same source
  // as World, so its daily total cannot drift from the World daily total.
  useEffect(() => {
    if (!authReady) return;
    let cancelled = false;

    const loadTodayStudySessions = async () => {
      const { data: authData, error: authError } = await supabase.auth.getUser();
      if (authError || !authData.user || cancelled) {
        if (authError) console.error("Could not identify user for today's study total:", authError);
        return;
      }

      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const { data, error } = await supabase
        .from("global_study_sessions")
        .select("id, user_id, username, subject_name, started_at, ended_at")
        .eq("user_id", authData.user.id)
        .gte("started_at", todayStart.toISOString())
        .order("started_at", { ascending: true })
        .limit(2000);

      if (cancelled) return;
      if (error) {
        console.error("Could not load today's Timer study sessions:", error);
        return;
      }
      setTodayStudySessions((data ?? []) as WorldStudySession[]);
    };

    void loadTodayStudySessions();
    const refresh = window.setInterval(() => { void loadTodayStudySessions(); }, 15000);
    const channel = supabase
      .channel("tapasya-timer-daily-study")
      .on("postgres_changes", {
        event: "*",
        schema: "public",
        table: "global_study_sessions",
      }, () => { void loadTodayStudySessions(); })
      .subscribe();

    return () => {
      cancelled = true;
      window.clearInterval(refresh);
      void supabase.removeChannel(channel);
    };
  }, [authReady]);

  // Re-render elapsed durations every second without writing to the database.
  useEffect(() => {
    // Read the clock after mount so server and client render the same initial state.
    setDailyNow(Date.now());

    const interval = window.setInterval(() => setDailyNow(Date.now()), 1000);
    return () => window.clearInterval(interval);
  }, []);

  // Load worldwide live activity and today's study sessions.
  useEffect(() => {
    if (!authReady || selectedTab !== "World") return;

    let cancelled = false;
    const loadWorldSessions = async () => {
      setWorldLoading(true);
      setWorldError("");

      const { data, error } = await supabase
        .from("global_study_sessions")
        .select("id, user_id, username, subject_name, started_at, ended_at")
        .order("started_at", { ascending: false })
        .limit(500);

      if (cancelled) return;
      if (error) {
        console.error("Could not load World study activity:", error);
        setWorldError("World activity needs the database setup below. Please run the SQL migration.");
        setWorldLoading(false);
        return;
      }

      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const yesterdayStart = new Date(todayStart);
      yesterdayStart.setDate(yesterdayStart.getDate() - 1);

      // global_study_sessions was introduced after the original timer.
      // Recover this user's earlier sessions from the existing group study log
      // so yesterday is not blank for sessions recorded before global tracking.
      const { data: authData } = await supabase.auth.getUser();
      let legacyRows: WorldStudySession[] = [];

      if (authData.user && !cancelled) {
        const [{ data: oldSessions, error: oldSessionsError }, { data: profile }] = await Promise.all([
          supabase
            .from("study_sessions")
            .select("id, user_id, started_at, ended_at")
            .eq("user_id", authData.user.id)
            .gte("started_at", yesterdayStart.toISOString())
            .lt("started_at", new Date(todayStart.getTime() + 24 * 60 * 60 * 1000).toISOString())
            .order("started_at", { ascending: false })
            .limit(500),
          supabase
            .from("profiles")
            .select("username")
            .eq("id", authData.user.id)
            .maybeSingle()
        ]);

        if (oldSessionsError) {
          console.warn("Could not load legacy study history:", oldSessionsError);
        } else {
          const username = profile?.username || "student";
          const seen = new Set<string>();
          legacyRows = (oldSessions ?? []).filter(row => {
            const key = `${row.user_id}:${row.started_at}:${row.ended_at ?? "active"}`;
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
          }).map(row => ({
            id: `legacy-${row.id}`,
            user_id: row.user_id,
            username,
            subject_name: "Study session",
            started_at: row.started_at,
            ended_at: row.ended_at,
          }));
        }
      }

      if (cancelled) return;
      const globalRows = (data ?? []) as WorldStudySession[];
      const combined = [...globalRows, ...legacyRows];
      const unique = new Map<string, WorldStudySession>();
      combined.forEach(session => {
        const key = `${session.user_id}:${session.started_at}:${session.ended_at ?? "active"}`;
        if (!unique.has(key)) unique.set(key, session);
      });

      setWorldSessions(Array.from(unique.values()).filter(session => {
        const started = new Date(session.started_at).getTime();
        return session.ended_at === null || started >= yesterdayStart.getTime();
      }));
      setWorldLoading(false);
    };

    void loadWorldSessions();
    const refresh = window.setInterval(loadWorldSessions, 15000);

    const channel = supabase
      .channel("tapasya-world-study-activity")
      .on("postgres_changes", {
        event: "*",
        schema: "public",
        table: "global_study_sessions",
      }, () => { void loadWorldSessions(); })
      .subscribe();

    return () => {
      cancelled = true;
      window.clearInterval(refresh);
      void supabase.removeChannel(channel);
    };
  }, [selectedTab, authReady]);

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

  // Match World: sum today's global sessions, using the current time for open sessions.
  const dailySubjectSeconds = todayStudySessions.reduce((totals, session) => {
    const startedAt = new Date(session.started_at).getTime();
    const endedAt = session.ended_at ? new Date(session.ended_at).getTime() : dailyNow;
    const seconds = Math.max(0, Math.floor((Math.min(endedAt, dailyNow) - startedAt) / 1000));
    const key = (session.subject_name || "Study session").trim().toLowerCase();
    totals[key] = (totals[key] || 0) + seconds;
    return totals;
  }, {} as Record<string, number>);
  const dailyTotalSeconds = Object.values(dailySubjectSeconds).reduce((sum, seconds) => sum + seconds, 0);
  const dailySecondsForSubject = (name: string) => dailySubjectSeconds[name.trim().toLowerCase()] || 0;

  // SHARE STUDY CARD
  function buildShareCanvas(theme: ShareThemeId = shareTheme) {
    return drawShareCard({
      username: profileUsername || "student",
      subjects,
      theme,
      siteLabel: "tapasya",
    });
  }

  async function getShareBlob(): Promise<Blob | null> {
    const canvas = buildShareCanvas();
    if (!canvas) return null;
    return new Promise(resolve => canvas.toBlob(blob => resolve(blob), "image/png"));
  }

  function downloadBlob(blob: Blob) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "tapasya-study-card.png";
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  function changeShareTheme(theme: ShareThemeId) {
    setShareTheme(theme);
    const canvas = buildShareCanvas(theme);
    if (canvas) setShareImage(canvas.toDataURL("image/png"));
  }

  async function handleShareCard() {
    if (shareBusy) return;
    setShareBusy(true);

    try {
      const blob = await getShareBlob();
      if (!blob) return;

      const file = new File([blob], "tapasya-study-card.png", { type: "image/png" });

      if (typeof navigator.canShare === "function" && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: "My Tapasya study card",
          text: `I studied ${formatTime(totalSeconds)} on Tapasya!`,
        });
      } else {
        downloadBlob(blob);
      }
    } catch (error) {
      if ((error as Error).name !== "AbortError") {
        console.error("Could not share study card:", error);
      }
    } finally {
      setShareBusy(false);
    }
  }

  async function handleDownloadCard() {
    const blob = await getShareBlob();
    if (blob) downloadBlob(blob);
  }

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

    if (activeSubject === id) {
      stopActiveStudySession();
    }

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


  if (!authReady || !subjectsLoaded) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#080808] text-[#888888]">
        <p className="text-sm">Loading Tapasya...</p>
      </main>
    );
  }

  return (
    <main
      data-theme={appTheme}
      className="tapasya-theme min-h-screen bg-[#111111] text-[#d0d0d0]"
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
            { name: "World", icon: Globe2 },
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

          {/* {selectedTab !== "Groups" && (
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
          )} */}
        </div>

        <div className="flex shrink-0 items-center gap-2">
          {/* COMMUNITY */}
          <button
            type="button"
            onClick={event => { event.stopPropagation(); setSelectedTab("Community"); }}
            aria-label="Open community"
            title="Community feedback and suggestions"
            aria-pressed={selectedTab === "Community"}
            className={`flex h-9 items-center gap-1.5 rounded-full border px-3 transition ${
              selectedTab === "Community"
                ? "border-[#FF7628]/60 bg-[#2b211b] text-[#FF9A5C]"
                : "border-[#303030] bg-[#191919] text-[#cfcfcf] hover:border-[#FF7628]/60 hover:bg-[#242424] hover:text-white"
            }`}
          >
            <MessageSquare size={14} className="text-[#FF7628]" />
            <span className="text-[11px] font-medium">Community</span>
          </button>

          {/* PERSONAL ANALYSIS */}
          <button
            type="button"
            onClick={event => { event.stopPropagation(); setSelectedTab("Analysis"); }}
            aria-label="Open personal analysis"
            title="Your study analysis"
            aria-pressed={selectedTab === "Analysis"}
            className={`flex h-9 items-center gap-1.5 rounded-full border px-3 transition ${
              selectedTab === "Analysis"
                ? "border-[#FF7628]/60 bg-[#2b211b] text-[#FF9A5C]"
                : "border-[#303030] bg-[#191919] text-[#cfcfcf] hover:border-[#FF7628]/60 hover:bg-[#242424] hover:text-white"
            }`}
          >
            <BarChart3 size={14} className="text-[#FF7628]" />
            <span className="text-[11px] font-medium">Analysis</span>
          </button>

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

                <div className="px-4 py-3">
                  <div className="mb-2 flex items-center gap-2 text-[11px] font-semibold text-[#bdbdbd]">
                    <Sun size={14} className="text-[#FF7628]" /> Appearance
                  </div>
                  <div className="grid grid-cols-3 gap-1.5">
                    {[
                      { id: "dark", label: "Dark", Icon: Moon },
                      { id: "light", label: "Light", Icon: Sun },
                      { id: "amoled", label: "AMOLED", Icon: Contrast },
                    ].map(({ id, label, Icon }) => (
                      <button key={id} type="button" aria-pressed={appTheme === id}
                        onClick={() => setAppTheme(id as "dark" | "light" | "amoled")}
                        className={`flex flex-col items-center gap-1.5 rounded-lg border px-2 py-2 text-[10px] transition ${appTheme === id ? "border-[#FF7628] bg-[#FF7628]/10 text-[#FF9A5C]" : "border-[#383838] bg-[#222222] text-[#999999] hover:border-[#666666] hover:text-white"}`}>
                        <Icon size={15} />{label}
                      </button>
                    ))}
                  </div>
                </div>

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
        </div>
      </header>

      {breakDialog && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/75 px-4 py-6 backdrop-blur-sm">
          <section role="dialog" aria-modal="true" aria-labelledby="break-dialog-title" className="w-full max-w-[440px] rounded-2xl border border-[#343434] bg-[#171717] p-5 shadow-2xl">
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#FF7628]">Tapasya · Break tracking</p>
                <h2 id="break-dialog-title" className="mt-2 text-lg font-semibold text-white">
                  {breakDialog.mode === "recovery" ? "What happened during your last session?" : "Why are you taking a break?"}
                </h2>
                <p className="mt-1 text-xs leading-5 text-[#929292]">This helps build more useful study and break insights. Your answer is used for your personal activity analytics.</p>
              </div>
              {breakDialog.mode === "recovery" && (
                <button type="button" onClick={() => setBreakDialog(null)} aria-label="Skip for now" className="rounded-lg p-1 text-[#888] hover:bg-[#292929] hover:text-white"><X size={18} /></button>
              )}
            </div>
            <div className="grid grid-cols-2 gap-2">
              {[
                ["☕", "Short break"], ["🚻", "Washroom"], ["🍽️", "Food / Meal"],
                ["😴", "Sleep / Rest"], ["📱", "Phone / Social media"], ["🚶", "Walking"],
                ["🧠", "Mental refresh"], ["📚", "Subject completed"],
                ["🏠", "Personal work"], ["❓", "Other"],
              ].map(([emoji, label]) => (
                <button key={label} type="button" onClick={() => { setSelectedBreakReason(label); if (label !== "Other") setBreakOtherText(""); }} aria-pressed={selectedBreakReason === label}
                  className={`flex items-center gap-2 rounded-xl border px-3 py-3 text-left text-xs transition ${selectedBreakReason === label ? "border-[#FF7628] bg-[#FF7628]/10 text-[#ffad7a]" : "border-[#333] bg-[#202020] text-[#d0d0d0] hover:border-[#555]"}`}>
                  <span className="text-base">{emoji}</span><span>{label}</span>
                </button>
              ))}
            </div>
            {selectedBreakReason === "Other" && (
              <input value={breakOtherText} onChange={event => setBreakOtherText(event.target.value)} maxLength={80} placeholder="Tell us briefly" className="mt-3 h-10 w-full rounded-lg border border-[#383838] bg-[#101010] px-3 text-sm text-white outline-none focus:border-[#FF7628]" />
            )}
            <button type="button" onClick={() => void saveBreakReason()} disabled={breakSaving || (selectedBreakReason === "Other" && !breakOtherText.trim())}
              className="mt-4 flex h-11 w-full items-center justify-center rounded-xl bg-[#FF7628] text-sm font-semibold text-black transition hover:bg-[#ff8b49] disabled:cursor-wait disabled:opacity-60">
              {breakSaving ? "Saving..." : breakDialog.mode === "logout" ? "Save & log out" : "Save reason"}
            </button>
            {breakDialog.mode === "recovery" && <button type="button" onClick={() => setBreakDialog(null)} className="mt-2 h-9 w-full text-xs text-[#888] hover:text-white">Skip for now</button>}
          </section>
        </div>
      )}

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
                      <span className="font-mono tabular-nums">{formatTime(runningSubject ? dailySecondsForSubject(runningSubject.name) : dailyTotalSeconds)}</span>
                      <div className="flex-1" />
                    </div>
                    <section className="mx-3 mb-2 flex min-h-[94px] items-center justify-between rounded-xl bg-[#151515] px-4 py-3">
                      <div>
                        <p className="text-[11px] font-medium text-[#cccccc]">Total focus time</p>
                        <p className="mt-1 font-mono text-[32px] font-semibold leading-none tracking-tight text-[#e6e6e6]">{formatTime(dailyTotalSeconds)}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-mono text-[12px] text-[#FF7628]">{formatTime(runningSubject ? dailySecondsForSubject(runningSubject.name) : dailyTotalSeconds)}</p>
                        <p className="mt-1 text-[9px] text-[#777777]">{runningSubject?.name ?? "STUDYING"}</p>
                      </div>
                    </section>
                    <LiveStudyRoom
                      activeSubjectName={runningSubject?.name ?? null}
                      studyStartedAt={activeSessionStartedAt}
                      onPause={stopActiveStudySession}
                    />
                  </>
                );
              })()}
            </>
          ) : (
          <>
          <section className="relative h-[150px] bg-[#151515]">
            {/* <span className="absolute left-4 top-3 rounded-full bg-[#292929] px-2 py-0.5 text-[11px] text-[#aaaaaa]">
              D-?
            </span> */}

            <p className="absolute left-1/2 top-4 -translate-x-1/2 text-[13px] font-medium text-[#cccccc]">
              {todayLabel}
            </p>

            {/* <button className="absolute right-3 top-3 text-[#aaaaaa] hover:text-white">
              <PanelRight size={17} />
            </button> */}

            <div className="absolute left-1/2 top-[62px] -translate-x-1/2 text-center">
              <p className="font-mono text-[38px] font-semibold tracking-tight text-[#e6e6e6] sm:text-[40px]">
                {formatTime(dailyTotalSeconds)}
              </p>
            </div>
          </section>

          {subjects.map((subject, index) => {
            const active = activeSubject === subject.id;

            return (
              <div key={subject.id} className="group relative flex h-[48px] items-center px-4 hover:bg-[#191919]">
                <button
                  onClick={() => toggleSubjectTimer(subject.id)}
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
                  {formatTime(dailySecondsForSubject(subject.name))}
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

      {/* WORLD STUDY ACTIVITY */}
      {selectedTab === "World" && (() => {
        const liveSessions = worldSessions.filter(session => session.ended_at === null);
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        const yesterdayStart = new Date(todayStart);
        yesterdayStart.setDate(yesterdayStart.getDate() - 1);

        const todaySessions = worldSessions.filter(session =>
          new Date(session.started_at).getTime() >= todayStart.getTime()
        );
        const yesterdaySessions = worldSessions.filter(session => {
          const started = new Date(session.started_at).getTime();
          return started >= yesterdayStart.getTime() && started < todayStart.getTime();
        });

        const getSessionSeconds = (session: WorldStudySession) => {
          const start = new Date(session.started_at).getTime();
          const end = session.ended_at ? new Date(session.ended_at).getTime() : dailyNow;
          return Math.max(0, Math.floor((end - start) / 1000));
        };

        const todaySeconds = todaySessions.reduce((total, session) => total + getSessionSeconds(session), 0);
        const uniqueStudentsToday = new Set(todaySessions.map(session => session.user_id)).size;

        const buildStudentActivity = (sessions: WorldStudySession[]) => Array.from(
          sessions.reduce((map, session) => {
            const existing = map.get(session.user_id);
            const startedAt = new Date(session.started_at).getTime();
            const duration = getSessionSeconds(session);

            if (!existing) {
              map.set(session.user_id, {
                user_id: session.user_id,
                username: session.username || "student",
                totalSeconds: duration,
                isStudying: session.ended_at === null,
                latestStartedAt: startedAt,
                latestSubject: session.subject_name || "Study session",
              });
            } else {
              existing.totalSeconds += duration;
              if (session.ended_at === null) existing.isStudying = true;
              if (startedAt >= existing.latestStartedAt) {
                existing.latestStartedAt = startedAt;
                existing.latestSubject = session.subject_name || "Study session";
                existing.username = session.username || existing.username;
              }
            }
            return map;
          }, new Map<string, {
            user_id: string;
            username: string;
            totalSeconds: number;
            isStudying: boolean;
            latestStartedAt: number;
            latestSubject: string;
          }>())
            .values()
        ).sort((a, b) => b.latestStartedAt - a.latestStartedAt);

        const todayActivity = buildStudentActivity(todaySessions);
        const yesterdayActivity = buildStudentActivity(yesterdaySessions);

        // Stable, date-seeded sample activity for a clearly disclosed mixed activity feed.
        const nowLocal = new Date();
        const dayKey = `${nowLocal.getFullYear()}-${String(nowLocal.getMonth()+1).padStart(2,"0")}-${String(nowLocal.getDate()).padStart(2,"0")}`;
        const hashSeed = (value: string) => { let hash = 2166136261; for (let i = 0; i < value.length; i++) hash = Math.imul(hash ^ value.charCodeAt(i), 16777619); return hash >>> 0; };
        const dailyRandom = (name: string, salt: string) => { let x = hashSeed(`${dayKey}:${name}:${salt}`); x = (x ^ (x >>> 16)) * 0x45d9f3b; x = (x ^ (x >>> 16)) * 0x45d9f3b; x ^= x >>> 16; return (x >>> 0) / 4294967295; };
        const sampleNames = ["riya.notes", "ananya.study", "mehakfocus", "sana.reads", "aashi_07", "kavya.learns", "isha.focus", "priya.pages", "simran.study", "arjunprep", "dev.studylog", "kabirfocus", "rohan.notes", "vivaanlearn", "aditya.study"];
        const sampleSubjects = ["Mathematics", "Physics", "History", "Biology", "Economics", "Computer Science", "Literature", "Chemistry"];
        const sampleActivity = sampleNames.map((username, index) => {
          const isStudying = dailyRandom(username, "live-status") > 0.67;
          const liveElapsedSeconds = Math.floor(dailyRandom(username, "live-start") * 3 * 3600);
          return { user_id: `sample-${username}`, username, totalSeconds: Math.floor((6 + dailyRandom(username, "hours") * 6) * 3600), isStudying, latestStartedAt: nowLocal.getTime() - liveElapsedSeconds * 1000, latestSubject: sampleSubjects[Math.floor(dailyRandom(username, "subject") * sampleSubjects.length)] };
        }).sort((a, b) => Number(b.isStudying) - Number(a.isStudying) || b.totalSeconds - a.totalSeconds);
        const todayDisplayActivity = [...todayActivity, ...sampleActivity].sort((a, b) => Number(b.isStudying) - Number(a.isStudying) || b.latestStartedAt - a.latestStartedAt);

        const renderActivityGroup = (
          title: string,
          subtitle: string,
          students: ReturnType<typeof buildStudentActivity>,
          emptyText: string
        ) => (
          <div className="overflow-hidden rounded-xl border border-[#292929] bg-[#151515]">
            <div className="flex items-center justify-between border-b border-[#292929] px-4 py-4 sm:px-5">
              <div>
                <h2 className="text-[13px] font-semibold text-[#eeeeee]">{title}</h2>
                <p className="mt-1 text-[10px] text-[#777777]">{subtitle}</p>
              </div>
              <span className="rounded-full bg-[#242424] px-2.5 py-1 text-[10px] tabular-nums text-[#bdbdbd]">
                {students.length} {students.length === 1 ? "student" : "students"}
              </span>
            </div>

            {students.length === 0 ? (
              <div className="px-5 py-10 text-center text-[11px] text-[#777777]">{emptyText}</div>
            ) : (
              <div className="divide-y divide-[#252525]">
                {students.map(student => (
                  <div key={student.user_id} className="flex items-center gap-3 px-4 py-4 sm:px-5">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#2b211b] text-[12px] font-semibold text-[#FF7628]">
                      {(student.username || "S").slice(0, 1).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[12px] font-semibold text-[#e5e5e5]">@{student.username}</p>
                      <p className="mt-1 truncate text-[10px] text-[#858585]">{student.latestSubject}</p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="font-mono text-[12px] tabular-nums text-[#FF7628]">{formatTime(student.totalSeconds)}</p>
                      <p className={`mt-1 flex items-center justify-end gap-1 text-[9px] ${student.isStudying ? "text-[#8fdaa9]" : "text-[#777777]"}`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${student.isStudying ? "bg-[#35bd70] animate-pulse" : "bg-[#777777]"}`} />
                        {student.isStudying ? "STUDYING NOW" : "STUDIED"}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );

        return (
          <section className="mx-auto w-full max-w-[1180px] px-4 pb-12 pt-7 sm:px-6">
            <div className="mb-7 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-[#FF7628]">TAPASYA · WORLD</p>
                <h1 className="mt-2 text-[25px] font-semibold tracking-tight text-[#eeeeee] sm:text-[30px]">The world is studying.</h1>
                <p className="mt-2 max-w-[560px] text-[12px] leading-6 text-[#858585]">
                  A live view of students putting in the work, one focused session at a time.
                </p>
              </div>
              <div className="flex items-center gap-2 self-start rounded-full border border-[#24452f] bg-[#14231a] px-3 py-1.5">
                <span className="h-2 w-2 animate-pulse rounded-full bg-[#36c477]" />
                <span className="text-[10px] font-medium text-[#8fdaa9]">LIVE · refreshes automatically</span>
              </div>
            </div>

            {worldLoading && worldSessions.length === 0 ? (
              <div className="mt-5 rounded-xl border border-[#292929] bg-[#151515] px-5 py-14 text-center text-[12px] text-[#777777]">
                Loading worldwide activity…
              </div>
            ) : worldError ? (
              <div className="mt-5 rounded-xl border border-[#292929] bg-[#151515] px-5 py-12 text-center">
                <p className="text-[12px] text-[#e6a07b]">{worldError}</p>
                <p className="mx-auto mt-2 max-w-[600px] text-[10px] leading-5 text-[#777777]">
                  Run the accompanying global-study-sessions.sql migration in Supabase, then refresh this page.
                </p>
              </div>
            ) : (
              <div className="mt-8">
                <div className="mb-4 flex items-center gap-1 rounded-xl border border-[#292929] bg-[#101010] p-1">
                  <button
                    type="button"
                    onClick={() => setWorldActivityPeriod("yesterday")}
                    aria-pressed={worldActivityPeriod === "yesterday"}
                    className={`flex-1 rounded-lg px-4 py-2.5 text-[12px] font-medium transition ${
                      worldActivityPeriod === "yesterday"
                        ? "bg-[#242424] text-white shadow-sm"
                        : "text-[#858585] hover:bg-[#191919] hover:text-[#dddddd]"
                    }`}
                  >
                    Yesterday
                    <span className={`ml-2 text-[10px] ${worldActivityPeriod === "yesterday" ? "text-[#FF7628]" : "text-[#666666]"}`}>
                      {yesterdayActivity.length}
                    </span>
                  </button>                  <button
                    type="button"
                    onClick={() => setWorldActivityPeriod("today")}
                    aria-pressed={worldActivityPeriod === "today"}
                    className={`flex-1 rounded-lg px-4 py-2.5 text-[12px] font-medium transition ${
                      worldActivityPeriod === "today"
                        ? "bg-[#242424] text-white shadow-sm"
                        : "text-[#858585] hover:bg-[#191919] hover:text-[#dddddd]"
                    }`}
                  >
                    Today
                    <span className={`ml-2 text-[10px] ${worldActivityPeriod === "today" ? "text-[#FF7628]" : "text-[#666666]"}`}>
                      {todayActivity.length}
                    </span>
                  </button>

                </div>
                {worldActivityPeriod === "today"
                  ? renderActivityGroup(
                      "Students who studied today",
                      "Recorded activity · includes sample profiles",
                      todayDisplayActivity,
                      "No study sessions yet today."
                    )
                  : renderActivityGroup(
                      "Students who studied yesterday",
                      "Everyone who logged a study session yesterday",
                      yesterdayActivity,
                      "No study sessions were recorded yesterday."
                    )}
              </div>
            )}



            <p className="mt-4 text-[10px] leading-5 text-[#666666]">
              Your study activity is shared on this page while your timer is running. Only your username, subject and session duration are displayed.
            </p>
          </section>
        );
      })()}


      {/* PERSONAL ANALYSIS */}
      {selectedTab === "Analysis" && (() => {
        const now = new Date();
        const periodStart = new Date(now);
        periodStart.setHours(0, 0, 0, 0);
        if (analyticsRange !== "today") periodStart.setDate(periodStart.getDate() - (analyticsRange === "7d" ? 6 : 29));
        const durationFor = (session: typeof analyticsSessions[number]) => {
          const started = new Date(session.started_at).getTime();
          const ended = session.ended_at ? new Date(session.ended_at).getTime() : now.getTime();
          return Math.max(0, Math.floor((Math.min(ended, now.getTime()) - Math.max(started, periodStart.getTime())) / 1000));
        };
        const validSessions = analyticsSessions.filter(session => new Date(session.started_at).getTime() <= now.getTime());
        const totalStudySeconds = validSessions.reduce((sum, session) => sum + durationFor(session), 0);
        const subjectTotals = validSessions.reduce((map, session) => {
          const name = session.subject_name || "Study session";
          map.set(name, (map.get(name) || 0) + durationFor(session));
          return map;
        }, new Map<string, number>());
        const subjectRows = Array.from(subjectTotals.entries()).sort((a, b) => b[1] - a[1]);
        const studyDays = new Set(validSessions.map(session => dateKey(new Date(session.started_at)))).size;
        const tabEvents = appActivity.filter(event => {
          const at = new Date(event.at).getTime();
          return Number.isFinite(at) && at >= periodStart.getTime() && at <= now.getTime();
        });
        const tabCounts = tabEvents.reduce((map, event) => {
          map.set(event.tab, (map.get(event.tab) || 0) + 1);
          return map;
        }, new Map<string, number>());
        const tabRows = Array.from(tabCounts.entries()).sort((a, b) => b[1] - a[1]);
        const dailyRows = Array.from({ length: analyticsRange === "today" ? 1 : analyticsRange === "7d" ? 7 : 30 }, (_, index) => {
          const day = new Date(periodStart);
          day.setDate(periodStart.getDate() + index);
          const key = dateKey(day);
          const seconds = validSessions.reduce((sum, session) =>
            dateKey(new Date(session.started_at)) === key ? sum + durationFor(session) : sum, 0);
          return { key, label: day.toLocaleDateString("en-US", { weekday: "short", day: "numeric" }), seconds };
        });
        const maxDaily = Math.max(1, ...dailyRows.map(row => row.seconds));
        const orderedSessions = [...validSessions].sort((a, b) => new Date(a.started_at).getTime() - new Date(b.started_at).getTime());
        const breakGaps = orderedSessions.slice(1).map((session, index) => {
          const previous = orderedSessions[index];
          if (!previous.ended_at) return null;
          if (dateKey(new Date(previous.ended_at)) !== dateKey(new Date(session.started_at))) return null;
          const gap = new Date(session.started_at).getTime() - new Date(previous.ended_at).getTime();
          if (gap <= 0 || gap > 12 * 60 * 60 * 1000) return null;
          return { seconds: Math.floor(gap / 1000), reason: previous.break_reason || "Reason not specified", start: previous.ended_at, end: session.started_at };
        }).filter((item): item is { seconds: number; reason: string; start: string; end: string } => item !== null);
        const estimatedBreakSeconds = breakGaps.reduce((sum, gap) => sum + gap.seconds, 0);
        const formatCompact = (seconds: number) => {
          const h = Math.floor(seconds / 3600);
          const m = Math.floor((seconds % 3600) / 60);
          return h > 0 ? `${h}h ${m}m` : `${m}m`;
        };
        const periodLabel = analyticsRange === "today" ? "Today" : analyticsRange === "7d" ? "Last 7 days" : "Last 30 days";

        return (
          <section className="mx-auto w-full max-w-[1180px] px-4 pb-14 pt-7 sm:px-6">
            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-[#FF7628]">TAPASYA · PERSONAL INSIGHTS</p>
                <h1 className="mt-2 text-[26px] font-semibold tracking-tight text-[#eeeeee] sm:text-[32px]">Your day, in focus.</h1>
                <p className="mt-2 max-w-[560px] text-[12px] leading-6 text-[#858585]">A clear picture of your study sessions and how you move through Tapasya.</p>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex rounded-lg border border-[#303030] bg-[#151515] p-1">
                  {(["today", "7d", "30d"] as const).map(range => (
                    <button key={range} type="button" onClick={() => setAnalyticsRange(range)} aria-pressed={analyticsRange === range}
                      className={`rounded-md px-3 py-2 text-[11px] font-medium transition ${analyticsRange === range ? "bg-[#292929] text-white" : "text-[#858585] hover:text-white"}`}>
                      {range === "today" ? "Today" : range === "7d" ? "7 days" : "30 days"}
                    </button>
                  ))}
                </div>
                <button type="button" onClick={() => setAnalyticsRefresh(value => value + 1)} title="Refresh analytics" className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#303030] bg-[#151515] text-[#999] hover:text-white"><RefreshCw size={14} /></button>
              </div>
            </div>

            {analyticsLoading ? (
              <div className="rounded-xl border border-[#292929] bg-[#151515] px-5 py-16 text-center text-[12px] text-[#888]">Preparing your insights…</div>
            ) : analyticsError ? (
              <div className="rounded-xl border border-[#553626] bg-[#1c1713] px-5 py-10 text-center">
                <p className="text-[13px] text-[#ffad7a]">{analyticsError}</p>
                <button type="button" onClick={() => setAnalyticsRefresh(value => value + 1)} className="mt-4 rounded-lg bg-[#D97736] px-4 py-2 text-[11px] font-semibold text-black">Try again</button>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                  {[
                    { label: "FOCUS TIME", value: formatCompact(totalStudySeconds), hint: `${validSessions.length} recorded sessions`, Icon: Clock3 },
                    { label: "SESSIONS", value: String(validSessions.length), hint: `${studyDays} ${studyDays === 1 ? "day" : "days"} with study`, Icon: Activity },
                    { label: "SUBJECTS", value: String(subjectRows.length), hint: subjectRows[0]?.[0] || "No subject data yet", Icon: BookOpen },
                    { label: "APP SECTION VISITS", value: String(tabEvents.length), hint: `${tabRows.length} different sections visited`, Icon: BarChart3 },
                  ].map(({ label, value, hint, Icon }) => (
                    <div key={label} className="rounded-xl border border-[#292929] bg-[#151515] p-4 sm:p-5">
                      <div className="flex items-center justify-between"><p className="text-[9px] font-semibold tracking-[0.16em] text-[#777]">{label}</p><Icon size={15} className="text-[#FF7628]" /></div>
                      <p className="mt-3 font-mono text-[25px] font-semibold tracking-tight text-white">{value}</p>
                      <p className="mt-1 truncate text-[10px] text-[#777]">{hint}</p>
                    </div>
                  ))}
                </div>

                <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-[1.35fr_1fr]">
                  <div className="rounded-xl border border-[#292929] bg-[#151515] p-4 sm:p-5">
                    <div className="mb-5 flex items-center justify-between"><div><h2 className="text-[13px] font-semibold text-white">Study rhythm</h2><p className="mt-1 text-[10px] text-[#777]">{periodLabel} · recorded focus time</p></div><Activity size={16} className="text-[#FF7628]" /></div>
                    {totalStudySeconds === 0 ? <p className="py-10 text-center text-[11px] text-[#777]">No recorded study sessions in this period yet.</p> : (
                      <div className="flex h-[170px] items-end gap-1.5 overflow-x-auto pb-1">
                        {dailyRows.map(row => (
                          <div key={row.key} className="flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-2">
                            <div className="flex h-[132px] w-full items-end justify-center"><div title={`${row.label}: ${formatCompact(row.seconds)}`} className="w-full max-w-[34px] rounded-t-md bg-[#D97736] transition-all" style={{ height: `${row.seconds ? Math.max(4, row.seconds / maxDaily * 100) : 2}%`, opacity: row.seconds ? 1 : 0.18 }} /></div>
                            <span className="text-[9px] text-[#777]">{analyticsRange === "today" ? "Today" : row.label}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="rounded-xl border border-[#292929] bg-[#151515] p-4 sm:p-5">
                    <div className="mb-4 flex items-center justify-between"><div><h2 className="text-[13px] font-semibold text-white">Subject breakdown</h2><p className="mt-1 text-[10px] text-[#777]">Where your focus went</p></div><BookOpen size={16} className="text-[#FF7628]" /></div>
                    {subjectRows.length === 0 ? <p className="py-10 text-center text-[11px] text-[#777]">Subject insights will appear after a study session.</p> : (
                      <div className="space-y-4">{subjectRows.map(([name, seconds], index) => (
                        <div key={name}>
                          <div className="mb-1.5 flex items-center justify-between gap-3 text-[11px]"><span className="truncate text-[#d8d8d8]">{name}</span><span className="shrink-0 font-mono text-[#aaa]">{formatCompact(seconds)}</span></div>
                          <div className="h-1.5 overflow-hidden rounded-full bg-[#292929]"><div className="h-full rounded-full bg-[#D97736]" style={{ width: `${Math.max(1, seconds / Math.max(1, totalStudySeconds) * 100)}%`, opacity: Math.max(0.45, 1 - index * 0.08) }} /></div>
                        </div>
                      ))}</div>
                    )}
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
                  <div className="rounded-xl border border-[#292929] bg-[#151515] p-4 sm:p-5">
                    <div className="mb-4 flex items-center justify-between"><div><h2 className="text-[13px] font-semibold text-white">Tapasya sections</h2><p className="mt-1 text-[10px] text-[#777]">Times each in-app section was opened on this device</p></div><BarChart3 size={16} className="text-[#FF7628]" /></div>
                    {tabRows.length === 0 ? <p className="py-8 text-center text-[11px] text-[#777]">Your section visits will be counted from now on.</p> : (
                      <div className="space-y-3">{tabRows.map(([tab, count]) => (
                        <div key={tab} className="flex items-center justify-between rounded-lg bg-[#1d1d1d] px-3 py-2.5"><span className="text-[11px] text-[#d0d0d0]">{tab}</span><span className="font-mono text-[11px] text-[#FF9A5C]">{count} {count === 1 ? "visit" : "visits"}</span></div>
                      ))}</div>
                    )}
                    <p className="mt-3 text-[9px] leading-4 text-[#666]">Counts Timer, To-Do, Calendar, Groups, World and Analysis visits inside Tapasya—not browser tabs or other websites. Stored on this device.</p>
                  </div>

                  <div className="rounded-xl border border-[#292929] bg-[#151515] p-4 sm:p-5">
                    <div className="mb-4 flex items-center justify-between"><div><h2 className="text-[13px] font-semibold text-white">Breaks & recovery</h2><p className="mt-1 text-[10px] text-[#777]">Time between consecutive recorded sessions</p></div><Coffee size={16} className="text-[#FF7628]" /></div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="rounded-lg bg-[#1d1d1d] p-3"><p className="text-[9px] text-[#777]">ESTIMATED GAP TIME</p><p className="mt-2 font-mono text-[20px] text-white">{formatCompact(estimatedBreakSeconds)}</p></div>
                      <div className="rounded-lg bg-[#1d1d1d] p-3"><p className="text-[9px] text-[#777]">GAPS FOUND</p><p className="mt-2 font-mono text-[20px] text-white">{breakGaps.length}</p></div>
                    </div>
                    {breakGaps.length > 0 ? <div className="mt-3 space-y-2">
                      {breakGaps.slice(-4).reverse().map((gap, index) => (
                        <div key={`${gap.start}-${index}`} className="flex items-center justify-between gap-3 border-b border-[#292929] py-2 text-[10px]">
                          <div className="min-w-0"><p className="truncate text-[#d0d0d0]">{gap.reason}</p><p className="mt-0.5 text-[#666]">{new Date(gap.start).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} – {new Date(gap.end).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</p></div>
                          <span className="shrink-0 font-mono text-[#aaa]">{formatCompact(gap.seconds)}</span>
                        </div>
                      ))}
                    </div> : <p className="mt-4 py-4 text-center text-[10px] text-[#777]">Break gaps appear after you stop a session and start another. Gap time is an estimate, not a verified break timer.</p>}
                  </div>
                </div>

                <div className="mt-4 rounded-xl border border-[#292929] bg-[#151515] p-4 sm:p-5">
                  <div className="mb-4 flex items-center justify-between"><div><h2 className="text-[13px] font-semibold text-white">Recent focus sessions</h2><p className="mt-1 text-[10px] text-[#777]">Your recorded sessions in {periodLabel.toLowerCase()}</p></div><Clock3 size={16} className="text-[#FF7628]" /></div>
                  {validSessions.length === 0 ? <p className="py-8 text-center text-[11px] text-[#777]">No sessions recorded in this period.</p> : (
                    <div className="divide-y divide-[#292929]">{[...validSessions].reverse().slice(0, 12).map(session => (
                      <div key={session.id} className="flex items-center justify-between gap-3 py-3">
                        <div className="min-w-0"><p className="truncate text-[11px] font-medium text-[#ddd]">{session.subject_name || "Study session"}</p><p className="mt-1 text-[9px] text-[#777]">{new Date(session.started_at).toLocaleDateString()} · {new Date(session.started_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}{session.ended_at ? ` – ${new Date(session.ended_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}` : " · In progress"}</p></div>
                        <span className="shrink-0 font-mono text-[11px] text-[#FF9A5C]">{formatCompact(durationFor(session))}</span>
                      </div>
                    ))}</div>
                  )}
                </div>
              </>
            )}
          </section>
        );
      })()}

      {/* GROUPS */}
      {selectedTab === "Groups" && <GroupsPanel />}

      {/* COMMUNITY */}
      {selectedTab === "Community" && <CommunityPanel />}

      {/* SHARE STUDY CARD MODAL */}
      {shareOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 px-4 py-4"
          onClick={() => setShareOpen(false)}
        >
          <div
            onClick={event => event.stopPropagation()}
            className="max-h-[94vh] w-full max-w-[380px] overflow-y-auto rounded-xl border border-[#383838] bg-[#1d1d1d] p-4 shadow-2xl"
          >
            <div className="mb-3 flex items-center justify-between">
              <div>
                <h2 className="text-[14px] font-semibold text-white">Share your study card</h2>
                <p className="mt-0.5 text-[10px] text-[#777777]">Perfect for Instagram, Snapchat & WhatsApp stories</p>
              </div>
              <button onClick={() => setShareOpen(false)} className="text-[#888888] hover:text-white">
                <X size={17} />
              </button>
            </div>

            <div className="overflow-hidden rounded-lg border border-[#2b2b2b] bg-[#111111]">
              {shareImage ? (
                <img
                  src={shareImage}
                  alt="Your Tapasya study card"
                  className="mx-auto max-h-[56vh] w-auto"
                />
              ) : (
                <div className="flex h-[300px] items-center justify-center text-[11px] text-[#777777]">
                  Creating your card…
                </div>
              )}
            </div>

            <div className="mt-3 flex items-center justify-center gap-2">
              {SHARE_THEMES.map(theme => (
                <button
                  key={theme.id}
                  type="button"
                  onClick={() => changeShareTheme(theme.id)}
                  className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[11px] font-medium transition ${
                    shareTheme === theme.id
                      ? "border-white/70 bg-[#292929] text-white"
                      : "border-[#383838] text-[#999999] hover:border-[#555555] hover:text-white"
                  }`}
                >
                  <span
                    className="h-3 w-3 rounded-full"
                    style={{ background: `linear-gradient(135deg, ${theme.accent}, ${theme.accent2})` }}
                  />
                  {theme.label}
                </button>
              ))}
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2">
              <button
                onClick={handleShareCard}
                disabled={shareBusy || !shareImage}
                className="flex items-center justify-center gap-2 rounded bg-[#D97736] py-2.5 text-[12px] font-medium text-white hover:bg-[#c56a30] disabled:opacity-40"
              >
                <Share2 size={14} /> {shareBusy ? "Sharing…" : "Share"}
              </button>
              <button
                onClick={handleDownloadCard}
                disabled={!shareImage}
                className="flex items-center justify-center gap-2 rounded border border-[#383838] py-2.5 text-[12px] font-medium text-[#d0d0d0] hover:bg-[#292929] disabled:opacity-40"
              >
                <Download size={14} /> Download
              </button>
            </div>
          </div>
        </div>
      )}

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
      <style jsx global>{`
        .tapasya-theme[data-theme="light"] { background:#f5f5f4 !important; color:#242424 !important; color-scheme:light; }
        .tapasya-theme[data-theme="light"] [class~="bg-[#111111]"] { background:#f5f5f4 !important; }
        .tapasya-theme[data-theme="light"] [class~="bg-[#151515]"], .tapasya-theme[data-theme="light"] [class~="bg-[#191919]"], .tapasya-theme[data-theme="light"] [class~="bg-[#1a1a1a]"], .tapasya-theme[data-theme="light"] [class~="bg-[#1b1b1b]"], .tapasya-theme[data-theme="light"] [class~="bg-[#1c1c1c]"], .tapasya-theme[data-theme="light"] [class~="bg-[#202020]"], .tapasya-theme[data-theme="light"] [class~="bg-[#222222]"], .tapasya-theme[data-theme="light"] [class~="bg-[#242424]"], .tapasya-theme[data-theme="light"] [class~="bg-[#252525]"], .tapasya-theme[data-theme="light"] [class~="bg-[#292929]"], .tapasya-theme[data-theme="light"] [class~="bg-[#303030]"], .tapasya-theme[data-theme="light"] [class~="bg-[#30251f]"], .tapasya-theme[data-theme="light"] [class~="bg-[#1c1713]"] { background:#ffffff !important; }
        .tapasya-theme[data-theme="light"] [class~="text-white"], .tapasya-theme[data-theme="light"] [class~="text-[#e5e5e5]"], .tapasya-theme[data-theme="light"] [class~="text-[#e0e0e0]"], .tapasya-theme[data-theme="light"] [class~="text-[#dddddd]"], .tapasya-theme[data-theme="light"] [class~="text-[#d0d0d0]"], .tapasya-theme[data-theme="light"] [class~="text-[#cccccc]"], .tapasya-theme[data-theme="light"] [class~="text-[#cfcfcf]"] { color:#242424 !important; }
        .tapasya-theme[data-theme="light"] [class~="text-[#999999]"], .tapasya-theme[data-theme="light"] [class~="text-[#888888]"], .tapasya-theme[data-theme="light"] [class~="text-[#777777]"], .tapasya-theme[data-theme="light"] [class~="text-[#666666]"], .tapasya-theme[data-theme="light"] [class~="text-[#555555]"], .tapasya-theme[data-theme="light"] [class~="text-[#5f5f5f]"] { color:#737373 !important; }
        .tapasya-theme[data-theme="light"] [class*="border-[#"] { border-color:#e5e5e5 !important; }
        .tapasya-theme[data-theme="light"] input, .tapasya-theme[data-theme="light"] textarea, .tapasya-theme[data-theme="light"] select { background:#ffffff !important; color:#242424 !important; border-color:#d4d4d4 !important; }
        .tapasya-theme[data-theme="amoled"] { background:#000000 !important; color:#d0d0d0 !important; color-scheme:dark; }

        /* AMOLED: keep the page background true black, but give interactive
           surfaces enough separation to remain visible. Do not flatten every
           Tailwind background (that also erased orange buttons and message cards). */
        .tapasya-theme[data-theme="amoled"] [class~="bg-[#111111]"],
        .tapasya-theme[data-theme="amoled"] [class~="bg-[#141414]"],
        .tapasya-theme[data-theme="amoled"] [class~="bg-[#151515]"] { background-color:#080808 !important; }

        .tapasya-theme[data-theme="amoled"] [class~="bg-[#181818]"],
        .tapasya-theme[data-theme="amoled"] [class~="bg-[#191919]"],
        .tapasya-theme[data-theme="amoled"] [class~="bg-[#1b1b1b]"],
        .tapasya-theme[data-theme="amoled"] [class~="bg-[#1d1d1d]"],
        .tapasya-theme[data-theme="amoled"] [class~="bg-[#202020]"],
        .tapasya-theme[data-theme="amoled"] [class~="bg-[#222222]"] { background-color:#101010 !important; }

        .tapasya-theme[data-theme="amoled"] [class~="bg-[#242424]"],
        .tapasya-theme[data-theme="amoled"] [class~="bg-[#252525]"],
        .tapasya-theme[data-theme="amoled"] [class~="bg-[#262626]"],
        .tapasya-theme[data-theme="amoled"] [class~="bg-[#292929]"],
        .tapasya-theme[data-theme="amoled"] [class~="bg-[#303030]"],
        .tapasya-theme[data-theme="amoled"] [class~="bg-[#333333]"],
        .tapasya-theme[data-theme="amoled"] [class~="bg-[#3a3a3a]"] { background-color:#171717 !important; }

        .tapasya-theme[data-theme="amoled"] [class*="border-[#"] { border-color:#242424 !important; }
        .tapasya-theme[data-theme="amoled"] [class~="text-[#777777]"],
        .tapasya-theme[data-theme="amoled"] [class~="text-[#666666]"] { color:#858585 !important; }
      `}</style>
    </main>
  );
}