"use client"

import { useEffect, useState, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import DashboardLayout from "@/components/DashboardLayout"
import type { User } from "@supabase/supabase-js"
import { useRouter } from "next/navigation"
import {
  Box,
  Button,
  TextField,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Modal,
  IconButton,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Snackbar,
  Card,
  CardContent,
  CardActions,
  Stack,
  Chip,
  useMediaQuery,
  useTheme
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
  sku: string | null
  barcode: string | null
  description: string | null
  unit_of_measure: string
  reorder_point: number | null
  unit_price: number | null
  category: string | null
  warehouse_id: string
  custom_fields: Record<string, unknown> | null
  created_at: string
  current_stock: number
  warehouses?: {
    id: string
    name: string
  }
}

interface SnackbarState {
  open: boolean
  message: string
  severity: "success" | "error" | "info" | "warning"
}

export default function ProductsPage() {
  const [user, setUser] = useState<User | null>(null)
  const [products, setProducts] = useState<Product[]>([])
  const [warehouses, setWarehouses] = useState<Warehouse[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedWarehouse, setSelectedWarehouse] = useState<string>("all")
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean
    product: Product | null
  }>({ open: false, product: null })
  const [snackbar, setSnackbar] = useState<SnackbarState>({
    open: false,
    message: "",
    severity: "success"
  })
  const router = useRouter()
  const supabase = createClient()
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"))
  const isTablet = useMediaQuery(theme.breakpoints.down("md"))

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

  const fetchProducts = useCallback(
    async (userId: string) => {
      setLoading(true)
      try {
        let query = supabase
          .from("products")
          .select(
            `
            *,
            warehouses:warehouse_id (
              id,
              name
            )
          `
          )
          .eq("user_id", userId)
          .order("created_at", { ascending: false })

        // Filter by warehouse if selected
        if (selectedWarehouse && selectedWarehouse !== "all") {
          query = query.eq("warehouse_id", selectedWarehouse)
        }

        const { data, error } = await query

        if (error) throw error

        setProducts(data || [])
      } catch (error) {
        console.error("Error fetching products:", error)
        showSnackbar("Failed to load products", "error")
      } finally {
        setLoading(false)
      }
    },
    [supabase, selectedWarehouse]
  )

  const checkUser = useCallback(async () => {
    const {
      data: { user }
    } = await supabase.auth.getUser()

    if (!user) {
      router.push("/login")
    } else {
      setUser(user)
      await fetchWarehouses()
      fetchProducts(user.id)
    }
  }, [supabase, router, fetchWarehouses, fetchProducts])

  useEffect(() => {
    checkUser()
  }, [checkUser])

  useEffect(() => {
    if (user) {
      fetchProducts(user.id)
    }
  }, [selectedWarehouse, user, fetchProducts])

  const showSnackbar = (message: string, severity: "success" | "error" | "info" | "warning" = "success") => {
    setSnackbar({ open: true, message, severity })
  }

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false })
  }

  const handleDeleteClick = (product: Product) => {
    setDeleteDialog({ open: true, product })
  }

  const handleDeleteCancel = () => {
    setDeleteDialog({ open: false, product: null })
  }

  const handleDeleteConfirm = async () => {
    if (!deleteDialog.product) return

    const productToDelete = deleteDialog.product
    setDeleteDialog({ open: false, product: null })

    try {
      const { error } = await supabase.from("products").delete().eq("id", productToDelete.id)

      if (error) throw error

      setProducts(products.filter((p) => p.id !== productToDelete.id))
      showSnackbar(`"${productToDelete.name}" deleted successfully`, "success")
    } catch (error) {
      console.error("Error deleting product:", error)
      showSnackbar("Failed to delete product", "error")
    }
  }

  const filteredProducts = products.filter(
    (product) =>
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.sku?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.barcode?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.category?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const formatCurrency = (value: number | null) => {
    if (value === null || value === undefined) return "-"
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD"
    }).format(value)
  }

  if (loading) {
    return (
      <DashboardLayout>
        <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
          <CircularProgress />
        </Box>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      {/* Header */}
      <Box
        sx={{
          display: "flex",
          flexDirection: { xs: "column", sm: "row" },
          justifyContent: "space-between",
          alignItems: { xs: "stretch", sm: "center" },
          gap: 2,
          mb: 3
        }}
      >
        <Typography variant={isMobile ? "h5" : "h4"} fontWeight={600}>
          Products
        </Typography>
        <Box display="flex" gap={2} flexWrap="wrap">
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
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => {
              setEditingProduct(null)
              setShowAddModal(true)
            }}
            fullWidth={isMobile}
            sx={{
              bgcolor: "#667eea",
              textTransform: "none",
              fontWeight: 500,
              "&:hover": {
                bgcolor: "#5568d3"
              }
            }}
          >
            Add Product
          </Button>
        </Box>
      </Box>

      {/* Search Bar */}
      <Box sx={{ mb: 2 }}>
        <TextField
          fullWidth
          placeholder="Search products by name, SKU, barcode, or category..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          size="small"
          sx={{ bgcolor: "white" }}
        />
      </Box>

      {/* Empty State */}
      {filteredProducts.length === 0 ? (
        <Paper sx={{ p: { xs: 4, sm: 8 }, textAlign: "center" }}>
          <Typography variant="h1" sx={{ mb: 2 }}>
            📦
          </Typography>
          <Typography color="text.secondary" gutterBottom>
            {searchTerm ? "No products found" : "No products yet"}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {searchTerm ? "Try a different search term" : "Click 'Add Product' to get started"}
          </Typography>
        </Paper>
      ) : (
        <>
          {/* Desktop/Tablet Table View */}
          {!isMobile ? (
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow sx={{ bgcolor: "#f9fafb" }}>
                    <TableCell sx={{ fontWeight: 600 }}>Name</TableCell>
                    {!isTablet && <TableCell sx={{ fontWeight: 600 }}>SKU</TableCell>}
                    <TableCell sx={{ fontWeight: 600 }}>Warehouse</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Category</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Unit</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600 }}>
                      Price
                    </TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600 }}>
                      Stock
                    </TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600 }}>
                      Actions
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredProducts.map((product) => (
                    <TableRow key={product.id} hover>
                      <TableCell sx={{ fontWeight: 500 }}>{product.name}</TableCell>
                      {!isTablet && <TableCell>{product.sku || "-"}</TableCell>}
                      <TableCell>
                        <Chip
                          icon={<WarehouseIcon />}
                          label={product.warehouses?.name || "N/A"}
                          size="small"
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell>
                        <Chip label={product.category || "General"} size="small" variant="outlined" />
                      </TableCell>
                      <TableCell>{product.unit_of_measure}</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 500 }}>
                        {formatCurrency(product.unit_price)}
                      </TableCell>
                      <TableCell align="right" sx={{ fontWeight: 500 }}>
                        {product.reorder_point && product.current_stock <= product.reorder_point ? (
                          <Chip label={`${product.current_stock} - Low`} color="error" size="small" />
                        ) : (
                          product.current_stock
                        )}
                      </TableCell>
                      <TableCell align="right">
                        <Box
                          sx={{
                            display: "flex",
                            gap: 1,
                            justifyContent: "flex-end",
                            flexWrap: "wrap"
                          }}
                        >
                          <Button
                            size="small"
                            startIcon={<EditIcon />}
                            onClick={() => {
                              setEditingProduct(product)
                              setShowAddModal(true)
                            }}
                            sx={{ textTransform: "none" }}
                          >
                            Edit
                          </Button>
                          <Button
                            size="small"
                            startIcon={<DeleteIcon />}
                            onClick={() => handleDeleteClick(product)}
                            color="error"
                            sx={{ textTransform: "none" }}
                          >
                            Delete
                          </Button>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            /* Mobile Card View */
            <Stack spacing={2}>
              {filteredProducts.map((product) => (
                <Card key={product.id} variant="outlined">
                  <CardContent>
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "flex-start",
                        mb: 2
                      }}
                    >
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="h6" fontWeight={600} gutterBottom>
                          {product.name}
                        </Typography>
                        <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ mb: 1, gap: 0.5 }}>
                          <Chip
                            icon={<WarehouseIcon />}
                            label={product.warehouses?.name || "N/A"}
                            size="small"
                            variant="outlined"
                          />
                          {product.reorder_point && product.current_stock <= product.reorder_point ? (
                            <Chip label={`Stock: ${product.current_stock} - Low`} size="small" color="error" />
                          ) : (
                            <Chip label={`Stock: ${product.current_stock}`} size="small" color="primary" />
                          )}
                          <Chip label={product.unit_of_measure} size="small" variant="outlined" />
                          <Chip label={product.category || "General"} size="small" variant="outlined" />
                        </Stack>
                      </Box>
                    </Box>

                    <Box sx={{ mb: 1 }}>
                      <Typography variant="body2" color="text.secondary">
                        Price: <strong>{formatCurrency(product.unit_price)}</strong>
                      </Typography>
                      {product.sku && (
                        <Typography variant="body2" color="text.secondary">
                          SKU: {product.sku}
                        </Typography>
                      )}
                      {product.barcode && (
                        <Typography variant="body2" color="text.secondary">
                          Barcode: {product.barcode}
                        </Typography>
                      )}
                    </Box>
                  </CardContent>

                  <CardActions sx={{ px: 2, pb: 2 }}>
                    <Button
                      size="small"
                      startIcon={<EditIcon />}
                      onClick={() => {
                        setEditingProduct(product)
                        setShowAddModal(true)
                      }}
                      sx={{ textTransform: "none" }}
                    >
                      Edit
                    </Button>
                    <Button
                      size="small"
                      startIcon={<DeleteIcon />}
                      onClick={() => handleDeleteClick(product)}
                      color="error"
                      sx={{ textTransform: "none" }}
                    >
                      Delete
                    </Button>
                  </CardActions>
                </Card>
              ))}
            </Stack>
          )}
        </>
      )}

      {/* Add/Edit Modal */}
      <ProductModal
        open={showAddModal}
        product={editingProduct}
        warehouses={warehouses}
        onClose={() => {
          setShowAddModal(false)
          setEditingProduct(null)
        }}
        onSave={(message: string) => {
          setShowAddModal(false)
          setEditingProduct(null)
          if (user) fetchProducts(user.id)
          showSnackbar(message, "success")
        }}
        userId={user?.id || ""}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialog.open} onClose={handleDeleteCancel} maxWidth="xs" fullWidth>
        <DialogTitle>Delete Product?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete <strong>&quot;{deleteDialog.product?.name}&quot;</strong>? This action
            cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={handleDeleteCancel} sx={{ textTransform: "none" }}>
            Cancel
          </Button>
          <Button onClick={handleDeleteConfirm} color="error" variant="contained" sx={{ textTransform: "none" }}>
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar Notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} variant="filled" sx={{ width: "100%" }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </DashboardLayout>
  )
}

