import { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import API from "../api/axios";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { AuthContext } from "../context/AuthContext";
import {
  Box, Typography, Button, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, Dialog, DialogTitle, DialogContent,
  DialogContentText, DialogActions, TextField, CircularProgress,
  Stack, TablePagination, MenuItem
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import CountUp from "react-countup";

export default function AdminPanel() {
  const { user, token, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  // Data states
  const [users, setUsers] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);

  // Search/filter states
  const [userSearch, setUserSearch] = useState("");
  const [accountSearch, setAccountSearch] = useState("");
  const [transactionSearch, setTransactionSearch] = useState("");
  const [transactionTypeFilter, setTransactionTypeFilter] = useState("");
  const [transactionDateFrom, setTransactionDateFrom] = useState("");
  const [transactionDateTo, setTransactionDateTo] = useState("");

  // Pagination states
  const [userPage, setUserPage] = useState(0);
  const [accountPage, setAccountPage] = useState(0);
  const [transactionPage, setTransactionPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);

  // Dialog states
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editUserDialogOpen, setEditUserDialogOpen] = useState(false);
  const [addUserDialogOpen, setAddUserDialogOpen] = useState(false);
  const [deleteAccountDialogOpen, setDeleteAccountDialogOpen] = useState(false);
  const [editAccountDialogOpen, setEditAccountDialogOpen] = useState(false);
  const [addAccountDialogOpen, setAddAccountDialogOpen] = useState(false);
  const [loadingIds, setLoadingIds] = useState([]);

  // Selected items for dialogs
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedAccount, setSelectedAccount] = useState(null);

  // Form states
  const [newUser, setNewUser] = useState({ name: "", email: "", password: "", role: "user", phone: "" });
  const [editUser, setEditUser] = useState({ name: "", email: "", role: "user", phone: "" });
  const [newAccount, setNewAccount] = useState({ userId: "", type: "savings", balance: 0 });
  const [editAccount, setEditAccount] = useState({ type: "", balance: 0 });

  // Fetch admin data
  useEffect(() => {
    if (!user || !token || user.role?.toLowerCase() !== "admin") {
      navigate("/", { replace: true });
      return;
    }

    const fetchAdminData = async () => {
      setLoading(true);
      try {
        const [usersRes, accountsRes, txRes] = await Promise.all([
          API.get("/admin/users"),
          API.get("/admin/accounts"),
          API.get("/admin/transactions")
        ]);
        setUsers(usersRes.data.users || []);
        setAccounts(accountsRes.data.accounts || []);
        setTransactions(txRes.data.transactions || []);
      } catch (err) {
        toast.error("Failed to fetch admin data");
      } finally {
        setLoading(false);
      }
    };

    fetchAdminData();
  }, [user, token, navigate]);

  // ---------- HANDLERS ----------

  // User handlers
  const openEditUserDialog = (user) => {
    setSelectedUser(user);
    setEditUser({ name: user.name, email: user.email, role: user.role });
    setEditUserDialogOpen(true);
  };

  const handleDeleteUser = (user) => {
    setSelectedUser(user);
    setDeleteDialogOpen(true);
  };

  const confirmDeleteUser = async () => {
    try {
      await API.delete(`/admin/users/${selectedUser.id}`);
      setUsers(users.filter(u => u.id !== selectedUser.id));
      toast.success("User deleted successfully");
    } catch (err) {
      toast.error("Failed to delete user");
    } finally {
      setDeleteDialogOpen(false);
    }
  };

  const handleEditUser = async () => {
    try {
      const res = await API.put(`/admin/users/${selectedUser.id}`, editUser);
      setUsers(users.map(u => (u.id === selectedUser.id ? res.data : u)));
      toast.success("User updated successfully");
    } catch (err) {
      toast.error("Failed to update user");
    } finally {
      setEditUserDialogOpen(false);
    }
  };

  const handleAddUser = async () => {
    try {
      const res = await API.post("/admin/users", newUser);
      setUsers([...users, res.data]);
      toast.success("User added successfully");
    } catch (err) {
      toast.error("Failed to add user");
    } finally {
      setAddUserDialogOpen(false);
      setNewUser({ name: "", email: "", password: "", role: "user" });
    }
  };

  // Account handlers
  const openEditAccountDialog = (account) => {
    setSelectedAccount(account);
    setEditAccount({ type: account.type, balance: account.balance });
    setEditAccountDialogOpen(true);
  };

  const handleDeleteAccount = (account) => {
    setSelectedAccount(account);
    setDeleteAccountDialogOpen(true);
  };

  const confirmDeleteAccount = async () => {
    try {
      await API.delete(`/admin/accounts/${selectedAccount.id}`);
      setAccounts(accounts.filter(acc => acc.id !== selectedAccount.id));
      toast.success("Account deleted successfully");
    } catch (err) {
      toast.error("Failed to delete account");
    } finally {
      setDeleteAccountDialogOpen(false);
    }
  };

  const handleEditAccount = async () => {
    try {
      const res = await API.put(`/admin/accounts/${selectedAccount.id}`, editAccount);
      setAccounts(accounts.map(acc => (acc.id === selectedAccount.id ? res.data : acc)));
      toast.success("Account updated successfully");
    } catch (err) {
      toast.error("Failed to update account");
    } finally {
      setEditAccountDialogOpen(false);
    }
  };

  const handleAddAccount = async () => {
    try {
      const res = await API.post("/admin/accounts", newAccount);
      setAccounts([...accounts, res.data]);
      toast.success("Account added successfully");
    } catch (err) {
      toast.error("Failed to add account");
    } finally {
      setAddAccountDialogOpen(false);
      setNewAccount({ userId: "", type: "savings", balance: 0 });
    }
  };

  // Reset Password
  const handleResetPassword = async (user) => {
    if (!window.confirm(`Reset password for ${user.name}?`)) return;

    try {
      const res = await API.put(`/admin/users/${user.id}/reset-password`);
      toast.success(res.data.message || "Password reset successfully");
    } catch (err) {
      toast.error("Failed to reset password");
    }
  };

  // Toggle Activate / Deactivate
  const handleToggleUserStatus = async (user) => {
    setLoadingIds([...loadingIds, user.id]);
    const action = user.status === "active" ? "deactivate" : "activate";
    try {
      const res = await API.put(`/admin/users/${user.id}/${action}`);
      setUsers(users.map(u => u.id === user.id ? { ...u, status: action === "activate" ? "active" : "inactive" } : u));
      toast.success(res.data.message || `User ${action}d successfully`);
    } catch (err) {
      toast.error(`Failed to ${action} user`);
    } finally {
      setLoadingIds(loadingIds.filter(id => id !== user.id));
    }
  };

  // ---------- FILTERED DATA ----------
  const filteredUsers = users.filter(
    u =>
      u.name?.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.email?.toLowerCase().includes(userSearch.toLowerCase())
  );

  const filteredAccounts = accounts.filter(
    acc =>
      acc.account_number?.toString().includes(accountSearch) ||
      acc.user_name?.toLowerCase().includes(accountSearch.toLowerCase()) ||
      acc.user_email?.toLowerCase().includes(accountSearch.toLowerCase())
  );

  const filteredTransactions = transactions.filter(txn => {
    const matchesSearch =
      txn.from_account?.toString().includes(transactionSearch) ||
      txn.to_account?.toString().includes(transactionSearch) ||
      txn.from_user?.toLowerCase().includes(transactionSearch.toLowerCase()) ||
      txn.to_user?.toLowerCase().includes(transactionSearch.toLowerCase());

    const matchesType = transactionTypeFilter ? txn.type === transactionTypeFilter : true;

    const txnDate = new Date(txn.created_at);
    const matchesDate =
      (!transactionDateFrom || txnDate >= new Date(transactionDateFrom)) &&
      (!transactionDateTo || txnDate <= new Date(transactionDateTo));

    return matchesSearch && matchesType && matchesDate;
  });

  // ---------- TRANSACTION FORMAT ----------
  const formatTransactionFromTo = (txn) => {
    switch (txn.type) {
      case "TRANSFER": return `${txn.from_account || "-"} → ${txn.to_account || "-"}`;
      case "DEPOSIT": return `→ ${txn.to_account || "-"}`;
      case "WITHDRAW": return `${txn.from_account || "-"} →`;
      default: return "-";
    }
  };
  const getSender = (txn) => txn.type === "TRANSFER" || txn.type === "WITHDRAW" ? txn.from_user || "-" : "-";
  const getReceiver = (txn) => txn.type === "TRANSFER" || txn.type === "DEPOSIT" ? txn.to_user || "-" : "-";

  // ---------- FORMAT USERS ----------
  const formatUserForPDF = (user) => ({
    id: user.id,
    name: user.name || "-",
    email: user.email || "-",
    phone: user.phone || "-",
    role: user.role || "-",
    status: user.status || "active",
  });

  // ---------- FORMAT ACCOUNTS ----------
  const formatAccountForPDF = (acc) => ({
    id: acc.id,
    accountNumber: acc.account_number || "-",
    type: acc.type || "-",
    balance:
      acc.balance !== undefined
        ? `\u20B9${Number(acc.balance).toFixed(2)}`
        : "-",
    user: acc.user_name || "-",
    createdAt: acc.created_at
      ? new Date(acc.created_at).toLocaleString()
      : "-",
  });

  // ---------- FORMAT TRANSACTIONS ----------
  const formatTransactionForPDF = (txn) => ({
    id: txn.id,
    fromTo:
      txn.type === "TRANSFER"
        ? `${txn.from_account || "-"} → ${txn.to_account || "-"}`
        : txn.type === "DEPOSIT"
          ? `→ ${txn.to_account || "-"}`
          : txn.type === "WITHDRAW"
            ? `${txn.from_account || "-"} →`
            : "-",
    sender:
      txn.type === "TRANSFER" || txn.type === "WITHDRAW"
        ? txn.from_user || "-"
        : "-",
    receiver:
      txn.type === "TRANSFER" || txn.type === "DEPOSIT"
        ? txn.to_user || "-"
        : "-",
    type: txn.type || "-",
    amount:
      txn.amount !== undefined
        ? `\u20B9${Number(txn.amount).toFixed(2)}`
        : "-",
    date: txn.created_at
      ? new Date(txn.created_at).toLocaleString()
      : "-",
  });

  // ---------- EXPORT TO PDF ----------
  const exportToPDF = (data, fileName, title, columns, formatFunc) => {
    const doc = new jsPDF();
    doc.setFontSize(12);
    doc.text(title, 14, 10);

    const tableRows = data.map((item) => {
      const formatted = formatFunc(item);
      return columns.map((col) => formatted[col.key]);
    });

    autoTable(doc, {
      head: [columns.map((col) => col.label)],
      body: tableRows,
      startY: 20,
      styles: {
        fontSize: 9,
        cellPadding: 3,
        overflow: "linebreak",
      },
      headStyles: {
        fillColor: [238, 208, 110],
        textColor: 20,
        halign: "center",
      },
      columnStyles: columns.reduce((acc, col, idx) => {
        acc[idx] = { cellWidth: "auto" };
        return acc;
      }, {}),
    });

    doc.save(fileName);
  };

  // Dashboard Card Style
  const cardStyle = {
    flex: "1 1 300px",
    maxWidth: 205,
    maxHeight: 145,
    p: 3,
    borderRadius: 3,
    background: "linear-gradient(135deg, #74ebd5, #9face6)",
    color: "#1E3C72",
    position: "relative",
    transition: "0.3s",
    "&:hover": {
      transform: "translateY(-6px) scale(1.03)",
      boxShadow:
        "0 0 10px rgba(116,235,213,0.6), 0 0 25px rgba(159,172,230,0.6)",
    },
  };



  // ========== RENDER UI ==========
  return (
    <Box
      sx={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #0f2027, #203a43, #2c5364)",
        p: 4,
        color: "white"
      }}>

      {/* Header */}
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center" mb={4}
      >
        <Typography
          variant="h4"
          fontWeight="bold"
          sx={{
            fontSize: '2.5rem',
            background: 'linear-gradient(90deg, #FFE5B4, #FFD580, #FFF1C9, #FFEACD)',
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            textFillColor: 'transparent',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            display: 'inline-block',
            width: '0ch',
            animation: 'typing 2s steps(20, end) forwards',
            '@keyframes typing': {
              from: { width: '0ch' },
              to: { width: '12ch' },
            },
            '&:hover': {
              cursor: 'pointer',
              textShadow: `0 1px 5px #FFD580`,
              transition: 'text-shadow 0.6s ease-in-out',
            },
          }}
        >
          Admin Panel
        </Typography>

        <Button
          variant="contained"
          color="error"
          onClick={() => { logout(); navigate("/"); }}>
          Logout
        </Button>
      </Stack>

      {loading && <Box sx={{ display: "flex", justifyContent: "center", mb: 4 }}><CircularProgress color="secondary" /></Box>}

      {/* Analytics / Dashboard Section */}
      <Stack
        direction="row"
        flexWrap="wrap"
        gap={4}
        mb={4}
      >
        {/* Total Users */}
        <Paper sx={cardStyle}>
          <Typography variant="h6">Total Users</Typography>
          <Typography variant="h4" ml={2}>
            <CountUp
              end={users.length}
              duration={2}
              separator=","
            />
          </Typography>
        </Paper>

        {/* Total Accounts */}
        <Paper sx={cardStyle}>
          <Typography variant="h6">Total Accounts</Typography>
          <Typography variant="h4" ml={2}>
            <CountUp
              end={accounts.length}
              duration={2}
              separator=","
            />
          </Typography>
        </Paper>

        {/* Transactions Today */}
        <Paper sx={cardStyle}>
          <Typography variant="h6">Transactions Today</Typography>
          <Typography variant="h4" ml={2}>
            <CountUp
              end={transactions.filter(tx =>
                new Date(tx.created_at).toDateString() === new Date().toDateString()
              ).length}
              duration={2}
              separator=","
            />
          </Typography>
        </Paper>

        {/* Total Deposits */}
        <Paper sx={cardStyle}>
          <Typography variant="h6">Total Deposits</Typography>
          <Typography variant="h4" ml={2}>
            ₹{" "}
            <CountUp
              end={transactions
                .filter(tx => tx.type === "DEPOSIT")
                .reduce((sum, tx) => sum + Number(tx.amount || 0), 0)
                .toFixed(2)}
              duration={2}
              separator=","
              decimals={2}
            />
          </Typography>
        </Paper>

        {/* Total Withdrawals */}
        <Paper sx={cardStyle}>
          <Typography variant="h6">Total Withdrawals</Typography>
          <Typography variant="h4" ml={2}>
            ₹{" "}
            <CountUp
              end={transactions
                .filter(tx => tx.type === "WITHDRAW")
                .reduce((sum, tx) => sum + Number(tx.amount || 0), 0)
                .toFixed(2)}
              duration={2}
              separator=","
              decimals={2}
            />
          </Typography>
        </Paper>
      </Stack>

      {/* PDF Section */}
      <Stack direction="row" spacing={2} mb={4}>
        <Button
          variant="contained"
          color="secondary"
          onClick={() =>
            exportToPDF(
              users,
              "users_report.pdf",
              "Users Report",
              [
                { key: "id", label: "ID" },
                { key: "name", label: "Name" },
                { key: "email", label: "Email" },
                { key: "phone", label: "Phone" },
                { key: "role", label: "Role" },
                { key: "status", label: "Status" },
              ],
              formatUserForPDF
            )
          }
        >
          Export Users PDF
        </Button>

        <Button
          variant="contained"
          color="secondary"
          onClick={() =>
            exportToPDF(
              accounts,
              "accounts_report.pdf",
              "Accounts Report",
              [
                { key: "id", label: "ID" },
                { key: "accountNumber", label: "Account Number" },
                { key: "type", label: "Type" },
                { key: "balance", label: "Balance" },
                { key: "user", label: "User" },
                { key: "createdAt", label: "Created At" },
              ],
              formatAccountForPDF
            )
          }
        >
          Export Accounts PDF
        </Button>

        <Button
          variant="contained"
          color="secondary"
          onClick={() =>
            exportToPDF(
              transactions,
              "transactions_report.pdf",
              "Transactions Report",
              [
                { key: "id", label: "ID" },
                { key: "fromTo", label: "From → To" },
                { key: "sender", label: "Sender" },
                { key: "receiver", label: "Receiver" },
                { key: "type", label: "Type" },
                { key: "amount", label: "Amount" },
                { key: "date", label: "Date" },
              ],
              formatTransactionForPDF
            )
          }
        >
          Export Transactions PDF
        </Button>
      </Stack>

      {/* USERS TABLE */}
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        mb={2}>
        <Typography variant="h5">
          All Users
        </Typography>
        <Stack
          direction="row"
          spacing={2}>
          <TextField
            size="small"
            variant="outlined"
            placeholder="Search users..."
            value={userSearch}
            onChange={e => setUserSearch(e.target.value)}
            sx={{
              input: { color: "white" },
              label: { color: "white" },
              "& .MuiOutlinedInput-root": {
                "& fieldset": { borderColor: "#FFCD2D" },
                "&:hover fieldset": { borderColor: "#FFD84D" },
              },
            }}
          />
          <Button
            variant="contained"
            color="success"
            onClick={() => setAddUserDialogOpen(true)}>
            Add New User
          </Button>
        </Stack>
      </Stack>
      <TableContainer component={Paper} sx={{ mb: 2, overflowX: "auto" }}>
        <Table>
          <TableHead sx={{ bgcolor: "#eed06e" }}>
            <TableRow>
              <TableCell>ID</TableCell>
              <TableCell>Name</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Phone</TableCell>
              <TableCell>Role</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredUsers
              .slice(userPage * rowsPerPage, userPage * rowsPerPage + rowsPerPage)
              .map(u => {
                const isActive = u.status === "active" || !u.status;
                const isLoading = loadingIds.includes(u.id);

                return (
                  <TableRow key={u.id}>
                    <TableCell>{u.id}</TableCell>
                    <TableCell>{u.name}</TableCell>
                    <TableCell>{u.email}</TableCell>
                    <TableCell>{u.phone}</TableCell>
                    <TableCell>{u.role}</TableCell>
                    <TableCell>{isActive ? "active" : "inactive"}</TableCell>
                    <TableCell>
                      <Stack direction="row" spacing={1}>
                        <Button color="primary" startIcon={<EditIcon />} onClick={() => openEditUserDialog(u)}>
                          Edit
                        </Button>
                        <Button color="warning" onClick={() => handleResetPassword(u)}>
                          Reset Password
                        </Button>
                        <Button
                          color={isActive ? "error" : "success"}
                          onClick={() => handleToggleUserStatus(u)}
                          sx={{ ml: 1 }}
                          disabled={isLoading}
                        >
                          {isLoading
                            ? "Processing..."
                            : isActive
                              ? "Deactivate"
                              : "Activate"}
                        </Button>
                        <Button color="error" startIcon={<DeleteIcon />} onClick={() => handleDeleteUser(u)}>
                          Delete
                        </Button>
                      </Stack>
                    </TableCell>
                  </TableRow>
                );
              })}
          </TableBody>

        </Table>
      </TableContainer>
      <TablePagination
        component="div"
        count={filteredUsers.length}
        page={userPage}
        onPageChange={(e, newPage) => setUserPage(newPage)}
        rowsPerPage={rowsPerPage}
        sx={{
          color: "white",
          "& .MuiTablePagination-actions button": {
          },
          "& .MuiSelect-icon": {
            color: "#ccc",
          },
        }}
        onRowsPerPageChange={e => { setRowsPerPage(parseInt(e.target.value, 10)); setUserPage(0); }}
      />

      {/* ACCOUNTS TABLE */}
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center" mb={2}>
        <Typography variant="h5">
          All Accounts
        </Typography>
        <Stack direction="row" spacing={2}>
          <TextField
            size="small"
            variant="outlined"
            placeholder="Search accounts..."
            value={accountSearch}
            sx={{
              input: { color: "white" },
              label: { color: "white" },
              "& .MuiOutlinedInput-root": {
                "& fieldset": { borderColor: "#FFCD2D" },
                "&:hover fieldset": { borderColor: "#FFD84D" },
              },
            }}
            onChange={e => setAccountSearch(e.target.value)}
          />
          <Button variant="contained" color="success" onClick={() => setAddAccountDialogOpen(true)}>Add New Account</Button>
        </Stack>
      </Stack>
      <TableContainer component={Paper} sx={{ mb: 2 }}>
        <Table>
          <TableHead sx={{ bgcolor: "#eed06e" }}>
            <TableRow>
              <TableCell>ID</TableCell><TableCell>Account Number</TableCell><TableCell>Type</TableCell><TableCell>Balance</TableCell><TableCell>User</TableCell><TableCell>Created At</TableCell><TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredAccounts.slice(accountPage * rowsPerPage, accountPage * rowsPerPage + rowsPerPage).map(acc => (
              <TableRow key={acc.id}>
                <TableCell>{acc.id}</TableCell>
                <TableCell>{acc.account_number}</TableCell>
                <TableCell>{acc.type}</TableCell>
                <TableCell>₹{acc.balance}</TableCell>
                <TableCell>{acc.user_name}</TableCell>
                <TableCell>{acc.created_at ? new Date(acc.created_at).toLocaleString() : "-"}</TableCell>
                <TableCell>
                  <Button color="primary" startIcon={<EditIcon />} onClick={() => openEditAccountDialog(acc)}>Edit</Button>
                  <Button color="error" startIcon={<DeleteIcon />} onClick={() => handleDeleteAccount(acc)}>Delete</Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      <TablePagination
        component="div"
        count={filteredAccounts.length}
        page={accountPage}
        onPageChange={(e, newPage) => setAccountPage(newPage)}
        rowsPerPage={rowsPerPage}
        sx={{
          color: "white",
          "& .MuiTablePagination-actions button": {
          },
          "& .MuiSelect-icon": {
            color: "#ccc",
          },
        }}
        onRowsPerPageChange={e => { setRowsPerPage(parseInt(e.target.value, 10)); setAccountPage(0); }}
      />

      {/* TRANSACTIONS TABLE */}
      <Typography variant="h5" fontWeight="medium" mb={2}>
        All Transactions
      </Typography>
      <Stack direction="row" spacing={2} mb={2}>

        <TextField
          size="small"
          variant="outlined"
          placeholder="Search transactions..."
          value={transactionSearch}
          sx={{
            input: { color: "white" },
            label: { color: "white" },
            "& .MuiOutlinedInput-root": {
              "& fieldset": { borderColor: "#FFCD2D" },
              "&:hover fieldset": { borderColor: "#FFD84D" },
            },
          }}
          onChange={e => setTransactionSearch(e.target.value)} />

        <TextField
          select
          size="small"
          variant="outlined"
          label="Type Filter"
          value={transactionTypeFilter}
          sx={{
            width: "130px",
            input: { color: "white" },
            label: { color: "white" },
            "& .MuiOutlinedInput-root": {
              "& fieldset": { borderColor: "#FFCD2D" },
              "&:hover fieldset": { borderColor: "#FFD84D" },
            },
            "& .MuiSelect-icon": {
              color: "#ccc",
            },
            "& .MuiSelect-select": {
              color: "white",
            },
          }}
          onChange={e => setTransactionTypeFilter(e.target.value)}
        >
          <MenuItem value="">All</MenuItem>
          <MenuItem value="DEPOSIT">Deposit</MenuItem>
          <MenuItem value="WITHDRAW">Withdraw</MenuItem>
          <MenuItem value="TRANSFER">Transfer</MenuItem>
        </TextField>

        <TextField
          type="date"
          size="small"
          label="From"
          InputLabelProps={{ shrink: true }}
          value={transactionDateFrom}
          sx={{
            input: { color: "white" },
            label: { color: "white" },
            "& .MuiOutlinedInput-root": {
              "& fieldset": { borderColor: "#FFCD2D" },
              "&:hover fieldset": { borderColor: "#FFD84D" },
            },
            "& input[type='date']::-webkit-calendar-picker-indicator": {
              filter: "invert(1) sepia(1) saturate(5) hue-rotate(10deg)",
              cursor: "pointer",
            },
          }}
          onChange={e => setTransactionDateFrom(e.target.value)}
        />

        <TextField
          type="date"
          size="small"
          label="To"
          InputLabelProps={{ shrink: true }}
          value={transactionDateTo}
          sx={{
            input: { color: "white" },
            label: { color: "white" },
            "& .MuiOutlinedInput-root": {
              "& fieldset": { borderColor: "#FFCD2D" },
              "&:hover fieldset": { borderColor: "#FFD84D" },
            },
            "& input[type='date']::-webkit-calendar-picker-indicator": {
              filter: "invert(1) sepia(1) saturate(5) hue-rotate(10deg)",
              cursor: "pointer",
            },
          }}
          onChange={e => setTransactionDateTo(e.target.value)}
        />

      </Stack>
      <TableContainer component={Paper} sx={{ mb: 2 }}>
        <Table>
          <TableHead sx={{ bgcolor: "#eed06e" }}>
            <TableRow>
              <TableCell>ID</TableCell><TableCell>From → To</TableCell><TableCell>Sender</TableCell><TableCell>Receiver</TableCell><TableCell>Type</TableCell><TableCell>Amount</TableCell><TableCell>Date</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredTransactions.slice(transactionPage * rowsPerPage, transactionPage * rowsPerPage + rowsPerPage).map(txn => (
              <TableRow key={txn.id}>
                <TableCell>{txn.id}</TableCell>
                <TableCell>{formatTransactionFromTo(txn)}</TableCell>
                <TableCell>{getSender(txn)}</TableCell>
                <TableCell>{getReceiver(txn)}</TableCell>
                <TableCell>{txn.type}</TableCell>
                <TableCell>₹ {txn.amount}</TableCell>
                <TableCell>{new Date(txn.created_at).toLocaleString()}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <TablePagination
        component="div"
        count={filteredTransactions.length}
        page={transactionPage}
        onPageChange={(e, newPage) =>
          setTransactionPage(newPage)}
        rowsPerPage={rowsPerPage}
        sx={{
          color: "white",
          "& .MuiTablePagination-actions button": {
          },
          "& .MuiSelect-icon": {
            color: "#ccc",
          },
        }}
        onRowsPerPageChange={e => {
          setRowsPerPage(parseInt(e.target.value, 10));
          setTransactionPage(0);
        }}
      />

      {/* DIALOGS */}
      {/* Delete User */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Delete User</DialogTitle>
        <DialogContent>
          <DialogContentText>Are you sure you want to delete user <b>{selectedUser?.name}</b>?</DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button onClick={confirmDeleteUser} color="error" variant="contained">Delete</Button>
        </DialogActions>
      </Dialog>

      {/* Edit User */}
      <Dialog open={editUserDialogOpen} onClose={() => setEditUserDialogOpen(false)}>
        <DialogTitle>Edit User</DialogTitle>
        <DialogContent>
          <TextField
            label="Name"
            fullWidth margin="dense"
            value={editUser.name}
            onChange={e => setEditUser({ ...editUser, name: e.target.value })}
          />

          <TextField
            label="Email"
            fullWidth margin="dense"
            value={editUser.email}
            onChange={e => setEditUser({ ...editUser, email: e.target.value })}
          />

          <TextField
            label="Phone"
            fullWidth
            margin="dense"
            value={editUser.phone}
            onChange={e => setEditUser({ ...editUser, phone: e.target.value })}
          />

          <TextField
            label="Role"
            fullWidth margin="dense"
            value={editUser.role}
            onChange={e =>
              setEditUser({ ...editUser, role: e.target.value })}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditUserDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleEditUser} color="primary" variant="contained">Update</Button>
        </DialogActions>
      </Dialog>

      {/* Add User */}
      <Dialog open={addUserDialogOpen} onClose={() => setAddUserDialogOpen(false)}>
        <DialogTitle>Add New User</DialogTitle>
        <DialogContent>
          <TextField
            label="Name"
            fullWidth margin="dense"
            value={newUser.name}
            onChange={e => setNewUser({ ...newUser, name: e.target.value })}
          />

          <TextField
            label="Email"
            fullWidth margin="dense"
            value={newUser.email}
            onChange={e => setNewUser({ ...newUser, email: e.target.value })}
          />

          <TextField
            label="Phone"
            fullWidth
            margin="dense"
            value={newUser.phone}
            onChange={e => setNewUser({ ...newUser, phone: e.target.value })}
          />

          <TextField
            label="Password"
            type="password"
            fullWidth margin="dense"
            value={newUser.password}
            onChange={e => setNewUser({ ...newUser, password: e.target.value })}
          />

          <TextField
            label="Role"
            fullWidth margin="dense"
            value={newUser.role}
            onChange={e =>
              setNewUser({ ...newUser, role: e.target.value })}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddUserDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleAddUser} color="success" variant="contained">Add User</Button>
        </DialogActions>
      </Dialog>

      {/* Delete Account */}
      <Dialog open={deleteAccountDialogOpen} onClose={() => setDeleteAccountDialogOpen(false)}>
        <DialogTitle>Delete Account</DialogTitle>
        <DialogContent>
          <DialogContentText>Are you sure you want to delete account <b>{selectedAccount?.account_number}</b>?</DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteAccountDialogOpen(false)}>Cancel</Button>
          <Button onClick={confirmDeleteAccount} color="error" variant="contained">Delete</Button>
        </DialogActions>
      </Dialog>

      {/* Edit Account */}
      <Dialog open={editAccountDialogOpen} onClose={() => setEditAccountDialogOpen(false)}>
        <DialogTitle>Edit Account</DialogTitle>
        <DialogContent>
          <TextField label="Type" fullWidth margin="dense" value={editAccount.type} onChange={e => setEditAccount({ ...editAccount, type: e.target.value })} />
          <TextField label="Balance" type="number" fullWidth margin="dense" value={editAccount.balance} onChange={e => setEditAccount({ ...editAccount, balance: e.target.value })} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditAccountDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleEditAccount} color="primary" variant="contained">Update</Button>
        </DialogActions>
      </Dialog>

      {/* Add Account */}
      <Dialog open={addAccountDialogOpen} onClose={() => setAddAccountDialogOpen(false)}>
        <DialogTitle>Add New Account</DialogTitle>
        <DialogContent>
          {/* Select User */}
          <TextField
            select
            label="Select User"
            fullWidth
            margin="dense"
            value={newAccount.userId}
            onChange={e => setNewAccount({ ...newAccount, userId: e.target.value })}
            SelectProps={{ native: true }}
          >
            <option value="Select User">-- Select User --</option>
            {users.map(u => u ? (
              <option key={u.id} value={u.id}>{u.name} ({u.email})</option>
            ) : null)}
          </TextField>

          {/* Select Account Type */}
          <TextField
            select
            label="Account Type"
            fullWidth
            margin="dense"
            value={newAccount.type}
            onChange={e => setNewAccount({ ...newAccount, type: e.target.value })}
            SelectProps={{ native: true }}
          >
            <option value="savings">Savings</option>
            <option value="current">Current</option>
            <option value="fixed deposit">Fixed Deposit</option>
            <option value="joint">Joint</option>
          </TextField>

          {/* Initial Balance */}
          <TextField
            label="Initial Balance"
            type="number"
            fullWidth
            margin="dense"
            value={newAccount.balance}
            onChange={e => setNewAccount({ ...newAccount, balance: e.target.value })}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddAccountDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleAddAccount} color="success" variant="contained">Add Account</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
