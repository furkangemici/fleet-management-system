import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import Icons from './Icons';
import Toast from './Toast';

function Layout({ children }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const { isConnected, unreadCount, toasts, removeToast } = useSocket();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const menuItems = [
    { path: '/dashboard', icon: <Icons.Dashboard />, label: 'Dashboard' },
    { path: '/vehicles', icon: <Icons.Vehicle />, label: 'Araçlar' },
    { path: '/drivers', icon: <Icons.Driver />, label: 'Sürücüler' },
    { path: '/maintenance', icon: <Icons.Maintenance />, label: 'Bakım' },
    { path: '/fines', icon: <Icons.Fine />, label: 'Cezalar' },
    { path: '/insurance', icon: <Icons.Insurance />, label: 'Sigorta & Kasko' },
    { path: '/map', icon: <Icons.Map />, label: 'Harita' },
    { path: '/notifications', icon: <Icons.Notification />, label: 'Bildirimler' }
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f8f9fa' }}>
      {/* Sidebar */}
      <aside style={{
        width: sidebarOpen ? '260px' : '80px',
        background: 'linear-gradient(180deg, #1e3a8a 0%, #1e40af 100%)',
        color: 'white',
        transition: 'width 0.3s',
        position: 'fixed',
        height: '100vh',
        zIndex: 1000,
        display: 'flex',
        flexDirection: 'column'
      }}>
        {/* Logo */}
        <div style={{
          padding: '24px',
          borderBottom: '1px solid rgba(255,255,255,0.1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          {sidebarOpen && (
            <div>
              <h1 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '4px' }}>
                Reeder Fleet
              </h1>
              <p style={{ fontSize: '12px', opacity: 0.8 }}>Filo Yönetim Sistemi</p>
            </div>
          )}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            style={{
              background: 'rgba(255,255,255,0.1)',
              border: 'none',
              color: 'white',
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 0
            }}
          >
            {sidebarOpen ? <Icons.ChevronLeft /> : <Icons.ChevronRight />}
          </button>
        </div>

        {/* Menu Items */}
        <nav style={{ padding: '16px 12px', flex: 1, overflowY: 'auto' }}>
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  marginBottom: '8px',
                  background: isActive ? 'rgba(255,255,255,0.15)' : 'transparent',
                  border: 'none',
                  borderRadius: '8px',
                  color: 'white',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  fontSize: '14px',
                  fontWeight: isActive ? '600' : '400',
                  transition: 'all 0.2s',
                  textAlign: 'left',
                  justifyContent: sidebarOpen ? 'flex-start' : 'center'
                }}
                onMouseEnter={(e) => {
                  if (!isActive) e.target.style.background = 'rgba(255,255,255,0.08)';
                }}
                onMouseLeave={(e) => {
                  if (!isActive) e.target.style.background = 'transparent';
                }}
              >
                <span style={{ fontSize: '20px', display: 'flex' }}>{item.icon}</span>
                {sidebarOpen && <span>{item.label}</span>}
              </button>
            );
          })}
        </nav>
        
        {/* Logout Button (Bottom Sidebar) */}
        <div style={{ padding: '16px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
          <button
            onClick={handleLogout}
            style={{
              width: '100%',
              padding: '12px 16px',
              background: 'rgba(220, 38, 38, 0.2)', // Kırmızı transparan
              border: '1px solid rgba(220, 38, 38, 0.3)',
              borderRadius: '8px',
              color: '#fecaca', // Açık kırmızı
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              fontSize: '14px',
              fontWeight: '600',
              transition: 'all 0.2s',
              justifyContent: sidebarOpen ? 'flex-start' : 'center'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(220, 38, 38, 0.3)';
              e.currentTarget.style.color = 'white';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(220, 38, 38, 0.2)';
              e.currentTarget.style.color = '#fecaca';
            }}
          >
            <span style={{ fontSize: '20px', display: 'flex' }}><Icons.Logout /></span>
            {sidebarOpen && <span>Çıkış Yap</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main style={{
        flex: 1,
        marginLeft: sidebarOpen ? '260px' : '80px',
        transition: 'margin-left 0.3s',
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {/* Top Bar */}
        <header style={{
          background: 'white',
          padding: '16px 32px',
          borderBottom: '1px solid #e5e7eb',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          position: 'sticky',
          top: 0,
          zIndex: 100
        }}>
          <div>
            <h2 style={{ fontSize: '24px', fontWeight: 'bold', color: '#1f2937' }}>
              {menuItems.find(item => item.path === location.pathname)?.label || 'Dashboard'}
            </h2>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
            {/* Socket Status */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '6px 12px',
              background: isConnected ? '#f0fdf4' : '#fef2f2',
              borderRadius: '20px',
              border: `1px solid ${isConnected ? '#bbf7d0' : '#fecaca'}`
            }}>
              <span style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: isConnected ? '#22c55e' : '#ef4444',
                animation: isConnected ? 'pulse 2s infinite' : 'none'
              }}></span>
              <span style={{
                fontSize: '12px',
                color: isConnected ? '#166534' : '#991b1b',
                fontWeight: '600'
              }}>
                {isConnected ? 'Canlı' : 'Kopuk'}
              </span>
            </div>

            {/* Notifications */}
            <button style={{
              width: '40px',
              height: '40px',
              background: 'white',
              border: '1px solid #e5e7eb',
              borderRadius: '10px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative',
              color: '#64748b',
              transition: 'all 0.2s'
            }}
            onClick={() => navigate('/notifications')}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#f8fafc';
              e.currentTarget.style.color = '#3b82f6';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'white';
              e.currentTarget.style.color = '#64748b';
            }}
            >
              <Icons.Notification />
              {unreadCount > 0 && (
                <span style={{
                  position: 'absolute',
                  top: '10px',
                  right: '10px',
                  width: '8px',
                  height: '8px',
                  background: '#ef4444',
                  borderRadius: '50%',
                  border: '1px solid white'
                }}></span>
              )}
            </button>

            {/* User Profile Button */}
            <button
              onClick={() => navigate('/profile')}
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '12px', 
                paddingLeft: '24px', 
                borderLeft: '1px solid #e5e7eb',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                transition: 'opacity 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.opacity = '0.7'}
              onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
            >
              <div style={{ textAlign: 'right' }}>
                <p style={{ fontSize: '14px', fontWeight: '600', color: '#1f2937', marginBottom: '2px' }}>
                  {user?.fullName || 'Admin'}
                </p>
                <p style={{ fontSize: '11px', fontWeight: '500', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  {user?.role || 'SISTEM YÖNETİCİSİ'}
                </p>
              </div>
              
              <div style={{
                width: '40px',
                height: '40px',
                background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                borderRadius: '10px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '16px',
                fontWeight: 'bold',
                color: 'white',
                boxShadow: '0 2px 4px rgba(59, 130, 246, 0.2)'
              }}>
                {user?.fullName?.charAt(0) || 'A'}
              </div>
            </button>
          </div>
        </header>

        {/* Page Content */}
        <div style={{ padding: '32px', flex: 1, overflowY: 'auto' }}>
          {children}
        </div>
      </main>

      {/* Toast Container */}
      <div style={{
        position: 'fixed',
        top: '24px',
        right: '24px',
        zIndex: 2000,
        pointerEvents: 'none'
      }}>
        <div style={{ pointerEvents: 'auto' }}>
          {toasts.map(toast => (
            <Toast key={toast.id} toast={toast} onClose={removeToast} />
          ))}
        </div>
      </div>
    </div>
  );
}

export default Layout;
