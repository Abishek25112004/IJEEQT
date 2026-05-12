// src/App.js
import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import { AuthProvider } from "./context/AuthContext";
import { ProtectedRoute } from "./components/common";
import Navbar from "./components/layout/Navbar";
import Footer from "./components/layout/Footer";
import ErrorBoundary from "./components/common/ErrorBoundary";

// Pages
import Home from "./pages/Home";
import About from "./pages/About";
import EditorialBoard from "./pages/EditorialBoard";
import AuthorGuidelines from "./pages/AuthorGuidelines";
import CallForPapers from "./pages/CallForPapers";
import SubmitPaper from "./pages/SubmitPaper";
import Archives from "./pages/Archives";
import Contact from "./pages/Contact";
import Dashboard from "./pages/Dashboard";
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import AdminPanel from "./pages/admin/AdminPanel";
import SiteContentPage from "./pages/admin/SiteContentPage";
import HeaderFooterLayoutEditor from "./pages/admin/HeaderFooterLayoutEditor";
import ReviewerPanel from "./pages/ReviewerPanel";
import EditorPanel from "./pages/editor/EditorPanel";

// Layout wrapper for pages with Navbar + Footer
const Layout = ({ children }) => (
  <div className="min-h-screen flex flex-col">
    <Navbar />
    <main className="flex-1">{children}</main>
    <Footer />
  </div>
);

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ErrorBoundary>
          <Routes>
          {/* Auth pages — no Navbar */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Public pages */}
          <Route path="/" element={<Layout><Home /></Layout>} />
          <Route path="/about" element={<Layout><About /></Layout>} />
          <Route path="/editorial-board" element={<Layout><EditorialBoard /></Layout>} />
          <Route path="/author-guidelines" element={<Layout><AuthorGuidelines /></Layout>} />
          <Route path="/call-for-papers" element={<Layout><CallForPapers /></Layout>} />
          <Route path="/archives" element={<Layout><Archives /></Layout>} />
          <Route path="/contact" element={<Layout><Contact /></Layout>} />

          {/* Protected — any logged-in user */}
          <Route
            path="/submit-paper"
            element={
              <Layout>
                <ProtectedRoute>
                  <SubmitPaper />
                </ProtectedRoute>
              </Layout>
            }
          />
          <Route
            path="/dashboard"
            element={
              <Layout>
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              </Layout>
            }
          />

          {/* Admin / Editor only */}
          <Route
            path="/admin"
            element={
              <Layout>
                <ProtectedRoute requiredRole="admin">
                  <AdminPanel />
                </ProtectedRoute>
              </Layout>
            }
          />

          <Route
            path="/admin/header-layout"
            element={
              <Layout>
                <ProtectedRoute requiredRole="admin">
                  <HeaderFooterLayoutEditor />
                </ProtectedRoute>
              </Layout>
            }
          />

          <Route
            path="/editor"
            element={
              <Layout>
                <ProtectedRoute requiredRole="editor">
                  <EditorPanel />
                </ProtectedRoute>
              </Layout>
            }
          />

          {/* Admin / Manager only */}
          <Route
            path="/site-content"
            element={
              <Layout>
                <ProtectedRoute requiredRole={["admin", "manager"]}>
                  <SiteContentPage />
                </ProtectedRoute>
              </Layout>
            }
          />

          {/* Reviewer Panel */}
          <Route
            path="/reviewer"
            element={
              <Layout>
                <ProtectedRoute requiredRole="reviewer">
                  <ReviewerPanel />
                </ProtectedRoute>
              </Layout>
            }
          />

          {/* 404 */}
          <Route
            path="*"
            element={
              <Layout>
                <div className="max-w-lg mx-auto px-4 py-24 text-center">
                  <p className="text-6xl font-bold text-blue-200">404</p>
                  <h2 className="text-xl font-bold text-gray-800 mt-4">Page Not Found</h2>
                  <p className="text-gray-500 text-sm mt-2">The page you're looking for doesn't exist.</p>
                  <a href="/" className="mt-6 inline-block bg-blue-700 text-white px-5 py-2 rounded-lg text-sm hover:bg-blue-800">
                    Go to Home
                  </a>
                </div>
              </Layout>
            }
          />
        </Routes>
        </ErrorBoundary>

        <ToastContainer position="top-right" autoClose={4000} hideProgressBar={false} />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
