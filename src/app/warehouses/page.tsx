"use client"

import { useEffect, useState, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import DashboardLayout from "@/components/DashboardLayout"
import { useRouter } from "next/navigation"
import ZipCodes from "zipcodes-us"
import {
  Box,
  Button,
  TextField,
  Typography,
  Paper,
  Modal,
  IconButton,
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
  Stack,
  Chip,
  Grid,
  Switch,
  FormControlLabel,
  useMediaQuery,
  useTheme
} from "@mui/material"
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Close as CloseIcon,
  Warehouse as WarehouseIcon,
  LocationOn as LocationIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  Person as PersonIcon,
  CheckCircle as ActiveIcon,
  Cancel as InactiveIcon,
  Star as DefaultIcon
} from "@mui/icons-material"

// US States with two-letter codes
const US_STATES = [
  { code: "AL", name: "Alabama" },
  { code: "AK", name: "Alaska" },
  { code: "AZ", name: "Arizona" },
  { code: "AR", name: "Arkansas" },
  { code: "CA", name: "California" },
  { code: "CO", name: "Colorado" },
  { code: "CT", name: "Connecticut" },
  { code: "DE", name: "Delaware" },
  { code: "FL", name: "Florida" },
  { code: "GA", name: "Georgia" },
  { code: "HI", name: "Hawaii" },
  { code: "ID", name: "Idaho" },
  { code: "IL", name: "Illinois" },
  { code: "IN", name: "Indiana" },
  { code: "IA", name: "Iowa" },
  { code: "KS", name: "Kansas" },
  { code: "KY", name: "Kentucky" },
  { code: "LA", name: "Louisiana" },
  { code: "ME", name: "Maine" },
  { code: "MD", name: "Maryland" },
  { code: "MA", name: "Massachusetts" },
  { code: "MI", name: "Michigan" },
  { code: "MN", name: "Minnesota" },
  { code: "MS", name: "Mississippi" },
  { code: "MO", name: "Missouri" },
  { code: "MT", name: "Montana" },
  { code: "NE", name: "Nebraska" },
  { code: "NV", name: "Nevada" },
  { code: "NH", name: "New Hampshire" },
  { code: "NJ", name: "New Jersey" },
  { code: "NM", name: "New Mexico" },
  { code: "NY", name: "New York" },
  { code: "NC", name: "North Carolina" },
  { code: "ND", name: "North Dakota" },
  { code: "OH", name: "Ohio" },
  { code: "OK", name: "Oklahoma" },
  { code: "OR", name: "Oregon" },
  { code: "PA", name: "Pennsylvania" },
  { code: "RI", name: "Rhode Island" },
  { code: "SC", name: "South Carolina" },
  { code: "SD", name: "South Dakota" },
  { code: "TN", name: "Tennessee" },
  { code: "TX", name: "Texas" },
  { code: "UT", name: "Utah" },
  { code: "VT", name: "Vermont" },
  { code: "VA", name: "Virginia" },
  { code: "WA", name: "Washington" },
  { code: "WV", name: "West Virginia" },
  { code: "WI", name: "Wisconsin" },
  { code: "WY", name: "Wyoming" }
]

interface Warehouse {
  id: string
  name: string
  code: string | null
  street_address: string | null
  city: string | null
  state: string | null
  zip_code: string | null
  contact_person: string | null
  contact_email: string | null
  contact_phone: string | null
  is_active: boolean
  is_default: boolean
  notes: string | null
  created_at: string
  total_products?: number
  total_stock_value?: number
}

interface SnackbarState {
  open: boolean
  message: string
  severity: "success" | "error" | "info" | "warning"
}