// Product Modal Component
interface ProductModalProps {
  open: boolean
  product: Product | null
  warehouses: Warehouse[]
  onClose: () => void
  onSave: (message: string) => void
  userId: string
}

function ProductModal({ open, product, warehouses, onClose, onSave, userId }: ProductModalProps) {
  const [formData, setFormData] = useState({
    name: product?.name || "",
    sku: product?.sku || "",
    barcode: product?.barcode || "",
    description: product?.description || "",
    unit_of_measure: product?.unit_of_measure || "pcs",
    category: product?.category || "General",
    unit_price: product?.unit_price?.toString() || "",
    reorder_point: product?.reorder_point?.toString() || "",
    warehouse_id: product?.warehouse_id || "",
    initial_stock: ""
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const supabase = createClient()
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"))

  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name || "",
        sku: product.sku || "",
        barcode: product.barcode || "",
        description: product.description || "",
        unit_of_measure: product.unit_of_measure || "pcs",
        category: product.category || "General",
        unit_price: product.unit_price?.toString() || "",
        reorder_point: product.reorder_point?.toString() || "",
        warehouse_id: product.warehouse_id || "",
        initial_stock: ""
      })
    } else {
      const defaultWarehouse = warehouses.find((w) => w.is_default) || warehouses[0]
      setFormData({
        name: "",
        sku: "",
        barcode: "",
        description: "",
        unit_of_measure: "pcs",
        category: "General",
        unit_price: "",
        reorder_point: "",
        warehouse_id: defaultWarehouse?.id || "",
        initial_stock: ""
      })
    }
    setError("")
  }, [product, open, warehouses])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    if (!formData.warehouse_id) {
      setError("Please select a warehouse")
      setLoading(false)
      return
    }

    try {
      const productData = {
        name: formData.name,
        sku: formData.sku || null,
        barcode: formData.barcode || null,
        description: formData.description || null,
        unit_of_measure: formData.unit_of_measure,
        category: formData.category || "General",
        unit_price: formData.unit_price ? parseFloat(formData.unit_price) : null,
        reorder_point: formData.reorder_point ? parseInt(formData.reorder_point) : null,
        warehouse_id: formData.warehouse_id,
        user_id: userId
      }

      if (product) {
        const { error } = await supabase.from("products").update(productData).eq("id", product.id)

        if (error) throw error
        onSave(`"${formData.name}" updated successfully`)
      } else {
        // Insert product
        const { data: newProduct, error: productError } = await supabase
          .from("products")
          .insert(productData)
          .select()
          .single()

        if (productError) throw productError

        // If initial stock is provided, create an IN movement
        if (formData.initial_stock && parseFloat(formData.initial_stock) > 0) {
          const { error: movementError } = await supabase.from("stock_movements").insert({
            user_id: userId,
            product_id: newProduct.id,
            warehouse_id: formData.warehouse_id,
            movement_type: "IN",
            quantity: parseFloat(formData.initial_stock),
            notes: "Opening stock balance",
            movement_date: new Date().toISOString().split("T")[0]
          })

          if (movementError) throw movementError
        }

        onSave(`"${formData.name}" added successfully`)
      }
    } catch (err) {
      console.error("Error saving product:", err)
      setError("Failed to save product. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose}>
      <Box
        sx={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: isMobile ? "90vw" : 500,
          maxWidth: "90vw",
          maxHeight: "90vh",
          overflow: "auto",
          bgcolor: "background.paper",
          borderRadius: 2,
          boxShadow: 24
        }}
      >
        {/* Modal Header */}
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            p: 2.5,
            borderBottom: 1,
            borderColor: "divider"
          }}
        >
          <Typography variant="h6" fontWeight={600}>
            {product ? "Edit Product" : "Add New Product"}
          </Typography>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>

        {/* Modal Body */}
        <Box component="form" onSubmit={handleSubmit} sx={{ p: 3 }}>
          <TextField
            fullWidth
            required
            label="Product Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            sx={{ mb: 2.5 }}
          />

          <Box sx={{ display: "flex", gap: 2, mb: 2.5 }}>
            <TextField
              fullWidth
              label="SKU"
              value={formData.sku}
              onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
            />

            <TextField
              fullWidth
              label="Barcode"
              value={formData.barcode}
              onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
            />
          </Box>

          <FormControl fullWidth required sx={{ mb: 2.5 }}>
            <InputLabel>Warehouse *</InputLabel>
            <Select
              value={formData.warehouse_id}
              label="Warehouse *"
              onChange={(e) => setFormData({ ...formData, warehouse_id: e.target.value })}
            >
              {warehouses.map((warehouse) => (
                <MenuItem key={warehouse.id} value={warehouse.id}>
                  {warehouse.name} {warehouse.is_default && "(Default)"}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl fullWidth sx={{ mb: 2.5 }}>
            <InputLabel>Category *</InputLabel>
            <Select
              required
              value={formData.category}
              label="Category *"
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            >
              <MenuItem value="General">General</MenuItem>
              <MenuItem value="Electronics">Electronics</MenuItem>
              <MenuItem value="Clothing">Clothing</MenuItem>
              <MenuItem value="Food & Beverage">Food & Beverage</MenuItem>
              <MenuItem value="Health & Beauty">Health & Beauty</MenuItem>
              <MenuItem value="Home & Garden">Home & Garden</MenuItem>
              <MenuItem value="Sports & Outdoors">Sports & Outdoors</MenuItem>
              <MenuItem value="Books & Media">Books & Media</MenuItem>
              <MenuItem value="Toys & Games">Toys & Games</MenuItem>
              <MenuItem value="Office Supplies">Office Supplies</MenuItem>
              <MenuItem value="Automotive">Automotive</MenuItem>
              <MenuItem value="Pet Supplies">Pet Supplies</MenuItem>
            </Select>
          </FormControl>

          <TextField
            fullWidth
            label="Description"
            multiline
            rows={3}
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            sx={{ mb: 2.5 }}
          />

          <Box sx={{ display: "flex", gap: 2, mb: 2.5 }}>
            <FormControl fullWidth>
              <InputLabel>Unit of Measure *</InputLabel>
              <Select
                required
                value={formData.unit_of_measure}
                label="Unit of Measure *"
                onChange={(e) => setFormData({ ...formData, unit_of_measure: e.target.value })}
              >
                <MenuItem value="pcs">Pieces (pcs)</MenuItem>
                <MenuItem value="kg">Kilograms (kg)</MenuItem>
                <MenuItem value="g">Grams (g)</MenuItem>
                <MenuItem value="l">Liters (l)</MenuItem>
                <MenuItem value="ml">Milliliters (ml)</MenuItem>
                <MenuItem value="box">Box</MenuItem>
                <MenuItem value="carton">Carton</MenuItem>
                <MenuItem value="pack">Pack</MenuItem>
              </Select>
            </FormControl>

            <TextField
              fullWidth
              type="number"
              label="Unit Price"
              value={formData.unit_price}
              onChange={(e) => setFormData({ ...formData, unit_price: e.target.value })}
              slotProps={{
                htmlInput: { min: 0, step: 0.01 },
                input: { startAdornment: "$" }
              }}
            />
          </Box>

          <TextField
            fullWidth
            type="number"
            label="Reorder Point (Low Stock Alert)"
            value={formData.reorder_point}
            onChange={(e) => setFormData({ ...formData, reorder_point: e.target.value })}
            helperText="You'll be alerted when stock falls below this level"
            sx={{ mb: 2.5 }}
            slotProps={{
              htmlInput: { min: 0 }
            }}
          />

          {!product && (
            <TextField
              fullWidth
              type="number"
              label="Initial Stock (Optional)"
              value={formData.initial_stock}
              onChange={(e) => setFormData({ ...formData, initial_stock: e.target.value })}
              helperText="Enter opening stock quantity for this product"
              sx={{ mb: 2.5 }}
              slotProps={{
                htmlInput: { min: 0, step: 0.01 }
              }}
            />
          )}

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {/* Buttons */}
          <Box
            sx={{
              display: "flex",
              flexDirection: isMobile ? "column" : "row",
              gap: 1.5,
              justifyContent: "flex-end"
            }}
          >
            <Button onClick={onClose} disabled={loading} fullWidth={isMobile} sx={{ textTransform: "none" }}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={loading}
              fullWidth={isMobile}
              sx={{
                bgcolor: "#667eea",
                textTransform: "none",
                "&:hover": {
                  bgcolor: "#5568d3"
                }
              }}
            >
              {loading ? "Saving..." : product ? "Update Product" : "Add Product"}
            </Button>
          </Box>
        </Box>
      </Box>
    </Modal>
  )
}
