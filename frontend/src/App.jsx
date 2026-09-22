import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ProtectedRoute from './components/ProtectedRoute';

import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import CitizenDashboard from './pages/CitizenDashboard';
import StaffDashboard from './pages/StaffDashboard';
import AdminDashboard from './pages/AdminDashboard';
import QueueDisplayBoard from './pages/QueueDisplayBoard';
import TicketView from './pages/TicketView';
import NotFound from './pages/NotFound';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* TV Display Board does not render header/footer */}
          <Route path="/display" element={<QueueDisplayBoard />} />

          {/* Standard Page Layout */}
          <Route
            path="*"
            element={
              <div className="app-container">
                <Navbar />
                <main className="main-content">
                  <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />
                    <Route path="/citizen" element={<CitizenDashboard />} />
                    
                    <Route
                      path="/staff"
                      element={
                        <ProtectedRoute allowedRoles={['staff', 'admin']}>
                          <StaffDashboard />
                        </ProtectedRoute>
                      }
                    />
                    
                    <Route
                      path="/admin"
                      element={
                        <ProtectedRoute allowedRoles={['admin']}>
                          <AdminDashboard />
                        </ProtectedRoute>
                      }
                    />

                    <Route path="/ticket/:ticketNumber" element={<TicketView />} />
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </main>
                <Footer />
              </div>
            }
          />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
