"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import type { User } from "@supabase/supabase-js"

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const checkUser = async () => {
      const {
        data: { user }
      } = await supabase.auth.getUser()

      if (!user) {
        router.push("/login")
      } else {
        setUser(user)
      }
      setLoading(false)
    }

    checkUser()
  }, [router, supabase])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push("/")
  }

  if (loading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
          color: "white",
          fontSize: "1.2rem"
        }}
      >
        Loading...
      </div>
    )
  }

  if (!user) {
    return null // Will redirect to login
  }

  return (
    <div style={{ minHeight: "100vh", background: "#f3f4f6" }}>
      {/* Header */}
      <header
        style={{
          background: "white",
          borderBottom: "1px solid #e5e7eb",
          padding: "1rem 2rem"
        }}
      >
        <div
          style={{
            maxWidth: "1200px",
            margin: "0 auto",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center"
          }}
        >
          <h1 style={{ fontSize: "1.5rem", fontWeight: "600", color: "#1f2937" }}>Invva Dashboard</h1>
          <button
            onClick={handleSignOut}
            style={{
              padding: "0.5rem 1rem",
              background: "#667eea",
              color: "white",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer",
              fontSize: "0.875rem",
              fontWeight: "500"
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "#5568d3")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "#667eea")}
          >
            Sign Out
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main style={{ maxWidth: "1200px", margin: "0 auto", padding: "2rem" }}>
        <div
          style={{
            background: "white",
            borderRadius: "12px",
            padding: "2rem",
            boxShadow: "0 1px 3px rgba(0,0,0,0.1)"
          }}
        >
          <h2
            style={{
              fontSize: "1.5rem",
              fontWeight: "600",
              marginBottom: "1rem",
              color: "#1f2937"
            }}
          >
            Welcome! 🎉
          </h2>
          <p style={{ color: "#6b7280", marginBottom: "1rem" }}>You're successfully logged in as:</p>
          <div
            style={{
              background: "#f9fafb",
              padding: "1rem",
              borderRadius: "8px",
              border: "1px solid #e5e7eb"
            }}
          >
            <p style={{ fontFamily: "monospace", color: "#374151" }}>{user.email}</p>
          </div>

          <div
            style={{
              marginTop: "2rem",
              padding: "1rem",
              background: "#dbeafe",
              borderRadius: "8px",
              border: "1px solid #93c5fd"
            }}
          >
            <p style={{ color: "#1e40af", fontSize: "0.875rem" }}>
              🚧 This is a placeholder dashboard. We'll build the actual inventory management features in the next
              steps!
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}
