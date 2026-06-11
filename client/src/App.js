// src/App.js
import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import { AuthProvider } from "./context/AuthContext";
import { ProtectedRoute, ScrollToTop, SmoothScroll } from "./components/common";
import Navbar from "./components/layout/Navbar";
import Footer from "./components/layout/Footer";
import ErrorBoundary from "./components/common/ErrorBoundary";

// Pages (Lazy Loaded)
const Home = React.lazy(() => import("./pages/Home"));
const About = React.lazy(() => import("./pages/About"));
const EditorialBoard = React.lazy(() => import("./pages/EditorialBoard"));
const AuthorGuidelines = React.lazy(() => import("./pages/AuthorGuidelines"));
const CallForPapers = React.lazy(() => import("./pages/CallForPapers"));
const SubmitPaper = React.lazy(() => import("./pages/SubmitPaper"));
const Archives = React.lazy(() => import("./pages/Archives"));
const Contact = React.lazy(() => import("./pages/Contact"));
const Dashboard = React.lazy(() => import("./pages/Dashboard"));
const Login = React.lazy(() => import("./pages/auth/Login"));
const Register = React.lazy(() => import("./pages/auth/Register"));
const ForgotPassword = React.lazy(() => import("./pages/auth/ForgotPassword"));
const AdminPanel = React.lazy(() => import("./pages/admin/AdminPanel"));
const SiteContentPage = React.lazy(() => import("./pages/admin/SiteContentPage"));
const HeaderFooterLayoutEditor = React.lazy(() => import("./pages/admin/HeaderFooterLayoutEditor"));
const ReviewerPanel = React.lazy(() => import("./pages/ReviewerPanel"));
const EditorPanel = React.lazy(() => import("./pages/editor/EditorPanel"));

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
      <ScrollToTop />
      <SmoothScroll />
      <AuthProvider>
        <ErrorBoundary>
          <React.Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div></div>}>
          <Routes>
          {/* Auth pages — no Navbar */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />

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
          </React.Suspense>
        </ErrorBoundary>

        <ToastContainer position="top-right" autoClose={4000} hideProgressBar={false} />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
