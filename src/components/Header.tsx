"use client"

import { useState } from "react"
import { usePathname, useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import {
  AppBar,
  Toolbar,
  Button,
  Box,
  IconButton,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  useMediaQuery,
  useTheme
} from "@mui/material"
import { Menu as MenuIcon, Close as CloseIcon } from "@mui/icons-material"
import Image from "next/image"

export default function Header() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down("md"))

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push("/")
  }

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen)
  }

  const navItems = [
    { href: "/dashboard", label: "Dashboard" },
    { href: "/products", label: "Products" },
    { href: "/movements", label: "Stock Movements" },
    { href: "/reports", label: "Reports" },
    { href: "/warehouses", label: "Warehouses" },
    { href: "/suppliers", label: "Suppliers" },
    { href: "/audit-logs", label: "Audit Log" }
  ]

  const handleNavClick = (href: string) => {
    router.push(href)
    if (isMobile) {
      setMobileOpen(false)
    }
  }

  // Mobile Drawer
  const drawer = (
    <Box sx={{ width: 280 }}>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          p: 2,
          borderBottom: 1,
          borderColor: "divider"
        }}
      >
        <Image
          src="/images/invva.png"
          alt="Invva"
          width={64}
          height={64}
          style={{ cursor: "pointer" }}
          onClick={() => handleNavClick("/dashboard")}
        />
        <IconButton onClick={handleDrawerToggle}>
          <CloseIcon />
        </IconButton>
      </Box>

      <List>
        {navItems.map((item) => (
          <ListItem key={item.href} disablePadding>
            <ListItemButton
              selected={pathname === item.href}
              onClick={() => handleNavClick(item.href)}
              sx={{
                "&.Mui-selected": {
                  bgcolor: "rgba(102, 126, 234, 0.08)",
                  borderRight: 3,
                  borderColor: "#667eea"
                }
              }}
            >
              <ListItemText
                primary={item.label}
                slotProps={{
                  primary: {
                    sx: {
                      fontWeight: pathname === item.href ? 600 : 400,
                      color: pathname === item.href ? "#667eea" : "text.primary"
                    }
                  }
                }}
              />
            </ListItemButton>
          </ListItem>
        ))}
      </List>

      <Box sx={{ position: "absolute", bottom: 0, width: "100%", p: 2 }}>
        <Button
          fullWidth
          variant="contained"
          onClick={handleSignOut}
          sx={{
            bgcolor: "#667eea",
            textTransform: "none",
            "&:hover": {
              bgcolor: "#5568d3"
            }
          }}
        >
          Sign Out
        </Button>
      </Box>
    </Box>
  )

  return (
    <>
      <AppBar position="static" sx={{ bgcolor: "white", boxShadow: 1 }}>
        <Toolbar>
          {/* Mobile Menu Button */}
          {isMobile && (
            <IconButton
              color="inherit"
              aria-label="open drawer"
              edge="start"
              onClick={handleDrawerToggle}
              sx={{ mr: 2, color: "#667eea" }}
            >
              <MenuIcon />
            </IconButton>
          )}

          {/* Logo */}
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              flexGrow: isMobile ? 1 : 0,
              cursor: "pointer"
            }}
            onClick={() => router.push("/dashboard")}
          >
            <Image src="/images/invva.png" alt="Invva" width={isMobile ? 36 : 64} height={isMobile ? 27 : 36} />
          </Box>

          {/* Desktop Navigation */}
          {!isMobile && (
            <Box sx={{ display: "flex", alignItems: "center", gap: 4, ml: 6 }}>
              {navItems.map((item) => (
                <Button
                  key={item.href}
                  onClick={() => handleNavClick(item.href)}
                  sx={{
                    textTransform: "none",
                    fontSize: "0.875rem",
                    fontWeight: 500,
                    color: pathname === item.href ? "#667eea" : "#6b7280",
                    borderBottom: pathname === item.href ? "2px solid #667eea" : "none",
                    borderRadius: 0,
                    pb: 2,
                    "&:hover": {
                      color: "#667eea",
                      bgcolor: "transparent"
                    }
                  }}
                >
                  {item.label}
                </Button>
              ))}
            </Box>
          )}

          {/* Desktop Sign Out Button */}
          {!isMobile && (
            <Box sx={{ flexGrow: 1, display: "flex", justifyContent: "flex-end" }}>
              <Button
                variant="contained"
                onClick={handleSignOut}
                sx={{
                  bgcolor: "#667eea",
                  textTransform: "none",
                  fontWeight: 500,
                  "&:hover": {
                    bgcolor: "#5568d3"
                  }
                }}
              >
                Sign Out
              </Button>
            </Box>
          )}
        </Toolbar>
      </AppBar>

      {/* Mobile Drawer */}
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={handleDrawerToggle}
        ModalProps={{
          keepMounted: true // Better open performance on mobile
        }}
        sx={{
          display: { xs: "block", md: "none" },
          "& .MuiDrawer-paper": { boxSizing: "border-box", width: 280 }
        }}
      >
        {drawer}
      </Drawer>
    </>
  )
}
