# Modern Library Management System 📚

A comprehensive, full-stack Library Management System built to handle high-level university requirements. This platform bridges the gap between scalable high-performance backend databases and beautiful, responsive frontend interfaces.

## 🌟 Key Features

### 1. Dual-Role Authentication Framework
- **Student Portal:** Students can securely register, browse the active catalog, submit requests to borrow books, and monitor their active checkouts and fines.
- **Super-Admin Portal:** Librarians get total control over the database. They can view the total active student roster, approve/reject student book requests, edit catalog entries, manually document checkouts, and clear late fines.

### 2. High-Performance RESTful API
- Powered by **Node.js & Express.js**.
- Structured using robust MVC architecture (`Models`, `Controllers/Routes`, `Middlewares`).
- Security middleware utilizes **JSON Web Tokens (JWT)** and **Bcrypt hashing** to guarantee that data routes are highly secure and segmented by role.
- Dynamic query processing enabled for advanced sorting, pagination, and regex-powered searching.

### 3. NoSQL Database & Relationships
- Uses **MongoDB Atlas** remotely hosted for extreme stability.
- Schemas strictly enforced via **Mongoose**.
- Handles complex relational linking (e.g. associating specific `Books` with a `Student` via an `Issue` document utilizing `findById` populates).

### 4. "Silicon Valley" Premium User Interface
- Built completely from scratch using **React + Vite** and Vanilla CSS Grid/Flexbox variants.
- Deep integration of modern UI UX including Frosted Glass cards (Glassmorphism), dynamic React-Recharts data visualization, hover micro-interactions, and visual status badging.

---

## 🚀 Getting Started

Follow these steps to run the application perfectly on your local machine.

### Prerequisites
Make sure you have [Node.js](https://nodejs.org/en/) installed on your computer.

### 1. Set Up the Backend
1. Open a terminal and navigate to the backend folder:
   ```bash
   cd server
   ```
2. Install the necessary packages:
   ```bash
   npm install
   ```
3. Copy the `.env.example` to create an active environment file:
   Make sure you have a `server/.env` file with your `MONGODB_URI` and `JWT_SECRET` populated.
4. Start the backend Node server:
   ```bash
   npm run dev
   ```
   *Note: If no admin account exists, the server will **automatically create one** using `admin@library.com` and `admin123`.*

### 2. Set Up the Frontend
1. Open a **second, separate terminal** and navigate to the frontend folder:
   ```bash
   cd client
   ```
2. Install the React packages:
   ```bash
   npm install
   ```
3. Start the Vite React Engine:
   ```bash
   npm run dev
   ```

### 3. Access the Project
Your application is now live! 
Open your web browser and go to: **[http://localhost:5173](http://localhost:5173)**

**Test Credentials:**
- **Admin:** `admin@library.com` / `admin123`
- **Student:** Click "Register" on the main screen to create a brand new student!

---

## 🛠️ Technology Stack Breakdown
- **Frontend Engine:** React, Vite, React Router DOM, Axios, Recharts
- **Backend Architecture:** Node.js, Express.js
- **Database Engineering:** MongoDB Atlas, Mongoose ODM
- **Security Protocols:** JSON Web Tokens (JWT), Bcrypt, CORS, Morgan (Activity Logging)
