import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import Icons from '../components/Icons';
import dashboardService from '../services/dashboardService';
import ReportModal from '../components/ReportModal';

function Dashboard() {
  const navigate = useNavigate();
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [stats, setStats] = useState({
    totalVehicles: 0,
    activeVehicles: 0,
    maintenanceVehicles: 0,
    activeDrivers: 0,
    pendingFines: 0,
    upcomingMaintenance: 0
  });

  const [recentActivities, setRecentActivities] = useState([]);

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        const response = await dashboardService.getStats();
        const { stats: apiStats, recentActivities: apiActivities } = response.data?.data || {};

        if (apiStats) setStats(apiStats);

        if (apiActivities) {
            setRecentActivities(apiActivities.map(act => ({
              id: act.id,
              type: act.type,
              message: act.message,
              time: new Date(act.createdAt).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }),
              icon: act.type === 'DANGER' || act.type === 'WARNING' ? <Icons.Alert /> : <Icons.Check />
            })));
        }
      } catch (error) {
        console.error('Dashboard verileri yüklenemedi:', error);
      }
    };

    loadDashboardData();
  }, []);

  const statCards = [
    {
      title: 'Toplam Araç',
      value: stats.totalVehicles,
      icon: <Icons.Vehicle />,
      color: '#3b82f6',
      bgColor: '#eff6ff',
      change: '+2 bu ay'
    },
    {
      title: 'Aktif Araç',
      value: stats.activeVehicles,
      icon: <Icons.Check />,
      color: '#22c55e',
      bgColor: '#f0fdf4',
      change: '75% aktif'
    },
    {
      title: 'Bakımdaki Araç',
      value: stats.maintenanceVehicles,
      icon: <Icons.Maintenance />,
      color: '#f59e0b',
      bgColor: '#fffbeb',
      change: '3 araç'
    },
    {
      title: 'Aktif Sürücü',
      value: stats.activeDrivers,
      icon: <Icons.Driver />,
      color: '#8b5cf6',
      bgColor: '#f5f3ff',
      change: '15 sürücü'
    },
    {
      title: 'Bekleyen Ceza',
      value: stats.pendingFines,
      icon: <Icons.Fine />,
      color: '#ef4444',
      bgColor: '#fef2f2',
      change: '₺12,450'
    },
    {
      title: 'Yaklaşan Bakım',
      value: stats.upcomingMaintenance,
      icon: <Icons.Calendar />,
      color: '#06b6d4',
      bgColor: '#ecfeff',
      change: '30 gün içinde'
    }
  ];

  return (
    <Layout>
      {/* Stats Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: '24px',
        marginBottom: '32px'
      }}>
        {statCards.map((stat, index) => (
          <div
            key={index}
            style={{
              background: 'white',
              borderRadius: '16px',
              padding: '24px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
              border: '1px solid #f3f4f6',
              transition: 'all 0.3s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-4px)';
              e.currentTarget.style.boxShadow = '0 8px 16px rgba(0,0,0,0.1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)';
            }}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div>
                <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '8px', fontWeight: '500' }}>
                  {stat.title}
                </p>
                <p style={{ fontSize: '36px', fontWeight: 'bold', color: '#1f2937', lineHeight: 1 }}>
                  {stat.value}
                </p>
              </div>
              <div style={{
                width: '56px',
                height: '56px',
                background: stat.bgColor,
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: stat.color
              }}>
                {stat.icon}
              </div>
            </div>
            <div style={{
              padding: '8px 12px',
              background: stat.bgColor,
              borderRadius: '8px',
              display: 'inline-block'
            }}>
              <span style={{ fontSize: '13px', color: stat.color, fontWeight: '500' }}>
                {stat.change}
              </span>
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
        {/* Recent Activities */}
        <div style={{
          background: 'white',
          borderRadius: '16px',
          padding: '24px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          border: '1px solid #f3f4f6'
        }}>
          <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: '#1f2937', marginBottom: '20px' }}>
            Son Aktiviteler
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {recentActivities.map((activity) => (
              <div
                key={activity.id}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '16px',
                  padding: '16px',
                  background: '#f9fafb',
                  borderRadius: '12px',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = '#f3f4f6'}
                onMouseLeave={(e) => e.currentTarget.style.background = '#f9fafb'}
              >
                <div style={{
                  width: '40px',
                  height: '40px',
                  background: 'white',
                  borderRadius: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#6b7280',
                  flexShrink: 0
                }}>
                  {activity.icon}
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: '14px', color: '#1f2937', marginBottom: '4px', fontWeight: '500' }}>
                    {activity.message}
                  </p>
                  <p style={{ fontSize: '12px', color: '#9ca3af' }}>
                    {activity.time}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div style={{
          background: 'white',
          borderRadius: '16px',
          padding: '24px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          border: '1px solid #f3f4f6'
        }}>
          <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: '#1f2937', marginBottom: '20px' }}>
             Hızlı İşlemler
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {[
              { label: 'Yeni Araç Ekle', icon: <Icons.Plus />, color: '#3b82f6', action: () => navigate('/vehicles') },
              { label: 'Bakım Planla', icon: <Icons.Maintenance />, color: '#f59e0b', action: () => navigate('/maintenance') },
              { label: 'Sürücü Ekle', icon: <Icons.Driver />, color: '#8b5cf6', action: () => navigate('/drivers') },
              { label: 'Rapor Oluştur', icon: <Icons.TrendingUp />, color: '#22c55e', action: () => setIsReportModalOpen(true) }
            ].map((item, index) => (
              <button
                key={index}
                onClick={item.action}
                style={{
                  width: '100%',
                  padding: '16px',
                  background: '#f9fafb',
                  border: 'none',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  transition: 'all 0.2s',
                  textAlign: 'left'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = item.color;
                  e.currentTarget.style.color = 'white';
                  e.currentTarget.style.transform = 'translateX(4px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = '#f9fafb';
                  e.currentTarget.style.color = '#1f2937';
                  e.currentTarget.style.transform = 'translateX(0)';
                }}
              >
                <span style={{ display: 'flex', alignItems: 'center' }}>
                  {item.icon}
                </span>
                <span style={{ fontSize: '14px', fontWeight: '600' }}>{item.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
      <ReportModal isOpen={isReportModalOpen} onClose={() => setIsReportModalOpen(false)} />
    </Layout>
  );
}

export default Dashboard;
