import { useContext, useEffect, useState, useCallback } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import API from "../api/axios";
import { AuthContext } from "../context/AuthContext";
import {
  Box, Card, Typography, Button, Grid, Stack, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, Chip, Dialog, DialogActions, DialogContent, DialogContentText,
  DialogTitle, TextField, IconButton, FormControl, InputLabel, Select, MenuItem, CircularProgress, Tooltip
} from "@mui/material";
import SavingsIcon from "@mui/icons-material/Savings";
import BusinessIcon from "@mui/icons-material/Business";
import SecurityIcon from "@mui/icons-material/Security";
import CardMembershipIcon from "@mui/icons-material/CardMembership";
import PeopleIcon from "@mui/icons-material/People";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward";
import AutorenewIcon from "@mui/icons-material/Autorenew";
import DeleteIcon from "@mui/icons-material/Delete";
import CountUp from "react-countup";

export default function Dashboard() {
  const { user, token, logout } = useContext(AuthContext);
  const [accounts, setAccounts] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // === DIALOG STATES ===
  const [depositDialogOpen, setDepositDialogOpen] = useState(false);
  const [withdrawDialogOpen, setWithdrawDialogOpen] = useState(false);
  const [transferDialogOpen, setTransferDialogOpen] = useState(false);
  const [otpDialogOpen, setOtpDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [openCreateDialog, setOpenCreateDialog] = useState(false);
  const [accountType, setAccountType] = useState("");
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [amountInput, setAmountInput] = useState("");
  const [transferData, setTransferData] = useState({ fromAccount: "", toAccount: "", amount: "" });
  const [otpInput, setOtpInput] = useState("");
  const [otpId, setOtpId] = useState(null);
  const [transactionPages, setTransactionPages] = useState({});
  const TRANSACTIONS_LIMIT = 10;


  // Hooks
  const refreshDashboard = useCallback(async () => {
    await fetchAccounts();
    await fetchTransactions();
  }, []);

  useEffect(() => {
    refreshDashboard();
  }, [refreshDashboard]);

  useEffect(() => {
    const initDashboard = async () => {
      await fetchAccounts();
    };
    initDashboard();
  }, []);

  useEffect(() => {
    if (accounts.length > 0) {
      accounts.forEach(acc => fetchTransactions(acc.account_number));
    }
  }, [accounts]);

  // EARLY RETURN
  if (!user || !token) return <Navigate to="/" replace />;

  // Fetch accounts
  const fetchAccounts = async () => {
    try {
      setLoading(true);
      const res = await API.get("/accounts");
      setAccounts(Array.isArray(res.data) ? res.data : []);
      setLoading(false);
    } catch (err) {
      setLoading(false);
      toast.error("Failed to load accounts");
      setAccounts([]);
    }
  };

  // Fetch transactions
  const fetchTransactions = async (accountNumber, page = 0) => {
    try {
      const res = await API.get("/transactions/history", {
        params: {
          accountNumber,       // only fetch for this account
          limit: TRANSACTIONS_LIMIT,
          offset: page * TRANSACTIONS_LIMIT,
        },
      });

      // Only include transactions belonging to this account
      const filteredTxns = Array.isArray(res.data.transactions)
        ? res.data.transactions.filter(txn =>
          txn.from_account === accountNumber || txn.to_account === accountNumber
        )
        : [];

      setTransactions(prev => ({
        ...prev,
        [accountNumber]: page === 0 ? filteredTxns : [...(prev[accountNumber] || []), ...filteredTxns],
      }));

      setTransactionPages(prev => ({ ...prev, [accountNumber]: page }));
    } catch (err) {
      console.error("Error fetching transactions:", err);
    }
  };

  // Account Icons
  const getAccountIcon = (type) => {
    switch (type) {
      case "Savings": return <SavingsIcon sx={{ fontSize: 32, color: "#1E3C72" }} />;
      case "Current": return <BusinessIcon sx={{ fontSize: 32, color: "#1E3C72" }} />;
      case "Fixed Deposit": return <SecurityIcon sx={{ fontSize: 32, color: "#1E3C72" }} />;
      case "Recurring Deposit": return <CardMembershipIcon sx={{ fontSize: 32, color: "#9c27b0" }} />;
      case "Joint": return <PeopleIcon sx={{ fontSize: 32, color: "#1E3C72" }} />;
      default: return <SavingsIcon sx={{ fontSize: 32, color: "#1E3C72" }} />;
    }
  };

  const getTransactionColor = (type) => {
    switch (type.toLowerCase()) {
      case "credit": return "success";
      case "debit": return "error";
      default: return "default";
    }
  };

  // Dialog handlers
  const handleOpenDeposit = (acc) => { setSelectedAccount(acc); setAmountInput(""); setDepositDialogOpen(true); };
  const handleOpenWithdraw = (acc) => { setSelectedAccount(acc); setAmountInput(""); setWithdrawDialogOpen(true); };
  const handleOpenDelete = (acc) => { setSelectedAccount(acc); setDeleteDialogOpen(true); };
  const handleOpenTransfer = () => { setTransferDialogOpen(true); };
  const handleCloseDialogs = () => {
    setDepositDialogOpen(false);
    setWithdrawDialogOpen(false);
    setTransferDialogOpen(false);
    setOtpDialogOpen(false);
    setOtpId(null);
    setOtpInput("");
    setDeleteDialogOpen(false);
    setOpenCreateDialog(false);
    setSelectedAccount(null);
    setAmountInput("");
    setOtpInput("");
    setTransferData({ fromAccount: "", toAccount: "", amount: "" });

    // Move focus safely to body to avoid aria-hidden warning
    if (document.activeElement) document.activeElement.blur();
  };

  // Deposit / Withdraw / Delete / Create
  const handleDeposit = async () => {
    try {
      setLoading(true);
      const res = await API.post("/accounts/deposit", { accountNumber: selectedAccount.account_number, amount: parseFloat(amountInput) });
      toast.success(res.data.message || "Deposit successful");
      refreshDashboard();
      handleCloseDialogs();
      setLoading(false);
    } catch (err) {
      setLoading(false);
      toast.error(err.response?.data?.message || "Deposit failed");
    }
  };

  const handleWithdraw = async () => {
    try {
      setLoading(true);
      const res = await API.post("/accounts/withdraw", { accountNumber: selectedAccount.account_number, amount: parseFloat(amountInput) });
      toast.success(res.data.message || "Withdrawal successful");
      refreshDashboard();
      handleCloseDialogs();
      setLoading(false);
    } catch (err) {
      setLoading(false);
      toast.error(err.response?.data?.message || "Withdrawal failed");
    }
  };

  const handleDelete = async () => {
    if (selectedAccount.balance > 0) {
      toast.error("Account balance must be 0 before deleting");
      return;
    }
    try {
      setLoading(true);
      await API.delete(`/accounts/delete/${selectedAccount.account_number}`);
      toast.success("Account deleted");
      refreshDashboard();
      handleCloseDialogs();
      setLoading(false);
    } catch (err) {
      setLoading(false);
      toast.error(err.response?.data?.message || "Failed to delete account");
    }
  };

  const handleCreateAccount = async () => {
    try {
      setLoading(true);
      const res = await API.post("/accounts/create", { type: accountType });
      toast.success(res.data.message);
      refreshDashboard();
      handleCloseDialogs();
      setLoading(false);
    } catch (err) {
      setLoading(false);
      toast.error(err.response?.data?.message || "Error creating account");
    }
  };

  // Transfer and OTP
  const handleTransferSubmit = async () => {
    if (transferData.fromAccount === transferData.toAccount) {
      toast.error("From and To accounts cannot be the same");
      return;
    }

    try {
      const res = await API.post("/auth/generate-otp", { userId: user.id, purpose: "TRANSFER" });
      console.log("OTP to transfer funds:", res.data.otp);
      setOtpId(res.data.otpId);

      setTransferDialogOpen(false);
      setOtpDialogOpen(true);
    } catch (err) {
      console.error("OTP Generate error:", err.response?.data || err.message);
      toast.error(err.response?.data?.message || "Failed to generate OTP");
    }
  };

  const handleVerifyOtp = async () => {
    try {
      setLoading(true);

      // Step 1: Verify OTP
      await API.post("/auth/verify-otp", { otpId, otp: otpInput });
      toast.success("OTP Verified. Proceeding with transfer...");

      // Step 2: Transfer Funds
      const transferRes = await API.post("/transactions/transfer", {
        fromAccount: transferData.fromAccount,
        toAccount: transferData.toAccount,
        amount: Number(transferData.amount), // 👈 ensure number
      });

      toast.success(transferRes.data.message || "Transfer successful");

      refreshDashboard();
      handleCloseDialogs();
    } catch (err) {
      console.error("Transfer Error:", err.response?.data || err.message);
      toast.error(err.response?.data?.message || "OTP verification / transfer failed");
    } finally {
      setLoading(false);
    }
  };

  const totalBalance = accounts.reduce((acc, a) => acc + Number(a.balance || 0), 0);

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
        alignItems="center" mb={4}>

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
          Welcome, {user?.name}!
        </Typography>

        <Button variant="contained" color="error"
          onClick={() => { logout(); navigate("/"); }}>
          Logout
        </Button>
      </Stack>

      {/* Total Balance */}
      <Card
        sx={{
          p: 2.5,
          mb: 4,
          maxWidth: 350,
          borderRadius: 3,
          background: "linear-gradient(135deg, #EEDFCC, #D8C3A5)",
          color: "#4E342E",
          boxShadow: "0 4px 15px rgba(0,0,0,0.1)",
          transition: "all 0.3s ease-in-out",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
          "&:hover": {
            transform: "scale(1.05)",
            boxShadow: "0 0 20px 4px rgba(238, 223, 204, 0.6)",
          },
        }}
      >
        <Typography variant="h6" fontWeight="medium" mb={1.5}>
          Total Balance Across Accounts
        </Typography>
        <Typography variant="h4" fontWeight="bold">
          ₹{" "}
          <CountUp
            end={totalBalance}
            duration={2}
            separator=","
            decimals={2}
          />
        </Typography>
      </Card>

      {/* Loading */}
      {loading && <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
        <CircularProgress color="secondary" />
      </Box>}

      {/* ACCOUNT SECTION */}
      <Typography variant="h5" fontWeight="medium" mb={2}>Your Accounts</Typography>
      <Grid container spacing={3} mb={6}>
        {/* User Accounts */}
        {accounts.map((acc) => (
          <Card
            key={acc.id}
            sx={{
              flex: "1 1 300px",
              maxWidth: 245,
              maxHeight: 145,
              p: 3,
              borderRadius: 3,
              background: "linear-gradient(135deg, #74ebd5, #9face6)",
              color: "#1E3C72",
              position: "relative",
              transition: "0.3s",
              "&:hover": { transform: "translateY(-6px) scale(1.03)", boxShadow: "0 0 10px rgba(116,235,213,0.6), 0 0 25px rgba(159,172,230,0.6)" }
            }}>

            <Tooltip title={Number(acc.balance) > 0 ? "Cannot delete account with balance" : "Delete Account"}>
              <span>
                <IconButton
                  aria-label="delete"
                  color="error"
                  disabled={Number(acc.balance) > 0}
                  onClick={() => handleOpenDelete(acc)}
                  sx={{
                    position: "absolute",
                    top: 8,
                    right: 8,
                    bgcolor: Number(acc.balance) > 0 ? "rgba(255,255,255,0.4)" : "rgba(255,255,255,0.7)",
                    cursor: Number(acc.balance) > 0 ? "not-allowed" : "pointer",
                    "&:hover": {
                      bgcolor: Number(acc.balance) > 0 ? "rgba(255,255,255,0.4)" : "rgba(255,0,0,0.1)"
                    }
                  }}
                >
                  <DeleteIcon />
                </IconButton>
              </span>
            </Tooltip>

            <Stack
              direction="row"
              alignItems="center"
              spacing={1}>
              {getAccountIcon(acc.type)}<Typography
                variant="subtitle1"
                fontWeight="bold">{acc.type || "Savings"} Account</Typography>
            </Stack>
            <Typography variant="body2" mt={1} ml={2}>
              A/C No: {acc.account_number}
            </Typography>
            <Typography variant="h6" fontWeight="bold" mt={1} ml={1}>
              ₹{" "}
              <CountUp
                end={Number(acc.balance || 0).toFixed(2)}
                duration={2}
                separator=","
                decimals={2}
              />
            </Typography>
            <Stack direction="row" spacing={1} mt={2}>
              <Button
                variant="contained"
                color="success"
                fullWidth onClick={() =>
                  handleOpenDeposit(acc)}>
                Deposit
              </Button>
              <Button
                variant="contained"
                color="error"
                fullWidth onClick={() =>
                  handleOpenWithdraw(acc)}>
                Withdraw
              </Button>
            </Stack>
          </Card>
        ))}

        {/* Create Account Card */}
        {accounts.length < 5 && (
          <Card sx={{
            flex: "1 1 300px",
            maxWidth: 220,
            maxHeight: 50,
            p: 3,
            borderRadius: 3,
            position: "relative",
            overflow: "hidden",
            background: "linear-gradient(135deg, #FFD700, #FFC107)",
            color: "#4E342E",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            textAlign: "center",
            cursor: "pointer",
            transition: "0.3s",
            boxShadow: "0 0 15px rgba(255, 215, 0, 0.6)",
            "&:hover": {
              transform: "scale(1.05)",
              boxShadow: "0 0 25px rgba(255, 215, 0, 0.9)"
            },
            "&::before": {
              content: '""',
              position: "absolute",
              top: 0,
              left: "-150%",
              width: "50%",
              height: "100%",
              background: "linear-gradient(120deg, transparent, rgba(255,255,255,0.6), transparent)",
              transform: "skewX(-25deg)",
              animation: "shimmer 3s infinite"
            }
          }}
            onClick={() => setOpenCreateDialog(true)}
          >
            <Typography variant="h6" fontWeight="bold" mb={2}>+ Create New Account</Typography>
            <Typography variant="body2">Max 5 accounts per user</Typography>
          </Card>

        )}
      </Grid>

      {/* Action Buttons: Transfer & PDF */}
      <Box display="flex" justifyContent="flex-start" gap={2} mb={4}>
        {/* Transfer Button */}
        <Button
          variant="contained"
          color="info"
          onClick={handleOpenTransfer}
        >
          Transfer Funds
        </Button>

        {/* PDF Download */}
        <Button
          sx={{
            bgcolor: "#8e24aa",
            "&:hover": { bgcolor: "#6a1b9a" }
          }}
          variant="contained"
          onClick={async () => {
            try {
              const res = await API.get(`/pdf/download-statement/`, { responseType: "blob" });
              const url = window.URL.createObjectURL(new Blob([res.data]));
              const link = document.createElement("a");
              link.href = url;
              link.setAttribute("download", "bank_statement.pdf");
              document.body.appendChild(link);
              link.click();
            } catch (err) {
              alert(err.response?.data?.message || "Failed to download statement");
            }
          }}
        >
          Download PDF Statement
        </Button>
      </Box>

      {/* Transactions */}
      {accounts.map(acc => {
        const accTransactions = transactions[acc.account_number] || [];
        const currentPage = transactionPages[acc.account_number] || 0;

        return (
          <Card key={acc.id} sx={{ bgcolor: "#fff3e0", color: "#e65100", p: 3, borderRadius: 3, mb: 4 }}>
            <Typography variant="h6" mb={2}>Recent Transactions (A/C {acc.account_number})</Typography>

            {accTransactions.length > 0 ? (
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow sx={{ bgcolor: "#ffe0b2" }}>
                      <TableCell>ID</TableCell>
                      <TableCell>Type</TableCell>
                      <TableCell>Amount</TableCell>
                      <TableCell>Date</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {accTransactions.map(txn => {
                      const type = txn.type.toLowerCase();
                      let IconComponent = null;
                      let iconColor = "";
                      let amountSign = "";
                      let amountColor = "";

                      if (type === "deposit") {
                        IconComponent = ArrowUpwardIcon;
                        iconColor = "green";
                        amountSign = "+";
                        amountColor = "green";
                      } else if (type === "withdraw" || type === "debit") {
                        IconComponent = ArrowDownwardIcon;
                        iconColor = "red";
                        amountSign = "-";
                        amountColor = "red";
                      } else if (type === "transfer") {
                        IconComponent = AutorenewIcon;
                        iconColor = "blue";
                        amountSign = "↻ ";
                        amountColor = "blue";
                      }

                      return (
                        <TableRow key={txn.id}>
                          <TableCell>{txn.id}</TableCell>
                          <TableCell>
                            <Stack direction="row" alignItems="center" spacing={1}>
                              <Chip
                                label={txn.type}
                                color={getTransactionColor(txn.type)}
                                size="small"
                                sx={{ fontWeight: "bold" }}
                              />
                              {IconComponent && <IconComponent sx={{ color: iconColor, fontSize: 18 }} />}
                            </Stack>
                          </TableCell>
                          <TableCell>
                            <Typography component="span" sx={{ color: amountColor, fontWeight: "bold" }}>
                              {amountSign}₹{txn.amount}
                            </Typography>
                          </TableCell>
                          <TableCell>{new Date(txn.created_at).toLocaleString()}</TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            ) : <Typography>No transactions for this account.</Typography>}

            {accTransactions.length >= TRANSACTIONS_LIMIT && (
              <Button
                variant="outlined"
                sx={{ mt: 2 }}
                onClick={() => fetchTransactions(acc.account_number, currentPage + 1)}
              >
                Load More
              </Button>
            )}
          </Card>
        );
      })}

      {/* DIALOG BOXES*/}
      {/* === CREATE ACCOUNT DIALOG === */}
      <Dialog
        open={openCreateDialog}
        onClose={handleCloseDialogs}
        aria-labelledby="create-account-dialog-title"
        keepMounted
        PaperProps={{
          sx: {
            borderRadius: 4,
            p: 2,
            background: "linear-gradient(135deg, #fff1c1, #ffe57f)",
            boxShadow: "0 8px 25px rgba(0,0,0,0.2)"
          }
        }}
      >
        <DialogTitle id="create-account-dialog-title" sx={{ fontWeight: "bold", color: "#4E342E" }}>
          Create New Account
        </DialogTitle>
        <DialogContent>
          <FormControl fullWidth sx={{ mt: 2 }}>
            <InputLabel>Account Type</InputLabel>
            <Select
              autoFocus
              value={accountType}
              label="Account Type"
              onChange={(e) => setAccountType(e.target.value)}
            >
              <MenuItem value="Savings">Savings Account</MenuItem>
              <MenuItem value="Current">Current Account</MenuItem>
              <MenuItem value="Fixed Deposit">Fixed Deposit</MenuItem>
              <MenuItem value="Joint">Joint Account</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialogs} color="secondary">Cancel</Button>
          <Button
            onClick={handleCreateAccount}
            variant="contained"
            sx={{
              background: "linear-gradient(135deg, #FFD700, #FFC107)",
              color: "#4E342E",
              fontWeight: "bold",
              "&:hover": { background: "linear-gradient(135deg, #FFC107, #FFB300)" }
            }}
          >
            Create
          </Button>
        </DialogActions>
      </Dialog>

      {/* === DEPOSIT DIALOG === */}
      <Dialog
        open={depositDialogOpen}
        onClose={handleCloseDialogs}
        aria-labelledby="deposit-dialog-title"
        keepMounted
        PaperProps={{
          sx: {
            borderRadius: 4,
            p: 2,
            background: "linear-gradient(135deg, #C8E6C9, #A5D6A7)",
            boxShadow: "0 8px 25px rgba(0,0,0,0.2)"
          }
        }}
      >
        <DialogTitle id="deposit-dialog-title" sx={{ fontWeight: "bold", color: "#2E7D32" }}>
          Deposit Money
        </DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Amount (₹)"
            type="number"
            fullWidth
            value={amountInput}
            onChange={(e) => setAmountInput(e.target.value)}
            sx={{ mt: 2, background: "#ffffffaa", borderRadius: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialogs} color="secondary">Cancel</Button>
          <Button
            onClick={handleDeposit}
            variant="contained"
            sx={{
              background: "linear-gradient(135deg, #66BB6A, #43A047)",
              color: "#ffffff",
              fontWeight: "bold",
              "&:hover": { background: "linear-gradient(135deg, #43A047, #388E3C)" }
            }}
          >
            Deposit
          </Button>
        </DialogActions>
      </Dialog>

      {/* === WITHDRAW DIALOG === */}
      <Dialog
        open={withdrawDialogOpen}
        onClose={handleCloseDialogs}
        aria-labelledby="withdraw-dialog-title"
        keepMounted
        PaperProps={{
          sx: {
            borderRadius: 4,
            p: 2,
            background: "linear-gradient(135deg, #FFCDD2, #EF9A9A)",
            boxShadow: "0 8px 25px rgba(0,0,0,0.2)"
          }
        }}
      >
        <DialogTitle id="withdraw-dialog-title" sx={{ fontWeight: "bold", color: "#C62828" }}>
          Withdraw Money
        </DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Amount (₹)"
            type="number"
            fullWidth
            value={amountInput}
            onChange={(e) => setAmountInput(e.target.value)}
            sx={{ mt: 2, background: "#ffffffaa", borderRadius: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialogs} color="secondary">Cancel</Button>
          <Button
            onClick={handleWithdraw}
            variant="contained"
            sx={{
              background: "linear-gradient(135deg, #E57373, #EF5350)",
              color: "#ffffff",
              fontWeight: "bold",
              "&:hover": { background: "linear-gradient(135deg, #EF5350, #E53935)" }
            }}
          >
            Withdraw
          </Button>
        </DialogActions>
      </Dialog>

      {/* === DELETE DIALOG === */}
      <Dialog
        open={deleteDialogOpen}
        onClose={handleCloseDialogs}
        aria-labelledby="delete-dialog-title"
        autoFocus
        keepMounted
      >
        <DialogTitle id="delete-dialog-title">Delete Account</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete account <b>{selectedAccount?.account_number}</b>? This cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialogs}>Cancel</Button>
          <Button onClick={handleDelete} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* === TRANSFER DIALOG === */}
      <Dialog
        open={transferDialogOpen}
        onClose={handleCloseDialogs}
        aria-labelledby="transfer-dialog-title"
        keepMounted
        PaperProps={{ sx: { borderRadius: 4, p: 2, background: "linear-gradient(135deg, #81D4FA, #4FC3F7)" } }}
      >
        <DialogTitle id="transfer-dialog-title" sx={{ fontWeight: "bold", color: "#01579B" }}>
          Transfer Funds
        </DialogTitle>
        <DialogContent>
          {/* From Account Dropdown */}
          <FormControl fullWidth sx={{ mt: 2 }}>
            <InputLabel>From Account</InputLabel>
            <Select
              autoFocus
              value={transferData.fromAccount}
              onChange={(e) => setTransferData({ ...transferData, fromAccount: e.target.value })}
            >
              {accounts.map(acc => (
                <MenuItem key={acc.account_number} value={acc.account_number}>
                  {acc.type} - {acc.account_number}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* To Account Input (any user’s account number) */}
          <FormControl fullWidth sx={{ mt: 2 }}>
            <TextField
              label="To Account Number"
              placeholder="Enter recipient account number"
              value={transferData.toAccount}
              onChange={(e) => setTransferData({ ...transferData, toAccount: e.target.value })}
              sx={{ background: "#ffffffaa", borderRadius: 2 }}
            />
          </FormControl>

          {/* Amount Input */}
          <TextField
            fullWidth
            label="Amount (₹)"
            type="number"
            sx={{ mt: 2, background: "#ffffffaa", borderRadius: 2 }}
            value={transferData.amount}
            onChange={(e) => setTransferData({ ...transferData, amount: e.target.value })}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialogs} color="secondary">Cancel</Button>
          <Button
            onClick={handleTransferSubmit}
            variant="contained"
            sx={{
              background: "linear-gradient(135deg, #0288D1, #0277BD)",
              color: "#ffffff",
              fontWeight: "bold",
              "&:hover": { background: "linear-gradient(135deg, #0277BD, #01579B)" }
            }}
          >
            Next
          </Button>
        </DialogActions>
      </Dialog>

      {/* === OTP DIALOG === */}
      <Dialog
        open={otpDialogOpen}
        onClose={handleCloseDialogs}
        aria-labelledby="otp-dialog-title"
        keepMounted
        PaperProps={{ sx: { borderRadius: 4, p: 2, background: "linear-gradient(135deg, #FFF59D, #FFEE58)" } }}
      >
        <DialogTitle id="otp-dialog-title" sx={{ fontWeight: "bold", color: "#F57F17" }}>
          Verify OTP
        </DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            fullWidth
            label="Enter OTP"
            type="text"
            sx={{ mt: 2, background: "#ffffffaa", borderRadius: 2 }}
            value={otpInput}
            onChange={(e) => setOtpInput(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialogs} color="secondary">Cancel</Button>
          <Button
            onClick={handleVerifyOtp}
            variant="contained"
            sx={{
              background: "linear-gradient(135deg, #FBC02D, #F9A825)",
              color: "#ffffff",
              fontWeight: "bold",
              "&:hover": { background: "linear-gradient(135deg, #F9A825, #F57F17)" }
            }}
          >
            Verify
          </Button>
        </DialogActions>
      </Dialog>
    </Box >
  );
}
