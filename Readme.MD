# Online Banking System

A secure digital banking system simulation that allows users to register, authenticate, and manage financial accounts. Users can view balances, transfer funds, download statements, and manage personal information. Admins can manage accounts, monitor transactions, and ensure system reliability.

---

## **Table of Contents**

1. [Features](#features)  
2. [Tech Stack](#tech-stack)  
3. [Project Structure](#project-structure)  
4. [Installation](#installation)  
5. [Usage](#usage)

---

## **Features**

### **User Features**
- Register and login securely  
- View account balance and transaction history  
- Transfer funds between accounts  
- Deposit and withdraw funds  
- Download account statements as PDF  
- Responsive, user-friendly interface  

### **Admin Features**
- View all users and accounts  
- Monitor transactions and logs  
- Manage user accounts  

---

## **Tech Stack**

- **Frontend:** HTML, CSS, JavaScript, React (Fundamental)  
- **Backend:** Node.js, Express.js  
- **Database:** MySQL  
- **Others:** PDF generation for statements, Axios for API calls  

---

## **Project Structure**
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

## **Installation**

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

## **Usage**
- Register a new user or login with existing credentials.

- Navigate the dashboard to view balance, make transfers, or download PDFs.

- Admins can login via admin panel to manage users and monitor transactions.

- Credentials for user and admin :
    User : user@example.com || User123
    Admin : admin@example.com || Admin123

## **Author**
Made by Priyanshi Bilodiya

📫 bilodiyapriyanshhi26@gmail.com