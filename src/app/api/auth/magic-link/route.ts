import { createSupabaseServer } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 })
    }

    const supabase = await createSupabaseServer()

    const redirectUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`

    console.log("Sending magic link to:", email)
    console.log("Redirect URL:", redirectUrl)

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: redirectUrl,
        shouldCreateUser: true
      }
    })

    if (error) {
      console.error("Magic link error:", error)
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({
      message: "Check your email for the magic link!"
    })
  } catch (error) {
    console.error("Unexpected error:", error)
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 })
  }
}
