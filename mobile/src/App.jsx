import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import { AuthProvider, useAuth } from './context/AuthContext';
import Settings from './components/Settings';
import { Toaster } from 'react-hot-toast';

import Login from './components/Login';
import Stock from './components/Stock';

function AppContent() {
  const { user, loading } = useAuth();

  if (loading) return <div className="d-flex justify-content-center mt-5">Cargando...</div>;

  return (
    <Router>
      <Routes>
        <Route path="/settings" element={<Settings />} />
        <Route path="/login" element={!user ? <Login /> : <Navigate to="/stock" replace />} />
        <Route path="/stock" element={user ? <Stock /> : <Navigate to="/login" replace />} />
        <Route path="/" element={<Navigate to={user ? "/stock" : "/login"} replace />} />
      </Routes>
    </Router>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
      <Toaster position="top-right" />
    </AuthProvider>
  );
}

export default App;
