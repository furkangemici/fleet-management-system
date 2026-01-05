import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import Icons from '../components/Icons';
import Modal from '../components/Modal';
import vehicleService from '../services/vehicleService';
import driverService from '../services/driverService';
import { exportToCSV } from '../utils/exportUtils';

function Vehicles() {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [availableDrivers, setAvailableDrivers] = useState([]);
  
  // Modal & Form States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState(null);
  const [formData, setFormData] = useState({
    plate: '',
    brand: '',
    model: '',
    year: new Date().getFullYear(),
    fuelType: 'DIESEL',
    km: 0,
    status: 'ACTIVE',
    color: '',
    chassisNo: '',
    driverId: '' // Sürücü atama için
  });
  const [formLoading, setFormLoading] = useState(false);

  // Verileri Getir
  const fetchVehicles = async () => {
    try {
      setLoading(true);
      const response = await vehicleService.getAllVehicles();
      
      // API response yapısını kontrol et
      let vehicleData = [];
      if (response.data && Array.isArray(response.data)) {
        vehicleData = response.data;
      } else if (response.data?.vehicles && Array.isArray(response.data.vehicles)) {
        vehicleData = response.data.vehicles;
      }
      
      setVehicles(vehicleData);
    } catch (err) {
      console.error(err);
      setError('Araçlar yüklenirken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  // Müsait Sürücüleri Getir
  const fetchDrivers = async (currentDriver = null) => {
    try {
      const response = await driverService.getAllDrivers({ available: 'true' });
      
      // API response yapısını kontrol et
      let drivers = [];
      if (response.data && Array.isArray(response.data)) {
        drivers = response.data;
      } else if (response.data?.drivers && Array.isArray(response.data.drivers)) {
        drivers = response.data.drivers;
      }
      
      // Eğer düzenleme modundaysak ve aracın zaten sürücüsü varsa, onu da listeye ekle
      if (currentDriver) {
        drivers = [currentDriver, ...drivers];
      }
      
      setAvailableDrivers(drivers);
    } catch (err) {
      console.error('Sürücüler yüklenemedi', err);
    }
  };

  useEffect(() => {
    fetchVehicles();
  }, []);

  // Form İşlemleri
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    // Plaka ve Şasi otomatik büyük harf
    let finalValue = value;
    if (name === 'plate' || name === 'chassisNo') {
      finalValue = value.toUpperCase();
    }
    // Yıl, KM ve DriverId için sayısal kontrol (ama string olarak tutuyoruz ki 0 silinebilsin)
    // Sadece sayı girilmesine izin ver
    else if (name === 'year' || name === 'km' || name === 'driverId') {
       finalValue = value; 
    }

    setFormData(prev => ({
      ...prev,
      [name]: finalValue
    }));
  };

  const openModal = (vehicle = null) => {
    if (vehicle) {
      setEditingVehicle(vehicle);
      setFormData({
        plate: vehicle.plate,
        brand: vehicle.brand,
        model: vehicle.model,
        year: vehicle.year,
        fuelType: vehicle.fuelType,
        fuelType: vehicle.fuelType,
        km: vehicle.km,
        status: vehicle.status,
        color: vehicle.color || '',
        chassisNo: vehicle.chassisNo || '',
        driverId: vehicle.driver ? vehicle.driver.id : ''
      });
      fetchDrivers(vehicle.driver); // Mevcut sürücüyü de listeye dahil et
    } else {
      setEditingVehicle(null);
      setFormData({
        plate: '',
        brand: '',
        model: '',
        year: new Date().getFullYear(),
        fuelType: 'DIESEL',
        km: '', // 0 yerine boş string
        status: 'ACTIVE',
        color: '',
        chassisNo: '',
        driverId: ''
      });
      fetchDrivers(null);
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormLoading(true);

    // Verileri hazırla (Sayısal alanları dönüştür)
    const dataToSubmit = {
      ...formData,
      year: parseInt(formData.year) || 0,
      km: parseInt(formData.km) || 0,
      driverId: formData.driverId ? parseInt(formData.driverId) : null
    };

    try {
      if (editingVehicle) {
        await vehicleService.updateVehicle(editingVehicle.id, dataToSubmit);
      } else {
        await vehicleService.createVehicle(dataToSubmit);
      }
      setIsModalOpen(false);
      fetchVehicles(); // Listeyi yenile
    } catch (err) {
      alert(err.response?.data?.message || 'Bir hata oluştu');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Bu aracı silmek istediğinize emin misiniz?')) {
      try {
        await vehicleService.deleteVehicle(id);
        fetchVehicles();
      } catch (err) {
        alert('Silme işlemi başarısız');
      }
    }
  };

  const handleExport = async () => {
    try {
      if (!window.confirm('Araç listesi dışa aktarılsın mı?')) return;
      const response = await vehicleService.getAllVehicles({ limit: 1000 });
      let data = [];
      if (response.data && Array.isArray(response.data)) {
        data = response.data;
      } else if (response.data?.vehicles && Array.isArray(response.data.vehicles)) {
        data = response.data.vehicles;
      }

      if (data.length > 0) {
        const exportData = data.map(v => ({
           'Plaka': v.plate,
           'Marka': v.brand,
           'Model': v.model,
           'Yıl': v.year,
           'Tip': v.type,
           'Yakıt': v.fuelType,
           'KM': v.km,
           'Durum': v.status === 'ACTIVE' ? 'Aktif' : (v.status === 'MAINTENANCE' ? 'Bakımda' : v.status),
           'Sürücü': v.driver?.fullName || '-'
        }));
        exportToCSV(exportData, 'arac_filosu');
      } else {
        alert('Dışa aktarılacak veri bulunamadı.');
      }
    } catch (err) {
      console.error(err);
      alert('Dışa aktarma hatası');
    }
  };

  // Status Badge Helper
  const getStatusBadge = (status) => {
    const styles = {
      ACTIVE: { bg: '#dcfce7', color: '#166534', label: 'Aktif' },
      PASSIVE: { bg: '#fee2e2', color: '#991b1b', label: 'Pasif' },
      MAINTENANCE: { bg: '#fef3c7', color: '#92400e', label: 'Bakımda' }
    };
    const style = styles[status] || styles.ACTIVE;
    return (
      <span style={{
        padding: '6px 12px',
        borderRadius: '20px',
        fontSize: '12px',
        fontWeight: '600',
        background: style.bg,
        color: style.color,
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px'
      }}>
        <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: style.color }}></span>
        {style.label}
      </span>
    );
  };

  return (
    <Layout>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#1f2937' }}>Araç Filosu</h1>
          <p style={{ color: '#6b7280', fontSize: '14px', marginTop: '4px' }}>
            Toplam {vehicles.length} araç listeleniyor
          </p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button 
            onClick={handleExport}
            style={{
              padding: '12px 24px',
              background: 'white',
              color: '#374151',
              border: '1px solid #e5e7eb',
              borderRadius: '12px',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}>
            <Icons.TrendingUp /> Dışa Aktar
          </button>
          <button 
            onClick={() => openModal()}
            style={{
              padding: '12px 24px',
              background: '#1e3a8a',
              color: 'white',
              border: 'none',
              borderRadius: '12px',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: '0 4px 6px -1px rgba(30, 58, 138, 0.2)'
            }}>
            <Icons.Plus /> Yeni Araç Ekle
          </button>
        </div>
      </div>

      {loading ? (
        <div style={{ padding: '40px', textAlign: 'center', color: '#6b7280' }}>Yükleniyor...</div>
      ) : error ? (
        <div style={{ padding: '40px', textAlign: 'center', color: '#ef4444' }}>{error}</div>
      ) : (
        <div style={{
          background: 'white',
          borderRadius: '16px',
          border: '1px solid #e5e7eb',
          overflow: 'hidden',
          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
        }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                <th style={{ padding: '16px 24px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' }}>Araç</th>
                <th style={{ padding: '16px 24px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' }}>Plaka / Şasi</th>
                <th style={{ padding: '16px 24px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' }}>Sürücü</th>
                <th style={{ padding: '16px 24px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' }}>Durum</th>
                <th style={{ padding: '16px 24px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' }}>KM</th>
                <th style={{ padding: '16px 24px', textAlign: 'right', fontSize: '12px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' }}>İşlemler</th>
              </tr>
            </thead>
            <tbody>
              {vehicles.map((vehicle) => (
                <tr key={vehicle.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                  <td style={{ padding: '16px 24px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{
                        width: '40px', height: '40px', background: '#eff6ff', borderRadius: '10px',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#1e3a8a'
                      }}>
                        <Icons.Vehicle />
                      </div>
                      <div>
                        <div style={{ fontWeight: '600', color: '#1f2937' }}>{vehicle.brand} {vehicle.model}</div>
                        <div style={{ fontSize: '13px', color: '#6b7280' }}>{vehicle.year} • {vehicle.fuelType}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '16px 24px' }}>
                    <div style={{ fontWeight: '600', color: '#1f2937', fontFamily: 'monospace', fontSize: '14px', background: '#f3f4f6', padding: '4px 8px', borderRadius: '6px', display: 'inline-block' }}>
                      {vehicle.plate}
                    </div>
                    {vehicle.chassisNo && (
                      <div style={{ fontSize: '12px', color: '#9ca3af', marginTop: '4px', fontFamily: 'monospace' }}>
                        {vehicle.chassisNo}
                      </div>
                    )}
                  </td>
                  <td style={{ padding: '16px 24px' }}>
                    {vehicle.driver ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                         <div style={{ width: '24px', height: '24px', background: '#e0e7ff', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: 'bold', color: '#3730a3' }}>
                           {vehicle.driver.fullName.charAt(0)}
                         </div>
                         <span style={{ fontSize: '14px', color: '#374151' }}>{vehicle.driver.fullName}</span>
                      </div>
                    ) : (
                      <span style={{ fontSize: '13px', color: '#9ca3af', fontStyle: 'italic' }}>Atanmamış</span>
                    )}
                  </td>
                  <td style={{ padding: '16px 24px' }}>
                    {getStatusBadge(vehicle.status)}
                  </td>
                  <td style={{ padding: '16px 24px', fontWeight: '500', color: '#4b5563' }}>
                    {vehicle.km.toLocaleString('tr-TR')} km
                  </td>
                  <td style={{ padding: '16px 24px', textAlign: 'right' }}>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                      <button 
                        onClick={() => openModal(vehicle)}
                        style={{ padding: '8px', background: 'transparent', border: '1px solid #e5e7eb', borderRadius: '8px', cursor: 'pointer', color: '#3b82f6' }}>
                        <Icons.Edit />
                      </button>
                      <button 
                        onClick={() => handleDelete(vehicle.id)}
                        style={{ padding: '8px', background: 'transparent', border: '1px solid #e5e7eb', borderRadius: '8px', cursor: 'pointer', color: '#ef4444' }}>
                        <Icons.Delete />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal - Create/Edit Form */}
      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)}
        title={editingVehicle ? 'Aracı Düzenle' : 'Yeni Araç Ekle'}
      >
        <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '16px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
             <div>
               <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '6px' }}>Plaka</label>
               <input 
                 name="plate"
                 value={formData.plate}
                 onChange={handleInputChange}
                 required
                 placeholder="34 ABC 123"
                 pattern="^(0[1-9]|[1-7][0-9]|8[01])\s[A-Z]{1,3}\s\d{2,4}$"
                 title="Örnek: 34 ABC 123 (Aralarda boşluk bırakınız)"
                 style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #d1d5db' }}
               />
               <span style={{ fontSize: '11px', color: '#6b7280', marginTop: '2px', display: 'block' }}>Örnek: 34 ABC 123 (Aralarda boşluk olmalı)</span>
             </div>
             <div>
               <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '6px' }}>Marka</label>
               <input 
                 name="brand"
                 value={formData.brand}
                 onChange={handleInputChange}
                 required
                 placeholder="Ford"
                 style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #d1d5db' }}
               />
             </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
             <div>
               <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '6px' }}>Model</label>
               <input 
                 name="model"
                 value={formData.model}
                 onChange={handleInputChange}
                 required
                 placeholder="Transit"
                 style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #d1d5db' }}
               />
             </div>
             <div>
               <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '6px' }}>Yıl</label>
               <input 
                 name="year"
                 type="number"
                 value={formData.year}
                 onChange={handleInputChange}
                 required
                 style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #d1d5db' }}
               />
             </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
             <div>
               <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '6px' }}>Yakıt Tipi</label>
               <select 
                 name="fuelType"
                 value={formData.fuelType}
                 onChange={handleInputChange}
                 style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #d1d5db' }}
               >
                 <option value="DIESEL">Dizel</option>
                 <option value="GASOLINE">Benzin</option>
                 <option value="ELECTRIC">Elektrik</option>
                 <option value="HYBRID">Hibrit</option>
               </select>
             </div>
             <div>
               <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '6px' }}>KM</label>
               <input 
                 name="km"
                 type="number"
                 value={formData.km}
                 onChange={handleInputChange}
                 required
                 style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #d1d5db' }}
               />
             </div>
          </div>

          <div>
             <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '6px' }}>Durum</label>
             <select 
               name="status"
               value={formData.status}
               onChange={handleInputChange}
               style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #d1d5db' }}
             >
               <option value="ACTIVE">Aktif</option>
               <option value="PASSIVE">Pasif</option>
               <option value="MAINTENANCE">Bakımda</option>
             </select>
          </div>

          <div>
             <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '6px' }}>Sürücü (Opsiyonel)</label>
             <select 
               name="driverId"
               value={formData.driverId}
               onChange={handleInputChange}
               style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #d1d5db' }}
             >
               <option value="">-- Sürücü Seçin --</option>
               {availableDrivers.map(driver => (
                 <option key={driver.id} value={driver.id}>
                   {driver.fullName} ({driver.phone})
                 </option>
               ))}
             </select>
             <span style={{ fontSize: '11px', color: '#6b7280', marginTop: '2px', display: 'block' }}>
               Sadece boşta olan sürücüler listelenir.
             </span>
          </div>

          <div>
             <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '6px' }}>Şasi No (Opsiyonel)</label>
             <input 
               name="chassisNo"
               value={formData.chassisNo}
               onChange={handleInputChange}
               placeholder="ABC12345678"
               maxLength="17"
               pattern="^[A-HJ-NPR-Z0-9]{17}$"
               title="17 Karakter olmalı. I, O, Q harfleri kullanılamaz."
               style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #d1d5db' }}
             />
             <span style={{ fontSize: '11px', color: '#6b7280', marginTop: '2px', display: 'block' }}>17 Karakter (I, O, Q hariç)</span>
          </div>

          <button 
            type="submit" 
            disabled={formLoading}
            style={{
              marginTop: '16px',
              padding: '12px',
              background: '#1e3a8a',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontWeight: 'bold',
              cursor: formLoading ? 'not-allowed' : 'pointer',
              opacity: formLoading ? 0.7 : 1
            }}
          >
            {formLoading ? 'Kaydediliyor...' : editingVehicle ? 'Güncelle' : 'Oluştur'}
          </button>
        </form>
      </Modal>
    </Layout>
  );
}

export default Vehicles;
