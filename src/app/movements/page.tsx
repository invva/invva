"use client"

import { useEffect, useState, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import DashboardLayout from "@/components/DashboardLayout"
import { useRouter } from "next/navigation"
import {
  Box,
  Typography,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Snackbar,
  Alert,
  CircularProgress,
  Chip,
  Card,
  CardContent,
  Grid,
  useTheme,
  useMediaQuery
} from "@mui/material"
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Close as CloseIcon,
  Warehouse as WarehouseIcon
} from "@mui/icons-material"

interface Warehouse {
  id: string
  name: string
  is_default: boolean
  is_active: boolean
}

interface Product {
  id: string
  name: string
  sku: string
  current_stock: number
  warehouse_id: string
  supplier?: {
    id: string
    name: string
  }
}

interface StockMovement {
  id: string
  product_id: string
  warehouse_id: string
  movement_type: "IN" | "OUT" | "ADJUSTMENT"
  quantity: number
  reference_number?: string
  notes?: string
  movement_date: string
  created_at: string
  products?: {
    name: string
    sku: string
    supplier?: {
      id: string
      name: string
    }
  }
  warehouses?: {
    id: string
    name: string
  }
}

interface MovementFormData {
  product_id: string
  warehouse_id: string
  movement_type: "IN" | "OUT" | "ADJUSTMENT"
  quantity: number
  reference_number: string
  notes: string
  movement_date: string
}

