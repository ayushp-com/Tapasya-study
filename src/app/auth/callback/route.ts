import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

type CookieToSet = {
  name: string;
  value: string;
  options?: any;
};

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  const redirect = (path: string, cookies: CookieToSet[] = []) => {
    const response = NextResponse.redirect(new URL(path, origin));
    for (const cookie of cookies) {
      response.cookies.set(cookie.name, cookie.value, cookie.options);
    }
    return response;
  };

  if (!code) {
    console.error("[Auth callback] Missing OAuth authorization code.");
    return redirect("/auth?error=missing_code");
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  // Support the current anon key name and the newer publishable-key name.
  const supabaseKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error("[Auth callback] Supabase URL or public key is missing.", {
      hasUrl: Boolean(supabaseUrl),
      hasKey: Boolean(supabaseKey),
    });
    return redirect("/auth?error=server_config");
  }

  // Collect auth cookies first, then attach them to the final redirect response.
  // This avoids losing the session when choosing /auth/setup instead of /.
  const cookiesToSet: CookieToSet[] = [];

  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookies) {
        cookiesToSet.push(...cookies);
      },
    },
  });

  const { data, error } = await supabase.auth.exchangeCodeForSession(code);

  if (error || !data.user) {
    console.error("[Auth callback] OAuth code exchange failed:", error?.message);
    return redirect("/auth?error=callback", cookiesToSet);
  }

  // Read the canonical profile row. Do not use user metadata as a substitute:
  // onboarding is complete only when the required profile fields are saved.
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("username, exam, age")
    .eq("id", data.user.id)
    .maybeSingle();

  if (profileError) {
    console.error("[Auth callback] Could not read profile:", {
      message: profileError.message,
      code: profileError.code,
      details: profileError.details,
      hint: profileError.hint,
    });
    return redirect("/auth?error=profile", cookiesToSet);
  }

  const username =
    typeof profile?.username === "string" ? profile.username.trim() : "";
  const exam = typeof profile?.exam === "string" ? profile.exam.trim() : "";
  const ageValue = typeof profile?.age === "string"
    ? Number(profile.age.trim())
    : profile?.age;
  const ageIsValid =
    typeof ageValue === "number" &&
    Number.isFinite(ageValue) &&
    ageValue > 0;

  const profileComplete = Boolean(username && exam && ageIsValid);
  const destination = profileComplete ? "/" : "/auth/setup";

  console.info("[Auth callback] Profile check:", {
    userId: data.user.id,
    profileFound: Boolean(profile),
    hasUsername: Boolean(username),
    hasExam: Boolean(exam),
    hasValidAge: ageIsValid,
    destination,
  });

  return redirect(destination, cookiesToSet);
}
