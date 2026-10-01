import type { Metadata } from "next"
import { AppRouterCacheProvider } from "@mui/material-nextjs/v16-appRouter"
import "./globals.css"

export const metadata: Metadata = {
  title: "Invva - Coming Soon | Simplifying Inventory Management",
  description: "Simple inventory management for small businesses. Open source, free to self-host. Coming soon.",
  icons: {
    icon: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>📦</text></svg>"
  }
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body
        style={{
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Oxygen", sans-serif',
          margin: 0,
          padding: 0
        }}
      >
        <AppRouterCacheProvider>{children}</AppRouterCacheProvider>
      </body>
    </html>
  )
}
