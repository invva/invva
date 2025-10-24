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
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon, Close as CloseIcon } from "@mui/icons-material"

interface Product {
  id: string
  name: string
  sku: string | null
  barcode: string | null
  description: string | null
  unit_of_measure: string
  reorder_point: number | null
  custom_fields: Record<string, unknown> | null
  created_at: string
  current_stock?: number
}

interface SnackbarState {
  open: boolean
  message: string
  severity: "success" | "error" | "info" | "warning"
}

export default function ProductsPage() {
  const [user, setUser] = useState<User | null>(null)
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
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

  const fetchProducts = useCallback(
    async (userId: string) => {
      setLoading(true)
      try {
        const { data, error } = await supabase
          .from("products")
          .select("*")
          .eq("user_id", userId)
          .order("created_at", { ascending: false })

        if (error) throw error

        const productsWithStock = (data || []).map((product) => ({
          ...product,
          current_stock: 0
        }))

        setProducts(productsWithStock)
      } catch (error) {
        console.error("Error fetching products:", error)
        showSnackbar("Failed to load products", "error")
      } finally {
        setLoading(false)
      }
    },
    [supabase]
  )

  const checkUser = useCallback(async () => {
    const {
      data: { user }
    } = await supabase.auth.getUser()

    if (!user) {
      router.push("/login")
    } else {
      setUser(user)
      fetchProducts(user.id)
    }
  }, [supabase, router, fetchProducts])

  useEffect(() => {
    checkUser()
  }, [checkUser])

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
      product.barcode?.toLowerCase().includes(searchTerm.toLowerCase())
  )

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

      {/* Search Bar */}
      <Box sx={{ mb: 2 }}>
        <TextField
          fullWidth
          placeholder="Search products..."
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
                    {!isTablet && <TableCell sx={{ fontWeight: 600 }}>Barcode</TableCell>}
                    <TableCell sx={{ fontWeight: 600 }}>Unit</TableCell>
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
                      {!isTablet && <TableCell>{product.barcode || "-"}</TableCell>}
                      <TableCell>{product.unit_of_measure}</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 500 }}>
                        {product.current_stock || 0}
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
                        <Stack direction="row" spacing={1} sx={{ mb: 1 }}>
                          <Chip label={`Stock: ${product.current_stock || 0}`} size="small" color="primary" />
                          <Chip label={product.unit_of_measure} size="small" variant="outlined" />
                        </Stack>
                      </Box>
                    </Box>

                    {(product.sku || product.barcode) && (
                      <Box sx={{ mb: 1 }}>
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
                    )}
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

// Product Modal Component (same as before, but with responsive width)
interface ProductModalProps {
  open: boolean
  product: Product | null
  onClose: () => void
  onSave: (message: string) => void
  userId: string
}

function ProductModal({ open, product, onClose, onSave, userId }: ProductModalProps) {
  const [formData, setFormData] = useState({
    name: product?.name || "",
    sku: product?.sku || "",
    barcode: product?.barcode || "",
    description: product?.description || "",
    unit_of_measure: product?.unit_of_measure || "pcs",
    reorder_point: product?.reorder_point?.toString() || ""
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
        reorder_point: product.reorder_point?.toString() || ""
      })
    } else {
      setFormData({
        name: "",
        sku: "",
        barcode: "",
        description: "",
        unit_of_measure: "pcs",
        reorder_point: ""
      })
    }
    setError("")
  }, [product, open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      const productData = {
        name: formData.name,
        sku: formData.sku || null,
        barcode: formData.barcode || null,
        description: formData.description || null,
        unit_of_measure: formData.unit_of_measure,
        reorder_point: formData.reorder_point ? parseInt(formData.reorder_point) : null,
        user_id: userId
      }

      if (product) {
        const { error } = await supabase.from("products").update(productData).eq("id", product.id)

        if (error) throw error
        onSave(`"${formData.name}" updated successfully`)
      } else {
        const { error } = await supabase.from("products").insert(productData)

        if (error) throw error
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

          <TextField
            fullWidth
            label="SKU"
            value={formData.sku}
            onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
            sx={{ mb: 2.5 }}
          />

          <TextField
            fullWidth
            label="Barcode"
            value={formData.barcode}
            onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
            sx={{ mb: 2.5 }}
          />

          <TextField
            fullWidth
            label="Description"
            multiline
            rows={3}
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            sx={{ mb: 2.5 }}
          />

          <FormControl fullWidth sx={{ mb: 2.5 }}>
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
            label="Reorder Point (Low Stock Alert)"
            value={formData.reorder_point}
            onChange={(e) => setFormData({ ...formData, reorder_point: e.target.value })}
            helperText="You'll be alerted when stock falls below this level"
            sx={{ mb: 2.5 }}
            slotProps={{
              htmlInput: { min: 0 }
            }}
          />

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
