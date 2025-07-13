import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { BluetoothProvider } from './contexts/BluetoothContext';
import { NotesProvider } from './contexts/NotesContext';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import NotePage from './pages/NotePage';
import Settings from './pages/Settings';
import './App.css';

function App() {
  return (
    <AuthProvider>
      <BluetoothProvider>
        <NotesProvider>
          <Router>
            <div className="App min-h-screen bg-gray-50">
              <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/dashboard" element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                } />
                <Route path="/note/:id" element={
                  <ProtectedRoute>
                    <NotePage />
                  </ProtectedRoute>
                } />
                <Route path="/settings" element={
                  <ProtectedRoute>
                    <Settings />
                  </ProtectedRoute>
                } />
                <Route path="/" element={<Navigate to="/dashboard" />} />
              </Routes>
            </div>
          </Router>
        </NotesProvider>
      </BluetoothProvider>
    </AuthProvider>
  );
}

export default App;