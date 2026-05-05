// src/services/api.js
// Centralized Axios instance — auto-attaches Firebase ID token to every request

import axios from "axios";
import { auth } from "./firebase";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000/api";

const api = axios.create({
  baseURL: API_URL,
  timeout: 60000, // Increased to 1 minute (60000ms)
});

// Request interceptor — attach Firebase ID token
api.interceptors.request.use(
  async (config) => {
    const user = auth.currentUser;
    if (user) {
      const token = await user.getIdToken();
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor — normalize errors
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const message =
      error.response?.data?.error ||
      error.response?.data?.message ||
      error.message ||
      "An unexpected error occurred";
    return Promise.reject(new Error(message));
  }
);

// ─── Auth ─────────────────────────────────────────────────────────────────────
export const authAPI = {
  register: (data) => api.post("/auth/register", data),
  getProfile: () => api.get("/auth/profile"),
  updateProfile: (data) => api.put("/auth/profile", data),
  sendOtp: (email) => api.post("/auth/send-otp", { email }),
  verifyOtp: (email, otp) => api.post("/auth/verify-otp", { email, otp }),
};

// ─── Papers ───────────────────────────────────────────────────────────────────
export const papersAPI = {
  submit: (formData) =>
    api.post("/papers/submit", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
  getAll: (params) => api.get("/papers", { params }),
  getPublished: (params) => api.get("/papers/published", { params }),
  getById: (id) => api.get(`/papers/${id}`),
  updateStatus: (id, data) => api.patch(`/papers/${id}/status`, data),
  assignReviewer: (id, reviewerId) =>
    api.patch(`/papers/${id}/assign-reviewer`, { reviewerId }),
  delete: (id) => api.delete(`/papers/${id}`),
};

// ─── Reviews ──────────────────────────────────────────────────────────────────
export const reviewsAPI = {
  add: (data) => api.post("/reviews", data),
  getForPaper: (paperId) => api.get(`/reviews/paper/${paperId}`),
  toggleVisibility: (id, isVisible) =>
    api.patch(`/reviews/${id}/visibility`, { isVisible }),
};

// ─── Reviewer Panel ───────────────────────────────────────────────────────────
export const reviewerAPI = {
  getProfile: () => api.get("/reviewer/profile"),
  saveProfile: (data) => api.post("/reviewer/profile", data),
  getAssignments: () => api.get("/reviewer/assignments"),
  respondToAssignment: (id, status) => api.patch(`/reviewer/assignments/${id}`, { status }),
  submitReview: (data) => api.post("/reviewer/review", data),
  getMyReviews: () => api.get("/reviewer/reviews"),
};

// ─── Admin ────────────────────────────────────────────────────────────────────
export const adminAPI = {
  getStats: () => api.get("/admin/stats"),
  getUsers: () => api.get("/admin/users"),
  getReviewers: () => api.get("/admin/reviewers"),
  getReviewerProfiles: () => api.get("/admin/reviewer-profiles"),
  getReviewAssignments: () => api.get("/admin/review-assignments"),
  getSubmittedReviews: () => api.get("/admin/submitted-reviews"),
  updateUserRole: (uid, roles) => api.patch(`/admin/users/${uid}/role`, { roles }),
  deleteUser: (uid) => api.delete(`/admin/users/${uid}`),
};

// ─── Payments ─────────────────────────────────────────────────────────────────
export const paymentsAPI = {
  createOrder: (data) => api.post("/payments/create-order", data),
  verify: (data) => api.post("/payments/verify", data),
  getMyPayments: () => api.get("/payments/my-payments"),
};
// ─── Contact ───────────────────────────────────────────────────────────────────
export const contactAPI = {
  submitForm: (data) => api.post("/contact", data),
};

// ─── Site Content ─────────────────────────────────────────────────────────────
export const contentAPI = {
  getContent: (key) => api.get(`/content/${key}`),
  updateContent: (key, value) => api.put(`/content/${key}`, { value }),
};

export default api;
