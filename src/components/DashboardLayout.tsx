"use client"

import { ReactNode } from "react"
import { Box, Container } from "@mui/material"
import Header from "./Header"

interface DashboardLayoutProps {
  children: ReactNode
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "#f5f5f5" }}>
      <Header />
      <Container
        maxWidth="xl"
        sx={{
          py: { xs: 2, sm: 3, md: 4 },
          px: { xs: 2, sm: 3 }
        }}
      >
        {children}
      </Container>
    </Box>
  )
}
