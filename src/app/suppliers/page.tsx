"use client"

import { useEffect, useState, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import DashboardLayout from "@/components/DashboardLayout"
import { useRouter } from "next/navigation"
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  IconButton,
  Chip,
  CircularProgress,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Tooltip,
  Card,
  CardContent,
  useTheme,
  useMediaQuery,
  Alert,
  Snackbar
} from "@mui/material"
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Business as BusinessIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  Search as SearchIcon
} from "@mui/icons-material"

interface Supplier {
  id: string
  name: string
  contact_person: string | null
  email: string | null
  phone: string | null
  address: string | null
  city: string | null
  state: string | null
  postal_code: string | null
  country: string | null
  website: string | null
  tax_id: string | null
  payment_terms: string | null
  notes: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

interface SupplierFormData {
  name: string
  contact_person: string
  email: string
  phone: string
  address: string
  city: string
  state: string
  postal_code: string
  country: string
  website: string
  tax_id: string
  payment_terms: string
  notes: string
  is_active: boolean
}

const initialFormData: SupplierFormData = {
  name: "",
  contact_person: "",
  email: "",
  phone: "",
  address: "",
  city: "",
  state: "",
  postal_code: "",
  country: "",
  website: "",
  tax_id: "",
  payment_terms: "Net 30",
  notes: "",
  is_active: true
}

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState<string>("ALL")
  const [openDialog, setOpenDialog] = useState(false)
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null)
  const [formData, setFormData] = useState<SupplierFormData>(initialFormData)
  const [saving, setSaving] = useState(false)
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" as "success" | "error" })

  const router = useRouter()
  const supabase = createClient()
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"))

  const fetchSuppliers = useCallback(async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase.from("suppliers").select("*").order("name", { ascending: true })

      if (error) throw error
      setSuppliers(data || [])
    } catch (error) {
      console.error("Error fetching suppliers:", error)
      showSnackbar("Failed to load suppliers", "error")
    } finally {
      setLoading(false)
    }
  }, [supabase])

  const checkUserAndFetchSuppliers = useCallback(async () => {
    const {
      data: { user }
    } = await supabase.auth.getUser()

    if (!user) {
      router.push("/login")
    } else {
      fetchSuppliers()
    }
  }, [supabase, router, fetchSuppliers])

  useEffect(() => {
    checkUserAndFetchSuppliers()
  }, [checkUserAndFetchSuppliers])

  const showSnackbar = (message: string, severity: "success" | "error") => {
    setSnackbar({ open: true, message, severity })
  }

  const handleOpenDialog = (supplier?: Supplier) => {
    if (supplier) {
      setEditingSupplier(supplier)
      setFormData({
        name: supplier.name,
        contact_person: supplier.contact_person || "",
        email: supplier.email || "",
        phone: supplier.phone || "",
        address: supplier.address || "",
        city: supplier.city || "",
        state: supplier.state || "",
        postal_code: supplier.postal_code || "",
        country: supplier.country || "",
        website: supplier.website || "",
        tax_id: supplier.tax_id || "",
        payment_terms: supplier.payment_terms || "Net 30",
        notes: supplier.notes || "",
        is_active: supplier.is_active
      })
    } else {
      setEditingSupplier(null)
      setFormData(initialFormData)
    }
    setOpenDialog(true)
  }

  const handleCloseDialog = () => {
    setOpenDialog(false)
    setEditingSupplier(null)
    setFormData(initialFormData)
  }

  const handleInputChange = (field: keyof SupplierFormData, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleSaveSupplier = async () => {
    if (!formData.name.trim()) {
      showSnackbar("Supplier name is required", "error")
      return
    }

    setSaving(true)
    try {
      const {
        data: { user }
      } = await supabase.auth.getUser()

      const supplierData = {
        ...formData,
        // Convert empty strings to null for optional fields
        contact_person: formData.contact_person.trim() || null,
        email: formData.email.trim() || null,
        phone: formData.phone.trim() || null,
        address: formData.address.trim() || null,
        city: formData.city.trim() || null,
        state: formData.state.trim() || null,
        postal_code: formData.postal_code.trim() || null,
        country: formData.country.trim() || null,
        website: formData.website.trim() || null,
        tax_id: formData.tax_id.trim() || null,
        payment_terms: formData.payment_terms.trim() || null,
        notes: formData.notes.trim() || null,
        updated_by: user?.id
      }

      if (editingSupplier) {
        // Update existing supplier
        const { error } = await supabase.from("suppliers").update(supplierData).eq("id", editingSupplier.id)

        if (error) throw error
        showSnackbar("Supplier updated successfully", "success")
      } else {
        // Create new supplier
        const { error } = await supabase.from("suppliers").insert({ ...supplierData, created_by: user?.id })

        if (error) throw error
        showSnackbar("Supplier created successfully", "success")
      }

      handleCloseDialog()
      fetchSuppliers()
    } catch (error) {
      console.error("Error saving supplier:", error)
      showSnackbar("Failed to save supplier", "error")
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteSupplier = async (supplier: Supplier) => {
    if (!confirm(`Are you sure you want to delete "${supplier.name}"?`)) return

    try {
      const { error } = await supabase.from("suppliers").delete().eq("id", supplier.id)

      if (error) throw error
      showSnackbar("Supplier deleted successfully", "success")
      fetchSuppliers()
    } catch (error) {
      console.error("Error deleting supplier:", error)
      showSnackbar("Failed to delete supplier", "error")
    }
  }

  const filteredSuppliers = suppliers.filter((supplier) => {
    const matchesSearch =
      supplier.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      supplier.contact_person?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      supplier.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      supplier.city?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      supplier.country?.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesStatus =
      filterStatus === "ALL" ||
      (filterStatus === "ACTIVE" && supplier.is_active) ||
      (filterStatus === "INACTIVE" && !supplier.is_active)

    return matchesSearch && matchesStatus
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
            alignItems: "center",
            mb: 3,
            flexWrap: "wrap",
            gap: 2
          }}
        >
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1
            }}
          >
            <BusinessIcon sx={{ fontSize: 32, color: "primary.main" }} />
            <Typography variant="h4" component="h1">
              Suppliers
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpenDialog()}
            size={isMobile ? "small" : "medium"}
          >
            ADD SUPPLIER
          </Button>
        </Box>

        {/* Filters */}
        <Paper sx={{ p: 2, mb: 3 }}>
          <Grid container spacing={2}>
            <Grid columns={{ xs: 12, md: 8 }}>
              <TextField
                fullWidth
                placeholder="Search suppliers by name, contact, email, or location..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                size="small"
                slotProps={{
                  input: { startAdornment: <SearchIcon sx={{ mr: 1, color: "text.secondary" }} /> }
                }}
              />
            </Grid>
            <Grid columns={{ xs: 12, md: 4 }}>
              <FormControl fullWidth size="small">
                <InputLabel>Status</InputLabel>
                <Select value={filterStatus} label="Status" onChange={(e) => setFilterStatus(e.target.value)}>
                  <MenuItem value="ALL">All Suppliers</MenuItem>
                  <MenuItem value="ACTIVE">Active</MenuItem>
                  <MenuItem value="INACTIVE">Inactive</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </Paper>

        {/* Summary Stats */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid columns={{ xs: 6, md: 3 }}>
            <Card>
              <CardContent>
                <Typography
                  variant="body2"
                  sx={{
                    color: "text.secondary"
                  }}
                >
                  Total Suppliers
                </Typography>
                <Typography variant="h4">{suppliers.length}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid columns={{ xs: 6, md: 3 }}>
            <Card>
              <CardContent>
                <Typography
                  variant="body2"
                  sx={{
                    color: "text.secondary"
                  }}
                >
                  Active
                </Typography>
                <Typography
                  variant="h4"
                  sx={{
                    color: "success.main"
                  }}
                >
                  {suppliers.filter((s) => s.is_active).length}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid columns={{ xs: 6, md: 3 }}>
            <Card>
              <CardContent>
                <Typography
                  variant="body2"
                  sx={{
                    color: "text.secondary"
                  }}
                >
                  Inactive
                </Typography>
                <Typography
                  variant="h4"
                  sx={{
                    color: "text.secondary"
                  }}
                >
                  {suppliers.filter((s) => !s.is_active).length}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid columns={{ xs: 6, md: 3 }}>
            <Card>
              <CardContent>
                <Typography
                  variant="body2"
                  sx={{
                    color: "text.secondary"
                  }}
                >
                  Filtered Results
                </Typography>
                <Typography variant="h4">{filteredSuppliers.length}</Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Suppliers Table */}
        {filteredSuppliers.length === 0 ? (
          <Paper sx={{ p: 4, textAlign: "center" }}>
            <BusinessIcon sx={{ fontSize: 64, color: "text.secondary", mb: 2 }} />
            <Typography
              variant="h6"
              gutterBottom
              sx={{
                color: "text.secondary"
              }}
            >
              {searchTerm || filterStatus !== "ALL" ? "No suppliers found" : "No suppliers yet"}
            </Typography>
            <Typography
              variant="body2"
              sx={{
                color: "text.secondary",
                mb: 2
              }}
            >
              {searchTerm || filterStatus !== "ALL"
                ? "Try adjusting your search or filters"
                : "Get started by adding your first supplier"}
            </Typography>
            {!searchTerm && filterStatus === "ALL" && (
              <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpenDialog()}>
                Add First Supplier
              </Button>
            )}
          </Paper>
        ) : (
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Supplier Name</TableCell>
                  {!isMobile && <TableCell>Contact Person</TableCell>}
                  <TableCell>Contact Info</TableCell>
                  {!isMobile && <TableCell>Location</TableCell>}
                  {!isMobile && <TableCell>Payment Terms</TableCell>}
                  <TableCell>Status</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredSuppliers.map((supplier) => (
                  <TableRow key={supplier.id} hover>
                    <TableCell>
                      <Box>
                        <Typography
                          variant="body1"
                          sx={{
                            fontWeight: 500
                          }}
                        >
                          {supplier.name}
                        </Typography>
                        {supplier.tax_id && (
                          <Typography
                            variant="caption"
                            sx={{
                              color: "text.secondary"
                            }}
                          >
                            Tax ID: {supplier.tax_id}
                          </Typography>
                        )}
                      </Box>
                    </TableCell>
                    {!isMobile && <TableCell>{supplier.contact_person || "-"}</TableCell>}
                    <TableCell>
                      <Box>
                        {supplier.email && (
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: 0.5,
                              mb: 0.5
                            }}
                          >
                            <EmailIcon fontSize="small" sx={{ color: "text.secondary" }} />
                            <Typography variant="body2">{supplier.email}</Typography>
                          </Box>
                        )}
                        {supplier.phone && (
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: 0.5
                            }}
                          >
                            <PhoneIcon fontSize="small" sx={{ color: "text.secondary" }} />
                            <Typography variant="body2">{supplier.phone}</Typography>
                          </Box>
                        )}
                        {!supplier.email && !supplier.phone && "-"}
                      </Box>
                    </TableCell>
                    {!isMobile && (
                      <TableCell>
                        {supplier.city || supplier.state || supplier.country ? (
                          <Typography variant="body2">
                            {[supplier.city, supplier.state, supplier.country].filter(Boolean).join(", ")}
                          </Typography>
                        ) : (
                          "-"
                        )}
                      </TableCell>
                    )}
                    {!isMobile && <TableCell>{supplier.payment_terms || "-"}</TableCell>}
                    <TableCell>
                      <Chip
                        label={supplier.is_active ? "Active" : "Inactive"}
                        color={supplier.is_active ? "success" : "default"}
                        size="small"
                      />
                    </TableCell>
                    <TableCell align="right">
                      <Tooltip title="Edit">
                        <IconButton size="small" onClick={() => handleOpenDialog(supplier)} color="primary">
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete">
                        <IconButton size="small" onClick={() => handleDeleteSupplier(supplier)} color="error">
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        {/* Add/Edit Supplier Dialog - Single Column Layout Like Stock Movement */}
        <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth fullScreen={isMobile}>
          <DialogTitle>{editingSupplier ? "Edit Supplier" : "Add New Supplier"}</DialogTitle>
          <DialogContent>
            <Box sx={{ pt: 2, display: "flex", flexDirection: "column", gap: 2 }}>
              {/* Supplier Name - Required */}
              <TextField
                fullWidth
                label="Supplier Name"
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                required
                placeholder="Enter supplier name"
              />

              {/* Contact Person */}
              <TextField
                fullWidth
                label="Contact Person"
                value={formData.contact_person}
                onChange={(e) => handleInputChange("contact_person", e.target.value)}
                placeholder="Enter contact person name"
              />

              {/* Email */}
              <TextField
                fullWidth
                label="Email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange("email", e.target.value)}
                placeholder="email@example.com"
              />

              {/* Phone */}
              <TextField
                fullWidth
                label="Phone"
                value={formData.phone}
                onChange={(e) => handleInputChange("phone", e.target.value)}
                placeholder="Enter phone number"
              />

              {/* Website */}
              <TextField
                fullWidth
                label="Website"
                value={formData.website}
                onChange={(e) => handleInputChange("website", e.target.value)}
                placeholder="https://example.com"
              />

              {/* Street Address */}
              <TextField
                fullWidth
                label="Street Address"
                value={formData.address}
                onChange={(e) => handleInputChange("address", e.target.value)}
                placeholder="Enter street address"
              />

              {/* City */}
              <TextField
                fullWidth
                label="City"
                value={formData.city}
                onChange={(e) => handleInputChange("city", e.target.value)}
                placeholder="Enter city"
              />

              {/* State/Province */}
              <TextField
                fullWidth
                label="State/Province"
                value={formData.state}
                onChange={(e) => handleInputChange("state", e.target.value)}
                placeholder="Enter state or province"
              />

              {/* Postal Code */}
              <TextField
                fullWidth
                label="Postal Code"
                value={formData.postal_code}
                onChange={(e) => handleInputChange("postal_code", e.target.value)}
                placeholder="Enter postal code"
              />

              {/* Country */}
              <TextField
                fullWidth
                label="Country"
                value={formData.country}
                onChange={(e) => handleInputChange("country", e.target.value)}
                placeholder="Enter country"
              />

              {/* Tax ID */}
              <TextField
                fullWidth
                label="Tax ID"
                value={formData.tax_id}
                onChange={(e) => handleInputChange("tax_id", e.target.value)}
                placeholder="Enter tax ID"
              />

              {/* Payment Terms */}
              <FormControl fullWidth>
                <InputLabel>Payment Terms</InputLabel>
                <Select
                  value={formData.payment_terms}
                  label="Payment Terms"
                  onChange={(e) => handleInputChange("payment_terms", e.target.value)}
                >
                  <MenuItem value="Net 15">Net 15</MenuItem>
                  <MenuItem value="Net 30">Net 30</MenuItem>
                  <MenuItem value="Net 45">Net 45</MenuItem>
                  <MenuItem value="Net 60">Net 60</MenuItem>
                  <MenuItem value="Due on Receipt">Due on Receipt</MenuItem>
                  <MenuItem value="COD">Cash on Delivery</MenuItem>
                </Select>
              </FormControl>

              {/* Status */}
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={formData.is_active ? "active" : "inactive"}
                  label="Status"
                  onChange={(e) => handleInputChange("is_active", e.target.value === "active")}
                >
                  <MenuItem value="active">Active</MenuItem>
                  <MenuItem value="inactive">Inactive</MenuItem>
                </Select>
              </FormControl>

              {/* Notes */}
              <TextField
                fullWidth
                label="Notes"
                value={formData.notes}
                onChange={(e) => handleInputChange("notes", e.target.value)}
                multiline
                rows={3}
                placeholder="Additional notes about this supplier..."
              />
            </Box>
          </DialogContent>
          <DialogActions sx={{ p: 2, gap: 1 }}>
            <Button onClick={handleCloseDialog} disabled={saving} color="primary">
              CANCEL
            </Button>
            <Button variant="contained" onClick={handleSaveSupplier} disabled={saving || !formData.name.trim()}>
              {saving ? <CircularProgress size={24} /> : editingSupplier ? "UPDATE" : "CREATE"}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Snackbar for notifications */}
        <Snackbar
          open={snackbar.open}
          autoHideDuration={4000}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
        >
          <Alert severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })}>
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Box>
    </DashboardLayout>
  )
}
