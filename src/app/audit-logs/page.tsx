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
  Chip,
  CircularProgress,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Tabs,
  Tab,
  Card,
  CardContent,
  Grid,
  useTheme,
  useMediaQuery,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from "@mui/material"
import {
  Inventory as InventoryIcon,
  TrendingUp as MovementIcon,
  ExpandMore as ExpandMoreIcon
} from "@mui/icons-material"

interface AuditLog {
  id: string
  table_name: string
  record_id: string
  action: "INSERT" | "UPDATE" | "DELETE"
  user_id: string
  user_email: string
  old_data: Record<string, unknown> | null
  new_data: Record<string, unknown> | null
  changed_fields: string[]
  created_at: string
}

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(true)
  const [filterAction, setFilterAction] = useState<string>("ALL")
  const [filterTable, setFilterTable] = useState<string>("ALL")
  const [searchTerm, setSearchTerm] = useState("")
  const [tabValue, setTabValue] = useState(0)

  const router = useRouter()
  const supabase = createClient()
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"))

  const fetchLogs = useCallback(async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from("audit_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(200)

      if (error) throw error
      setLogs(data || [])
    } catch (error) {
      console.error("Error fetching audit logs:", error)
    } finally {
      setLoading(false)
    }
  }, [supabase])

  const checkUserAndFetchLogs = useCallback(async () => {
    const {
      data: { user }
    } = await supabase.auth.getUser()

    if (!user) {
      router.push("/login")
    } else {
      fetchLogs()
    }
  }, [supabase, router, fetchLogs])

  useEffect(() => {
    checkUserAndFetchLogs()
  }, [checkUserAndFetchLogs])

  const getActionColor = (action: string) => {
    switch (action) {
      case "INSERT":
        return "success"
      case "UPDATE":
        return "info"
      case "DELETE":
        return "error"
      default:
        return "default"
    }
  }

  const getTableIcon = (tableName: string) => {
    switch (tableName) {
      case "products":
        return <InventoryIcon fontSize="small" />
      case "stock_movements":
        return <MovementIcon fontSize="small" />
      default:
        return null
    }
  }

  const formatTableName = (tableName: string) => {
    return tableName
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ")
  }

  const renderChangedData = (log: AuditLog) => {
    if (log.action === "INSERT") {
      return (
        <Box>
          <Typography variant="body2" fontWeight="bold" gutterBottom>
            New Record Created:
          </Typography>
          {Object.entries(log.new_data || {}).map(([key, value]) => (
            <Typography key={key} variant="body2" sx={{ pl: 2 }}>
              <strong>{key}:</strong> {String(value)}
            </Typography>
          ))}
        </Box>
      )
    }

    if (log.action === "DELETE") {
      return (
        <Box>
          <Typography variant="body2" fontWeight="bold" gutterBottom>
            Deleted Record:
          </Typography>
          {Object.entries(log.old_data || {}).map(([key, value]) => (
            <Typography key={key} variant="body2" sx={{ pl: 2 }}>
              <strong>{key}:</strong> {String(value)}
            </Typography>
          ))}
        </Box>
      )
    }

    if (log.action === "UPDATE" && log.changed_fields && log.changed_fields.length > 0) {
      return (
        <Box>
          <Typography variant="body2" fontWeight="bold" gutterBottom>
            Changed Fields:
          </Typography>
          {log.changed_fields.map((field) => (
            <Box key={field} sx={{ pl: 2, mb: 1 }}>
              <Typography variant="body2">
                <strong>{field}:</strong>
              </Typography>
              <Typography variant="body2" color="error" sx={{ pl: 2 }}>
                Old: {String(log.old_data?.[field] || "null")}
              </Typography>
              <Typography variant="body2" color="success.main" sx={{ pl: 2 }}>
                New: {String(log.new_data?.[field] || "null")}
              </Typography>
            </Box>
          ))}
        </Box>
      )
    }

    return <Typography variant="body2">No changes recorded</Typography>
  }

  const filteredLogs = logs.filter((log) => {
    const matchesSearch =
      (log.user_email?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
      log.record_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      JSON.stringify(log.new_data).toLowerCase().includes(searchTerm.toLowerCase()) ||
      JSON.stringify(log.old_data).toLowerCase().includes(searchTerm.toLowerCase())

    const matchesAction = filterAction === "ALL" || log.action === filterAction
    const matchesTable = filterTable === "ALL" || log.table_name === filterTable

    return matchesSearch && matchesAction && matchesTable
  })

  // Separate logs by table
  const productLogs = filteredLogs.filter((log) => log.table_name === "products")
  const movementLogs = filteredLogs.filter((log) => log.table_name === "stock_movements")
  const otherLogs = filteredLogs.filter((log) => log.table_name !== "products" && log.table_name !== "stock_movements")

  const renderLogsTable = (logsToRender: AuditLog[]) => {
    if (logsToRender.length === 0) {
      return (
        <Paper sx={{ p: 3, textAlign: "center" }}>
          <Typography color="text.secondary">No audit logs found</Typography>
        </Paper>
      )
    }

    if (isMobile) {
      return (
        <Box>
          {logsToRender.map((log) => (
            <Card key={log.id} sx={{ mb: 2 }}>
              <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                  <Box>
                    <Chip
                      label={log.action}
                      color={getActionColor(log.action) as "error" | "success" | "info" | "default"}
                      size="small"
                      sx={{ mb: 1 }}
                    />
                    <Typography variant="body2" color="text.secondary">
                      {formatTableName(log.table_name)}
                    </Typography>
                  </Box>
                  <Typography variant="caption" color="text.secondary">
                    {new Date(log.created_at).toLocaleString()}
                  </Typography>
                </Box>

                <Typography variant="body2" gutterBottom>
                  <strong>User:</strong> {log.user_email || "system"}
                </Typography>
                <Typography variant="body2" gutterBottom>
                  <strong>Record ID:</strong> {log.record_id}
                </Typography>

                <Accordion sx={{ mt: 2 }}>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography variant="body2">View Changes</Typography>
                  </AccordionSummary>
                  <AccordionDetails>{renderChangedData(log)}</AccordionDetails>
                </Accordion>
              </CardContent>
            </Card>
          ))}
        </Box>
      )
    }

    return (
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Action</TableCell>
              <TableCell>Table</TableCell>
              <TableCell>Record ID</TableCell>
              <TableCell>User</TableCell>
              <TableCell>Changed Fields</TableCell>
              <TableCell>Date</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {logsToRender.map((log) => (
              <TableRow key={log.id} hover>
                <TableCell>
                  <Chip
                    label={log.action}
                    color={getActionColor(log.action) as "error" | "success" | "info" | "default"}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  <Box display="flex" alignItems="center" gap={1}>
                    {getTableIcon(log.table_name)}
                    {formatTableName(log.table_name)}
                  </Box>
                </TableCell>
                <TableCell>{log.record_id}</TableCell>
                <TableCell>{log.user_email}</TableCell>
                <TableCell>
                  {log.action === "UPDATE" && log.changed_fields ? (
                    <Box>
                      {log.changed_fields.map((field) => (
                        <Chip key={field} label={field} size="small" sx={{ mr: 0.5, mb: 0.5 }} />
                      ))}
                    </Box>
                  ) : (
                    "-"
                  )}
                </TableCell>
                <TableCell>{new Date(log.created_at).toLocaleString()}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    )
  }

  if (loading) {
    return (
      <DashboardLayout>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <CircularProgress />
        </Box>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <Box sx={{ p: { xs: 2, sm: 3 } }}>
        {/* Header */}
        <Typography variant="h4" component="h1" mb={3}>
          Audit Logs
        </Typography>

        {/* Filters */}
        <Paper sx={{ p: 2, mb: 3 }}>
          <Grid container spacing={2}>
            <Grid columns={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                label="Search logs"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                size="small"
                placeholder="Search by user, record ID, or data"
              />
            </Grid>
            <Grid columns={{ xs: 12, sm: 6, md: 3 }}>
              <FormControl fullWidth size="small">
                <InputLabel>Action</InputLabel>
                <Select value={filterAction} label="Action" onChange={(e) => setFilterAction(e.target.value)}>
                  <MenuItem value="ALL">All Actions</MenuItem>
                  <MenuItem value="INSERT">Insert</MenuItem>
                  <MenuItem value="UPDATE">Update</MenuItem>
                  <MenuItem value="DELETE">Delete</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid columns={{ xs: 12, sm: 6, md: 3 }}>
              <FormControl fullWidth size="small">
                <InputLabel>Table</InputLabel>
                <Select value={filterTable} label="Table" onChange={(e) => setFilterTable(e.target.value)}>
                  <MenuItem value="ALL">All Tables</MenuItem>
                  <MenuItem value="products">Products</MenuItem>
                  <MenuItem value="stock_movements">Stock Movements</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </Paper>

        {/* Tabs */}
        <Box sx={{ borderBottom: 1, borderColor: "divider", mb: 3 }}>
          <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)}>
            <Tab label={`All (${filteredLogs.length})`} />
            <Tab label={`Products (${productLogs.length})`} icon={<InventoryIcon />} iconPosition="start" />
            <Tab label={`Movements (${movementLogs.length})`} icon={<MovementIcon />} iconPosition="start" />
          </Tabs>
        </Box>

        {/* Content based on selected tab */}
        {tabValue === 0 && renderLogsTable(filteredLogs)}
        {tabValue === 1 && renderLogsTable(productLogs)}
        {tabValue === 2 && renderLogsTable(movementLogs)}

        {/* Summary Stats */}
        <Paper sx={{ p: 2, mt: 3 }}>
          <Typography variant="h6" gutterBottom>
            Summary
          </Typography>
          <Grid container spacing={2}>
            <Grid columns={{ xs: 6, sm: 3 }}>
              <Typography variant="body2" color="text.secondary">
                Total Logs
              </Typography>
              <Typography variant="h6">{logs.length}</Typography>
            </Grid>
            <Grid columns={{ xs: 6, sm: 3 }}>
              <Typography variant="body2" color="text.secondary">
                Products
              </Typography>
              <Typography variant="h6">{productLogs.length}</Typography>
            </Grid>
            <Grid columns={{ xs: 6, sm: 3 }}>
              <Typography variant="body2" color="text.secondary">
                Movements
              </Typography>
              <Typography variant="h6">{movementLogs.length}</Typography>
            </Grid>
            <Grid columns={{ xs: 6, sm: 3 }}>
              <Typography variant="body2" color="text.secondary">
                Other
              </Typography>
              <Typography variant="h6">{otherLogs.length}</Typography>
            </Grid>
          </Grid>
        </Paper>
      </Box>
    </DashboardLayout>
  )
}
