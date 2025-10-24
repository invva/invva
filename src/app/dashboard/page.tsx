"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import DashboardLayout from "@/components/DashboardLayout"
import type { User } from "@supabase/supabase-js"
import { Box, Typography, Paper, Button, Alert, CircularProgress } from "@mui/material"
import { Inventory as InventoryIcon, TrendingUp as TrendingUpIcon } from "@mui/icons-material"

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

  if (loading) {
    return (
      <Box
        sx={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          bgcolor: "#f5f5f5"
        }}
      >
        <CircularProgress />
      </Box>
    )
  }

  if (!user) {
    return null
  }

  return (
    <DashboardLayout>
      <Paper sx={{ p: 4 }}>
        <Typography variant="h4" fontWeight={600} gutterBottom>
          Welcome to Invva! 🎉
        </Typography>

        <Typography color="text.secondary" gutterBottom>
          You&apos;re successfully logged in as:
        </Typography>

        <Paper sx={{ p: 2, bgcolor: "#f9fafb", mb: 3 }}>
          <Typography sx={{ fontFamily: "monospace" }}>{user.email}</Typography>
        </Paper>

        <Alert severity="info" sx={{ mb: 3 }}>
          <Typography variant="subtitle2" fontWeight={600} gutterBottom>
            🚀 Quick Start
          </Typography>
          <Typography variant="body2" gutterBottom>
            Get started with Invva in 3 easy steps:
          </Typography>
          <Box component="ol" sx={{ pl: 2, mb: 0 }}>
            <li>
              <Typography variant="body2">
                <strong>Add your first product</strong> - Click on the Products tab
              </Typography>
            </li>
            <li>
              <Typography variant="body2">
                <strong>Record stock movements</strong> - Track inventory IN and OUT
              </Typography>
            </li>
            <li>
              <Typography variant="body2">
                <strong>Monitor your inventory</strong> - See real-time stock levels
              </Typography>
            </li>
          </Box>
        </Alert>

        <Box sx={{ display: "flex", gap: 2 }}>
          <Button
            variant="contained"
            startIcon={<InventoryIcon />}
            href="/products"
            sx={{
              bgcolor: "#667eea",
              textTransform: "none",
              "&:hover": {
                bgcolor: "#5568d3"
              }
            }}
          >
            Go to Products
          </Button>
          <Button
            variant="outlined"
            startIcon={<TrendingUpIcon />}
            href="/movements"
            sx={{
              borderColor: "#667eea",
              color: "#667eea",
              textTransform: "none",
              "&:hover": {
                borderColor: "#5568d3",
                bgcolor: "rgba(102, 126, 234, 0.04)"
              }
            }}
          >
            View Movements
          </Button>
        </Box>
      </Paper>
    </DashboardLayout>
  )
}
