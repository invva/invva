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
  Select,
  MenuItem,
  FormControl,
  InputLabel
} from "@mui/material"

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
  const router = useRouter()
  const supabase = createClient()

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

  const getActionColor = (action: string): "success" | "info" | "error" | "default" => {
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

  const getTableColor = (tableName: string): "primary" | "secondary" | "default" => {
    switch (tableName) {
      case "products":
        return "primary"
      case "stock_movements":
        return "secondary"
      default:
        return "default"
    }
  }

  const getDescription = (log: AuditLog) => {
    const data = log.action === "DELETE" ? log.old_data : log.new_data

    if (log.table_name === "products") {
      return (data?.name as string) || "Unknown Product"
    } else if (log.table_name === "stock_movements") {
      const type = (data?.movement_type as string) || "unknown"
      const quantity = (data?.quantity as number) || 0
      return `${type.toUpperCase()}: ${quantity} units`
    }

    return log.record_id
  }

  const getChangedFieldsText = (log: AuditLog) => {
    if (log.action === "INSERT" || log.action === "DELETE") {
      return "All fields"
    }
    return log.changed_fields?.join(", ") || "None"
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    })
  }

  const getTableStats = () => {
    return logs.reduce((acc, log) => {
      acc[log.table_name] = (acc[log.table_name] || 0) + 1
      return acc
    }, {} as Record<string, number>)
  }

  const filteredLogs = logs.filter((log) => {
    const matchesAction = filterAction === "ALL" || log.action === filterAction
    const matchesTable = filterTable === "ALL" || log.table_name === filterTable
    const matchesSearch =
      searchTerm === "" ||
      getDescription(log).toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.user_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.table_name.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesAction && matchesTable && matchesSearch
  })

  const tableStats = getTableStats()

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
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" fontWeight={600} gutterBottom>
          Audit Log
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Complete history of all changes across the system
        </Typography>
      </Box>

      {/* Stats Cards */}
      <Box sx={{ display: "flex", gap: 2, mb: 3, flexWrap: "wrap" }}>
        <Paper sx={{ p: 2, flex: 1, minWidth: 150 }}>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Total Changes
          </Typography>
          <Typography variant="h4" fontWeight={600}>
            {logs.length}
          </Typography>
        </Paper>
        <Paper sx={{ p: 2, flex: 1, minWidth: 150 }}>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Products Changes
          </Typography>
          <Typography variant="h4" fontWeight={600}>
            {tableStats.products || 0}
          </Typography>
        </Paper>
        <Paper sx={{ p: 2, flex: 1, minWidth: 150 }}>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Stock Movements
          </Typography>
          <Typography variant="h4" fontWeight={600}>
            {tableStats.stock_movements || 0}
          </Typography>
        </Paper>
      </Box>

      {/* Filters */}
      <Box
        sx={{
          display: "flex",
          flexDirection: { xs: "column", sm: "row" },
          gap: 2,
          mb: 3
        }}
      >
        <TextField
          placeholder="Search by description, user, or table..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          size="small"
          sx={{ flex: 1, bgcolor: "white" }}
        />
        <FormControl size="small" sx={{ minWidth: 150, bgcolor: "white" }}>
          <InputLabel>Table</InputLabel>
          <Select value={filterTable} label="Table" onChange={(e) => setFilterTable(e.target.value)}>
            <MenuItem value="ALL">All Tables</MenuItem>
            <MenuItem value="products">Products</MenuItem>
            <MenuItem value="stock_movements">Stock Movements</MenuItem>
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 150, bgcolor: "white" }}>
          <InputLabel>Action</InputLabel>
          <Select value={filterAction} label="Action" onChange={(e) => setFilterAction(e.target.value)}>
            <MenuItem value="ALL">All Actions</MenuItem>
            <MenuItem value="INSERT">Created</MenuItem>
            <MenuItem value="UPDATE">Updated</MenuItem>
            <MenuItem value="DELETE">Deleted</MenuItem>
          </Select>
        </FormControl>
      </Box>

      {/* Audit Logs Table */}
      <TableContainer component={Paper}>
        {filteredLogs.length === 0 ? (
          <Box sx={{ p: 8, textAlign: "center" }}>
            <Typography variant="h1" sx={{ mb: 2 }}>
              📋
            </Typography>
            <Typography color="text.secondary" gutterBottom>
              No audit logs found
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {searchTerm || filterAction !== "ALL" || filterTable !== "ALL"
                ? "Try adjusting your filters"
                : "Logs will appear here when changes are made"}
            </Typography>
          </Box>
        ) : (
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: "#f9fafb" }}>
                <TableCell sx={{ fontWeight: 600 }}>Table</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Action</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Description</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>User</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Changed Fields</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Date & Time</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredLogs.map((log) => (
                <TableRow key={log.id} hover>
                  <TableCell>
                    <Chip
                      label={log.table_name}
                      color={getTableColor(log.table_name)}
                      size="small"
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell>
                    <Chip label={log.action} color={getActionColor(log.action)} size="small" sx={{ fontWeight: 500 }} />
                  </TableCell>
                  <TableCell sx={{ fontWeight: 500 }}>{getDescription(log)}</TableCell>
                  <TableCell>
                    <Typography variant="body2">{log.user_email}</Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="text.secondary">
                      {getChangedFieldsText(log)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="text.secondary">
                      {formatDate(log.created_at)}
                    </Typography>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </TableContainer>

      {/* Stats */}
      {filteredLogs.length > 0 && (
        <Box sx={{ mt: 2, textAlign: "center" }}>
          <Typography variant="body2" color="text.secondary">
            Showing {filteredLogs.length} of {logs.length} log entries
          </Typography>
        </Box>
      )}
    </DashboardLayout>
  )
}
