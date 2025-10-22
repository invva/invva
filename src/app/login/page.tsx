"use client"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage("")
    setError("")

    try {
      const res = await fetch("/api/auth/magic-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email })
      })

      const data = await res.json()

      if (res.ok) {
        setMessage(data.message)
        setEmail("") // Clear email field
      } else {
        setError(data.error || "Something went wrong")
      }
    } catch (err) {
      console.error("Network error:", err)
      setError("Network error. Please try again.")
    } finally {
      setLoading(false)
    }
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
            Welcome back
          </h2>
          <p
            style={{
              color: "#6b7280",
              marginBottom: "2rem",
              fontSize: "0.95rem"
            }}
          >
            Sign in with your email to continue
          </p>

          <form onSubmit={handleLogin}>
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
              {loading ? "Sending..." : "Send magic link"}
            </button>
          </form>

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
            No password needed. We&apos;ll email you a magic link.
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