export default function WarehousesPage() {
  const [warehouses, setWarehouses] = useState<Warehouse[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [showModal, setShowModal] = useState(false)
  const [editingWarehouse, setEditingWarehouse] = useState<Warehouse | null>(null)
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean
    warehouse: Warehouse | null
  }>({ open: false, warehouse: null })
  const [snackbar, setSnackbar] = useState<SnackbarState>({
    open: false,
    message: "",
    severity: "success"
  })

  const router = useRouter()
  const supabase = createClient()
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"))

  const fetchWarehouses = useCallback(async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from("warehouses")
        .select("*")
        .order("is_default", { ascending: false })
        .order("name", { ascending: true })

      if (error) throw error

      // Fetch product counts for each warehouse
      const warehousesWithStats = await Promise.all(
        (data || []).map(async (warehouse) => {
          const { count } = await supabase
            .from("products")
            .select("*", { count: "exact", head: true })
            .eq("warehouse_id", warehouse.id)

          const { data: products } = await supabase
            .from("products")
            .select("current_stock, unit_price")
            .eq("warehouse_id", warehouse.id)

          const totalValue = products?.reduce((sum, p) => sum + p.current_stock * (p.unit_price || 0), 0) || 0

          return {
            ...warehouse,
            total_products: count || 0,
            total_stock_value: totalValue
          }
        })
      )

      setWarehouses(warehousesWithStats)
    } catch (error) {
      console.error("Error fetching warehouses:", error)
      showSnackbar("Failed to load warehouses", "error")
    } finally {
      setLoading(false)
    }
  }, [supabase])

  const checkUser = useCallback(async () => {
    const {
      data: { user }
    } = await supabase.auth.getUser()

    if (!user) {
      router.push("/login")
    } else {
      await fetchWarehouses()
    }
  }, [supabase, router, fetchWarehouses])

  useEffect(() => {
    checkUser()
  }, [checkUser])

  const showSnackbar = (message: string, severity: "success" | "error" | "info" | "warning" = "success") => {
    setSnackbar({ open: true, message, severity })
  }

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false })
  }

  const handleDeleteClick = (warehouse: Warehouse) => {
    setDeleteDialog({ open: true, warehouse })
  }

  const handleDeleteCancel = () => {
    setDeleteDialog({ open: false, warehouse: null })
  }

  const handleDeleteConfirm = async () => {
    if (!deleteDialog.warehouse) return

    const warehouseToDelete = deleteDialog.warehouse
    setDeleteDialog({ open: false, warehouse: null })

    try {
      const { error } = await supabase.from("warehouses").delete().eq("id", warehouseToDelete.id)

      if (error) throw error

      setWarehouses(warehouses.filter((w) => w.id !== warehouseToDelete.id))
      showSnackbar(`"${warehouseToDelete.name}" deleted successfully`, "success")
    } catch (error) {
      console.error("Error deleting warehouse:", error)
      showSnackbar("Failed to delete warehouse", "error")
    }
  }

  const filteredWarehouses = warehouses.filter(
    (warehouse) =>
      warehouse.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      warehouse.code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      warehouse.street_address?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      warehouse.city?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      warehouse.state?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      warehouse.zip_code?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const formatCurrency = (value: number) => {
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
        <Box>
          <Typography
            variant={isMobile ? "h5" : "h4"}
            sx={{
              fontWeight: 600
            }}
          >
            Warehouses
          </Typography>
          <Typography variant="body2" color="textSecondary">
            Manage your warehouse locations and inventory
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => {
            setEditingWarehouse(null)
            setShowModal(true)
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
          Add Warehouse
        </Button>
      </Box>
      {/* Search Bar */}
      <Box sx={{ mb: 3 }}>
        <TextField
          fullWidth
          placeholder="Search warehouses by name, code, or location..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          size="small"
          sx={{ bgcolor: "white" }}
        />
      </Box>
      {/* Empty State */}
      {filteredWarehouses.length === 0 ? (
        <Paper sx={{ p: { xs: 4, sm: 8 }, textAlign: "center" }}>
          <WarehouseIcon sx={{ fontSize: 80, color: "text.secondary", mb: 2 }} />
          <Typography
            variant="h6"
            gutterBottom
            sx={{
              color: "text.secondary"
            }}
          >
            {searchTerm ? "No warehouses found" : "No warehouses yet"}
          </Typography>
          <Typography
            variant="body2"
            sx={{
              color: "text.secondary",
              mb: 3
            }}
          >
            {searchTerm ? "Try a different search term" : "Click 'Add Warehouse' to create your first warehouse"}
          </Typography>
        </Paper>
      ) : (
        /* Warehouse Cards */
        <Grid container spacing={3}>
          {filteredWarehouses.map((warehouse) => (
            <Grid size={{ xs: 12, md: 6, lg: 4 }} key={warehouse.id}>
              <Card
                elevation={2}
                sx={{
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                  position: "relative",
                  border: warehouse.is_default ? "2px solid #667eea" : "none"
                }}
              >
                {warehouse.is_default && (
                  <Chip
                    icon={<DefaultIcon />}
                    label="Default"
                    size="small"
                    color="primary"
                    sx={{
                      position: "absolute",
                      top: 16,
                      right: 16
                    }}
                  />
                )}

                <CardContent sx={{ flexGrow: 1 }}>
                  <Stack spacing={2}>
                    {/* Warehouse Name & Code */}
                    <Box>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
                        <WarehouseIcon color="primary" />
                        <Typography
                          variant="h6"
                          sx={{
                            fontWeight: 600
                          }}
                        >
                          {warehouse.name}
                        </Typography>
                      </Box>
                      {warehouse.code && <Chip label={warehouse.code} size="small" variant="outlined" sx={{ mb: 1 }} />}
                      <Chip
                        icon={warehouse.is_active ? <ActiveIcon /> : <InactiveIcon />}
                        label={warehouse.is_active ? "Active" : "Inactive"}
                        size="small"
                        color={warehouse.is_active ? "success" : "default"}
                      />
                    </Box>

                    {/* Stats */}
                    <Box
                      sx={{
                        bgcolor: "action.hover",
                        borderRadius: 1,
                        p: 2
                      }}
                    >
                      <Grid container spacing={2}>
                        <Grid size={{ xs: 6 }}>
                          <Typography variant="caption" color="textSecondary">
                            Products
                          </Typography>
                          <Typography
                            variant="h6"
                            sx={{
                              fontWeight: "bold"
                            }}
                          >
                            {warehouse.total_products || 0}
                          </Typography>
                        </Grid>
                        <Grid size={{ xs: 6 }}>
                          <Typography variant="caption" color="textSecondary">
                            Stock Value
                          </Typography>
                          <Typography
                            variant="h6"
                            sx={{
                              fontWeight: "bold",
                              color: "success.main"
                            }}
                          >
                            {formatCurrency(warehouse.total_stock_value || 0)}
                          </Typography>
                        </Grid>
                      </Grid>
                    </Box>

                    {/* Contact Info */}
                    {(warehouse.street_address ||
                      warehouse.city ||
                      warehouse.state ||
                      warehouse.zip_code ||
                      warehouse.contact_person ||
                      warehouse.contact_email ||
                      warehouse.contact_phone) && (
                      <Box>
                        {(warehouse.street_address || warehouse.city || warehouse.state || warehouse.zip_code) && (
                          <Box sx={{ display: "flex", alignItems: "start", gap: 1, mb: 0.5 }}>
                            <LocationIcon sx={{ fontSize: 18, color: "text.secondary", mt: 0.25 }} />
                            <Typography variant="body2" color="textSecondary">
                              {[
                                warehouse.street_address,
                                warehouse.city,
                                warehouse.state && warehouse.zip_code
                                  ? `${warehouse.state} ${warehouse.zip_code}`
                                  : warehouse.state || warehouse.zip_code
                              ]
                                .filter(Boolean)
                                .join(", ")}
                            </Typography>
                          </Box>
                        )}
                        {warehouse.contact_person && (
                          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.5 }}>
                            <PersonIcon sx={{ fontSize: 18, color: "text.secondary" }} />
                            <Typography variant="body2" color="textSecondary">
                              {warehouse.contact_person}
                            </Typography>
                          </Box>
                        )}
                        {warehouse.contact_email && (
                          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.5 }}>
                            <EmailIcon sx={{ fontSize: 18, color: "text.secondary" }} />
                            <Typography variant="body2" color="textSecondary">
                              {warehouse.contact_email}
                            </Typography>
                          </Box>
                        )}
                        {warehouse.contact_phone && (
                          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                            <PhoneIcon sx={{ fontSize: 18, color: "text.secondary" }} />
                            <Typography variant="body2" color="textSecondary">
                              {warehouse.contact_phone}
                            </Typography>
                          </Box>
                        )}
                      </Box>
                    )}

                    {/* Notes */}
                    {warehouse.notes && (
                      <Typography variant="body2" color="textSecondary" sx={{ fontStyle: "italic" }}>
                        {warehouse.notes}
                      </Typography>
                    )}
                  </Stack>
                </CardContent>

                {/* Actions */}
                <Box sx={{ p: 2, pt: 0, display: "flex", gap: 1 }}>
                  <Button
                    size="small"
                    startIcon={<EditIcon />}
                    onClick={() => {
                      setEditingWarehouse(warehouse)
                      setShowModal(true)
                    }}
                    sx={{ textTransform: "none", flex: 1 }}
                  >
                    Edit
                  </Button>
                  <Button
                    size="small"
                    startIcon={<DeleteIcon />}
                    onClick={() => handleDeleteClick(warehouse)}
                    color="error"
                    sx={{ textTransform: "none", flex: 1 }}
                  >
                    Delete
                  </Button>
                </Box>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
      {/* Add/Edit Modal */}
      <WarehouseModal
        open={showModal}
        warehouse={editingWarehouse}
        onClose={() => {
          setShowModal(false)
          setEditingWarehouse(null)
        }}
        onSave={(message: string) => {
          setShowModal(false)
          setEditingWarehouse(null)
          fetchWarehouses()
          showSnackbar(message, "success")
        }}
      />
      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialog.open} onClose={handleDeleteCancel} maxWidth="xs" fullWidth>
        <DialogTitle>Delete Warehouse?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete <strong>&quot;{deleteDialog.warehouse?.name}&quot;</strong>?
            {deleteDialog.warehouse?.total_products && deleteDialog.warehouse.total_products > 0 ? (
              <Alert severity="warning" sx={{ mt: 2 }}>
                This warehouse has {deleteDialog.warehouse.total_products} product(s). They will no longer be assigned
                to a warehouse.
              </Alert>
            ) : null}
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

// Warehouse Modal Component
interface WarehouseModalProps {
  open: boolean
  warehouse: Warehouse | null
  onClose: () => void
  onSave: (message: string) => void
}

function WarehouseModal({ open, warehouse, onClose, onSave }: WarehouseModalProps) {
  const [formData, setFormData] = useState({
    name: "",
    code: "",
    street_address: "",
    city: "",
    state: "",
    zip_code: "",
    contact_person: "",
    contact_email: "",
    contact_phone: "",
    is_active: true,
    is_default: false,
    notes: ""
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const supabase = createClient()
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"))

  useEffect(() => {
    if (warehouse) {
      setFormData({
        name: warehouse.name || "",
        code: warehouse.code || "",
        street_address: warehouse.street_address || "",
        city: warehouse.city || "",
        state: warehouse.state || "",
        zip_code: warehouse.zip_code || "",
        contact_person: warehouse.contact_person || "",
        contact_email: warehouse.contact_email || "",
        contact_phone: warehouse.contact_phone || "",
        is_active: warehouse.is_active,
        is_default: warehouse.is_default,
        notes: warehouse.notes || ""
      })
    } else {
      setFormData({
        name: "",
        code: "",
        street_address: "",
        city: "",
        state: "",
        zip_code: "",
        contact_person: "",
        contact_email: "",
        contact_phone: "",
        is_active: true,
        is_default: false,
        notes: ""
      })
    }
    setError("")
  }, [warehouse, open])

  // Handle ZIP code change and auto-fill city/state
  const handleZipCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const zipCode = e.target.value
    setFormData({ ...formData, zip_code: zipCode })

    // Auto-fill city and state if ZIP code is 5 digits
    if (zipCode.length === 5) {
      const locationData = ZipCodes.find(zipCode)
      if (locationData) {
        setFormData({
          ...formData,
          zip_code: zipCode,
          city: locationData.city || "",
          state: locationData.stateCode || ""
        })
      }
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      const {
        data: { user }
      } = await supabase.auth.getUser()

      if (!user) throw new Error("Not authenticated")

      const warehouseData = {
        name: formData.name.trim(),
        code: formData.code.trim() || null,
        street_address: formData.street_address.trim() || null,
        city: formData.city.trim() || null,
        state: formData.state || null,
        zip_code: formData.zip_code.trim() || null,
        contact_person: formData.contact_person.trim() || null,
        contact_email: formData.contact_email.trim() || null,
        contact_phone: formData.contact_phone.trim() || null,
        is_active: formData.is_active,
        is_default: formData.is_default,
        notes: formData.notes.trim() || null,
        user_id: user.id
      }

      if (warehouse) {
        const { error } = await supabase.from("warehouses").update(warehouseData).eq("id", warehouse.id)

        if (error) throw error
        onSave(`"${formData.name}" updated successfully`)
      } else {
        const { error } = await supabase.from("warehouses").insert(warehouseData)

        if (error) throw error
        onSave(`"${formData.name}" created successfully`)
      }
    } catch (err: unknown) {
      console.error("Error saving warehouse:", err)
      if (err instanceof Error) {
        setError(err.message)
      } else {
        setError("Failed to save warehouse. Please try again.")
      }
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
          width: isMobile ? "90vw" : 600,
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
          <Typography
            variant="h6"
            sx={{
              fontWeight: 600
            }}
          >
            {warehouse ? "Edit Warehouse" : "Add New Warehouse"}
          </Typography>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>

        {/* Modal Body */}
        <Box component="form" onSubmit={handleSubmit} sx={{ p: 3 }}>
          <Grid container spacing={2.5}>
            {/* Name */}
            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                required
                label="Warehouse Name"
                placeholder="e.g., Main Warehouse, New York Distribution Center"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </Grid>

            {/* Code and ZIP Code */}
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="Warehouse Code"
                placeholder="e.g., WH-01, NYC"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="ZIP Code"
                placeholder="Enter ZIP to auto-fill city/state"
                value={formData.zip_code}
                onChange={handleZipCodeChange}
                slotProps={{
                  htmlInput: { maxLength: 5 }
                }}
              />
            </Grid>

            {/* Street Address */}
            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                label="Street Address"
                placeholder="e.g., 123 Main Street"
                value={formData.street_address}
                onChange={(e) => setFormData({ ...formData, street_address: e.target.value })}
              />
            </Grid>

            {/* City and State */}
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="City"
                placeholder="City name"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                select
                fullWidth
                label="State"
                value={formData.state}
                onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                slotProps={{
                  select: {
                    native: true
                  }
                }}
              >
                <option value="">Select State</option>
                {US_STATES.map((state) => (
                  <option key={state.code} value={state.code}>
                    {state.code} - {state.name}
                  </option>
                ))}
              </TextField>
            </Grid>

            {/* Contact Person and Phone */}
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="Contact Person"
                placeholder="Name"
                value={formData.contact_person}
                onChange={(e) => setFormData({ ...formData, contact_person: e.target.value })}
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="Contact Phone"
                placeholder="Phone number"
                value={formData.contact_phone}
                onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })}
              />
            </Grid>

            {/* Contact Email */}
            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                type="email"
                label="Contact Email"
                placeholder="email@example.com"
                value={formData.contact_email}
                onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
              />
            </Grid>

            {/* Notes */}
            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                label="Notes"
                placeholder="Additional information (optional)"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                multiline
                rows={3}
              />
            </Grid>

            {/* Status Switches */}
            <Grid size={{ xs: 12 }}>
              <Stack direction="row" spacing={3}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={formData.is_active}
                      onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    />
                  }
                  label="Active"
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={formData.is_default}
                      onChange={(e) => setFormData({ ...formData, is_default: e.target.checked })}
                    />
                  }
                  label="Set as Default"
                />
              </Stack>
            </Grid>
          </Grid>

          {error && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {error}
            </Alert>
          )}

          {/* Buttons */}
          <Box
            sx={{
              display: "flex",
              gap: 1.5,
              justifyContent: "flex-end",
              mt: 3
            }}
          >
            <Button onClick={onClose} disabled={loading} sx={{ textTransform: "none" }}>
              Cancel
            </Button>
            <Button type="submit" variant="contained" disabled={loading} sx={{ textTransform: "none" }}>
              {loading ? "Saving..." : warehouse ? "Update" : "Add Warehouse"}
            </Button>
          </Box>
        </Box>
      </Box>
    </Modal>
  )
}
