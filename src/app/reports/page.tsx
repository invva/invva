"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import DashboardLayout from "@/components/DashboardLayout"
import { useRouter } from "next/navigation"
import type { User } from "@supabase/supabase-js"
import {
  Box,
  Typography,
  Grid,
  Paper,
  Button,
  CircularProgress,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  MenuItem,
  Card,
  CardContent,
  Divider,
  Chip,
  Stack,
  Alert,
  IconButton,
  useTheme,
  useMediaQuery
} from "@mui/material"
import {
  Download as DownloadIcon,
  Print as PrintIcon,
  DateRange as DateIcon,
  TrendingUp as InIcon,
  TrendingDown as OutIcon,
  SwapHoriz as AdjustmentIcon,
  Assessment as ReportIcon
} from "@mui/icons-material"

interface TabPanelProps {
  children?: React.ReactNode
  index: number
  value: number
}

interface InventoryValuationItem {
  id: string
  name: string
  sku: string
  category: string
  current_stock: number
  unit_price: number
  unit_of_measure: string
  total_value: number
}

interface StockMovementReport {
  id: string
  product_name: string
  product_sku: string
  movement_type: "IN" | "OUT" | "ADJUSTMENT"
  quantity: number
  reference_number?: string
  movement_date: string
  notes?: string
}

interface LowStockReport {
  id: string
  name: string
  sku: string
  category: string
  current_stock: number
  reorder_point: number
  unit_of_measure: string
  difference: number
}

