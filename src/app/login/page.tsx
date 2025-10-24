"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { Box, TextField, Button, Typography, Paper, Link as MuiLink, Alert, CircularProgress } from "@mui/material"
import { ArrowBack as ArrowBackIcon } from "@mui/icons-material"
import Link from "next/link"
import Image from "next/image"

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
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        padding: 2
      }}
    >
      <Box sx={{ width: "100%", maxWidth: 420 }}>
        {/* Logo - Smaller and centered */}
        <Box sx={{ textAlign: "center", mb: 3 }}>
          <Link href="/" style={{ textDecoration: "none" }}>
            <Paper
              elevation={3}
              sx={{
                display: "inline-block",
                p: 2,
                borderRadius: 3,
                cursor: "pointer",
                transition: "transform 0.2s",
                "&:hover": {
                  transform: "translateY(-2px)"
                }
              }}
            >
              <Image
                src="/images/invva.png"
                alt="Invva Logo"
                width={120}
                height={96}
                style={{ display: "block" }}
                priority
              />
            </Paper>
          </Link>
        </Box>

        {/* Login Card - Main Focus */}
        <Paper elevation={6} sx={{ borderRadius: 3, overflow: "hidden" }}>
          <Box sx={{ p: 4 }}>
            {/* Header */}
            <Typography variant="h5" fontWeight={600} gutterBottom>
              {step === "email" ? "Welcome back" : "Enter code"}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              {step === "email" ? "Sign in with your email to continue" : `We sent a 6-digit code to ${email}`}
            </Typography>

            {/* Email Step */}
            {step === "email" && (
              <Box component="form" onSubmit={handleSendCode}>
                <TextField
                  fullWidth
                  type="email"
                  label="Email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                  required
                  autoFocus
                  sx={{ mb: 3 }}
                />

                <Button
                  fullWidth
                  type="submit"
                  variant="contained"
                  size="large"
                  disabled={loading}
                  sx={{
                    bgcolor: "#667eea",
                    py: 1.5,
                    textTransform: "none",
                    fontSize: "1rem",
                    fontWeight: 500,
                    "&:hover": {
                      bgcolor: "#5568d3"
                    }
                  }}
                >
                  {loading ? <CircularProgress size={24} sx={{ color: "white" }} /> : "Send code"}
                </Button>
              </Box>
            )}

            {/* OTP Step */}
            {step === "otp" && (
              <Box component="form" onSubmit={handleVerifyCode}>
                <TextField
                  fullWidth
                  label="6-digit code"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  disabled={loading}
                  required
                  autoFocus
                  slotProps={{
                    htmlInput: {
                      maxLength: 6
                    }
                  }}
                  sx={{
                    mb: 2,
                    "& input": {
                      fontSize: "1.5rem",
                      textAlign: "center",
                      letterSpacing: "0.5rem",
                      fontWeight: 600
                    }
                  }}
                />

                <Button
                  fullWidth
                  type="submit"
                  variant="contained"
                  size="large"
                  disabled={loading || otp.length !== 6}
                  sx={{
                    bgcolor: "#667eea",
                    py: 1.5,
                    textTransform: "none",
                    fontSize: "1rem",
                    fontWeight: 500,
                    mb: 2,
                    "&:hover": {
                      bgcolor: "#5568d3"
                    }
                  }}
                >
                  {loading ? <CircularProgress size={24} sx={{ color: "white" }} /> : "Verify code"}
                </Button>

                <Box sx={{ display: "flex", gap: 1 }}>
                  <Button
                    fullWidth
                    variant="outlined"
                    onClick={handleResendCode}
                    disabled={loading}
                    sx={{
                      textTransform: "none",
                      borderColor: "#667eea",
                      color: "#667eea",
                      "&:hover": {
                        borderColor: "#5568d3",
                        bgcolor: "rgba(102, 126, 234, 0.04)"
                      }
                    }}
                  >
                    Resend
                  </Button>
                  <Button
                    fullWidth
                    variant="outlined"
                    onClick={handleBackToEmail}
                    disabled={loading}
                    sx={{
                      textTransform: "none"
                    }}
                  >
                    Change email
                  </Button>
                </Box>
              </Box>
            )}

            {/* Success Message */}
            {message && (
              <Alert severity="success" sx={{ mt: 2 }}>
                {message}
              </Alert>
            )}

            {/* Error Message */}
            {error && (
              <Alert severity="error" sx={{ mt: 2 }}>
                {error}
              </Alert>
            )}

            {/* Footer Text */}
            <Typography variant="caption" color="text.secondary" sx={{ display: "block", textAlign: "center", mt: 3 }}>
              {step === "email"
                ? "We'll email you a 6-digit code. No password needed."
                : "Check your email for the code. It expires in 10 minutes."}
            </Typography>
          </Box>
        </Paper>

        {/* Back to Home Link */}
        <Box sx={{ textAlign: "center", mt: 2 }}>
          <MuiLink
            component={Link}
            href="/"
            sx={{
              color: "white",
              textDecoration: "none",
              display: "inline-flex",
              alignItems: "center",
              gap: 0.5,
              fontSize: "0.875rem",
              opacity: 0.9,
              "&:hover": {
                opacity: 1,
                textDecoration: "underline"
              }
            }}
          >
            <ArrowBackIcon fontSize="small" />
            Back to home
          </MuiLink>
        </Box>
      </Box>
    </Box>
  )
}
