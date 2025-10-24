"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import DashboardLayout from "@/components/DashboardLayout"
import type { User } from "@supabase/supabase-js"
import { Box, Typography, Paper, Button, CircularProgress } from "@mui/material"
import { TrendingUp as TrendingUpIcon, ArrowBack as ArrowBackIcon } from "@mui/icons-material"

export default function MovementsPage() {
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
      <DashboardLayout>
        <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
          <CircularProgress />
        </Box>
      </DashboardLayout>
    )
  }

  if (!user) {
    return null
  }

  return (
    <DashboardLayout>
      <Paper sx={{ p: 6, textAlign: "center" }}>
        <TrendingUpIcon sx={{ fontSize: 64, color: "#667eea", mb: 2 }} />

        <Typography variant="h4" fontWeight={600} gutterBottom>
          Stock Movements
        </Typography>

        <Typography color="text.secondary" sx={{ mb: 3 }}>
          Coming soon! This page will show all your inventory transactions.
        </Typography>

        <Button
          variant="contained"
          startIcon={<ArrowBackIcon />}
          href="/products"
          sx={{
            bgcolor: "#667eea",
            textTransform: "none",
            "&:hover": {
              bgcolor: "#5568d3"
            }
          }}
        >
          Back to Products
        </Button>
      </Paper>
    </DashboardLayout>
  )
}
