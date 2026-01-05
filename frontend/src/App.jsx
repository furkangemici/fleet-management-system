import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';

// Pages
import Login from './pages/Login';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';
import Vehicles from './pages/Vehicles';
import Drivers from './pages/Drivers';
import Maintenance from './pages/Maintenance';
import Fines from './pages/Fines';
import Insurance from './pages/Insurance';
import Map from './pages/Map';
import Notifications from './pages/Notifications';

function App() {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#f7fafc'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '64px',
            height: '64px',
            border: '4px solid #e2e8f0',
            borderTopColor: '#667eea',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 16px'
          }}></div>
          <p style={{ color: '#718096' }}>Yükleniyor...</p>
        </div>
        <style>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route
          path="/login"
          element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <Login />}
        />
        <Route
          path="/forgot-password"
          element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <ForgotPassword />}
        />
        <Route
          path="/reset-password"
          element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <ResetPassword />}
        />

        {/* Protected Routes */}
        <Route
          path="/dashboard"
          element={isAuthenticated ? <Dashboard /> : <Navigate to="/login" replace />}
        />
        <Route
          path="/profile"
          element={isAuthenticated ? <Profile /> : <Navigate to="/login" replace />}
        />
        <Route
          path="/vehicles"
          element={isAuthenticated ? <Vehicles /> : <Navigate to="/login" replace />}
        />
        <Route
          path="/drivers"
          element={isAuthenticated ? <Drivers /> : <Navigate to="/login" replace />}
        />
        <Route
          path="/maintenance"
          element={isAuthenticated ? <Maintenance /> : <Navigate to="/login" replace />}
        />
        <Route
          path="/fines"
          element={isAuthenticated ? <Fines /> : <Navigate to="/login" replace />}
        />
        <Route
          path="/insurance"
          element={isAuthenticated ? <Insurance /> : <Navigate to="/login" replace />}
        />
        <Route
          path="/map"
          element={isAuthenticated ? <Map /> : <Navigate to="/login" replace />}
        />
        <Route
          path="/notifications"
          element={isAuthenticated ? <Notifications /> : <Navigate to="/login" replace />}
        />

        {/* Default Route */}
        <Route
          path="/"
          element={<Navigate to={isAuthenticated ? "/dashboard" : "/login"} replace />}
        />

        {/* 404 */}
        <Route
          path="*"
          element={
            <div style={{
              minHeight: '100vh',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: '#f7fafc'
            }}>
              <div style={{ textAlign: 'center' }}>
                <h1 style={{ fontSize: '72px', marginBottom: '16px' }}>404</h1>
                <p style={{ fontSize: '20px', color: '#718096', marginBottom: '24px' }}>
                  Sayfa bulunamadı
                </p>
                <a
                  href="/"
                  style={{
                    padding: '12px 24px',
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    color: 'white',
                    textDecoration: 'none',
                    borderRadius: '12px',
                    fontSize: '14px',
                    fontWeight: '600',
                    display: 'inline-block'
                  }}
                >
                  Ana Sayfaya Dön
                </a>
              </div>
            </div>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
