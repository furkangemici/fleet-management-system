import { useState, useEffect, useRef } from 'react';
import Layout from '../components/Layout';
import Icons from '../components/Icons';
import notificationService from '../services/notificationService';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';

function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [filter, setFilter] = useState('ALL');
  const { socket, setUnreadCount } = useSocket();
  const { user } = useAuth();
  const processedIds = useRef(new Set()); // Sayfa içi deduplication

  useEffect(() => {
    loadNotifications();
    setUnreadCount(0); // Sayfa açıldığında kırmızılık gitsin
  }, []);

  const loadNotifications = async () => {
    try {
      const data = await notificationService.getAll();
      setNotifications(data);
      data.forEach(n => processedIds.current.add(n.id));
    } catch (error) {
      console.error('Bildirimler yüklenemedi:', error);
    }
  };

  // Socket ile canlı güncelleme
  useEffect(() => {
    if (!socket) return;

    const handleNewNotification = (newNotif) => {
      setNotifications(prev => {
        // 1. ID Kontrolü
        if (prev.some(n => n.id === newNotif.id) || processedIds.current.has(newNotif.id)) {
            processedIds.current.add(newNotif.id);
            return prev;
        }

        // 2. İçerik ve Zaman Bazlı Kontrol (Aynı mesaj 2 saniye içinde geldiyse engelle)
        // Backend bazen çift kayıt üretirse (farklı ID ile) bunu engeller.
        const isDuplicateContent = prev.some(n => 
            n.title === newNotif.title &&
            n.message === newNotif.message &&
            Math.abs(new Date(newNotif.createdAt).getTime() - new Date(n.createdAt).getTime()) < 2000
        );

        if (isDuplicateContent) {
            processedIds.current.add(newNotif.id);
            return prev;
        }

        processedIds.current.add(newNotif.id);
        return [newNotif, ...prev];
      });
    };

    socket.on('notification:new', handleNewNotification);
    if (user?.id) {
      socket.on(`notification:user:${user.id}`, handleNewNotification);
    }

    return () => {
      socket.off('notification:new', handleNewNotification);
      if (user?.id) {
        socket.off(`notification:user:${user.id}`, handleNewNotification);
      }
    };
  }, [socket, user]);

  const getTypeStyle = (type) => {
    const styles = {
      INFO: { bg: '#eff6ff', text: '#1e40af', icon: <Icons.Info />, label: 'Bilgi' },
      WARNING: { bg: '#fffbeb', text: '#92400e', icon: <Icons.Alert />, label: 'Uyarı' },
      DANGER: { bg: '#fef2f2', text: '#991b1b', icon: <Icons.Alert />, label: 'Acil' },
      SUCCESS: { bg: '#f0fdf4', text: '#166534', icon: <Icons.Check />, label: 'Başarılı' }
    };
    return styles[type] || styles.INFO;
  };

  // 1. Önce Mükerrerleri Temizle (Master List)
  const uniqueNotifications = notifications.reduce((acc, current) => {
    const isDuplicate = acc.some(item => 
      item.id === current.id || (
        item.title === current.title && 
        item.message === current.message && 
        Math.abs(new Date(item.createdAt).getTime() - new Date(current.createdAt).getTime()) < 5000
      )
    );
    if (!isDuplicate) acc.push(current);
    return acc;
  }, []);

  // 2. İstatistikler (Temiz liste üzerinden)
  const stats = {
    total: uniqueNotifications.length,
    unread: uniqueNotifications.filter(n => !n.isRead).length,
    read: uniqueNotifications.filter(n => n.isRead).length
  };

  // 3. Görünüm Filtresi
  const filteredNotifications = uniqueNotifications.filter(n => {
    if (filter === 'ALL') return true;
    if (filter === 'UNREAD') return !n.isRead;
    if (filter === 'READ') return n.isRead;
    return true;
  });

  const markAsRead = async (id) => {
    // Optimistic Update
    setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, isRead: true } : n)
    );
    try {
      await notificationService.markAsRead(id);
    } catch (error) {
      console.error('Bildirim okundu işaretlenemedi:', error);
    }
  };

  const markAllAsRead = async () => {
    // Optimistic Update
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    try {
      await notificationService.markAllAsRead();
    } catch (error) {
      console.error('Tümü okundu işaretlenemedi:', error);
    }
  };

  const deleteAll = async () => {
    if (!window.confirm('Tüm bildirimleri silmek istediğinize emin misiniz?')) return;
    setNotifications([]);
    try {
      await notificationService.deleteAll();
    } catch (error) {
      console.error('Tüm bildirimler silinemedi:', error);
    }
  };

  const getTimeAgo = (date) => {
    const now = new Date();
    const notifDate = new Date(date);
    const diffMs = now - notifDate;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Az önce';
    if (diffMins < 60) return `${diffMins} dakika önce`;
    if (diffHours < 24) return `${diffHours} saat önce`;
    return `${diffDays} gün önce`;
  };

  const handleDelete = async (e, id) => {
    e.stopPropagation();
    if (!window.confirm('Bu bildirimi silmek istediğinize emin misiniz?')) return;

    // Hedef bildirimi bul
    const target = notifications.find(n => n.id === id);
    if (!target) return;

    // Benzer (kopya) bildirimleri de bul (State'den hepsini temizlemek için)
    const relatedIds = notifications.filter(n => 
        n.id === id || 
        (n.title === target.title && 
         n.message === target.message && 
         Math.abs(new Date(n.createdAt).getTime() - new Date(target.createdAt).getTime()) < 5000)
    ).map(n => n.id);

    // Hepsini listeden uçur
    setNotifications(prev => prev.filter(n => !relatedIds.includes(n.id)));

    try {
      // Backend'den de hepsini sil
      await Promise.all(relatedIds.map(nid => notificationService.delete(nid)));
    } catch (error) {
      console.error('Bildirim silinemedi:', error);
    }
  };

  return (
    <Layout>
      {/* Stats */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '16px',
        marginBottom: '24px'
      }}>
        <div style={{
          background: 'white',
          padding: '20px',
          borderRadius: '12px',
          border: '1px solid #f3f4f6'
        }}>
          <p style={{ fontSize: '13px', color: '#6b7280', marginBottom: '8px' }}>Toplam Bildirim</p>
          <p style={{ fontSize: '28px', fontWeight: 'bold', color: '#1f2937' }}>{stats.total}</p>
        </div>
        <div style={{
          background: 'white',
          padding: '20px',
          borderRadius: '12px',
          border: '1px solid #f3f4f6'
        }}>
          <p style={{ fontSize: '13px', color: '#6b7280', marginBottom: '8px' }}>Okunmamış</p>
          <p style={{ fontSize: '28px', fontWeight: 'bold', color: '#ef4444' }}>{stats.unread}</p>
        </div>
        <div style={{
          background: 'white',
          padding: '20px',
          borderRadius: '12px',
          border: '1px solid #f3f4f6'
        }}>
          <p style={{ fontSize: '13px', color: '#6b7280', marginBottom: '8px' }}>Okundu</p>
          <p style={{ fontSize: '28px', fontWeight: 'bold', color: '#22c55e' }}>{stats.read}</p>
        </div>
      </div>

      {/* Filters */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '24px'
      }}>
        <div style={{ display: 'flex', gap: '12px' }}>
          {[
            { key: 'ALL', label: 'Tümü' },
            { key: 'UNREAD', label: 'Okunmamış' },
            { key: 'READ', label: 'Okundu' }
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              style={{
                padding: '10px 20px',
                background: filter === tab.key ? '#1e40af' : 'white',
                color: filter === tab.key ? 'white' : '#6b7280',
                border: filter === tab.key ? 'none' : '1px solid #e5e7eb',
                borderRadius: '10px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '600'
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            onClick={markAllAsRead}
            style={{
              padding: '10px 20px',
              background: 'white',
              color: '#1e40af',
              border: '1px solid #e5e7eb',
              borderRadius: '10px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <Icons.Check />
            Tümünü Okundu İşaretle
          </button>

          <button
            onClick={deleteAll}
            style={{
              padding: '10px 20px',
              background: '#fef2f2',
              color: '#dc2626',
              border: '1px solid #fecaca',
              borderRadius: '10px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <Icons.Delete size={16} />
            Tümünü Sil
          </button>
        </div>
      </div>

      {/* Notifications List */}
      <div style={{
        background: 'white',
        borderRadius: '16px',
        overflow: 'hidden',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        border: '1px solid #f3f4f6'
      }}>
        {filteredNotifications.map((notification, index) => {
          const typeStyle = getTypeStyle(notification.type);
          return (
            <div
              key={notification.id}
              style={{
                padding: '20px 24px',
                borderBottom: index < filteredNotifications.length - 1 ? '1px solid #f3f4f6' : 'none',
                background: notification.isRead ? 'white' : '#f9fafb',
                transition: 'all 0.2s',
                cursor: 'pointer'
              }}
              onClick={() => markAsRead(notification.id)}
              onMouseEnter={(e) => e.currentTarget.style.background = '#f3f4f6'}
              onMouseLeave={(e) => e.currentTarget.style.background = notification.isRead ? 'white' : '#f9fafb'}
            >
              <div style={{ display: 'flex', gap: '16px' }}>
                {/* Icon */}
                <div style={{
                  width: '48px',
                  height: '48px',
                  background: typeStyle.bg,
                  borderRadius: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: typeStyle.text,
                  flexShrink: 0
                }}>
                  {typeStyle.icon}
                </div>

                {/* Content */}
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <div style={{ flex: 1 }}>
                      <h4 style={{
                        fontSize: '16px',
                        fontWeight: notification.isRead ? '600' : '700',
                        color: '#1f2937',
                        marginBottom: '4px'
                      }}>
                        {notification.title}
                      </h4>
                      <p style={{ fontSize: '14px', color: '#6b7280', lineHeight: 1.5 }}>
                        {notification.message}
                      </p>
                    </div>
                    {!notification.isRead && (
                      <div style={{
                        width: '8px',
                        height: '8px',
                        background: '#3b82f6',
                        borderRadius: '50%',
                        marginLeft: '12px',
                        marginTop: '6px'
                      }}></div>
                    )}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{
                      padding: '4px 10px',
                      background: typeStyle.bg,
                      color: typeStyle.text,
                      borderRadius: '6px',
                      fontSize: '12px',
                      fontWeight: '600'
                    }}>
                      {typeStyle.label}
                    </span>
                    <span style={{ fontSize: '13px', color: '#9ca3af' }}>
                      {getTimeAgo(notification.createdAt)}
                    </span>
                  </div>
                </div>


                {/* Delete Button */}
                <button
                  onClick={(e) => handleDelete(e, notification.id)}
                  style={{
                    border: 'none',
                    background: 'transparent',
                    color: '#9ca3af',
                    cursor: 'pointer',
                    padding: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: '8px',
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#fee2e2';
                    e.currentTarget.style.color = '#ef4444';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.color = '#9ca3af';
                  }}
                  title="Bildirimi Sil"
                >
                  <Icons.Delete size={18} />
                </button>
              </div>
            </div>
          );
        })}

        {filteredNotifications.length === 0 && (
          <div style={{
            padding: '64px',
            textAlign: 'center'
          }}>
            <div style={{
              width: '64px',
              height: '64px',
              background: '#f3f4f6',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
              color: '#9ca3af'
            }}>
              <Icons.Notification />
            </div>
            <p style={{ fontSize: '16px', color: '#6b7280' }}>
              Bildirim bulunamadı
            </p>
          </div>
        )}
      </div>
    </Layout>
  );
}

export default Notifications;
