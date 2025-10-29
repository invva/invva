"use client"

import { useEffect, useState, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import DashboardLayout from "@/components/DashboardLayout"
import { useRouter } from "next/navigation"
import {
  Box,
  Typography,
  Grid,
  Paper,
  Card,
  CardContent,
  CircularProgress,
  Alert,
  Chip,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Divider,
  Stack,
  Button
} from "@mui/material"
import {
  Inventory as InventoryIcon,
  TrendingUp as InIcon,
  TrendingDown as OutIcon,
  SwapHoriz as AdjustmentIcon,
  Warning as WarningIcon,
  Assessment as ReportIcon,
  Refresh as RefreshIcon,
  Add as AddIcon
} from "@mui/icons-material"

interface DashboardStats {
  totalProducts: number
  lowStockProducts: number
  totalStockValue: number
  recentMovements: number
}

interface LowStockProduct {
  id: string
  name: string
  sku: string
  current_stock: number
  reorder_point: number
  unit_of_measure: string
}

interface RecentMovement {
  id: string
  movement_type: "IN" | "OUT" | "ADJUSTMENT"
  quantity: number
  movement_date: string
  product_name: string
  product_sku: string
  reference_number?: string
}

export default function DashboardPage() {
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<DashboardStats>({
    totalProducts: 0,
    lowStockProducts: 0,
    totalStockValue: 0,
    recentMovements: 0
  })
  const [lowStockProducts, setLowStockProducts] = useState<LowStockProduct[]>([])
  const [recentMovements, setRecentMovements] = useState<RecentMovement[]>([])
  const [refreshing, setRefreshing] = useState(false)

  const router = useRouter()
  const supabase = createClient()

  const fetchStats = useCallback(async () => {
    try {
      // Total products count
      const { count: totalProducts, error: countError } = await supabase
        .from("products")
        .select("*", { count: "exact", head: true })

      if (countError) {
        console.error("Error counting products:", countError)
        throw countError
      }

      // Low stock products count and total value
      const { data: products, error: productsError } = await supabase
        .from("products")
        .select("current_stock, reorder_point, unit_price")

      if (productsError) {
        console.error("Error fetching products:", productsError)
        throw productsError
      }

      const lowStockCount = products?.filter((p) => p.current_stock <= p.reorder_point).length || 0

      // Calculate total stock value (now using actual unit_price)
      const totalValue = products?.reduce((sum, p) => sum + p.current_stock * (p.unit_price || 0), 0) || 0

      // Recent movements count (last 7 days)
      const sevenDaysAgo = new Date()
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
      const dateString = sevenDaysAgo.toISOString().split("T")[0] // Format: YYYY-MM-DD

      const { count: movementsCount, error: movementsError } = await supabase
        .from("stock_movements")
        .select("*", { count: "exact", head: true })
        .gte("movement_date", dateString)

      if (movementsError) {
        console.error("Error counting movements:", movementsError)
        // Don't throw - just set count to 0
      }

      setStats({
        totalProducts: totalProducts || 0,
        lowStockProducts: lowStockCount,
        totalStockValue: totalValue,
        recentMovements: movementsCount || 0
      })
    } catch (error) {
      console.error("Error fetching stats:", error)
      // Set default stats on error
      setStats({
        totalProducts: 0,
        lowStockProducts: 0,
        totalStockValue: 0,
        recentMovements: 0
      })
    }
  }, [supabase])

  const fetchLowStockProducts = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("products")
        .select("id, name, sku, current_stock, reorder_point, unit_of_measure")
        .order("current_stock", { ascending: true })

      if (error) throw error

      // Filter on the client side where current_stock <= reorder_point
      const lowStock = data?.filter((p) => p.current_stock <= p.reorder_point) || []
      setLowStockProducts(lowStock.slice(0, 5)) // Take only first 5
    } catch (error) {
      console.error("Error fetching low stock products:", error)
    }
  }, [supabase])

  const fetchRecentMovements = useCallback(async () => {
    interface SupabaseMovementData {
      id: string
      movement_type: "IN" | "OUT" | "ADJUSTMENT"
      quantity: number
      movement_date: string
      reference_number?: string | null
      products: {
        name: string
        sku: string
      } | null // Single object, not array!
    }

    try {
      const { data, error } = await supabase
        .from("stock_movements")
        .select(
          `
        id,
        movement_type,
        quantity,
        movement_date,
        reference_number,
        products!inner (
          name,
          sku
        )
      `
        )
        .order("movement_date", { ascending: false })
        .limit(10)

      if (error) throw error

      const formattedMovements =
        (data as unknown as SupabaseMovementData[])?.map((m) => ({
          id: m.id,
          movement_type: m.movement_type,
          quantity: m.quantity,
          movement_date: m.movement_date,
          product_name: m.products?.name || "Unknown", // Direct access, no [0]
          product_sku: m.products?.sku || "", // Direct access, no [0]
          reference_number: m.reference_number || undefined
        })) || []

      setRecentMovements(formattedMovements)
    } catch (error) {
      console.error("Error fetching recent movements:", error)
    }
  }, [supabase])

  const fetchDashboardData = useCallback(async () => {
    setRefreshing(true)
    try {
      // Fetch all data in parallel
      await Promise.all([fetchStats(), fetchLowStockProducts(), fetchRecentMovements()])
    } catch (error) {
      console.error("Error fetching dashboard data:", error)
    } finally {
      setRefreshing(false)
    }
  }, [fetchStats, fetchLowStockProducts, fetchRecentMovements])

  const checkUser = useCallback(async () => {
    const {
      data: { user }
    } = await supabase.auth.getUser()
    if (!user) {
      router.push("/login")
    } else {
      await fetchDashboardData()
    }
    setLoading(false)
  }, [supabase, router, fetchDashboardData])

  useEffect(() => {
    checkUser()
  }, [checkUser])

  const getMovementIcon = (type: string) => {
    switch (type) {
      case "IN":
        return <InIcon color="success" />
      case "OUT":
        return <OutIcon color="error" />
      case "ADJUSTMENT":
        return <AdjustmentIcon color="warning" />
      default:
        return null
    }
  }

  const getMovementColor = (type: string) => {
    switch (type) {
      case "IN":
        return "success"
      case "OUT":
        return "error"
      case "ADJUSTMENT":
        return "warning"
      default:
        return "default"
    }
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD"
    }).format(value)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    })
  }

  if (loading) {
    return (
      <DashboardLayout>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
          <CircularProgress />
        </Box>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <Box sx={{ flexGrow: 1 }}>
        {/* Header */}
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h4" component="h1" fontWeight="bold">
            Dashboard
          </Typography>
          <IconButton onClick={fetchDashboardData} disabled={refreshing} color="primary">
            <RefreshIcon />
          </IconButton>
        </Box>

        {/* Stats Cards */}
        <Grid container spacing={3} mb={4}>
          {/* Total Products */}
          <Grid columns={{ xs: 12, sm: 6, md: 3 }}>
            <Card elevation={2}>
              <CardContent>
                <Box display="flex" alignItems="center" mb={2}>
                  <InventoryIcon color="primary" sx={{ fontSize: 40, mr: 2 }} />
                  <Box>
                    <Typography color="textSecondary" variant="body2">
                      Total Products
                    </Typography>
                    <Typography variant="h4" fontWeight="bold">
                      {stats.totalProducts}
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Low Stock Alert */}
          <Grid columns={{ xs: 12, sm: 6, md: 3 }}>
            <Card
              elevation={2}
              sx={{ borderLeft: stats.lowStockProducts > 0 ? "4px solid" : "none", borderColor: "error.main" }}
            >
              <CardContent>
                <Box display="flex" alignItems="center" mb={2}>
                  <WarningIcon color="error" sx={{ fontSize: 40, mr: 2 }} />
                  <Box>
                    <Typography color="textSecondary" variant="body2">
                      Low Stock Items
                    </Typography>
                    <Typography variant="h4" fontWeight="bold" color="error">
                      {stats.lowStockProducts}
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Total Stock Value */}
          <Grid columns={{ xs: 12, sm: 6, md: 3 }}>
            <Card elevation={2}>
              <CardContent>
                <Box display="flex" alignItems="center" mb={2}>
                  <ReportIcon color="success" sx={{ fontSize: 40, mr: 2 }} />
                  <Box>
                    <Typography color="textSecondary" variant="body2">
                      Total Stock Value
                    </Typography>
                    <Typography variant="h5" fontWeight="bold">
                      {formatCurrency(stats.totalStockValue)}
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Recent Movements */}
          <Grid columns={{ xs: 12, sm: 6, md: 3 }}>
            <Card elevation={2}>
              <CardContent>
                <Box display="flex" alignItems="center" mb={2}>
                  <AdjustmentIcon color="info" sx={{ fontSize: 40, mr: 2 }} />
                  <Box>
                    <Typography color="textSecondary" variant="body2">
                      Movements (7 days)
                    </Typography>
                    <Typography variant="h4" fontWeight="bold">
                      {stats.recentMovements}
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Two Column Layout - Now Three Columns on Desktop */}
        <Grid container spacing={3}>
          {/* Low Stock Products */}
          <Grid columns={{ xs: 12, md: 6, lg: 4 }}>
            <Paper elevation={2} sx={{ p: 3, height: "100%" }}>
              <Typography variant="h6" fontWeight="bold" gutterBottom>
                Low Stock Alert
              </Typography>
              <Divider sx={{ mb: 2 }} />

              {lowStockProducts.length === 0 ? (
                <Alert severity="success">All products are adequately stocked!</Alert>
              ) : (
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Product</TableCell>
                        <TableCell align="center">Current</TableCell>
                        <TableCell align="center">Reorder</TableCell>
                        <TableCell align="right">Status</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {lowStockProducts.map((product) => (
                        <TableRow key={product.id} hover>
                          <TableCell>
                            <Typography variant="body2" fontWeight="medium">
                              {product.name}
                            </Typography>
                            <Typography variant="caption" color="textSecondary">
                              {product.sku}
                            </Typography>
                          </TableCell>
                          <TableCell align="center">
                            <Chip
                              label={`${product.current_stock} ${product.unit_of_measure}`}
                              size="small"
                              color="error"
                              variant="outlined"
                            />
                          </TableCell>
                          <TableCell align="center">
                            <Typography variant="body2" color="textSecondary">
                              {product.reorder_point}
                            </Typography>
                          </TableCell>
                          <TableCell align="right">
                            <Chip label="Low" size="small" color="error" icon={<WarningIcon />} />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </Paper>
          </Grid>

          {/* Recent Movements */}
          <Grid columns={{ xs: 12, md: 6, lg: 4 }}>
            <Paper elevation={2} sx={{ p: 3, height: "100%" }}>
              <Typography variant="h6" fontWeight="bold" gutterBottom>
                Recent Activity
              </Typography>
              <Divider sx={{ mb: 2 }} />

              {recentMovements.length === 0 ? (
                <Alert severity="info">No recent stock movements</Alert>
              ) : (
                <Box sx={{ maxHeight: 400, overflow: "auto" }}>
                  {recentMovements.map((movement) => (
                    <Box
                      key={movement.id}
                      sx={{
                        p: 2,
                        mb: 1,
                        borderRadius: 1,
                        border: "1px solid",
                        borderColor: "divider",
                        "&:hover": {
                          bgcolor: "action.hover"
                        }
                      }}
                    >
                      <Stack direction="row" spacing={2} alignItems="center">
                        <Box>{getMovementIcon(movement.movement_type)}</Box>
                        <Box sx={{ flexGrow: 1 }}>
                          <Typography variant="body2" fontWeight="medium">
                            {movement.product_name}
                          </Typography>
                          <Typography variant="caption" color="textSecondary">
                            {movement.product_sku}
                            {movement.reference_number && ` • Ref: ${movement.reference_number}`}
                          </Typography>
                        </Box>
                        <Box textAlign="right">
                          <Chip
                            label={`${movement.movement_type === "OUT" ? "-" : "+"}${movement.quantity}`}
                            size="small"
                            color={
                              getMovementColor(movement.movement_type) as "success" | "warning" | "error" | "default"
                            }
                          />
                          <Typography variant="caption" display="block" color="textSecondary">
                            {formatDate(movement.movement_date)}
                          </Typography>
                        </Box>
                      </Stack>
                    </Box>
                  ))}
                </Box>
              )}
            </Paper>
          </Grid>

          {/* Quick Actions & Summary - New Widget */}
          <Grid columns={{ xs: 12, lg: 4 }}>
            <Stack spacing={3}>
              {/* Quick Actions Card */}
              <Paper elevation={2} sx={{ p: 3 }}>
                <Typography variant="h6" fontWeight="bold" gutterBottom>
                  Quick Actions
                </Typography>
                <Divider sx={{ mb: 2 }} />
                <Stack spacing={2}>
                  <Button
                    variant="outlined"
                    fullWidth
                    startIcon={<AddIcon />}
                    onClick={() => router.push("/products")}
                    sx={{ textTransform: "none", justifyContent: "flex-start" }}
                  >
                    Add New Product
                  </Button>
                  <Button
                    variant="outlined"
                    fullWidth
                    startIcon={<AdjustmentIcon />}
                    onClick={() => router.push("/movements")}
                    sx={{ textTransform: "none", justifyContent: "flex-start" }}
                  >
                    Record Stock Movement
                  </Button>
                  <Button
                    variant="outlined"
                    fullWidth
                    startIcon={<ReportIcon />}
                    onClick={() => router.push("/reports")}
                    sx={{ textTransform: "none", justifyContent: "flex-start" }}
                  >
                    Generate Reports
                  </Button>
                </Stack>
              </Paper>

              {/* Stock Summary Card */}
              <Paper elevation={2} sx={{ p: 3 }}>
                <Typography variant="h6" fontWeight="bold" gutterBottom>
                  Stock Summary
                </Typography>
                <Divider sx={{ mb: 2 }} />
                <Stack spacing={2}>
                  <Box>
                    <Typography variant="body2" color="textSecondary" gutterBottom>
                      Total Products
                    </Typography>
                    <Typography variant="h4" fontWeight="bold">
                      {stats.totalProducts}
                    </Typography>
                  </Box>
                  <Divider />
                  <Box>
                    <Typography variant="body2" color="textSecondary" gutterBottom>
                      Inventory Value
                    </Typography>
                    <Typography variant="h5" fontWeight="bold" color="success.main">
                      {formatCurrency(stats.totalStockValue)}
                    </Typography>
                  </Box>
                  {stats.lowStockProducts > 0 && (
                    <>
                      <Divider />
                      <Box>
                        <Typography variant="body2" color="textSecondary" gutterBottom>
                          Needs Attention
                        </Typography>
                        <Chip
                          label={`${stats.lowStockProducts} item${stats.lowStockProducts > 1 ? "s" : ""} low on stock`}
                          color="error"
                          size="small"
                          icon={<WarningIcon />}
                        />
                      </Box>
                    </>
                  )}
                </Stack>
              </Paper>
            </Stack>
          </Grid>
        </Grid>
      </Box>
    </DashboardLayout>
  )
}
