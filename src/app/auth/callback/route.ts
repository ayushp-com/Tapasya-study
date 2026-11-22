
import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  console.log("========== AUTH CALLBACK ==========");
  console.log("CALLBACK ROUTE HIT");

  if (!code) {
    console.error("No authorization code received");

    return NextResponse.redirect(
      new URL("/auth?error=missing_code", origin)
    );
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // Verify environment variables.
  console.log("SUPABASE CALLBACK ENV CHECK:", {
    hasUrl: Boolean(supabaseUrl),
    hasKey: Boolean(supabaseKey),
  });

  if (!supabaseUrl || !supabaseKey) {
    console.error("Supabase environment variables are missing.");

    return NextResponse.redirect(
      new URL("/auth?error=server_config", origin)
    );
  }

  // Create response to preserve Supabase session cookies.
  const response = NextResponse.redirect(new URL("/", origin));

  const supabase = createServerClient(
    supabaseUrl,
    supabaseKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  // Exchange OAuth code for session.
  const { data, error } =
    await supabase.auth.exchangeCodeForSession(code);

  console.log("SESSION EXCHANGE:", {
    userFound: !!data.user,
    error: error?.message ?? null,
  });

  if (error || !data.user) {
    console.error("Authentication failed:", error?.message);

    return NextResponse.redirect(
      new URL("/auth?error=callback", origin)
    );
  }

  console.log("Authenticated user:", data.user.id);

  // Fetch profile.
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("username, exam, age")
    .eq("id", data.user.id)
    .maybeSingle();

  console.log("PROFILE RESULT:", {
    profileFound: !!profile,
    username: profile?.username ?? null,
    exam: profile?.exam ?? null,
    age: profile?.age ?? null,
    error: profileError?.message ?? null,
  });

  if (profileError) {
    console.error("PROFILE ERROR DETAILS:", {
      message: profileError.message,
      code: profileError.code,
      details: profileError.details,
      hint: profileError.hint,
    });

    response.headers.set(
      "Location",
      new URL("/auth?error=profile", origin).toString()
    );

    return response;
  }

  // Check onboarding completion.
  const profileComplete =
    !!profile?.username &&
    !!profile?.exam &&
    profile?.age != null;

  const destination = profileComplete
    ? "/"
    : "/auth/setup";

  console.log("PROFILE COMPLETE:", profileComplete);
  console.log("REDIRECTING TO:", destination);
  console.log("===================================");

  // Preserve session cookies and redirect.
  response.headers.set(
    "Location",
    new URL(destination, origin).toString()
  );

  return response;
}
