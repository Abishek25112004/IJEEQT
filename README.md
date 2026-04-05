# 📚 International Research Journal — Full Stack App

An IEEE-style peer-reviewed journal platform built with **React + Tailwind**, **Node.js + Express**, **Firebase**, and **Razorpay**.

---

## 🏗️ Project Structure

```
journal-app/
├── client/               ← React frontend
│   ├── public/
│   └── src/
│       ├── components/
│       │   ├── common/   ← Reusable UI (Badge, Card, Spinner, etc.)
│       │   └── layout/   ← Navbar, Footer
│       ├── context/      ← AuthContext (Firebase Auth + Firestore)
│       ├── pages/
│       │   ├── auth/     ← Login, Register
│       │   ├── admin/    ← AdminPanel
│       │   ├── Home, About, EditorialBoard, AuthorGuidelines
│       │   ├── CallForPapers, SubmitPaper, Archives
│       │   ├── CurrentIssue, Contact, Dashboard
│       └── services/     ← firebase.js, api.js (Axios)
│
└── server/               ← Node.js + Express backend
    ├── config/           ← firebase.js (Admin SDK)
    ├── controllers/      ← auth, papers, reviews, admin, payments
    ├── middleware/        ← auth.js (verifyToken, requireRole), errorHandler.js
    └── routes/           ← auth, papers, reviews, admin, payments
```

---

## ⚙️ Step 1 — Firebase Setup

### 1.1 Create a Firebase Project

1. Go to [https://console.firebase.google.com](https://console.firebase.google.com)
2. Click **Add project** → name it (e.g. `journal-app`)
3. Disable Google Analytics (optional)

### 1.2 Enable Authentication

1. In Firebase Console → **Authentication** → **Sign-in method**
2. Enable **Email/Password**

### 1.3 Create Firestore Database

1. **Firestore Database** → **Create database**
2. Choose **Production mode**
3. Select a region (e.g. `asia-south1` for India)

**Firestore Security Rules** (paste in Rules tab):
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can read their own profile; admins can read all
    match /users/{userId} {
      allow read: if request.auth != null && 
        (request.auth.uid == userId || 
         get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role in ['admin','editor']);
      allow write: if request.auth != null && request.auth.uid == userId;
    }
    // Papers: authors can create; read/update governed by backend
    match /papers/{paperId} {
      allow read: if resource.data.status == 'published' || request.auth != null;
      allow create: if request.auth != null;
      allow update, delete: if request.auth != null;
    }
    // Reviews: authenticated users
    match /reviews/{reviewId} {
      allow read, write: if request.auth != null;
    }
    // Payments: owner can read their own
    match /payments/{paymentId} {
      allow read: if request.auth != null && 
        resource.data.userId == request.auth.uid;
      allow create: if request.auth != null;
      allow update: if request.auth != null;
    }
  }
}
```

### 1.4 Enable Firebase Storage

1. **Storage** → **Get started** → Production mode
2. Choose same region as Firestore

**Storage Security Rules**:
```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /papers/{allPaths=**} {
      allow read: if true;
      allow write: if request.auth != null 
        && request.resource.size < 10 * 1024 * 1024
        && request.resource.contentType == 'application/pdf';
    }
  }
}
```

### 1.5 Get Client SDK Config

1. **Project Settings** → **General** → scroll to **Your apps**
2. Click **</>** (Web) → Register app
3. Copy the `firebaseConfig` object → use values in `client/.env`

### 1.6 Get Admin SDK Credentials (for backend)

1. **Project Settings** → **Service accounts**
2. Click **Generate new private key** → download JSON
3. Copy values to `server/.env`:
   - `FIREBASE_PROJECT_ID` = `project_id`
   - `FIREBASE_CLIENT_EMAIL` = `client_email`
   - `FIREBASE_PRIVATE_KEY` = `private_key` (keep the `\n` escapes)
   - `FIREBASE_STORAGE_BUCKET` = `storageBucket` (from client config)

---

## 💳 Step 2 — Razorpay Setup

1. Sign up at [https://razorpay.com](https://razorpay.com)
2. Go to **Settings** → **API Keys** → **Generate Test Key**
3. Copy `Key ID` and `Key Secret` to `server/.env`

> Use **Test Mode** keys during development — no real charges are made.

---

## 🚀 Step 3 — Running the Project

### 3.1 Backend

```bash
cd server
cp .env.example .env
# Fill in your Firebase and Razorpay credentials in .env

