import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './auth';
import { AnimatePresence } from 'framer-motion';
import Layout from './components/Layout';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import CreateGroup from './pages/CreateGroup';
import GroupDetails from './pages/GroupDetails';
import ExpenseDetails from './pages/ExpenseDetails';
import AddExpense from './pages/AddExpense';
import SettleUp from './pages/SettleUp';
import Analytics from './pages/Analytics';
import './index.css';

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="loading-page">
        <div className="spinner" />
        <div className="loading-text">Loading...</div>
      </div>
    );
  }
  if (!user) return <Navigate to="/login" />;
  return children;
}

function AppRoutes() {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Layout><Dashboard /></Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/groups/create"
          element={
            <ProtectedRoute>
              <Layout><CreateGroup /></Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/groups/:id"
          element={
            <ProtectedRoute>
              <Layout><GroupDetails /></Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/groups/:id/expenses/:expenseId"
          element={
            <ProtectedRoute>
              <Layout><ExpenseDetails /></Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/groups/:id/add-expense"
          element={
            <ProtectedRoute>
              <Layout><AddExpense /></Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/groups/:id/settle"
          element={
            <ProtectedRoute>
              <Layout><SettleUp /></Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/groups/:id/analytics"
          element={
            <ProtectedRoute>
              <Layout><Analytics /></Layout>
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </AnimatePresence>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <div className="app-bg" />
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
