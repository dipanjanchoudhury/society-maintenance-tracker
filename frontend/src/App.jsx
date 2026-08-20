import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link, useNavigate } from 'react-router-dom';
import { authService } from './services/api';
import Login from './pages/Login';
import Register from './pages/Register';
import ResidentDashboard from './pages/ResidentDashboard';
import AdminDashboard from './pages/AdminDashboard';
import NoticeBoard from './pages/NoticeBoard';
import { LayoutDashboard, FileText, Settings, LogOut, Wrench } from 'lucide-react';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchUser = async () => {
    try {
      const token = localStorage.getItem('token');
      if (token) {
        const userData = await authService.getCurrentUser();
        setUser(userData);
      } else {
        setUser(null);
      }
    } catch (err) {
      console.error("Failed to load user info", err);
      localStorage.removeItem('token');
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUser();
  }, []);

  const handleLogout = () => {
    authService.logout();
    setUser(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          <p className="mt-4 text-gray-600 font-medium">Loading Society Tracker...</p>
        </div>
      </div>
    );
  }

  return (
    <Router>
      <Routes>
        <Route 
          path="/login" 
          element={user ? <Navigate to="/" replace /> : <Login onLoginSuccess={fetchUser} />} 
        />
        <Route 
          path="/register" 
          element={user ? <Navigate to="/" replace /> : <Register onRegisterSuccess={fetchUser} />} 
        />
        <Route
          path="/*"
          element={
            user ? (
              <Layout user={user} onLogout={handleLogout}>
                <Routes>
                  <Route 
                    path="/" 
                    element={user.role === 'admin' ? <AdminDashboard /> : <ResidentDashboard />} 
                  />
                  <Route path="/notices" element={<NoticeBoard user={user} />} />
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </Layout>
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
      </Routes>
    </Router>
  );
}

// Global layout wrapper with sidebar and header
function Layout({ children, user, onLogout }) {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-gray-100">
      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-gray-900 text-white flex flex-col shadow-md">
        <div className="p-5 flex items-center gap-3 border-b border-gray-800">
          <Wrench className="h-6 w-6 text-primary-400" />
          <span className="font-bold text-lg tracking-wider">Society Tracker</span>
        </div>
        
        {/* User Card */}
        <div className="p-4 bg-gray-800 border-b border-gray-700">
          <p className="font-semibold text-sm truncate">{user.full_name}</p>
          <div className="flex justify-between items-center mt-1">
            <span className="text-xs text-gray-400 bg-gray-900 px-2 py-0.5 rounded uppercase font-medium">
              {user.role}
            </span>
            {user.unit_number && (
              <span className="text-xs text-gray-400">
                Unit: {user.unit_number}
              </span>
            )}
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 p-4 space-y-1">
          <Link 
            to="/" 
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-800 transition text-gray-300 hover:text-white"
          >
            <LayoutDashboard className="h-5 w-5 text-gray-400" />
            <span>Dashboard</span>
          </Link>
          <Link 
            to="/notices" 
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-800 transition text-gray-300 hover:text-white"
          >
            <FileText className="h-5 w-5 text-gray-400" />
            <span>Notice Board</span>
          </Link>
        </nav>

        {/* Footer Logout */}
        <div className="p-4 border-t border-gray-800">
          <button 
            onClick={() => {
              onLogout();
              navigate('/login');
            }}
            className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-red-400 hover:bg-red-950/30 hover:text-red-300 transition"
          >
            <LogOut className="h-5 w-5" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-h-0 overflow-y-auto">
        <header className="bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center shadow-sm">
          <h1 className="text-xl font-bold text-gray-800">Society Maintenance System</h1>
          <span className="text-sm text-gray-500 hidden sm:inline">
            Logged in as {user.email}
          </span>
        </header>
        <div className="p-6 max-w-7xl w-full mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}

export default App;
