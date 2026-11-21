"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Mail,
  Loader2,
  Eye,
  EyeOff,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type Screen = "welcome" | "methods" | "email";
type AuthMode = "signin" | "signup";

function GoogleIcon() {
  return (
    <svg viewBox="0 0 48 48" className="h-4 w-4" aria-hidden="true">
      <path
        fill="#EA4335"
        d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5Z"
      />
      <path
        fill="#4285F4"
        d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.72 7.18l7.62 5.91c4.45-4.1 7.14-10.14 7.14-17.56Z"
      />
      <path
        fill="#FBBC05"
        d="M10.54 28.59A14.4 14.4 0 0 1 9.75 24c0-1.59.27-3.13.76-4.59l-7.98-6.19A23.9 23.9 0 0 0 0 24c0 3.88.93 7.55 2.56 10.78l7.98-6.19Z"
      />
      <path
        fill="#34A853"
        d="M24 48c6.48 0 11.93-2.13 15.9-5.89l-7.62-5.91c-2.12 1.43-4.84 2.28-8.28 2.28-6.26 0-11.57-4.22-13.46-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48Z"
      />
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/* STUDY SCENE: a boy studying under a flickering lamp (SVG + CSS)     */
/* ------------------------------------------------------------------ */
function StudyScene() {
  return (
    <div
      className="scene"
      role="img"
      aria-label="A boy studying late at night under a flickering desk lamp"
    >
      <div className="room-glow" />
      <svg
        viewBox="0 0 360 320"
        className="h-full w-full overflow-visible"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="cone" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#FFD58A" stopOpacity="0.55" />
            <stop offset="100%" stopColor="#FFB45A" stopOpacity="0.04" />
          </linearGradient>
          <radialGradient id="warm" cx="0.5" cy="0.5" r="0.5">
            <stop offset="0%" stopColor="#FFC670" stopOpacity="0.30" />
            <stop offset="100%" stopColor="#FFC670" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="metal" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#FFF0D5" />
            <stop offset="100%" stopColor="#B88B58" />
          </linearGradient>
          <filter id="blur6">
            <feGaussianBlur stdDeviation="6" />
          </filter>
        </defs>

        {/* window + night sky */}
        <rect x="14" y="14" width="84" height="92" rx="4" fill="#0B1022" stroke="#2A3050" strokeWidth="3" />
        <path d="M68 34a14 14 0 1 0 12 22a11 11 0 1 1 -12 -22Z" fill="#F3E7C4" />
        <circle className="star s1" cx="30" cy="34" r="1.5" fill="#fff" />
        <circle className="star s2" cx="46" cy="70" r="1.2" fill="#fff" />
        <circle className="star s3" cx="82" cy="82" r="1.4" fill="#fff" />
        <circle className="star s4" cx="28" cy="88" r="1" fill="#fff" />
        <path d="M56 14V106M14 60H98" stroke="#2A3050" strokeWidth="3" />

        {/* floor */}
        <ellipse cx="180" cy="302" rx="170" ry="9" fill="#1A1613" />

        {/* desk (behind the boy's legs) */}
        <rect x="106" y="208" width="6" height="92" fill="#3A2A1E" />
        <rect x="334" y="208" width="8" height="92" fill="#3A2A1E" />
        <rect x="104" y="200" width="244" height="9" rx="2" fill="#6B4A32" />
        <rect x="104" y="200" width="244" height="2.5" rx="1" fill="#8A6444" />

        {/* chair */}
        <rect x="24" y="148" width="11" height="98" rx="5" fill="#3B2F28" />
        <rect x="28" y="240" width="70" height="11" rx="5" fill="#4A3B32" />
        <rect x="60" y="251" width="5" height="36" fill="#2B2420" />
        <path d="M38 291H86" stroke="#2B2420" strokeWidth="4" strokeLinecap="round" />
        <circle cx="40" cy="296" r="4" fill="#1F1A17" />
        <circle cx="84" cy="296" r="4" fill="#1F1A17" />

        {/* boy: legs */}
        <path d="M60 238 L140 238 L142 296" stroke="#26304A" strokeWidth="15" strokeLinecap="round" strokeLinejoin="round" />
        <ellipse cx="148" cy="298" rx="13" ry="5" fill="#E8E2D6" />

        {/* boy: torso */}
        <path d="M50 242C44 202 58 166 86 142L118 152C114 188 102 218 92 242Z" fill="#B8541E" />
        <path className="rim" d="M118 152C114 188 102 218 92 242" stroke="#FFB070" strokeWidth="3" strokeLinecap="round" />

        {/* boy: head (nods slowly) */}
        <g className="head">
          <rect x="108" y="138" width="13" height="16" rx="5" fill="#D79A68" />
          <circle cx="122" cy="126" r="18" fill="#E0A878" />
          <path d="M103 126C98 104 124 94 140 108C130 106 118 110 113 128Z" fill="#18110D" />
          <path d="M138 126c4 1 5 4 2 6" stroke="#B9814F" strokeWidth="2" strokeLinecap="round" />
          <path className="blink" d="M132 124h4" stroke="#18110D" strokeWidth="2.2" strokeLinecap="round" />
          <path className="rim" d="M138 108C141 118 140 128 138 134" stroke="#FFC98A" strokeWidth="2" strokeLinecap="round" opacity="0.8" />
        </g>

        {/* notebook */}
        <path d="M148 200L160 190H236L226 200Z" fill="#F3E6CC" />
        <path d="M168 195H222M172 198H214" stroke="#C9B48C" strokeWidth="1" />
        <path className="page-glow" d="M148 200L160 190H236L226 200Z" fill="#FFD58A" />

        {/* boy: writing arm */}
        <path d="M96 154L130 194" stroke="#B8541E" strokeWidth="13" strokeLinecap="round" />
        <g className="writing">
          <path d="M130 194L168 196" stroke="#C9622B" strokeWidth="11" strokeLinecap="round" />
          <circle cx="173" cy="196" r="5.5" fill="#E0A878" />
          <path d="M184 183L174 197" stroke="#2B2B2B" strokeWidth="2.4" strokeLinecap="round" />
        </g>

        {/* mug + steam */}
        <rect x="262" y="180" width="18" height="20" rx="3" fill="#E8DCC4" />
        <path d="M280 185c8 0 8 10 0 10" stroke="#E8DCC4" strokeWidth="2.5" />
        <path className="steam st1" d="M267 176c-4-6 4-8 0-14" stroke="#CFC6B4" strokeWidth="2" strokeLinecap="round" />
        <path className="steam st2" d="M275 176c-4-6 4-8 0-14" stroke="#CFC6B4" strokeWidth="2" strokeLinecap="round" />

        {/* lamp light cone + dust */}
        <path className="beam" d="M196 86L226 104L270 200L130 200Z" fill="url(#cone)" filter="url(#blur6)" />
        <circle className="mote m1" cx="190" cy="140" r="1.6" fill="#FFE2A8" />
        <circle className="mote m2" cx="215" cy="160" r="1.3" fill="#FFE2A8" />
        <circle className="mote m3" cx="170" cy="170" r="1.5" fill="#FFE2A8" />

        {/* desk lamp: fixed base + subtly moving upper assembly */}
        <ellipse cx="304" cy="199" rx="26" ry="6" fill="#A77C4E" />
        <path d="M304 196L280 132" stroke="url(#metal)" strokeWidth="9" strokeLinecap="round" />
        <circle cx="280" cy="132" r="8" fill="#D9B887" />
        <circle cx="280" cy="132" r="3" fill="#FFF0D5" />
        <g className="lamp-upper">
          <path d="M280 132L246 74" stroke="url(#metal)" strokeWidth="8" strokeLinecap="round" />
          <path d="M196 86C190 62 214 40 240 48C256 54 250 84 226 104Z" fill="#F4DDB0" />
          <path d="M196 86L226 104" stroke="#2A2118" strokeWidth="4" strokeLinecap="round" />
          <path d="M201 88C211 80 222 75 236 73" stroke="#FFF0D5" strokeWidth="2" strokeLinecap="round" opacity="0.8" />
          <circle className="bulb" cx="211" cy="96" r="5" fill="#FFF3C9" />
        </g>

        {/* warm ambient light over the whole scene */}
        <ellipse className="ambient" cx="190" cy="140" rx="190" ry="150" fill="url(#warm)" pointerEvents="none" />
      </svg>

      <style jsx>{`
        .scene {
          position: relative;
          width: min(520px, 94vw);
          aspect-ratio: 360 / 320;
        }
        .room-glow {
          position: absolute;
          inset: -20% -10%;
          background: radial-gradient(
            closest-side at 58% 42%,
            rgba(255, 170, 80, 0.16),
            transparent 70%
          );
          animation: flicker 4.6s infinite;
          pointer-events: none;
        }
        svg :global(*) {
          transform-box: fill-box;
        }
        .head {
          transform-origin: 14px 28px;
          animation: nod 6s ease-in-out infinite;
        }
        .writing {
          animation: write 1.3s ease-in-out infinite;
        }
        .blink {
          animation: blink 5s infinite;
          transform-origin: center;
        }
        .beam,
        .bulb,
        .page-glow,
        .ambient,
        .rim {
          animation: flicker 4.6s infinite;
        }
        .lamp-upper {
          transform-box: view-box;
          transform-origin: 280px 132px;
          animation: lamp-adjust 6.5s ease-in-out infinite;
        }
        .page-glow {
          opacity: 0.25;
        }
        .star {
          animation: twinkle 3s ease-in-out infinite;
        }
        .s2 { animation-delay: 0.8s; }
        .s3 { animation-delay: 1.6s; }
        .s4 { animation-delay: 2.2s; }
        .steam {
          opacity: 0;
          animation: steam 3.2s ease-out infinite;
        }
        .st2 { animation-delay: 1.4s; }
        .mote {
          animation: drift 7s ease-in-out infinite;
        }
        .m2 { animation-delay: 2s; }
        .m3 { animation-delay: 4s; }

        @keyframes flicker {
          0%, 100% { opacity: 1; }
          6% { opacity: 0.82; }
          9% { opacity: 1; }
          47% { opacity: 0.94; }
          50% { opacity: 0.5; }
          52% { opacity: 0.95; }
          55% { opacity: 0.62; }
          58% { opacity: 1; }
          82% { opacity: 0.9; }
        }
        @keyframes lamp-adjust {
          0%, 100% { transform: rotate(0deg); }
          32% { transform: rotate(-1.6deg); }
          68% { transform: rotate(1deg); }
        }
        @keyframes nod {
          0%, 100% { transform: rotate(0deg); }
          45% { transform: rotate(5deg); }
          70% { transform: rotate(2deg); }
        }
        @keyframes write {
          0%, 100% { transform: translate(0, 0); }
          25% { transform: translate(4px, 0.5px); }
          50% { transform: translate(1px, 0); }
          75% { transform: translate(6px, 0.5px); }
        }
        @keyframes blink {
          0%, 94%, 100% { transform: scaleY(1); }
          97% { transform: scaleY(0.1); }
        }
        @keyframes twinkle {
          0%, 100% { opacity: 0.25; }
          50% { opacity: 1; }
        }
        @keyframes steam {
          0% { opacity: 0; transform: translateY(6px); }
          30% { opacity: 0.7; }
          100% { opacity: 0; transform: translateY(-14px); }
        }
        @keyframes drift {
          0%, 100% { transform: translate(0, 0); opacity: 0; }
          30% { opacity: 0.9; }
          60% { transform: translate(10px, -14px); opacity: 0.6; }
        }
        @media (prefers-reduced-motion: reduce) {
          * { animation: none !important; }
          .steam { opacity: 0.4; }
        }
      `}</style>
    </div>
  );
}

export default function AuthPage() {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  // Render only after mount so server HTML and the first client render always
  // match (prevents hydration errors from stale HMR, extensions, etc.)
  const [mounted, setMounted] = useState(false);
  const [introExpanded, setIntroExpanded] = useState(false);

  useEffect(() => {
    setMounted(true);
    const transitionTimer = window.setTimeout(() => {
      setIntroExpanded(true);
    }, 1500);
    return () => window.clearTimeout(transitionTimer);
  }, []);

  const [screen, setScreen] = useState<Screen>("welcome");
  const [mode, setMode] = useState<AuthMode>("signin");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  function clearMessages() {
    setError("");
    setMessage("");
  }

  function openMethods(nextMode: AuthMode) {
    setMode(nextMode);
    setScreen("methods");
    clearMessages();
  }

  function goBack() {
    clearMessages();

    if (screen === "email") {
      setScreen("methods");
    } else {
      setScreen("welcome");
    }
  }

  // Check whether the user's profile is complete.
  async function continueAfterLogin() {
    const { data: userData, error: userError } =
      await supabase.auth.getUser();

    if (userError || !userData.user) {
      setError("Unable to load your account. Please sign in again.");
      return;
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("username, exam, age")
      .eq("id", userData.user.id)
      .maybeSingle();

    if (profileError) {
      setError(profileError.message);
      return;
    }

    const profileComplete =
      !!profile?.username &&
      !!profile?.exam &&
      !!profile?.age;

    router.replace(profileComplete ? "/" : "/auth/setup");
    router.refresh();
  }

  // GOOGLE SIGN IN / SIGN UP
  async function signInWithGoogle() {
    setLoading(true);
    clearMessages();

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        setError(error.message);
        setLoading(false);
      }
    } catch {
      setError("Unable to connect. Please try again.");
      setLoading(false);
    }
  }

  // EMAIL SIGN IN / SIGN UP
  async function handleEmailAuth(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setLoading(true);
    clearMessages();

    try {
      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback`,
            data: {
              display_name: displayName.trim(),
            },
          },
        });

        if (error) {
          setError(error.message);
        } else if (data.session) {
          await continueAfterLogin();
        } else {
          setMessage(
            "Account created! Please check your email to confirm your account."
          );
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });

        if (error) {
          setError(error.message);
        } else {
          await continueAfterLogin();
        }
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (!mounted) return null;

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#111111] text-[#e5e5e5]">

      {/* WELCOME / SPLIT INTRO SCREEN */}
      {screen === "welcome" && (
        <section className="welcome-shell relative min-h-[100svh] w-full overflow-hidden bg-[#111111]">
          <div className={`welcome-left ${introExpanded ? "welcome-left-expanded" : ""}`}>
            <div className="welcome-brand">tapasya<span>.</span></div>
            <div className="welcome-art-wrap">
              <StudyScene />
              <p className="mt-1 px-4 text-center font-serif text-[15px] italic tracking-[0.01em] text-[#cbbfae]">
                Don&apos;t study alone — study together on Tapasya.
              </p>
            </div>
          </div>

          <div className={`welcome-right ${introExpanded ? "welcome-right-visible" : ""}`}>
            <div className="welcome-copy">
              <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.28em] text-[#ff7628]">
                Your space to grow
              </p>
              <h1 className="max-w-[520px] text-4xl font-semibold leading-[1.12] tracking-[-0.045em] text-[#f1eee9] sm:text-5xl lg:text-[58px]">
                Make every
                <span className="block text-[#ff7628]">hour count.</span>
              </h1>
              <p className="mt-6 max-w-[410px] text-[14px] leading-7 text-[#92908c] sm:text-[15px]">
                A space to focus deeply, find your people, and turn small study sessions into lasting progress.
              </p>

              <div className="mt-10 flex w-full max-w-[360px] flex-col gap-2.5">
                <button
                  onClick={() => openMethods("signup")}
                  className="h-[48px] rounded-[7px] bg-[#ff7628] text-[13px] font-semibold text-white transition hover:bg-[#f5681b]"
                >
                  Get started <span className="ml-2">→</span>
                </button>
                <button
                  onClick={() => openMethods("signin")}
                  className="h-[46px] rounded-[7px] border border-[#38332e] bg-transparent text-[13px] font-semibold text-[#d5cec5] transition hover:border-[#765039] hover:bg-[#191715]"
                >
                  I already have an account
                </button>
              </div>
            </div>
          </div>

          <style jsx>{`
            .welcome-shell { display: flex; }
            .welcome-left {
              position: absolute; inset: 0 auto 0 0; z-index: 2;
              width: 100%; display: flex; flex-direction: column;
              align-items: center; justify-content: center;
              padding: 34px 28px 26px; background: #111111;
              transition: width 1.25s cubic-bezier(.76,0,.18,1),
                padding 1.25s cubic-bezier(.76,0,.18,1);
            }
            .welcome-left-expanded { width: 50%; padding: 34px 34px 26px; }
            .welcome-brand { position: absolute; top: 34px; left: 42px; color: #e9e4dc; font-size: 15px; font-weight: 650; letter-spacing: -.04em; opacity: 0; transition: opacity .55s ease .75s; }
            .welcome-brand span { color: #ff7628; }
            .welcome-left-expanded .welcome-brand { opacity: 1; }
            .welcome-art-wrap { width: min(560px, 100%); display: flex; flex-direction: column; align-items: center; transform: translateY(-5px) scale(1); transition: transform 1.25s cubic-bezier(.76,0,.18,1); }
            .welcome-left-expanded .welcome-art-wrap { transform: translateY(-3px) scale(.86); }
            .welcome-art-wrap :global(.scene) { width: min(560px, 94vw); }
            .welcome-left-expanded .welcome-art-wrap :global(.scene) { width: min(490px, 42vw); }
            .welcome-left-footer { position: absolute; bottom: 28px; color: #625d56; font-size: 10px; letter-spacing: .04em; opacity: 0; transition: opacity .5s ease 1s; }
            .welcome-left-expanded .welcome-left-footer { opacity: 1; }
            .welcome-right { position: absolute; inset: 0 0 0 auto; width: 50%; display: flex; flex-direction: column; justify-content: center; padding: 80px clamp(30px, 7vw, 110px) 70px; opacity: 0; transform: translateX(48px); pointer-events: none; transition: opacity .8s ease .55s, transform 1s cubic-bezier(.2,.7,.2,1) .45s; }
            .welcome-right-visible { opacity: 1; transform: translateX(0); pointer-events: auto; }
            .welcome-copy { width: 100%; max-width: 540px; }
            @media (max-width: 760px) {
              .welcome-shell { min-height: 100svh; }
              .welcome-left { position: relative; width: 100%; min-height: 48svh; padding: 24px 18px 12px; }
              .welcome-left-expanded { width: 100%; min-height: 43svh; }
              .welcome-brand { top: 20px; left: 22px; }
              .welcome-art-wrap { transform: translateY(10px) scale(.76); }
              .welcome-left-expanded .welcome-art-wrap { transform: translateY(18px) scale(.62); }
              .welcome-art-wrap :global(.scene), .welcome-left-expanded .welcome-art-wrap :global(.scene) { width: min(390px, 88vw); }
              .welcome-right { position: relative; width: 100%; min-height: 57svh; padding: 22px 26px 64px; transform: translateY(24px); }
              .welcome-right-visible { transform: translateY(0); }
              .welcome-copy h1 { font-size: 39px; }
              .welcome-copy > p:nth-of-type(2) { margin-top: 12px; line-height: 1.65; }
              .welcome-copy .mt-10 { margin-top: 24px; }
            }
            @media (prefers-reduced-motion: reduce) {
              .welcome-left, .welcome-art-wrap, .welcome-right, .welcome-brand { transition: none !important; }
            }
          `}</style>
        </section>
      )}

      {/* SIGN IN METHODS SCREEN */}
      {screen === "methods" && (
        <section className="relative min-h-screen">
          <button
            onClick={goBack}
            className="absolute left-4 top-[66px] text-[#aaaaaa] transition hover:text-white"
            aria-label="Go back"
          >
            <ArrowLeft size={20} />
          </button>

          <div className="absolute left-4 top-[116px]">
            <h1 className="text-[21px] font-semibold tracking-tight text-[#dedede]">
              Tapasya
            </h1>

            <p className="mt-1 text-[22px] font-semibold text-[#ff7628]">
              {mode === "signin" ? "Sign in" : "Create account"}
            </p>
          </div>

          <div className="mx-auto flex w-full max-w-[280px] flex-col gap-2 pt-[216px]">
            {/* GOOGLE */}
            <button
              onClick={signInWithGoogle}
              disabled={loading}
              className="relative flex h-[39px] items-center justify-center rounded-[4px] border border-[#292929] text-[12px] font-medium text-[#cfcfcf] transition hover:bg-[#1c1c1c] disabled:opacity-50"
            >
              <span className="absolute left-5">
                <GoogleIcon />
              </span>

              {mode === "signin"
                ? "Sign in with Google"
                : "Sign up with Google"}
            </button>

            {/* EMAIL */}
            <button
              onClick={() => {
                setScreen("email");
                clearMessages();
              }}
              className="relative flex h-[39px] items-center justify-center rounded-[4px] border border-[#292929] text-[12px] font-medium text-[#cfcfcf] transition hover:bg-[#1c1c1c]"
            >
              <Mail
                size={15}
                className="absolute left-5 text-[#777777]"
              />

              {mode === "signin"
                ? "Sign in with email"
                : "Sign up with email"}
            </button>

            {loading && (
              <div className="flex justify-center pt-2">
                <Loader2
                  size={17}
                  className="animate-spin text-[#ff7628]"
                />
              </div>
            )}

            {error && (
              <p className="mt-2 rounded bg-red-500/10 p-2 text-center text-[11px] text-red-400">
                {error}
              </p>
            )}

            <button
              onClick={() => {
                setMode("signin");
                setScreen("email");
                clearMessages();
              }}
              className="mt-6 text-center text-[10px] text-[#888888] hover:text-white"
            >
              Find account
            </button>
          </div>
        </section>
      )}

      {/* EMAIL AUTH SCREEN */}
      {screen === "email" && (
        <section className="relative min-h-screen px-5">
          <button
            onClick={goBack}
            className="absolute left-4 top-[66px] text-[#aaaaaa] transition hover:text-white"
            aria-label="Go back"
          >
            <ArrowLeft size={20} />
          </button>

          <div className="mx-auto w-full max-w-[360px] pt-[116px]">
            <h1 className="text-[21px] font-semibold text-[#dedede]">
              Tapasya
            </h1>

            <p className="mt-1 text-[22px] font-semibold text-[#ff7628]">
              {mode === "signin" ? "Sign in with email" : "Create account"}
            </p>

            <form
              onSubmit={handleEmailAuth}
              className="mt-12 space-y-4"
            >
              {mode === "signup" && (
                <div>
                  <label className="mb-2 block text-[11px] text-[#999999]">
                    YOUR NAME
                  </label>

                  <input
                    required
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Enter your name"
                    maxLength={50}
                    className="h-[44px] w-full rounded-[4px] border border-[#303030] bg-[#171717] px-3 text-[13px] text-white outline-none placeholder:text-[#666666] focus:border-[#ff7628]"
                  />
                </div>
              )}

              <div>
                <label className="mb-2 block text-[11px] text-[#999999]">
                  EMAIL
                </label>

                <input
                  required
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  className="h-[44px] w-full rounded-[4px] border border-[#303030] bg-[#171717] px-3 text-[13px] text-white outline-none placeholder:text-[#666666] focus:border-[#ff7628]"
                />
              </div>

              <div>
                <label className="mb-2 block text-[11px] text-[#999999]">
                  PASSWORD
                </label>

                <div className="relative">
                  <input
                    required
                    type={showPassword ? "text" : "password"}
                    autoComplete={
                      mode === "signin"
                        ? "current-password"
                        : "new-password"
                    }
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="h-[44px] w-full rounded-[4px] border border-[#303030] bg-[#171717] px-3 pr-11 text-[13px] text-white outline-none placeholder:text-[#666666] focus:border-[#ff7628]"
                  />

                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#777777] hover:text-white"
                    aria-label={
                      showPassword ? "Hide password" : "Show password"
                    }
                  >
                    {showPassword ? (
                      <EyeOff size={16} />
                    ) : (
                      <Eye size={16} />
                    )}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="flex h-[43px] w-full items-center justify-center gap-2 rounded-[5px] bg-[#ff7628] text-[13px] font-semibold text-white transition hover:bg-[#f5681b] disabled:opacity-50"
              >
                {loading && (
                  <Loader2 size={15} className="animate-spin" />
                )}

                {mode === "signin" ? "Sign in" : "Create account"}
              </button>
            </form>

            {error && (
              <p className="mt-4 rounded bg-red-500/10 p-3 text-center text-[11px] text-red-400">
                {error}
              </p>
            )}

            {message && (
              <p className="mt-4 rounded bg-green-500/10 p-3 text-center text-[11px] text-green-400">
                {message}
              </p>
            )}

            <p className="mt-6 text-center text-[11px] text-[#888888]">
              {mode === "signin"
                ? "New to Tapasya?"
                : "Already have an account?"}{" "}

              <button
                onClick={() => {
                  setMode(mode === "signin" ? "signup" : "signin");
                  clearMessages();
                }}
                className="font-semibold text-[#ff7628] hover:text-[#ff985d]"
              >
                {mode === "signin" ? "Create account" : "Sign in"}
              </button>
            </p>
          </div>
        </section>
      )}
    </main>
  );
}