export default function StockMovementsPage() {
  const [movements, setMovements] = useState<StockMovement[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [warehouses, setWarehouses] = useState<Warehouse[]>([])
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [openDialog, setOpenDialog] = useState(false)
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false)
  const [editingMovement, setEditingMovement] = useState<StockMovement | null>(null)
  const [deletingMovement, setDeletingMovement] = useState<StockMovement | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterType, setFilterType] = useState<string>("ALL")
  const [selectedWarehouse, setSelectedWarehouse] = useState<string>("all")

  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success" as "success" | "error" | "info" | "warning"
  })

  const [formData, setFormData] = useState<MovementFormData>({
    product_id: "",
    warehouse_id: "",
    movement_type: "IN",
    quantity: 0,
    reference_number: "",
    notes: "",
    movement_date: new Date().toISOString().split("T")[0]
  })

  const router = useRouter()
  const supabase = createClient()
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"))
  const isTablet = useMediaQuery(theme.breakpoints.down("md"))

  const showSnackbar = useCallback((message: string, severity: "success" | "error" | "info" | "warning") => {
    setSnackbar({ open: true, message, severity })
  }, [])

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

  const fetchMovements = useCallback(async () => {
    setLoading(true)
    try {
      let query = supabase
        .from("stock_movements")
        .select(
          `
          *,
          products (
            name,
            sku,
            supplier:suppliers(id, name)
          ),
          warehouses:warehouse_id (
            id,
            name
          )
        `
        )
        .order("movement_date", { ascending: false })

      // Filter by warehouse if selected
      if (selectedWarehouse && selectedWarehouse !== "all") {
        query = query.eq("warehouse_id", selectedWarehouse)
      }

      const { data, error } = await query

      if (error) throw error
      setMovements(data || [])
    } catch (error) {
      console.error("Error fetching movements:", error)
      showSnackbar("Error loading stock movements", "error")
    } finally {
      setLoading(false)
    }
  }, [supabase, showSnackbar, selectedWarehouse])

  const fetchProducts = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("products")
        .select("id, name, sku, current_stock, warehouse_id")
        .order("name")

      if (error) throw error
      setProducts(data || [])
    } catch (error) {
      console.error("Error fetching products:", error)
    }
  }, [supabase])

  const checkUserAndFetchData = useCallback(async () => {
    const {
      data: { user }
    } = await supabase.auth.getUser()

    if (!user) {
      router.push("/login")
    } else {
      await Promise.all([fetchWarehouses(), fetchMovements(), fetchProducts()])
    }
  }, [supabase, router, fetchWarehouses, fetchMovements, fetchProducts])

  useEffect(() => {
    checkUserAndFetchData()
  }, [checkUserAndFetchData])

  useEffect(() => {
    // Only refetch when warehouse changes after initial load
    if (!loading && movements.length > 0) {
      fetchMovements()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedWarehouse])

  useEffect(() => {
    // Filter products by selected warehouse in form
    if (formData.warehouse_id) {
      const filtered = products.filter((p) => p.warehouse_id === formData.warehouse_id)
      setFilteredProducts(filtered)

      // Reset product selection if current product doesn't match warehouse
      if (formData.product_id) {
        const productInWarehouse = filtered.find((p) => p.id === formData.product_id)
        if (!productInWarehouse) {
          setFormData((prev) => ({ ...prev, product_id: "" }))
        }
      }
    } else {
      setFilteredProducts(products)
    }
  }, [formData.warehouse_id, products, formData.product_id])

  const handleOpenDialog = (movement?: StockMovement) => {
    if (movement) {
      setEditingMovement(movement)
      setFormData({
        product_id: movement.product_id,
        warehouse_id: movement.warehouse_id,
        movement_type: movement.movement_type,
        quantity: movement.quantity,
        reference_number: movement.reference_number || "",
        notes: movement.notes || "",
        movement_date: movement.movement_date.split("T")[0]
      })
    } else {
      setEditingMovement(null)
      const defaultWarehouse = warehouses.find((w) => w.is_default) || warehouses[0]
      setFormData({
        product_id: "",
        warehouse_id: defaultWarehouse?.id || "",
        movement_type: "IN",
        quantity: 0,
        reference_number: "",
        notes: "",
        movement_date: new Date().toISOString().split("T")[0]
      })
    }
    setOpenDialog(true)
  }

  const handleCloseDialog = () => {
    setOpenDialog(false)
    setEditingMovement(null)
  }

  const validateMovement = async (): Promise<boolean> => {
    if (!formData.product_id || !formData.warehouse_id || formData.quantity <= 0) {
      showSnackbar("Please fill in all required fields", "warning")
      return false
    }

    // For OUT movements, check if enough stock available in the warehouse
    if (formData.movement_type === "OUT") {
      const product = products.find((p) => p.id === formData.product_id)
      if (product && product.warehouse_id === formData.warehouse_id) {
        if (product.current_stock < formData.quantity) {
          showSnackbar(`Insufficient stock in this warehouse. Available: ${product.current_stock}`, "error")
          return false
        }
      }
    }

    return true
  }

  const handleSaveMovement = async () => {
    if (!(await validateMovement())) return

    try {
      const {
        data: { user }
      } = await supabase.auth.getUser()

      if (!user) {
        showSnackbar("User not authenticated", "error")
        return
      }

      const movementData = {
        user_id: user.id,
        product_id: formData.product_id,
        warehouse_id: formData.warehouse_id,
        movement_type: formData.movement_type,
        quantity: formData.quantity,
        reference_number: formData.reference_number || null,
        notes: formData.notes || null,
        movement_date: formData.movement_date
      }

      if (editingMovement) {
        // Update existing movement
        const { error } = await supabase.from("stock_movements").update(movementData).eq("id", editingMovement.id)

        if (error) throw error
        showSnackbar("Stock movement updated successfully", "success")
      } else {
        // Create new movement
        const { error } = await supabase.from("stock_movements").insert(movementData)

        if (error) throw error
        showSnackbar("Stock movement created successfully", "success")
      }

      handleCloseDialog()
      fetchMovements()
      fetchProducts() // Refresh to show updated stock levels
    } catch (error) {
      console.error("Error saving movement:", error)
      showSnackbar("Error saving stock movement", "error")
    }
  }

  const handleOpenDeleteDialog = (movement: StockMovement) => {
    setDeletingMovement(movement)
    setOpenDeleteDialog(true)
  }

  const handleCloseDeleteDialog = () => {
    setOpenDeleteDialog(false)
    setDeletingMovement(null)
  }

  const handleDeleteMovement = async () => {
    if (!deletingMovement) return

    try {
      const { error } = await supabase.from("stock_movements").delete().eq("id", deletingMovement.id)

      if (error) throw error
      showSnackbar("Stock movement deleted successfully", "success")
      handleCloseDeleteDialog()
      fetchMovements()
      fetchProducts() // Refresh to show updated stock levels
    } catch (error) {
      console.error("Error deleting movement:", error)
      showSnackbar("Error deleting stock movement", "error")
    }
  }

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false })
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

  const filteredMovements = movements.filter((movement) => {
    const matchesSearch =
      movement.products?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      movement.products?.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
      movement.reference_number?.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesFilter = filterType === "ALL" || movement.movement_type === filterType

    return matchesSearch && matchesFilter
  })

  if (loading) {
    return (
      <DashboardLayout>
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            minHeight: "400px"
          }}
        >
          <CircularProgress />
        </Box>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <Box sx={{ p: { xs: 2, sm: 3 } }}>
        {/* Header */}
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: { xs: "flex-start", sm: "center" },
            mb: 3,
            flexDirection: { xs: "column", sm: "row" },
            gap: 2
          }}
        >
          <Typography variant="h4" component="h1">
            Stock Movements
          </Typography>
          <Box
            sx={{
              display: "flex",
              gap: 2,
              flexWrap: "wrap"
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
            <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpenDialog()} fullWidth={isMobile}>
              Add Movement
            </Button>
          </Box>
        </Box>

        {/* Filters */}
        <Paper sx={{ p: 2, mb: 3 }}>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 6, md: 8 }}>
              <TextField
                fullWidth
                label="Search by product or reference"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                size="small"
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
              <FormControl fullWidth size="small">
                <InputLabel>Movement Type</InputLabel>
                <Select value={filterType} label="Movement Type" onChange={(e) => setFilterType(e.target.value)}>
                  <MenuItem value="ALL">All Types</MenuItem>
                  <MenuItem value="IN">Stock In</MenuItem>
                  <MenuItem value="OUT">Stock Out</MenuItem>
                  <MenuItem value="ADJUSTMENT">Adjustment</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </Paper>

        {/* Mobile Card View */}
        {isMobile ? (
          <Box>
            {filteredMovements.map((movement) => (
              <Card key={movement.id} sx={{ mb: 2 }}>
                <CardContent>
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                      mb: 2
                    }}
                  >
                    <Box>
                      <Typography variant="h6" gutterBottom>
                        {movement.products?.name}
                      </Typography>
                      <Typography
                        variant="body2"
                        sx={{
                          color: "text.secondary"
                        }}
                      >
                        SKU: {movement.products?.sku}
                      </Typography>
                      {movement.products?.supplier && (
                        <Typography
                          variant="body2"
                          sx={{
                            color: "text.secondary"
                          }}
                        >
                          Supplier: {movement.products.supplier.name}
                        </Typography>
                      )}
                    </Box>
                    <Chip
                      label={movement.movement_type}
                      color={getMovementColor(movement.movement_type) as "error" | "success" | "warning" | "default"}
                      size="small"
                    />
                  </Box>

                  <Box
                    sx={{
                      mb: 2
                    }}
                  >
                    <Chip
                      icon={<WarehouseIcon />}
                      label={movement.warehouses?.name || "N/A"}
                      size="small"
                      variant="outlined"
                      sx={{ mb: 1 }}
                    />
                    <Typography variant="body2">
                      <strong>Quantity:</strong> {movement.quantity}
                    </Typography>
                    {movement.reference_number && (
                      <Typography variant="body2">
                        <strong>Reference:</strong> {movement.reference_number}
                      </Typography>
                    )}
                    <Typography variant="body2">
                      <strong>Date:</strong> {new Date(movement.movement_date).toLocaleDateString()}
                    </Typography>
                    {movement.notes && (
                      <Typography variant="body2">
                        <strong>Notes:</strong> {movement.notes}
                      </Typography>
                    )}
                  </Box>

                  <Box
                    sx={{
                      display: "flex",
                      gap: 1
                    }}
                  >
                    <Button size="small" startIcon={<EditIcon />} onClick={() => handleOpenDialog(movement)} fullWidth>
                      Edit
                    </Button>
                    <Button
                      size="small"
                      color="error"
                      startIcon={<DeleteIcon />}
                      onClick={() => handleOpenDeleteDialog(movement)}
                      fullWidth
                    >
                      Delete
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            ))}
          </Box>
        ) : (
          /* Desktop/Tablet Table View */
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Type</TableCell>
                  <TableCell>Product</TableCell>
                  {!isTablet && <TableCell>SKU</TableCell>}
                  {!isTablet && <TableCell>Supplier</TableCell>}
                  <TableCell>Warehouse</TableCell>
                  <TableCell align="right">Quantity</TableCell>
                  {!isTablet && <TableCell>Reference</TableCell>}
                  <TableCell>Date</TableCell>
                  {!isTablet && <TableCell>Notes</TableCell>}
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredMovements.map((movement) => (
                  <TableRow key={movement.id} hover>
                    <TableCell>
                      <Chip
                        label={movement.movement_type}
                        color={getMovementColor(movement.movement_type) as "error" | "success" | "warning" | "default"}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>{movement.products?.name}</TableCell>
                    {!isTablet && <TableCell>{movement.products?.sku}</TableCell>}
                    {!isTablet && (
                      <TableCell>
                        {movement.products?.supplier ? (
                          <Typography
                            variant="body2"
                            sx={{
                              fontWeight: 500
                            }}
                          >
                            {movement.products.supplier.name}
                          </Typography>
                        ) : (
                          <Typography
                            variant="body2"
                            sx={{
                              color: "text.secondary"
                            }}
                          >
                            -
                          </Typography>
                        )}
                      </TableCell>
                    )}
                    <TableCell>
                      <Chip
                        icon={<WarehouseIcon />}
                        label={movement.warehouses?.name || "N/A"}
                        size="small"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell align="right">{movement.quantity}</TableCell>
                    {!isTablet && <TableCell>{movement.reference_number || "-"}</TableCell>}
                    <TableCell>{new Date(movement.movement_date).toLocaleDateString()}</TableCell>
                    {!isTablet && (
                      <TableCell sx={{ maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis" }}>
                        {movement.notes || "-"}
                      </TableCell>
                    )}
                    <TableCell align="right">
                      <IconButton size="small" onClick={() => handleOpenDialog(movement)} color="primary">
                        <EditIcon />
                      </IconButton>
                      <IconButton size="small" onClick={() => handleOpenDeleteDialog(movement)} color="error">
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        {filteredMovements.length === 0 && (
          <Paper sx={{ p: 4, textAlign: "center" }}>
            <Typography
              sx={{
                color: "text.secondary"
              }}
            >
              No stock movements found. Click &ldquo;Add Movement&rdquo; to create one.
            </Typography>
          </Paper>
        )}
      </Box>
      {/* Add/Edit Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth fullScreen={isMobile}>
        <DialogTitle>
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center"
            }}
          >
            {editingMovement ? "Edit Stock Movement" : "Add Stock Movement"}
            {isMobile && (
              <IconButton onClick={handleCloseDialog}>
                <CloseIcon />
              </IconButton>
            )}
          </Box>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2, display: "flex", flexDirection: "column", gap: 2 }}>
            <FormControl fullWidth required>
              <InputLabel>Warehouse</InputLabel>
              <Select
                value={formData.warehouse_id}
                label="Warehouse"
                onChange={(e) => setFormData({ ...formData, warehouse_id: e.target.value })}
              >
                {warehouses.map((warehouse) => (
                  <MenuItem key={warehouse.id} value={warehouse.id}>
                    {warehouse.name} {warehouse.is_default && "(Default)"}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth required>
              <InputLabel>Product</InputLabel>
              <Select
                value={formData.product_id}
                label="Product"
                onChange={(e) => setFormData({ ...formData, product_id: e.target.value })}
                disabled={!formData.warehouse_id}
              >
                {filteredProducts.map((product) => (
                  <MenuItem key={product.id} value={product.id}>
                    {product.name} ({product.sku}) - Stock: {product.current_stock}
                  </MenuItem>
                ))}
              </Select>
              {!formData.warehouse_id && (
                <Typography
                  variant="caption"
                  sx={{
                    color: "text.secondary",
                    mt: 0.5,
                    ml: 1.5
                  }}
                >
                  Select a warehouse first
                </Typography>
              )}
            </FormControl>

            <FormControl fullWidth required>
              <InputLabel>Movement Type</InputLabel>
              <Select
                value={formData.movement_type}
                label="Movement Type"
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    movement_type: e.target.value as "IN" | "OUT" | "ADJUSTMENT"
                  })
                }
              >
                <MenuItem value="IN">Stock In</MenuItem>
                <MenuItem value="OUT">Stock Out</MenuItem>
                <MenuItem value="ADJUSTMENT">Adjustment</MenuItem>
              </Select>
            </FormControl>

            <TextField
              fullWidth
              label="Quantity"
              type="number"
              required
              value={formData.quantity}
              onChange={(e) => setFormData({ ...formData, quantity: parseFloat(e.target.value) })}
              helperText={
                formData.movement_type === "ADJUSTMENT"
                  ? "Enter positive number to add, negative to subtract"
                  : "Enter quantity"
              }
              slotProps={{
                htmlInput: { min: 0, step: 1 }
              }}
            />

            <TextField
              fullWidth
              label="Movement Date"
              type="date"
              required
              value={formData.movement_date}
              onChange={(e) => setFormData({ ...formData, movement_date: e.target.value })}
              slotProps={{
                inputLabel: { shrink: true }
              }}
            />

            <TextField
              fullWidth
              label="Reference Number"
              value={formData.reference_number}
              onChange={(e) => setFormData({ ...formData, reference_number: e.target.value })}
              placeholder="PO#, Invoice#, etc."
            />

            <TextField
              fullWidth
              label="Notes"
              multiline
              rows={3}
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Additional information about this movement"
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSaveMovement} variant="contained">
            {editingMovement ? "Update" : "Create"}
          </Button>
        </DialogActions>
      </Dialog>
      {/* Delete Confirmation Dialog */}
      <Dialog open={openDeleteDialog} onClose={handleCloseDeleteDialog}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete this stock movement for <strong>{deletingMovement?.products?.name}</strong>?
          </Typography>
          <Typography color="error" sx={{ mt: 1 }}>
            This action cannot be undone and will be recorded in the audit log.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDeleteDialog}>Cancel</Button>
          <Button onClick={handleDeleteMovement} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: "100%" }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </DashboardLayout>
  )
}
