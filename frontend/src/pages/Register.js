import { useState } from "react";
import API from "../api/axios";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Divider,
  Link,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Stack,
  InputAdornment,
  IconButton,
} from "@mui/material";
import PersonIcon from "@mui/icons-material/Person";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import LockIcon from "@mui/icons-material/Lock";
import AccountBalanceIcon from "@mui/icons-material/AccountBalance";
import PhoneIcon from "@mui/icons-material/Phone";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";

export default function Register() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState(""); // New state for phone
  const [role, setRole] = useState("user");
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      // Include phone in the request
      const res = await API.post("/auth/register", { name, email, password, phone, role });
      alert(res.data.message || "Registered successfully!");
      navigate("/");
    } catch (err) {
      alert(err.response?.data?.message || "Registration failed");
    }
  };

  const handleTogglePassword = () => setShowPassword((prev) => !prev);

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
          <Stack direction="row" alignItems="center" spacing={1} justifyContent="center" sx={{ mb: 3 }}>
            <AccountBalanceIcon sx={{ fontSize: 40, color: "#1E3C72" }} />
            <Typography variant="h4" fontWeight="bold" color="#1E3C72">
              Create Account
            </Typography>
          </Stack>

          <form onSubmit={handleRegister}>
            <TextField
              fullWidth
              type="text"
              label="Full Name"
              variant="outlined"
              value={name}
              onChange={(e) => setName(e.target.value)}
              margin="normal"
              InputProps={{ startAdornment: <PersonIcon sx={{ mr: 1, color: "#1E3C72" }} /> }}
              required
            />

            <TextField
              fullWidth
              type="email"
              label="Email"
              variant="outlined"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              margin="normal"
              InputProps={{ startAdornment: <AccountCircleIcon sx={{ mr: 1, color: "#1E3C72" }} /> }}
              required
            />

            <TextField
              fullWidth
              type="tel"
              label="Phone Number"
              variant="outlined"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              margin="normal"
              InputProps={{ startAdornment: <PhoneIcon sx={{ mr: 1, color: "#1E3C72" }} /> }}
              required
            />

            <TextField
              fullWidth
              type={showPassword ? "text" : "password"}
              label="Password"
              variant="outlined"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              margin="normal"
              InputProps={{
                startAdornment: <LockIcon sx={{ mr: 1, color: "#1E3C72" }} />,
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={handleTogglePassword} edge="end">
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              required
            />

            {/* Fixed dropdown */}
            <FormControl fullWidth margin="normal">
              <InputLabel id="role-label">Role</InputLabel>
              <Select labelId="role-label" value={role} onChange={(e) => setRole(e.target.value)}>
                <MenuItem value="user">User</MenuItem>
              </Select>
            </FormControl>

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
              Register
            </Button>
          </form>

          <Divider sx={{ my: 3 }} />

          <Typography variant="body2" textAlign="center" color="text.secondary">
            Already have an account?{" "}
            <Link href="/" underline="hover" color="#1E3C72">
              Login
            </Link>
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
}
