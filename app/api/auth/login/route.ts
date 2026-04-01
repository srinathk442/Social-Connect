import { NextResponse } from "next/server";
import { comparePassword, signToken } from "@/lib/auth";
import { loginSchema } from "@/lib/validators";
import { supabaseAdmin } from "@/lib/supabase";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = loginSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request data", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const { identifier, password } = parsed.data;
    const isEmail = identifier.includes("@");
    const field = isEmail ? "email" : "username";

    const { data: user, error: userError } = await supabaseAdmin
      .from("users")
      .select("id, email, username, first_name, last_name, password_hash")
      .eq(field, identifier)
      .maybeSingle();

    if (userError) {
      return NextResponse.json({ error: userError.message }, { status: 500 });
    }

    if (!user) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    const passwordMatches = await comparePassword(password, user.password_hash);
    if (!passwordMatches) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    const { error: lastLoginError } = await supabaseAdmin
      .from("users")
      .update({ last_login: new Date().toISOString() })
      .eq("id", user.id);

    if (lastLoginError) {
      return NextResponse.json({ error: lastLoginError.message }, { status: 500 });
    }

    const token = signToken({ userId: user.id });
    const response = NextResponse.json({
      message: "Login successful",
      access_token: token,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        first_name: user.first_name,
        last_name: user.last_name,
      },
    });

    response.cookies.set("access_token", token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });

    return response;
  } catch (error) {
    return NextResponse.json(
      { error: "Server error", details: error instanceof Error ? error.message : null },
      { status: 500 },
    );
  }
}
