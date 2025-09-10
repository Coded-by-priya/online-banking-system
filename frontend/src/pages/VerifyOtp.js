import { useState, useContext, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import API from "../api/axios";
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Stack,
  InputAdornment,
} from "@mui/material";
import KeyIcon from "@mui/icons-material/Key";
import AccountBalanceIcon from "@mui/icons-material/AccountBalance";

export default function VerifyOtp() {
  const [otp, setOtp] = useState("");
  const location = useLocation();
  const navigate = useNavigate();
  const { login } = useContext(AuthContext);

  const { otpId, email, otp: backendOtp } = location.state || {};

  // If otpId or email is missing, redirect to login
  useEffect(() => {
    if (!otpId || !email) {
      alert("Missing OTP info. Please login again.");
      navigate("/", { replace: true });
      return;
    }

    if (backendOtp) {
      console.log("OTP received (auto-fill for testing):", backendOtp);
      setOtp(backendOtp); // Auto-fill OTP for testing
    }
  }, [otpId, email, backendOtp, navigate]);

  const handleVerify = async (e) => {
    e.preventDefault();
    console.log("Verifying OTP (user input or auto-fill):", otp); // Log OTP being sent
    try {
      const res = await API.post("/auth/verify-otp", { otpId, otp, email });

      if (res.data.user && res.data.token) {
        login(res.data.user, res.data.token);
        alert("Login successful!");

        const role = res.data.user.role?.toLowerCase();
        if (role === "admin") navigate("/admin");
        else navigate("/dashboard");
      } else {
        alert("Unexpected response format.");
      }
    } catch (err) {
      console.error("OTP Verify error:", err.response?.data || err.message);
      alert(err.response?.data?.message || "Invalid OTP");
    }
  };

  return (
    <Box
      sx={{
        height: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        background: "linear-gradient(135deg, #1E3C72 0%, #2A5298 100%)",
      }}
    >
      <Card sx={{ width: 400, borderRadius: 4, boxShadow: 6 }}>
        <CardContent sx={{ p: 4 }}>
          {/* Icon + Title */}
          <Stack
            direction="row"
            alignItems="center"
            spacing={1}
            justifyContent="center"
            sx={{ mb: 3 }}
          >
            <AccountBalanceIcon sx={{ fontSize: 40, color: "#1E3C72" }} />
            <Typography variant="h4" fontWeight="bold" color="#1E3C72">
              Verify OTP
            </Typography>
          </Stack>

          <form onSubmit={handleVerify}>
            <TextField
              fullWidth
              type="text"
              label="Enter OTP"
              variant="outlined"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              margin="normal"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <KeyIcon sx={{ color: "#1E3C72" }} />
                  </InputAdornment>
                ),
              }}
              required
            />

            <Button
              type="submit"
              variant="contained"
              fullWidth
              sx={{
                mt: 3,
                py: 1.5,
                bgcolor: "#1E3C72",
                "&:hover": { bgcolor: "#16325C" },
                fontWeight: "bold",
              }}
            >
              Verify
            </Button>
          </form>
        </CardContent>
      </Card>
    </Box>
  );
}
