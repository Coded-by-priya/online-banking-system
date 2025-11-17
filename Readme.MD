# Online Banking System

A secure digital banking system simulation that allows users to register, authenticate, and manage financial accounts. Users can view balances, transfer funds, download statements, and manage personal information. Admins can manage accounts, monitor transactions, and ensure system reliability.

---


## ✨ **Features**

### User Features  
- User registration and secure login  
- View account balance & transaction history  
- Transfer funds between accounts  
- Deposit and withdraw funds  
- Download account statements as a PDF  

### Admin Features  
- View all user accounts  
- Monitor transactions  
- Manage user account status
---

## 🛠 **Tech Stack**

- **Frontend**: React (JavaScript), HTML, CSS  
- **Backend**: Node.js, Express.js  
- **Database**: MySQL  
- **Utilities**: Axios (for API calls), PDF generation for statements  
- **Auth / Security**: JWT , OTP / email  
- **Tools**:Postman, VS Code, Git & GitHub

---


## 📁 **Project Structure**
```
online-banking-system/
│
├─ backend/
│  ├─ config/
│  │   └─ db.js                   # Database connection setup
│  │
│  ├─ controllers/
│  │   ├─ accountControllers.js
│  │   ├─ adminControllers.js
│  │   ├─ authControllers.js
│  │   ├─ pdfControllers.js
│  │   └─ transactionControllers.js
│  │
│  ├─ middleware/
│  │   ├─ adminMiddleware.js
│  │   └─ authMiddleware.js
│  │
│  ├─ models/
│  │   ├─ Account.js
│  │   ├─ Otp.js
│  │   ├─ Transaction.js
│  │   └─ User.js
│  │
│  ├─ routes/
│  │   ├─ accountRoutes.js
│  │   ├─ adminRoutes.js
│  │   ├─ authRoutes.js
│  │   ├─ pdfRoutes.js
│  │   └─ transactionRoutes.js
│  │
│  ├─ utils/
│  │   ├─ email.js
│  │   ├─ generateToken.js
│  │   └─ smsService.js
│  │
│  └─ server.js                   # Entry point for backend
│
├─ frontend/
│  └─ src/
│      ├─ api/
│      │   └─ axios.js            # Axios setup for API calls
│      │
│      ├─ context/
│      │   └─ AuthContext.js      # Authentication context
│      │
│      └─ pages/
│          ├─ AdminPanel.js
│          ├─ Dashboard.js
│          ├─ Login.js
│          ├─ Register.js
│          └─ VerifyOtp.js
│
├─ README.md
└─ .gitignore
```

---

## 📡 **API Endpoints**

- POST /api/auth/register		
    Register a new user with credentials.

- POST /api/auth/login		
    Log in user / generate session or JWT.

- GET /api/users/:userId		
    Get user profile details.

- GET /api/accounts		
    List all bank accounts for the authenticated user.

- GET /api/accounts/:accountId		
    Get a specific account’s details (balance, account type, etc.).

- POST /api/accounts/create		
    Create a new bank account for the user.

- GET /api/transactions		
    Fetch all transactions related to the user.

- POST /api/transactions/transfer		
    Transfer money from one account to another.

- GET /api/statements/:accountId		
    Download or generate statement (PDF) for a particular account.

- GET /api/admin/users		
    (If admin route) Get list of all users.

- GET /api/admin/transactions		
    (If admin) View all transactions across users.

---

## ⚙️ **Installation**

1. Clone the repository:  
```bash
git clone https://github.com/yourusername/online-banking-system.git
```
2. Backend Setup:
```bash
cd backend
npm install
# Setup MySQL database and update config/db.js
node server.js
```

3. Frontend Setup:
```bash
cd frontend
npm install
npm start
```
---

## 📘 **App Usage Instructions**

- Once backend and frontend are running:

    - Open http://localhost:3000 (or your frontend port)

    - Register as a new user → Login → Explore dashboard

    - As a user: create account, transfer money, download statements

    - For admin panel: login as admin to view/manage users & transactions

- Testing Credentials for user and admin :
    - User : user@example.com || User123

    - Admin : admin@example.com || Admin123

---

## 📸 **Screenshots / Demo**

![Login/Register page](https://github.com/Coded-by-priya/online-banking-system/blob/main/screenshot/Login-Register.png?raw=true)

![User Dashboard](https://github.com/Coded-by-priya/online-banking-system/blob/main/screenshot/User-dashboard.png?raw=true)

![Admin Panel](https://github.com/Coded-by-priya/online-banking-system/blob/main/screenshot/Admin-panel.png?raw=true)

---

## 🎓 What I Learned

- Built REST APIs with Express and modular routes/controllers

- Integrated Node.js backend with MySQL for relational data

- Handled transactions and business logic (balance checks, transfers)

- Generated downloadable bank statements in PDF format

- Implemented basic authentication and error handling

- Structured code with clear separation of concerns

---

## 🎯 **Future Enhancements**

- Add role-based access (e.g., more admin functionality)

- Add two-factor authentication (2FA)

- Support multiple currencies

- Real-time notifications on transaction events

- Deploy backend & frontend to cloud (Heroku / Render / Vercel)

- Unit + Integration tests

---

✉️ Contact
```
Author: Priyanshi Bilodiya
Email: your-email@example.com
```
