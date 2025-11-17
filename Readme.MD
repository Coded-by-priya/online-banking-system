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

## 👩‍💻 **Usage**

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