interface StockSummary {
  category: string
  total_items: number
  total_quantity: number
  total_value: number
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`report-tabpanel-${index}`}
      aria-labelledby={`report-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  )
}

export default function ReportsPage() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [tabValue, setTabValue] = useState(0)
  const [generating, setGenerating] = useState(false)

  // Inventory Valuation
  const [inventoryData, setInventoryData] = useState<InventoryValuationItem[]>([])
  const [inventorySummary, setInventorySummary] = useState<StockSummary[]>([])
  const [totalInventoryValue, setTotalInventoryValue] = useState(0)

  // Stock Movements
  const [movementsData, setMovementsData] = useState<StockMovementReport[]>([])
  const [movementStartDate, setMovementStartDate] = useState(() => {
    const date = new Date()
    date.setDate(date.getDate() - 30)
    return date.toISOString().split("T")[0]
  })
  const [movementEndDate, setMovementEndDate] = useState(() => {
    return new Date().toISOString().split("T")[0]
  })
  const [movementType, setMovementType] = useState<string>("ALL")

  // Low Stock Report
  const [lowStockData, setLowStockData] = useState<LowStockReport[]>([])

  const router = useRouter()
  const supabase = createClient()
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"))

  useEffect(() => {
    checkUser()
  }, [])

  const checkUser = async () => {
    const {
      data: { user }
    } = await supabase.auth.getUser()
    if (!user) {
      router.push("/login")
    } else {
      setUser(user)
      await generateInventoryReport()
    }
    setLoading(false)
  }

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue)
  }

  // Generate Inventory Valuation Report
  const generateInventoryReport = async () => {
    setGenerating(true)
    try {
      const { data, error } = await supabase
        .from("products")
        .select("id, name, sku, category, current_stock, unit_price, unit_of_measure")
        .order("name", { ascending: true })

      if (error) throw error

      const items: InventoryValuationItem[] =
        data?.map((item) => ({
          ...item,
          unit_price: item.unit_price || 0,
          total_value: item.current_stock * (item.unit_price || 0)
        })) || []

      setInventoryData(items)

      // Calculate total value
      const total = items.reduce((sum, item) => sum + item.total_value, 0)
      setTotalInventoryValue(total)

      // Generate summary by category
      const categoryMap = new Map<string, StockSummary>()
      items.forEach((item) => {
        const existing = categoryMap.get(item.category) || {
          category: item.category,
          total_items: 0,
          total_quantity: 0,
          total_value: 0
        }

        categoryMap.set(item.category, {
          category: item.category,
          total_items: existing.total_items + 1,
          total_quantity: existing.total_quantity + item.current_stock,
          total_value: existing.total_value + item.total_value
        })
      })

      setInventorySummary(Array.from(categoryMap.values()))
    } catch (error) {
      console.error("Error generating inventory report:", error)
    } finally {
      setGenerating(false)
    }
  }

  // Generate Stock Movements Report
  const generateMovementsReport = async () => {
    setGenerating(true)
    try {
      let query = supabase
        .from("stock_movements")
        .select(
          `
          id,
          movement_type,
          quantity,
          reference_number,
          movement_date,
          notes,
          products (
            name,
            sku
          )
        `
        )
        .gte("movement_date", movementStartDate)
        .lte("movement_date", movementEndDate)
        .order("movement_date", { ascending: false })

      if (movementType !== "ALL") {
        query = query.eq("movement_type", movementType)
      }

      const { data, error } = await query

      if (error) throw error

      const movements: StockMovementReport[] =
        data?.map((m: any) => ({
          id: m.id,
          product_name: m.products?.name || "Unknown",
          product_sku: m.products?.sku || "",
          movement_type: m.movement_type,
          quantity: m.quantity,
          reference_number: m.reference_number,
          movement_date: m.movement_date,
          notes: m.notes
        })) || []

      setMovementsData(movements)
    } catch (error) {
      console.error("Error generating movements report:", error)
    } finally {
      setGenerating(false)
    }
  }

  // Generate Low Stock Report
  const generateLowStockReport = async () => {
    setGenerating(true)
    try {
      const { data, error } = await supabase
        .from("products")
        .select("id, name, sku, category, current_stock, reorder_point, unit_of_measure")
        .order("current_stock", { ascending: true })

      if (error) throw error

      // Filter on the client side where current_stock <= reorder_point
      const lowStock = data?.filter((p) => p.current_stock <= p.reorder_point) || []

      const items: LowStockReport[] = lowStock.map((item) => ({
        ...item,
        difference: item.reorder_point - item.current_stock
      }))

      setLowStockData(items)
    } catch (error) {
      console.error("Error generating low stock report:", error)
    } finally {
      setGenerating(false)
    }
  }

  const exportToCSV = (data: any[], filename: string) => {
    if (data.length === 0) {
      alert("No data to export")
      return
    }

    const headers = Object.keys(data[0])
    const csvContent = [
      headers.join(","),
      ...data.map((row) =>
        headers
          .map((header) => {
            const value = row[header]
            return typeof value === "string" && value.includes(",") ? `"${value}"` : value
          })
          .join(",")
      )
    ].join("\n")

    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${filename}-${new Date().toISOString().split("T")[0]}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD"
    }).format(value)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
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
        <Box mb={3}>
          <Typography variant="h4" component="h1" fontWeight="bold">
            Reports & Analytics
          </Typography>
          <Typography variant="body2" color="textSecondary">
            Generate and export comprehensive inventory reports
          </Typography>
        </Box>

        {/* Tabs */}
        <Paper elevation={2}>
          <Tabs
            value={tabValue}
            onChange={handleTabChange}
            variant={isMobile ? "scrollable" : "standard"}
            scrollButtons="auto"
            sx={{ borderBottom: 1, borderColor: "divider" }}
          >
            <Tab label="Inventory Valuation" icon={<ReportIcon />} iconPosition="start" />
            <Tab label="Stock Movements" icon={<AdjustmentIcon />} iconPosition="start" />
            <Tab label="Low Stock Alert" icon={<OutIcon />} iconPosition="start" />
          </Tabs>

          {/* Tab 1: Inventory Valuation Report */}
          <TabPanel value={tabValue} index={0}>
            <Box sx={{ p: 3 }}>
              {/* Actions */}
              <Stack direction="row" spacing={2} mb={3} justifyContent="space-between">
                <Button
                  variant="contained"
                  startIcon={generating ? <CircularProgress size={20} /> : <ReportIcon />}
                  onClick={generateInventoryReport}
                  disabled={generating}
                >
                  Generate Report
                </Button>
                <Stack direction="row" spacing={1}>
                  <Button
                    variant="outlined"
                    startIcon={<DownloadIcon />}
                    onClick={() => exportToCSV(inventoryData, "inventory-valuation")}
                    disabled={inventoryData.length === 0}
                  >
                    Export CSV
                  </Button>
                  <IconButton color="primary" onClick={() => window.print()} disabled={inventoryData.length === 0}>
                    <PrintIcon />
                  </IconButton>
                </Stack>
              </Stack>

              {/* Summary Cards */}
              {inventorySummary.length > 0 && (
                <Grid container spacing={2} mb={3}>
                  <Grid columns={{ xs: 12, md: 4 }}>
                    <Card>
                      <CardContent>
                        <Typography color="textSecondary" variant="body2">
                          Total Inventory Value
                        </Typography>
                        <Typography variant="h4" fontWeight="bold" color="primary">
                          {formatCurrency(totalInventoryValue)}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid columns={{ xs: 12, md: 4 }}>
                    <Card>
                      <CardContent>
                        <Typography color="textSecondary" variant="body2">
                          Total Products
                        </Typography>
                        <Typography variant="h4" fontWeight="bold">
                          {inventoryData.length}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid columns={{ xs: 12, md: 4 }}>
                    <Card>
                      <CardContent>
                        <Typography color="textSecondary" variant="body2">
                          Categories
                        </Typography>
                        <Typography variant="h4" fontWeight="bold">
                          {inventorySummary.length}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>
              )}

              {/* Category Summary */}
              {inventorySummary.length > 0 && (
                <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
                  <Typography variant="h6" gutterBottom>
                    Summary by Category
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Category</TableCell>
                          <TableCell align="right">Items</TableCell>
                          <TableCell align="right">Total Quantity</TableCell>
                          <TableCell align="right">Total Value</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {inventorySummary.map((summary) => (
                          <TableRow key={summary.category}>
                            <TableCell>
                              <Chip label={summary.category} size="small" />
                            </TableCell>
                            <TableCell align="right">{summary.total_items}</TableCell>
                            <TableCell align="right">{summary.total_quantity}</TableCell>
                            <TableCell align="right" sx={{ fontWeight: "bold" }}>
                              {formatCurrency(summary.total_value)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Paper>
              )}

              {/* Detailed Inventory Table */}
              {inventoryData.length > 0 ? (
                <TableContainer component={Paper} variant="outlined">
                  <Table>
                    <TableHead>
                      <TableRow sx={{ bgcolor: "action.hover" }}>
                        <TableCell>Product</TableCell>
                        <TableCell>SKU</TableCell>
                        <TableCell>Category</TableCell>
                        <TableCell align="right">Stock</TableCell>
                        <TableCell align="right">Unit Price</TableCell>
                        <TableCell align="right">Total Value</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {inventoryData.map((item) => (
                        <TableRow key={item.id} hover>
                          <TableCell>{item.name}</TableCell>
                          <TableCell>
                            <Typography variant="body2" color="textSecondary">
                              {item.sku}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Chip label={item.category} size="small" variant="outlined" />
                          </TableCell>
                          <TableCell align="right">
                            {item.current_stock} {item.unit_of_measure}
                          </TableCell>
                          <TableCell align="right">{formatCurrency(item.unit_price)}</TableCell>
                          <TableCell align="right" sx={{ fontWeight: "bold" }}>
                            {formatCurrency(item.total_value)}
                          </TableCell>
                        </TableRow>
                      ))}
                      <TableRow sx={{ bgcolor: "action.hover" }}>
                        <TableCell colSpan={5} align="right" sx={{ fontWeight: "bold" }}>
                          GRAND TOTAL:
                        </TableCell>
                        <TableCell align="right" sx={{ fontWeight: "bold", fontSize: "1.1rem" }}>
                          {formatCurrency(totalInventoryValue)}
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : (
                <Alert severity="info">Click "Generate Report" to view inventory valuation</Alert>
              )}
            </Box>
          </TabPanel>

          {/* Tab 2: Stock Movements Report */}
          <TabPanel value={tabValue} index={1}>
            <Box sx={{ p: 3 }}>
              {/* Filters */}
              <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Report Filters
                </Typography>
                <Grid container spacing={2}>
                  <Grid columns={{ xs: 12, sm: 4 }}>
                    <TextField
                      fullWidth
                      label="Start Date"
                      type="date"
                      value={movementStartDate}
                      onChange={(e) => setMovementStartDate(e.target.value)}
                      InputLabelProps={{ shrink: true }}
                    />
                  </Grid>
                  <Grid columns={{ xs: 12, sm: 4 }}>
                    <TextField
                      fullWidth
                      label="End Date"
                      type="date"
                      value={movementEndDate}
                      onChange={(e) => setMovementEndDate(e.target.value)}
                      InputLabelProps={{ shrink: true }}
                    />
                  </Grid>
                  <Grid columns={{ xs: 12, sm: 4 }}>
                    <TextField
                      fullWidth
                      select
                      label="Movement Type"
                      value={movementType}
                      onChange={(e) => setMovementType(e.target.value)}
                    >
                      <MenuItem value="ALL">All Types</MenuItem>
                      <MenuItem value="IN">Stock In</MenuItem>
                      <MenuItem value="OUT">Stock Out</MenuItem>
                      <MenuItem value="ADJUSTMENT">Adjustments</MenuItem>
                    </TextField>
                  </Grid>
                </Grid>
              </Paper>

              {/* Actions */}
              <Stack direction="row" spacing={2} mb={3} justifyContent="space-between">
                <Button
                  variant="contained"
                  startIcon={generating ? <CircularProgress size={20} /> : <ReportIcon />}
                  onClick={generateMovementsReport}
                  disabled={generating}
                >
                  Generate Report
                </Button>
                <Stack direction="row" spacing={1}>
                  <Button
                    variant="outlined"
                    startIcon={<DownloadIcon />}
                    onClick={() => exportToCSV(movementsData, "stock-movements")}
                    disabled={movementsData.length === 0}
                  >
                    Export CSV
                  </Button>
                  <IconButton color="primary" onClick={() => window.print()} disabled={movementsData.length === 0}>
                    <PrintIcon />
                  </IconButton>
                </Stack>
              </Stack>

              {/* Movements Table */}
              {movementsData.length > 0 ? (
                <TableContainer component={Paper} variant="outlined">
                  <Table>
                    <TableHead>
                      <TableRow sx={{ bgcolor: "action.hover" }}>
                        <TableCell>Date</TableCell>
                        <TableCell>Product</TableCell>
                        <TableCell>Type</TableCell>
                        <TableCell align="right">Quantity</TableCell>
                        <TableCell>Reference</TableCell>
                        <TableCell>Notes</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {movementsData.map((movement) => (
                        <TableRow key={movement.id} hover>
                          <TableCell>
                            <Typography variant="body2">{formatDate(movement.movement_date)}</Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" fontWeight="medium">
                              {movement.product_name}
                            </Typography>
                            <Typography variant="caption" color="textSecondary">
                              {movement.product_sku}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={movement.movement_type}
                              size="small"
                              color={
                                movement.movement_type === "IN"
                                  ? "success"
                                  : movement.movement_type === "OUT"
                                  ? "error"
                                  : "warning"
                              }
                            />
                          </TableCell>
                          <TableCell align="right" sx={{ fontWeight: "bold" }}>
                            {movement.movement_type === "OUT" ? "-" : "+"}
                            {movement.quantity}
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" color="textSecondary">
                              {movement.reference_number || "-"}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" color="textSecondary">
                              {movement.notes || "-"}
                            </Typography>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : (
                <Alert severity="info">Select filters and click "Generate Report" to view stock movements</Alert>
              )}
            </Box>
          </TabPanel>

          {/* Tab 3: Low Stock Report */}
          <TabPanel value={tabValue} index={2}>
            <Box sx={{ p: 3 }}>
              {/* Actions */}
              <Stack direction="row" spacing={2} mb={3} justifyContent="space-between">
                <Button
                  variant="contained"
                  startIcon={generating ? <CircularProgress size={20} /> : <ReportIcon />}
                  onClick={generateLowStockReport}
                  disabled={generating}
                >
                  Generate Report
                </Button>
                <Stack direction="row" spacing={1}>
                  <Button
                    variant="outlined"
                    startIcon={<DownloadIcon />}
                    onClick={() => exportToCSV(lowStockData, "low-stock-report")}
                    disabled={lowStockData.length === 0}
                  >
                    Export CSV
                  </Button>
                  <IconButton color="primary" onClick={() => window.print()} disabled={lowStockData.length === 0}>
                    <PrintIcon />
                  </IconButton>
                </Stack>
              </Stack>

              {/* Low Stock Table */}
              {lowStockData.length > 0 ? (
                <>
                  <Alert severity="warning" sx={{ mb: 3 }}>
                    {lowStockData.length} product(s) need reordering
                  </Alert>
                  <TableContainer component={Paper} variant="outlined">
                    <Table>
                      <TableHead>
                        <TableRow sx={{ bgcolor: "action.hover" }}>
                          <TableCell>Product</TableCell>
                          <TableCell>SKU</TableCell>
                          <TableCell>Category</TableCell>
                          <TableCell align="right">Current Stock</TableCell>
                          <TableCell align="right">Reorder Point</TableCell>
                          <TableCell align="right">Difference</TableCell>
                          <TableCell align="center">Status</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {lowStockData.map((item) => (
                          <TableRow key={item.id} hover>
                            <TableCell>
                              <Typography variant="body2" fontWeight="medium">
                                {item.name}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2" color="textSecondary">
                                {item.sku}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Chip label={item.category} size="small" variant="outlined" />
                            </TableCell>
                            <TableCell align="right">
                              <Chip
                                label={`${item.current_stock} ${item.unit_of_measure}`}
                                size="small"
                                color="error"
                              />
                            </TableCell>
                            <TableCell align="right">
                              {item.reorder_point} {item.unit_of_measure}
                            </TableCell>
                            <TableCell align="right" sx={{ color: "error.main", fontWeight: "bold" }}>
                              -{item.difference} {item.unit_of_measure}
                            </TableCell>
                            <TableCell align="center">
                              <Chip
                                label={item.current_stock === 0 ? "OUT OF STOCK" : "LOW STOCK"}
                                size="small"
                                color="error"
                              />
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </>
              ) : generating ? (
                <Box display="flex" justifyContent="center" py={4}>
                  <CircularProgress />
                </Box>
              ) : (
                <Alert severity="success">All products are adequately stocked! No items below reorder point.</Alert>
              )}
            </Box>
          </TabPanel>
        </Paper>
      </Box>
    </DashboardLayout>
  )
}
