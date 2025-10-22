"use client"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [otp, setOtp] = useState("")
  const [step, setStep] = useState<"email" | "otp">("email")
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")
  const router = useRouter()
  const supabase = createClient()

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage("")
    setError("")

    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          shouldCreateUser: true
        }
      })

      if (error) {
        setError(error.message)
      } else {
        setMessage("Check your email for the 6-digit code!")
        setStep("otp")
      }
    } catch {
      setError("Network error. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage("")
    setError("")

    try {
      const { error } = await supabase.auth.verifyOtp({
        email,
        token: otp,
        type: "email"
      })

      if (error) {
        setError(error.message)
      } else {
        setMessage("Success! Redirecting...")
        router.push("/dashboard")
      }
    } catch {
      setError("Network error. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const handleResendCode = async () => {
    setLoading(true)
    setMessage("")
    setError("")

    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          shouldCreateUser: true
        }
      })

      if (error) {
        setError(error.message)
      } else {
        setMessage("New code sent! Check your email.")
      }
    } catch {
      setError("Network error. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const handleBackToEmail = () => {
    setStep("email")
    setOtp("")
    setMessage("")
    setError("")
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px",
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
      }}
    >
      <div style={{ maxWidth: "450px", width: "100%" }}>
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <Link href="/">
            <div
              style={{
                background: "white",
                padding: "30px 50px",
                borderRadius: "20px",
                display: "inline-block",
                boxShadow: "0 10px 30px rgba(0, 0, 0, 0.3)",
                cursor: "pointer"
              }}
            >
              <Image
                src="/images/invva.png"
                alt="Invva Logo"
                width={200}
                height={60}
                style={{ maxWidth: "200px", height: "auto" }}
                priority
              />
            </div>
          </Link>
        </div>

        {/* Login Card */}
        <div
          style={{
            background: "white",
            borderRadius: "16px",
            padding: "2.5rem",
            boxShadow: "0 20px 60px rgba(0, 0, 0, 0.3)"
          }}
        >
          <h2
            style={{
              fontSize: "2rem",
              fontWeight: "600",
              marginBottom: "0.5rem",
              color: "#1f2937"
            }}
          >
            {step === "email" ? "Welcome back" : "Enter code"}
          </h2>
          <p
            style={{
              color: "#6b7280",
              marginBottom: "2rem",
              fontSize: "0.95rem"
            }}
          >
            {step === "email" ? "Sign in with your email to continue" : `We sent a 6-digit code to ${email}`}
          </p>

          {/* Email Step */}
          {step === "email" && (
            <form onSubmit={handleSendCode}>
              <div style={{ marginBottom: "1.5rem" }}>
                <label
                  htmlFor="email"
                  style={{
                    display: "block",
                    fontSize: "0.875rem",
                    fontWeight: "500",
                    color: "#374151",
                    marginBottom: "0.5rem"
                  }}
                >
                  Email address
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  disabled={loading}
                  style={{
                    width: "100%",
                    padding: "0.75rem 1rem",
                    border: "1px solid #d1d5db",
                    borderRadius: "8px",
                    fontSize: "1rem",
                    outline: "none",
                    transition: "border-color 0.2s"
                  }}
                  onFocus={(e) => (e.target.style.borderColor = "#667eea")}
                  onBlur={(e) => (e.target.style.borderColor = "#d1d5db")}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                style={{
                  width: "100%",
                  padding: "0.75rem 1rem",
                  background: loading ? "#9ca3af" : "#667eea",
                  color: "white",
                  border: "none",
                  borderRadius: "8px",
                  fontSize: "1rem",
                  fontWeight: "500",
                  cursor: loading ? "not-allowed" : "pointer",
                  transition: "background 0.2s"
                }}
                onMouseEnter={(e) => {
                  if (!loading) e.currentTarget.style.background = "#5568d3"
                }}
                onMouseLeave={(e) => {
                  if (!loading) e.currentTarget.style.background = "#667eea"
                }}
              >
                {loading ? "Sending..." : "Send code"}
              </button>
            </form>
          )}

          {/* OTP Step */}
          {step === "otp" && (
            <form onSubmit={handleVerifyCode}>
              <div style={{ marginBottom: "1.5rem" }}>
                <label
                  htmlFor="otp"
                  style={{
                    display: "block",
                    fontSize: "0.875rem",
                    fontWeight: "500",
                    color: "#374151",
                    marginBottom: "0.5rem"
                  }}
                >
                  6-digit code
                </label>
                <input
                  id="otp"
                  type="text"
                  required
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  placeholder="000000"
                  disabled={loading}
                  maxLength={6}
                  style={{
                    width: "100%",
                    padding: "0.75rem 1rem",
                    border: "1px solid #d1d5db",
                    borderRadius: "8px",
                    fontSize: "1.5rem",
                    fontWeight: "600",
                    textAlign: "center",
                    letterSpacing: "0.5rem",
                    outline: "none",
                    transition: "border-color 0.2s"
                  }}
                  onFocus={(e) => (e.target.style.borderColor = "#667eea")}
                  onBlur={(e) => (e.target.style.borderColor = "#d1d5db")}
                  autoFocus
                />
              </div>

              <button
                type="submit"
                disabled={loading || otp.length !== 6}
                style={{
                  width: "100%",
                  padding: "0.75rem 1rem",
                  background: loading || otp.length !== 6 ? "#9ca3af" : "#667eea",
                  color: "white",
                  border: "none",
                  borderRadius: "8px",
                  fontSize: "1rem",
                  fontWeight: "500",
                  cursor: loading || otp.length !== 6 ? "not-allowed" : "pointer",
                  transition: "background 0.2s",
                  marginBottom: "1rem"
                }}
                onMouseEnter={(e) => {
                  if (!loading && otp.length === 6) e.currentTarget.style.background = "#5568d3"
                }}
                onMouseLeave={(e) => {
                  if (!loading && otp.length === 6) e.currentTarget.style.background = "#667eea"
                }}
              >
                {loading ? "Verifying..." : "Verify code"}
              </button>

              <div style={{ display: "flex", gap: "0.5rem", fontSize: "0.875rem" }}>
                <button
                  type="button"
                  onClick={handleResendCode}
                  disabled={loading}
                  style={{
                    flex: 1,
                    padding: "0.5rem",
                    background: "transparent",
                    color: "#667eea",
                    border: "1px solid #667eea",
                    borderRadius: "6px",
                    cursor: loading ? "not-allowed" : "pointer",
                    fontWeight: "500"
                  }}
                >
                  Resend code
                </button>
                <button
                  type="button"
                  onClick={handleBackToEmail}
                  disabled={loading}
                  style={{
                    flex: 1,
                    padding: "0.5rem",
                    background: "transparent",
                    color: "#6b7280",
                    border: "1px solid #d1d5db",
                    borderRadius: "6px",
                    cursor: loading ? "not-allowed" : "pointer",
                    fontWeight: "500"
                  }}
                >
                  Change email
                </button>
              </div>
            </form>
          )}

          {/* Success Message */}
          {message && (
            <div
              style={{
                marginTop: "1rem",
                padding: "0.75rem 1rem",
                background: "#d1fae5",
                border: "1px solid #6ee7b7",
                borderRadius: "8px",
                color: "#065f46",
                fontSize: "0.875rem"
              }}
            >
              ✓ {message}
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div
              style={{
                marginTop: "1rem",
                padding: "0.75rem 1rem",
                background: "#fee2e2",
                border: "1px solid #fca5a5",
                borderRadius: "8px",
                color: "#991b1b",
                fontSize: "0.875rem"
              }}
            >
              ✕ {error}
            </div>
          )}

          {/* Footer */}
          <p
            style={{
              marginTop: "1.5rem",
              textAlign: "center",
              fontSize: "0.875rem",
              color: "#6b7280"
            }}
          >
            {step === "email"
              ? "We'll email you a 6-digit code. No password needed."
              : "Check your email for the code. It expires in 10 minutes."}
          </p>
        </div>

        {/* Back to Home */}
        <div style={{ textAlign: "center", marginTop: "1.5rem" }}>
          <Link
            href="/"
            style={{
              color: "white",
              textDecoration: "none",
              fontSize: "0.875rem",
              opacity: 0.9
            }}
            onMouseEnter={(e) => (e.currentTarget.style.textDecoration = "underline")}
            onMouseLeave={(e) => (e.currentTarget.style.textDecoration = "none")}
          >
            ← Back to home
          </Link>
        </div>
      </div>
    </div>
  )
}
