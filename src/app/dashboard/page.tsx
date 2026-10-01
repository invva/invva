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
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from "@mui/material"
import {
  Inventory as InventoryIcon,
  TrendingUp as InIcon,
  TrendingDown as OutIcon,
  SwapHoriz as AdjustmentIcon,
  Warning as WarningIcon,
  Assessment as ReportIcon,
  Refresh as RefreshIcon,
  Add as AddIcon,
  Warehouse as WarehouseIcon
} from "@mui/icons-material"

// utils
import { formatCurrencyShort } from "@/utils/format-currency.util"

interface Warehouse {
  id: string
  name: string
  is_default: boolean
  is_active: boolean
}

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
  warehouses?: {
    name: string
  }
}

interface RecentMovement {
  id: string
  movement_type: "IN" | "OUT" | "ADJUSTMENT"
  quantity: number
  movement_date: string
  product_name: string
  product_sku: string
  warehouse_name: string
  reference_number?: string
}

export default function DashboardPage() {
  const [loading, setLoading] = useState(true)
  const [warehouses, setWarehouses] = useState<Warehouse[]>([])
  const [selectedWarehouse, setSelectedWarehouse] = useState<string>("all")
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

  const fetchWarehouses = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("warehouses")
        .select("*")
        .eq("is_active", true)
        .order("is_default", { ascending: false })

      if (error) throw error
      setWarehouses(data || [])
    } catch (error) {
      console.error("Error fetching warehouses:", error)
    }
  }, [supabase])

  const fetchStats = useCallback(async () => {
    try {
      // Build query for total products count
      let productsCountQuery = supabase.from("products").select("*", { count: "exact", head: true })

      if (selectedWarehouse !== "all") {
        productsCountQuery = productsCountQuery.eq("warehouse_id", selectedWarehouse)
      }

      const { count: totalProducts, error: countError } = await productsCountQuery

      if (countError) {
        console.error("Error counting products:", countError)
        throw countError
      }

      // Build query for low stock products count and total value
      let productsQuery = supabase.from("products").select("current_stock, reorder_point, unit_price")

      if (selectedWarehouse !== "all") {
        productsQuery = productsQuery.eq("warehouse_id", selectedWarehouse)
      }

      const { data: products, error: productsError } = await productsQuery

      if (productsError) {
        console.error("Error fetching products:", productsError)
        throw productsError
      }

      const lowStockCount = products?.filter((p) => p.current_stock <= p.reorder_point).length || 0

      // Calculate total stock value
      const totalValue = products?.reduce((sum, p) => sum + p.current_stock * (p.unit_price || 0), 0) || 0

      // Recent movements count (last 7 days)
      const sevenDaysAgo = new Date()
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
      const dateString = sevenDaysAgo.toISOString().split("T")[0]

      let movementsQuery = supabase
        .from("stock_movements")
        .select("*", { count: "exact", head: true })
        .gte("movement_date", dateString)

      if (selectedWarehouse !== "all") {
        movementsQuery = movementsQuery.eq("warehouse_id", selectedWarehouse)
      }

      const { count: movementsCount, error: movementsError } = await movementsQuery

      if (movementsError) {
        console.error("Error counting movements:", movementsError)
      }

      setStats({
        totalProducts: totalProducts || 0,
        lowStockProducts: lowStockCount,
        totalStockValue: totalValue,
        recentMovements: movementsCount || 0
      })
    } catch (error) {
      console.error("Error fetching stats:", error)
      setStats({
        totalProducts: 0,
        lowStockProducts: 0,
        totalStockValue: 0,
        recentMovements: 0
      })
    }
  }, [supabase, selectedWarehouse])

  const fetchLowStockProducts = useCallback(async () => {
    try {
      let query = supabase
        .from("products")
        .select(
          `
          id, 
          name, 
          sku, 
          current_stock, 
          reorder_point, 
          unit_of_measure,
          warehouses:warehouse_id (
            name
          )
        `
        )
        .order("current_stock", { ascending: true })

      if (selectedWarehouse !== "all") {
        query = query.eq("warehouse_id", selectedWarehouse)
      }

      const { data, error } = await query

      if (error) throw error

      // Filter on the client side where current_stock <= reorder_point
      const lowStock = data?.filter((p) => p.current_stock <= p.reorder_point) || []

      // Transform the data to match the LowStockProduct interface
      const transformedLowStock = lowStock.map((product) => ({
        ...product,
        warehouses:
          Array.isArray(product.warehouses) && product.warehouses.length > 0 ? product.warehouses[0] : undefined
      }))

      setLowStockProducts(transformedLowStock.slice(0, 5))
    } catch (error) {
      console.error("Error fetching low stock products:", error)
    }
  }, [supabase, selectedWarehouse])

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
      } | null
      warehouses: {
        name: string
      } | null
    }

    try {
      let query = supabase
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
        ),
        warehouses:warehouse_id (
          name
        )
      `
        )
        .order("movement_date", { ascending: false })
        .limit(10)

      if (selectedWarehouse !== "all") {
        query = query.eq("warehouse_id", selectedWarehouse)
      }

      const { data, error } = await query

      if (error) throw error

      const formattedMovements =
        (data as unknown as SupabaseMovementData[])?.map((m) => ({
          id: m.id,
          movement_type: m.movement_type,
          quantity: m.quantity,
          movement_date: m.movement_date,
          product_name: m.products?.name || "Unknown",
          product_sku: m.products?.sku || "",
          warehouse_name: m.warehouses?.name || "N/A",
          reference_number: m.reference_number || undefined
        })) || []

      setRecentMovements(formattedMovements)
    } catch (error) {
      console.error("Error fetching recent movements:", error)
    }
  }, [supabase, selectedWarehouse])

  const fetchDashboardData = useCallback(async () => {
    setRefreshing(true)
    try {
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
      await fetchWarehouses()
      await fetchDashboardData()
    }
    setLoading(false)
  }, [supabase, router, fetchWarehouses, fetchDashboardData])

  useEffect(() => {
    checkUser()
  }, [checkUser])

  useEffect(() => {
    if (!loading && warehouses.length > 0) {
      fetchDashboardData()
    }
  }, [selectedWarehouse, loading, warehouses, fetchDashboardData])

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
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            minHeight: "80vh"
          }}
        >
          <CircularProgress />
        </Box>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <Box sx={{ flexGrow: 1 }}>
        {/* Header */}
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 3,
            flexWrap: "wrap",
            gap: 2
          }}
        >
          <Typography
            variant="h4"
            component="h1"
            sx={{
              fontWeight: "bold"
            }}
          >
            Dashboard
          </Typography>
          <Box
            sx={{
              display: "flex",
              gap: 2,
              alignItems: "center"
            }}
          >
            <FormControl size="small" sx={{ minWidth: 200 }}>
              <InputLabel>Filter by Warehouse</InputLabel>
              <Select
                value={selectedWarehouse}
                onChange={(e) => setSelectedWarehouse(e.target.value)}
                label="Filter by Warehouse"
              >
                <MenuItem value="all">All Warehouses</MenuItem>
                {warehouses.map((warehouse) => (
                  <MenuItem key={warehouse.id} value={warehouse.id}>
                    {warehouse.name} {warehouse.is_default && "(Default)"}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <IconButton onClick={fetchDashboardData} disabled={refreshing} color="primary">
              <RefreshIcon />
            </IconButton>
          </Box>
        </Box>

        {/* Selected Warehouse Badge */}
        {selectedWarehouse !== "all" && (
          <Box
            sx={{
              mb: 3
            }}
          >
            <Chip
              icon={<WarehouseIcon />}
              label={`Viewing: ${warehouses.find((w) => w.id === selectedWarehouse)?.name || "Unknown Warehouse"}`}
              color="primary"
              onDelete={() => setSelectedWarehouse("all")}
            />
          </Box>
        )}

        {/* Stats Cards */}
        <Grid
          container
          spacing={3}
          sx={{
            mb: 3
          }}
        >
          {/* Total Products */}
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card elevation={2}>
              <CardContent>
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    mb: 2
                  }}
                >
                  <InventoryIcon color="primary" sx={{ fontSize: 40, mr: 2 }} />
                  <Box>
                    <Typography color="textSecondary" variant="body2">
                      Total Products
                    </Typography>
                    <Typography
                      variant="h4"
                      sx={{
                        fontWeight: "bold"
                      }}
                    >
                      {stats.totalProducts}
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Low Stock Alert */}
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card
              elevation={2}
              sx={{ borderLeft: stats.lowStockProducts > 0 ? "4px solid" : "none", borderColor: "error.main" }}
            >
              <CardContent>
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    mb: 2
                  }}
                >
                  <WarningIcon color="error" sx={{ fontSize: 40, mr: 2 }} />
                  <Box>
                    <Typography color="textSecondary" variant="body2">
                      Low Stock Items
                    </Typography>
                    <Typography
                      variant="h4"
                      color="error"
                      sx={{
                        fontWeight: "bold"
                      }}
                    >
                      {stats.lowStockProducts}
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Total Stock Value */}
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card elevation={2}>
              <CardContent>
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    mb: 2
                  }}
                >
                  <ReportIcon color="success" sx={{ fontSize: 40, mr: 2 }} />
                  <Box>
                    <Typography color="textSecondary" variant="body2">
                      Total Stock Value
                    </Typography>
                    <Typography
                      variant="h4"
                      sx={{
                        fontWeight: "bold"
                      }}
                    >
                      {formatCurrencyShort(stats.totalStockValue, { currency: "USD", decimals: 2 })}
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Recent Movements */}
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card elevation={2}>
              <CardContent>
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    mb: 2
                  }}
                >
                  <AdjustmentIcon color="info" sx={{ fontSize: 40, mr: 2 }} />
                  <Box>
                    <Typography color="textSecondary" variant="body2">
                      Movements (7 days)
                    </Typography>
                    <Typography
                      variant="h4"
                      sx={{
                        fontWeight: "bold"
                      }}
                    >
                      {stats.recentMovements}
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Three Column Layout */}
        <Grid container spacing={3}>
          {/* Low Stock Products */}
          <Grid size={{ xs: 12, md: 6, lg: 4 }}>
            <Paper elevation={2} sx={{ p: 3, height: "100%" }}>
              <Typography
                variant="h6"
                gutterBottom
                sx={{
                  fontWeight: "bold"
                }}
              >
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
                            <Typography
                              variant="body2"
                              sx={{
                                fontWeight: "medium"
                              }}
                            >
                              {product.name}
                            </Typography>
                            <Typography variant="caption" color="textSecondary">
                              {product.sku}
                            </Typography>
                            {selectedWarehouse === "all" && product.warehouses && (
                              <Typography
                                variant="caption"
                                color="primary"
                                sx={{
                                  display: "block"
                                }}
                              >
                                📦 {product.warehouses.name}
                              </Typography>
                            )}
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
          <Grid size={{ xs: 12, md: 6, lg: 4 }}>
            <Paper elevation={1} sx={{ p: 3, height: "100%", display: "flex", flexDirection: "column" }}>
              <Typography
                variant="h6"
                gutterBottom
                sx={{
                  fontWeight: "bold"
                }}
              >
                Recent Activity
              </Typography>
              <Divider sx={{ mb: 2 }} />

              {recentMovements.length === 0 ? (
                <Alert severity="info">No recent stock movements</Alert>
              ) : (
                <Box
                  sx={{
                    flexGrow: 1,
                    overflow: "auto",
                    minHeight: 0
                  }}
                >
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
                      <Stack
                        direction="row"
                        spacing={2}
                        sx={{
                          alignItems: "center"
                        }}
                      >
                        <Box>{getMovementIcon(movement.movement_type)}</Box>
                        <Box sx={{ flexGrow: 1 }}>
                          <Typography
                            variant="body2"
                            sx={{
                              fontWeight: "medium"
                            }}
                          >
                            {movement.product_name}
                          </Typography>
                          <Typography variant="caption" color="textSecondary">
                            {movement.product_sku}
                            {movement.reference_number && ` • Ref: ${movement.reference_number}`}
                          </Typography>
                          {selectedWarehouse === "all" && (
                            <Typography
                              variant="caption"
                              color="primary"
                              sx={{
                                display: "block"
                              }}
                            >
                              📦 {movement.warehouse_name}
                            </Typography>
                          )}
                        </Box>
                        <Box
                          sx={{
                            textAlign: "right"
                          }}
                        >
                          <Chip
                            label={`${movement.movement_type === "OUT" ? "-" : "+"}${movement.quantity}`}
                            size="small"
                            color={
                              getMovementColor(movement.movement_type) as "success" | "warning" | "error" | "default"
                            }
                          />
                          <Typography
                            variant="caption"
                            color="textSecondary"
                            sx={{
                              display: "block"
                            }}
                          >
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

          {/* Quick Actions & Summary */}
          <Grid size={{ xs: 12, lg: 4 }}>
            <Stack spacing={3}>
              {/* Quick Actions Card */}
              <Paper elevation={2} sx={{ p: 3 }}>
                <Typography
                  variant="h6"
                  gutterBottom
                  sx={{
                    fontWeight: "bold"
                  }}
                >
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
                  <Button
                    variant="outlined"
                    fullWidth
                    startIcon={<WarehouseIcon />}
                    onClick={() => router.push("/warehouses")}
                    sx={{ textTransform: "none", justifyContent: "flex-start" }}
                  >
                    Manage Warehouses
                  </Button>
                </Stack>
              </Paper>

              {/* Stock Summary Card */}
              <Paper elevation={2} sx={{ p: 3 }}>
                <Typography
                  variant="h6"
                  gutterBottom
                  sx={{
                    fontWeight: "bold"
                  }}
                >
                  Stock Summary
                  {selectedWarehouse !== "all" && (
                    <Chip
                      label={warehouses.find((w) => w.id === selectedWarehouse)?.name}
                      size="small"
                      sx={{ ml: 1 }}
                    />
                  )}
                </Typography>
                <Divider sx={{ mb: 2 }} />
                <Stack spacing={2}>
                  <Box>
                    <Typography variant="body2" color="textSecondary" gutterBottom>
                      Total Products
                    </Typography>
                    <Typography
                      variant="h4"
                      sx={{
                        fontWeight: "bold"
                      }}
                    >
                      {stats.totalProducts}
                    </Typography>
                  </Box>
                  <Divider />
                  <Box>
                    <Typography variant="body2" color="textSecondary" gutterBottom>
                      Inventory Value
                    </Typography>
                    <Typography
                      variant="h5"
                      sx={{
                        fontWeight: "bold",
                        color: "success.main"
                      }}
                    >
                      {formatCurrencyShort(stats.totalStockValue, { currency: "USD", decimals: 2 })}
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
