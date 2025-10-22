"use client"

import Image from "next/image"

export default function Home() {
  const features = [
    "Product tracking",
    "Stock movements",
    "Barcode scanning",
    "Mobile-first design",
    "Real-time updates",
    "Free to self-host"
  ]

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px",
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        color: "white"
      }}
    >
      <div
        style={{
          textAlign: "center",
          maxWidth: "700px",
          animation: "fadeIn 1s ease-in"
        }}
      >
        {/* Logo Container */}
        <div
          style={{
            background: "white",
            padding: "40px 60px",
            borderRadius: "20px",
            display: "inline-block",
            marginBottom: "3rem",
            boxShadow: "0 20px 60px rgba(0, 0, 0, 0.3)",
            transition: "transform 0.3s ease",
            cursor: "pointer"
          }}
          onMouseEnter={(e) => (e.currentTarget.style.transform = "translateY(-5px)")}
          onMouseLeave={(e) => (e.currentTarget.style.transform = "translateY(0)")}
        >
          <Image
            src="/images/invva.png"
            alt="Invva Logo"
            width={280}
            height={80}
            style={{ maxWidth: "280px", height: "auto", display: "block" }}
            priority
          />
        </div>

        {/* Tagline */}
        <p
          style={{
            fontSize: "1.8rem",
            marginBottom: "2rem",
            fontWeight: "500",
            lineHeight: "1.4",
            color: "white"
          }}
        >
          Simple inventory management for small businesses
        </p>

        {/* Status Box */}
        <div
          style={{
            background: "rgba(255, 255, 255, 0.15)",
            backdropFilter: "blur(10px)",
            padding: "2.5rem",
            borderRadius: "16px",
            marginBottom: "2.5rem",
            border: "1px solid rgba(255, 255, 255, 0.2)"
          }}
        >
          <h2
            style={{
              fontSize: "1.5rem",
              marginBottom: "1rem",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "10px",
              color: "white"
            }}
          >
            <span>🚧</span>
            <span>Under Development</span>
          </h2>

          <p
            style={{
              fontSize: "1.1rem",
              opacity: "0.9",
              lineHeight: "1.6",
              color: "white",
              marginBottom: "2rem"
            }}
          >
            We're building an open-source inventory management system that's actually simple to use. No complexity, no
            bloat—just the features small businesses need.
          </p>

          {/* Features Grid */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
              gap: "1rem",
              margin: "2rem 0",
              textAlign: "left"
            }}
          >
            {features.map((feature) => (
              <div
                key={feature}
                style={{
                  background: "rgba(255, 255, 255, 0.1)",
                  padding: "1rem",
                  borderRadius: "12px",
                  fontSize: "0.95rem",
                  color: "white"
                }}
              >
                <span
                  style={{
                    color: "#10b981",
                    fontWeight: "bold",
                    marginRight: "8px",
                    fontSize: "1.2rem"
                  }}
                >
                  ✓
                </span>
                {feature}
              </div>
            ))}
          </div>
        </div>

        {/* CTA Buttons */}
        <div
          style={{
            display: "flex",
            gap: "1rem",
            justifyContent: "center",
            flexWrap: "wrap",
            marginTop: "2rem"
          }}
        >
          <a
            href="/login"
            style={{
              color: "#667eea",
              textDecoration: "none",
              fontSize: "1.1rem",
              padding: "14px 28px",
              background: "white",
              borderRadius: "10px",
              display: "inline-block",
              transition: "all 0.3s ease",
              border: "2px solid white",
              fontWeight: "500",
              cursor: "pointer"
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "#f8f9fa"
              e.currentTarget.style.transform = "translateY(-2px)"
              e.currentTarget.style.boxShadow = "0 10px 30px rgba(0, 0, 0, 0.2)"
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "white"
              e.currentTarget.style.transform = "translateY(0)"
              e.currentTarget.style.boxShadow = "none"
            }}
          >
            Sign In / Start Trial
          </a>

          <a
            href="https://github.com/invva/invva"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              color: "white",
              textDecoration: "none",
              fontSize: "1.1rem",
              padding: "14px 28px",
              background: "rgba(255, 255, 255, 0.2)",
              borderRadius: "10px",
              display: "inline-block",
              transition: "all 0.3s ease",
              border: "2px solid rgba(255, 255, 255, 0.3)",
              fontWeight: "500",
              cursor: "pointer"
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "rgba(255, 255, 255, 0.3)"
              e.currentTarget.style.transform = "translateY(-2px)"
              e.currentTarget.style.boxShadow = "0 10px 30px rgba(0, 0, 0, 0.2)"
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "rgba(255, 255, 255, 0.2)"
              e.currentTarget.style.transform = "translateY(0)"
              e.currentTarget.style.boxShadow = "none"
            }}
          >
            Follow on GitHub →
          </a>
        </div>

        {/* Footer */}
        <div
          style={{
            marginTop: "3rem",
            fontSize: "0.9rem",
            opacity: "0.7",
            color: "white"
          }}
        >
          <a
            href="mailto:admin@invva.io"
            style={{
              color: "white",
              textDecoration: "none",
              margin: "0 10px"
            }}
            onMouseEnter={(e) => (e.currentTarget.style.textDecoration = "underline")}
            onMouseLeave={(e) => (e.currentTarget.style.textDecoration = "none")}
          >
            admin@invva.io
          </a>
          <span> • </span>
          <a
            href="https://github.com/invva"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              color: "white",
              textDecoration: "none",
              margin: "0 10px"
            }}
            onMouseEnter={(e) => (e.currentTarget.style.textDecoration = "underline")}
            onMouseLeave={(e) => (e.currentTarget.style.textDecoration = "none")}
          >
            GitHub
          </a>
        </div>
      </div>
    </div>
  )
}
