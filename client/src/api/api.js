import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

const API = axios.create({
  baseURL: API_BASE_URL,
});

API.interceptors.request.use((req) => {
  if (localStorage.getItem('token')) {
    req.headers.Authorization = `Bearer ${localStorage.getItem('token')}`;
  }
  return req;
});

// ── Auth API ──────────────────────────────────────────────
export const loginAdmin = (credentials) => API.post('/auth/login', credentials);
export const loginStudent = (credentials) => API.post('/auth/student/login', credentials);
export const registerStudent = (data) => API.post('/auth/student/register', data);
export const verifyAuth = () => API.get('/auth/verify');

// ── Admin API calls ─────────────────────────────────────────
export const getAllStudents = () => API.get('/students');

// ── Payment API ───────────────────────────────────────────
export const createCheckoutSession = (issueId) => API.post('/payment/create-checkout-session', { issueId });
export const resolvePaymentSuccess = (issueId) => API.post('/payment/resolve-success', { issueId });

// ── Book API ──────────────────────────────────────────────
export const getAllBooks = ({ search = '', availability = '', page = 1, limit = 10 } = {}) =>
  API.get('/books', { params: { search, availability, page, limit } });
export const getBookById = (id) => API.get(`/books/${id}`);
export const addBook = (bookData) => API.post('/books', bookData);
export const updateBook = (id, bookData) => API.put(`/books/${id}`, bookData);
export const deleteBook = (id) => API.delete(`/books/${id}`);
export const uploadPdf = (formData) => API.post('/books/upload', formData, { headers: { 'Content-Type': 'multipart/form-data' } });

// ── Issue API ─────────────────────────────────────────────
// Admin Actions
export const issueBook = (issueData) => API.post('/issue', issueData);
export const handleIssueAction = (id, action) => API.put(`/status/${id}`, { action });

// ── Payment API ───────────────────────────────────────────
export const payFine = (issueId) => API.post(`/payment/create-checkout-session`, { issueId });
export const getAllIssued = () => API.get('/issued');

// Student Actions
export const requestBook = (bookId) => API.post('/request', { bookId });
export const getMyIssuedBooks = () => API.get('/issued/me');
