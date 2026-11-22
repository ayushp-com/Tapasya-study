// Story / Reel / Snap friendly study card (1080 x 1920, 9:16).
// Put this file at: lib/shareCard.ts  (imported as "@/lib/shareCard")

export type ShareSubject = {
  name: string;
  color: string;
  seconds: number;
  targetHours: number;
};

export type ShareThemeId = "ember" | "ocean" | "neon";

type Theme = {
  id: ShareThemeId;
  label: string;
  accent: string;
  accent2: string;
  bg: string;
};

export const SHARE_THEMES: Theme[] = [
  { id: "ember", label: "Ember", accent: "#FF7628", accent2: "#FFC14D", bg: "#1a0d07" },
  { id: "ocean", label: "Ocean", accent: "#2196F3", accent2: "#5EEAD4", bg: "#07121d" },
  { id: "neon", label: "Neon", accent: "#A78BFA", accent2: "#F472B6", bg: "#150b21" },
];

export type ShareCardInput = {
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

export function formatClock(seconds: number) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
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

export function buildShareCanvas(input: ShareCardInput): HTMLCanvasElement | null {
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
  ctx.fillText(formatClock(totalSeconds), W / 2, 1060);
  ctx.restore();

  ctx.fillStyle = "#8a8a8a";
  ctx.font = `500 32px ${SANS}`;
  ctx.fillText("of focused study today", W / 2, 1112);

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
      ctx.fillText(formatClock(subject.seconds), W - 80, y);

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