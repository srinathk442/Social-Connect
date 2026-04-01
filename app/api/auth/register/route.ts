import { NextResponse } from "next/server";
import { hashPassword, signToken } from "@/lib/auth";
import { registerSchema } from "@/lib/validators";
import { supabaseAdmin } from "@/lib/supabase";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = registerSchema.safeParse(body);

    if (!parsed.success) {
      const firstIssue = parsed.error.issues[0];
      return NextResponse.json(
        {
          error: firstIssue
            ? `${firstIssue.path.join(".") || "field"}: ${firstIssue.message}`
            : "Invalid request data",
          details: parsed.error.flatten(),
        },
        { status: 400 },
      );
    }

    const { email, username, password, first_name, last_name } = parsed.data;

    const { data: existingUser, error: existingUserError } = await supabaseAdmin
      .from("users")
      .select("id")
      .or(`email.eq.${email},username.eq.${username}`)
      .limit(1)
      .maybeSingle();

    if (existingUserError) {
      return NextResponse.json({ error: existingUserError.message }, { status: 500 });
    }

    if (existingUser) {
      return NextResponse.json(
        { error: "Email or username already in use" },
        { status: 409 },
      );
    }

    const password_hash = await hashPassword(password);

    const { data: createdUser, error: insertError } = await supabaseAdmin
      .from("users")
      .insert({
        email,
        username,
        password_hash,
        first_name,
        last_name,
      })
      .select("id, email, username, first_name, last_name, created_at")
      .single();

    if (insertError || !createdUser) {
      return NextResponse.json(
        { error: insertError?.message || "Unable to create user" },
        { status: 500 },
      );
    }

    const token = signToken({ userId: createdUser.id });
    const response = NextResponse.json(
      { message: "Registered successfully", user: createdUser, access_token: token },
      { status: 201 },
    );

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
