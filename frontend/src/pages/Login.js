import { useState, useContext } from "react";
import API from "../api/axios";
import { AuthContext } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import {
  Box, Card, CardContent, Typography, TextField,
  Button, Divider, Stack, InputAdornment, IconButton
} from "@mui/material";
import { Link as RouterLink } from "react-router-dom";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import LockIcon from "@mui/icons-material/Lock";
import AccountBalanceIcon from "@mui/icons-material/AccountBalance";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await API.post("/auth/login", { email, password });

      // OTP flow
      if (res.data.otpId) {
        console.log("OTP (for testing):", res.data.otp);
        navigate("/verify-otp", {
          state: { otpId: res.data.otpId, email, otp: res.data.otp }
        });
        alert("OTP sent to your email. Please verify.");
        return;
      }

      // Normal login
      if (res.data.user && res.data.token) {
        login(res.data.user, res.data.token); // update context

        // Navigate after context updated
        setTimeout(() => {
          if (res.data.user.role?.toLowerCase() === "admin") navigate("/admin");
          else navigate("/dashboard");
        }, 0);

        alert("Login successful!");
      } else {
        alert("Unexpected response. Please check backend API.");
      }
    } catch (err) {
      console.error("Login error:", err.response?.data || err.message);
      alert(err.response?.data?.message || "Login failed");
    }
  };

  return (
    <Box sx={{ height: "100vh", display: "flex", justifyContent: "center", alignItems: "center", background: "linear-gradient(135deg, #1E3C72 0%, #2A5298 100%)" }}>
      <Card sx={{ width: 400, borderRadius: 4, boxShadow: 6 }}>
        <CardContent sx={{ p: 4 }}>
          <Stack direction="row" alignItems="center" spacing={1} justifyContent="center" sx={{ mb: 3 }}>
            <AccountBalanceIcon sx={{ fontSize: 40, color: "#1E3C72" }} />
            <Typography variant="h4" fontWeight="bold" color="#1E3C72">ByteBank Ltd.</Typography>
          </Stack>

          <form onSubmit={handleLogin}>
            <TextField
              fullWidth type="email" label="Email" variant="outlined" value={email} onChange={(e) => setEmail(e.target.value)}
              margin="normal"
              InputProps={{ startAdornment: <AccountCircleIcon sx={{ mr: 1, color: "#1E3C72" }} /> }}
              required
            />

            <TextField
              fullWidth type={showPassword ? "text" : "password"} label="Password" variant="outlined" value={password} onChange={(e) => setPassword(e.target.value)}
              margin="normal"
              InputProps={{
                startAdornment: <LockIcon sx={{ mr: 1, color: "#1E3C72" }} />,
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={() => setShowPassword(prev => !prev)} edge="end">
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                )
              }}
              required
            />

            <Button type="submit" variant="contained" fullWidth sx={{ mt: 3, py: 1.5, bgcolor: "#1E3C72", "&:hover": { bgcolor: "#16325C" }, fontWeight: "bold" }}>
              Login
            </Button>
          </form>

          <Divider sx={{ my: 3 }} />

          <Typography variant="body2" textAlign="center" color="text.secondary">
            Don’t have an account?{" "}
            <RouterLink to="/register" style={{ color: "#1E3C72", textDecoration: "underline" }}>
              Register
            </RouterLink>
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
}
