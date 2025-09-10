const express = require("express");
const {
  getAllUsers,
  createUser,
  updateUser,
  deleteUser,
  deactivateUser,
  activateUser,
  resetUserPassword,
  getAllAccounts,
  createAccount,
  updateAccount,
  deleteAccount,
  getAllTransactions
} = require("../controllers/adminController");

const protect = require("../middleware/authMiddleware");
const adminCheck = require("../middleware/adminMiddleware");

const router = express.Router();

// Protect all admin routes
router.use(protect, adminCheck);

// -------------------- USERS --------------------
router.get("/users", getAllUsers);
router.post("/users", createUser);
router.put("/users/:userId", updateUser);
router.delete("/users/:userId", deleteUser); 
router.put("/users/:userId/deactivate", deactivateUser);
router.put("/users/:userId/activate", activateUser);
router.put("/users/:userId/reset-password", resetUserPassword);

// -------------------- ACCOUNTS --------------------
router.get("/accounts", getAllAccounts);
router.post("/accounts", createAccount);
router.put("/accounts/:accountId", updateAccount);
router.delete("/accounts/:accountId", deleteAccount);

// -------------------- TRANSACTIONS --------------------
router.get("/transactions", getAllTransactions);
module.exports = router;
