import { useState, useEffect, useRef, useMemo } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup, Tooltip, useMap } from 'react-leaflet';
import { useNavigate } from 'react-router-dom';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import Layout from '../components/Layout';
import { useSocket } from '../context/SocketContext';
import api from '../services/api';
import Icons from '../components/Icons';

// Leaflet İkon Fix
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Harita Kontrolcüsü (Odaklanma İşlemi İçin)
function MapController({ selectedVehicle }) {
  const map = useMap();

  useEffect(() => {
    // Sadece araç seçimi DEĞİŞTİĞİNDE çalışır.
    if (selectedVehicle && selectedVehicle.lastLat && selectedVehicle.lastLng) {
      map.setView([selectedVehicle.lastLat, selectedVehicle.lastLng], 16, {
        animate: true,
        duration: 1
      });
    }
  }, [selectedVehicle?.id, map]); // Sadece ID değişirse odaklan!

  return null;
}

function Map() {
  const navigate = useNavigate();
  const { socket } = useSocket();
  const [vehicles, setVehicles] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null); // Hata durumu
  const [selectedId, setSelectedId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL'); // ALL, ACTIVE, MAINTENANCE, PASSIVE

  const mapRef = useRef(null);

  // Başlangıç verisi
  useEffect(() => {
    fetchVehicles();
    fetchDrivers();
  }, []);

  // Socket dinleyici
  useEffect(() => {
    if (!socket) return;

    const handleLocationUpdate = (updates) => {
      setVehicles(prevVehicles => {
        const currentVehicles = prevVehicles || [];
        const newVehicles = [...currentVehicles];
        
        updates.forEach(update => {
          // ID'leri Metin (String) olarak karşılaştır ki hata olmasın
          const index = newVehicles.findIndex(v => String(v.id) === String(update.id));
          
          if (index !== -1) {
            // VARSA: Mevcut verileri (Driver dahil) koru, sadece konumu güncelle
            newVehicles[index] = {
              ...newVehicles[index],
              lastLat: update.lat,
              lastLng: update.lng,
              lastSpeed: update.speed,
              heading: update.heading
            };
          } else {
            // LİSTEDE YOKSA: Socket'ten gelen veriyi ekle (Harita boş kalmasın)
            newVehicles.push({
              id: update.id,
              plate: update.plate,
              lastLat: update.lat,
              lastLng: update.lng,
              lastSpeed: update.speed,
              heading: update.heading,
              status: 'ACTIVE',
              brand: '', // API'den gelene kadar boş
              model: '',
              driver: { fullName: 'Yükleniyor...' } // Geçici metin
            });
          }
        });
        
        return newVehicles;
      });
    };

    socket.on('vehicle:locations', handleLocationUpdate);
    return () => {
      socket.off('vehicle:locations', handleLocationUpdate);
    };
  }, [socket]);

  const fetchVehicles = async () => {
    try {
      const response = await api.get('/vehicles');
      if (response.data.success) {
        setVehicles(prev => {
           const apiVehicles = response.data.data.vehicles || [];
           // Mevcut socket verilerini (konumları) koru
           return apiVehicles.map(apiV => {
             const existing = prev.find(p => p.id === apiV.id);
             return existing ? { ...apiV, lastLat: existing.lastLat, lastLng: existing.lastLng, lastSpeed: existing.lastSpeed } : apiV;
           });
        });
      }
    } catch (error) {
      console.error('Araçlar yüklenemedi:', error);
      setError('Araç verisi yüklenirken sorun oluştu.');
    } finally {
      setLoading(false);
    }
  };

  const fetchDrivers = async () => {
      try {
          const response = await api.get('/drivers');
          if (response.data.success) {
              setDrivers(response.data.data.drivers || []);
          }
      } catch (error) {
          console.warn('Sürücüler yüklenemedi:', error);
      }
  };

  // Filtreleme ve Arama Mantığı
  const filteredVehicles = useMemo(() => {
    return vehicles.filter(v => {
      const matchesSearch = v.plate.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            (v.brand + ' ' + v.model).toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'ALL' || v.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [vehicles, searchTerm, statusFilter]);

  const selectedVehicle = useMemo(() => vehicles.find(v => v.id === selectedId), [vehicles, selectedId]);

  const getDriverName = (vehicleId, vehicleDriver) => {
    const matchedDriver = drivers.find(d => d.vehicleId === vehicleId);
    if (matchedDriver) return matchedDriver.fullName || `${matchedDriver.firstName} ${matchedDriver.lastName}`;
    if (vehicleDriver) return vehicleDriver.fullName || `${vehicleDriver.firstName} ${vehicleDriver.lastName}`;
    return 'Atanmamış';
  };

  if (error) {
    return (
        <Layout>
            <div style={{ padding: '40px', textAlign: 'center' }}>
                <div style={{ color: '#ef4444', fontSize: '18px', marginBottom: '16px' }}>{error}</div>
                <button 
                  onClick={() => window.location.reload()}
                  style={{ padding: '10px 20px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}
                >
                    Sayfayı Yenile
                </button>
            </div>
        </Layout>
    );
  }

  return (
    <Layout>
      <div style={{ height: 'calc(100vh - 100px)', display: 'flex', gap: '20px' }}>
        
        {/* SOL PANEL: ARAÇ LİSTESİ VE FİLTRELER */}
        <div style={{ 
          width: '320px', 
          display: 'flex', 
          flexDirection: 'column', 
          background: 'white', 
          borderRadius: '16px', 
          boxShadow: '0 4px 6px rgba(0,0,0,0.05)',
          overflow: 'hidden',
          border: '1px solid #e5e7eb'
        }}>
          {/* Panel Header */}
          <div style={{ padding: '20px', borderBottom: '1px solid #f3f4f6', background: '#f9fafb' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 'bold', color: '#1f2937', marginBottom: '12px' }}>
              Filo Durumu
            </h2>
            
            {/* Arama */}
            <div style={{ position: 'relative', marginBottom: '16px' }}>
              <input 
                type="text" 
                placeholder="Plaka veya model ara..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px 10px 36px',
                  borderRadius: '8px',
                  border: '1px solid #d1d5db',
                  fontSize: '14px',
                  outline: 'none'
                }}
              />
              <div style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }}>
                <Icons.Search size={16} />
              </div>
            </div>

            {/* Durum Filtreleri */}
            <div style={{ display: 'flex', gap: '8px' }}>
               {[
                 { id: 'ALL', label: 'Tümü', color: '#6b7280' },
                 { id: 'ACTIVE', label: 'Aktif', color: '#22c55e' },
                 { id: 'MAINTENANCE', label: 'Bakım', color: '#ef4444' }
               ].map(filter => (
                 <button
                    key={filter.id}
                    onClick={() => setStatusFilter(filter.id)}
                    style={{
                      flex: 1,
                      padding: '6px',
                      fontSize: '11px',
                      borderRadius: '6px',
                      border: `1px solid ${statusFilter === filter.id ? filter.color : '#e5e7eb'}`,
                      background: statusFilter === filter.id ? `${filter.color}10` : 'white',
                      color: statusFilter === filter.id ? filter.color : '#6b7280',
                      cursor: 'pointer',
                      fontWeight: '600',
                      transition: 'all 0.2s'
                    }}
                 >
                   {filter.label}
                 </button>
               ))}
            </div>
          </div>

          {/* Araç Listesi */}
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {filteredVehicles.length === 0 ? (
              <div style={{ padding: '20px', textAlign: 'center', color: '#9ca3af', fontSize: '14px' }}>
                Araç bulunamadı.
              </div>
            ) : (
              filteredVehicles.map(vehicle => (
                <div 
                  key={vehicle.id}
                  onClick={() => setSelectedId(vehicle.id)}
                  style={{
                    padding: '12px 20px',
                    borderBottom: '1px solid #f3f4f6',
                    cursor: 'pointer',
                    background: selectedId === vehicle.id ? '#eff6ff' : 'white',
                    transition: 'background 0.2s',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{
                      width: '10px',
                      height: '10px',
                      borderRadius: '50%',
                      background: vehicle.status === 'ACTIVE' ? '#22c55e' : (vehicle.status === 'MAINTENANCE' ? '#ef4444' : '#d1d5db')
                    }}></div>
                    <div>
                      <div style={{ fontWeight: 'bold', fontSize: '14px', color: '#374151' }}>{vehicle.plate}</div>
                      <div style={{ fontSize: '12px', color: '#6b7280' }}>
                           {/* Marka Model gösterimi */}
                           {vehicle.brand} {vehicle.model}
                           {/* Liste görünümünde de sürücü adı eklenebilir */}
                           <div style={{fontSize: '11px', color:'#9ca3af', marginTop:'2px'}}>
                             {vehicle.driver?.fullName}
                           </div>
                      </div>
                    </div>
                  </div>
                  {vehicle.status === 'ACTIVE' && (
                    <div style={{ 
                      fontSize: '12px', 
                      fontWeight: 'bold', 
                      color: vehicle.lastSpeed > 0 ? '#3b82f6' : '#9ca3af',
                      background: vehicle.lastSpeed > 0 ? '#eff6ff' : '#f3f4f6',
                      padding: '2px 8px',
                      borderRadius: '12px'
                    }}>
                      {Math.round(vehicle.lastSpeed || 0)} km/s
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
          
          {/* Footer İstatistik */}
          <div style={{ padding: '12px', background: '#f9fafb', borderTop: '1px solid #e5e7eb', fontSize: '12px', color: '#6b7280', textAlign: 'center' }}>
            Toplam {filteredVehicles.length} araç listeleniyor
          </div>
        </div>

        {/* SAĞ PANEL: HARİTA */}
        <div style={{ flex: 1, position: 'relative', borderRadius: '16px', overflow: 'hidden', border: '1px solid #e5e7eb' }}>
          {loading ? (
             <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f9fafb' }}>
               Harita ve veriler yükleniyor...
             </div>
          ) : (
            <MapContainer 
              center={[41.2867, 36.33]} // Samsun Merkez
              zoom={12} 
              style={{ height: '100%', width: '100%', zIndex: 0 }}
              ref={mapRef}
            >
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; OpenStreetMap'
              />

              {/* Seçili Araca Odaklanma Bileşeni */}
              <MapController selectedVehicle={selectedVehicle} />

              {filteredVehicles.map(vehicle => {
                const lat = Number(vehicle.lastLat);
                const lng = Number(vehicle.lastLng);

                if (isNaN(lat) || isNaN(lng) || lat === 0 || lng === 0) return null;

                const color = vehicle.status === 'ACTIVE' ? '#22c55e' : (vehicle.status === 'MAINTENANCE' ? '#ef4444' : '#6b7280');
                const isSelected = selectedId === vehicle.id;
                const driverName = getDriverName(vehicle.id, vehicle.driver);

                return (
                  <CircleMarker 
                    key={`v-${vehicle.id}-${isSelected}`} // Seçilince yeniden render et
                    center={[lat, lng]}
                    pathOptions={{ 
                      color: isSelected ? '#3b82f6' : color, 
                      fillColor: color, 
                      fillOpacity: isSelected ? 1 : 0.7,
                      weight: isSelected ? 4 : 2, // Seçiliyse kalın çerçeve
                    }}
                    radius={isSelected ? 15 : 10} // Seçiliyse büyük
                    eventHandlers={{
                      click: () => setSelectedId(vehicle.id),
                    }}
                  >
                    <Tooltip direction="top" offset={[0, -15]} opacity={1} permanent={isSelected}>
                      <span style={{ fontWeight: 'bold' }}>{vehicle.plate}</span>
                    </Tooltip>
                    
                    <Popup>
                      <div style={{ minWidth: '180px' }}>
                        <div style={{ fontWeight: 'bold', fontSize: '16px', marginBottom: '8px', borderBottom: '1px solid #eee', paddingBottom: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          {vehicle.plate}
                          {vehicle.status === 'ACTIVE' && <span style={{fontSize:'10px', background:'#dcfce7', color:'#166534', padding:'2px 6px', borderRadius:'4px'}}>AKTİF</span>}
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '13px' }}>
                           <div><span style={{color:'#6b7280'}}>Sürücü:</span> <b>{driverName}</b></div>
                           <div><span style={{color:'#6b7280'}}>Hız:</span> <b style={{color:'#2563eb'}}>{Math.round(vehicle.lastSpeed || 0)} km/s</b></div>
                           <div><span style={{color:'#6b7280'}}>Son Konum:</span> {new Date().toLocaleTimeString()}</div>
                           <button style={{
                             marginTop: '8px', width: '100%', padding: '6px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer'
                           }} onClick={() => navigate('/vehicles')}>
                             Araç Detayına Git
                           </button>
                        </div>
                      </div>
                    </Popup>
                  </CircleMarker>
                );
              })}
            </MapContainer>
          )}
        </div>
      </div>
    </Layout>
  );
}

export default Map;