npm install
npm run dev
# Server starts at http://localhost:5000
```

### 3.2 Frontend

```bash
cd client
cp .env.example .env
# Fill in your Firebase client SDK config in .env

npm install
npm start
# App starts at http://localhost:3000
```

---

## 👤 Creating the First Admin User

1. Register a new account via `/register`
2. In **Firebase Console → Firestore → users** collection
3. Find your user document (by UID)
4. Change `role` field from `"author"` to `"admin"`
5. Refresh the app — Admin Panel link will appear

---

## 📡 API Reference

| Method | Endpoint                          | Auth         | Description                  |
|--------|-----------------------------------|--------------|------------------------------|
| POST   | /api/auth/register                | Public       | Register new user            |
| GET    | /api/auth/profile                 | User         | Get own profile              |
| PUT    | /api/auth/profile                 | User         | Update profile               |
| POST   | /api/papers/submit                | User         | Submit paper (PDF upload)    |
| GET    | /api/papers                       | User         | Get papers (role-filtered)   |
| GET    | /api/papers/published             | Public       | Get all published papers     |
| GET    | /api/papers/:id                   | User         | Get paper by ID              |
| PATCH  | /api/papers/:id/status            | Admin/Editor | Update paper status          |
| PATCH  | /api/papers/:id/assign-reviewer   | Admin/Editor | Assign reviewer              |
| DELETE | /api/papers/:id                   | Owner/Admin  | Delete paper                 |
| POST   | /api/reviews                      | Reviewer     | Submit review                |
| GET    | /api/reviews/paper/:paperId       | Authorized   | Get reviews for a paper      |
| PATCH  | /api/reviews/:id/visibility       | Admin/Editor | Toggle review visibility     |
| GET    | /api/admin/stats                  | Admin        | Dashboard statistics         |
| GET    | /api/admin/users                  | Admin        | All users                    |
| GET    | /api/admin/reviewers              | Admin/Editor | Reviewer list                |
| PATCH  | /api/admin/users/:uid/role        | Admin        | Change user role             |
| DELETE | /api/admin/users/:uid             | Admin        | Delete user                  |
| POST   | /api/payments/create-order        | User         | Create Razorpay order        |
| POST   | /api/payments/verify              | User         | Verify payment               |
| GET    | /api/payments/my-payments         | User         | Payment history              |

---

## 🔄 Paper Workflow

```
submitted → under_review → accepted → published
                        ↘ revision_required → (resubmit)
                        ↘ rejected
```

---

## 🧰 Tech Stack Summary

| Layer      | Technology                          |
|------------|-------------------------------------|
| Frontend   | React 18, React Router 6, Tailwind  |
| Backend    | Node.js, Express 4                  |
| Auth       | Firebase Authentication             |
| Database   | Cloud Firestore                     |
| Storage    | Firebase Storage                    |
| Payments   | Razorpay                            |
| Validation | express-validator                   |

---

## 🔐 Environment Variables

### server/.env
```
PORT=5000
NODE_ENV=development
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your_project.iam.gserviceaccount.com
FIREBASE_STORAGE_BUCKET=your_project.appspot.com
JWT_SECRET=your_strong_random_secret
RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxx
RAZORPAY_SECRET=your_razorpay_secret
CLIENT_URL=http://localhost:3000
```

### client/.env
```
REACT_APP_FIREBASE_API_KEY=AIzaSy...
REACT_APP_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=your_project_id
REACT_APP_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=123456789
REACT_APP_FIREBASE_APP_ID=1:123456789:web:abc123
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_JOURNAL_NAME=International Journal of Advanced Research in Technology
REACT_APP_JOURNAL_ABBR=IJART
```
