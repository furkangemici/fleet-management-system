import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import Icons from '../components/Icons';
import Modal from '../components/Modal';
import driverService from '../services/driverService';
import vehicleService from '../services/vehicleService';
import { exportToCSV } from '../utils/exportUtils';

function Drivers() {
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [availableVehicles, setAvailableVehicles] = useState([]);

  // Modal & Form States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDriver, setEditingDriver] = useState(null);
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    email: '',
    identityNumber: '',
    licenseNumber: '',
    licenseType: 'B',
    licenseExpiry: '',
    birthDate: '',
    status: 'ACTIVE',
    vehicleId: ''
  });
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState(null);

  // Müsait Araçları Getir
  const fetchVehicles = async (currentVehicle = null) => {
    try {
      // Sadece boşta olan araçları getir (Aktif/Pasif farketmeksizin)
      const response = await vehicleService.getAllVehicles({ available: 'true' });
      console.log('Vehicles API response:', response);
      
      // API response yapısını kontrol et
      let vehicles = [];
      if (response.data && Array.isArray(response.data)) {
        vehicles = response.data;
      } else if (response.data?.vehicles && Array.isArray(response.data.vehicles)) {
        vehicles = response.data.vehicles;
      }
      
      console.log('Parsed vehicles:', vehicles);
      
      // Eğer sürücünün zaten aracı varsa, onu da listeye ekle
      if (currentVehicle) {
        // Listede zaten var mı kontrol et (ne olur ne olmaz)
        const exists = vehicles.find(v => v.id === currentVehicle.id);
        if (!exists) {
            vehicles = [currentVehicle, ...vehicles];
        }
      }
      setAvailableVehicles(vehicles);
    } catch (err) {
      console.error('Araçlar yüklenemedi', err);
      setAvailableVehicles([]);
    }
  };

  // Verileri Getir
  const fetchDrivers = async () => {
    try {
      setLoading(true);
      const response = await driverService.getAllDrivers();
      
      // API response yapısını kontrol et
      let driverData = [];
      if (response.data && Array.isArray(response.data)) {
        driverData = response.data;
      } else if (response.data?.drivers && Array.isArray(response.data.drivers)) {
        driverData = response.data.drivers;
      }
      
      setDrivers(driverData);
    } catch (err) {
      console.error(err);
      setError('Sürücüler yüklenirken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDrivers();
  }, []);

  // Form İşlemleri
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    // Telefon Formatlaması (05XX XXX XX XX)
    if (name === 'phone') {
         // Sadece rakamları al
         let cleaned = value.replace(/\D/g, '');
         
         // Maksimum 11 karakter (05XXXXXXXXX)
         if (cleaned.length > 11) cleaned = cleaned.slice(0, 11);

         // Formatlama mantığı
         let formatted = cleaned;
         if (cleaned.length > 4) {
             formatted = `${cleaned.slice(0, 4)} ${cleaned.slice(4)}`;
         }
         if (cleaned.length > 7) {
             formatted = `${cleaned.slice(0, 4)} ${cleaned.slice(4, 7)} ${cleaned.slice(7)}`;
         }
         if (cleaned.length > 9) {
             formatted = `${cleaned.slice(0, 4)} ${cleaned.slice(4, 7)} ${cleaned.slice(7, 9)} ${cleaned.slice(9)}`;
         }

         setFormData(prev => ({ ...prev, [name]: formatted }));
    } else {
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    }
  };

  const openModal = async (driver = null) => {
    if (driver) {
      setEditingDriver(driver);
      
      // Telefonu formatla
      let formattedPhone = driver.phone;
      const cleaned = driver.phone.replace(/\D/g, '');
      if (cleaned.length > 4) formattedPhone = `${cleaned.slice(0, 4)} ${cleaned.slice(4)}`;
      if (cleaned.length > 7) formattedPhone = `${cleaned.slice(0, 4)} ${cleaned.slice(4, 7)} ${cleaned.slice(7)}`;
      if (cleaned.length > 9) formattedPhone = `${cleaned.slice(0, 4)} ${cleaned.slice(4, 7)} ${cleaned.slice(7, 9)} ${cleaned.slice(9)}`;

      setFormData({
        fullName: driver.fullName,
        phone: formattedPhone,
        email: driver.email,
        identityNumber: driver.identityNumber || '',
        licenseNumber: driver.licenseNumber,
        licenseType: driver.licenseClass || driver.licenseType || 'B',
        // Tarih formatını input date formatına çevir (yyyy-MM-dd)
        licenseExpiry: driver.licenseExpiry ? new Date(driver.licenseExpiry).toISOString().split('T')[0] : '',
        birthDate: driver.birthDate ? new Date(driver.birthDate).toISOString().split('T')[0] : '',
        status: driver.status,
        vehicleId: driver.vehicle?.id || ''
      });
      // Mevcut aracı da listeye dahil et
      await fetchVehicles(driver.vehicle);
    } else {
      setEditingDriver(null);
      setFormData({
        fullName: '',
        phone: '',
        email: '',
        identityNumber: '',
        licenseNumber: '',
        licenseType: 'B',
        licenseExpiry: '',
        birthDate: '',
        status: 'ACTIVE',
        vehicleId: ''
      });
      await fetchVehicles(null);
    }
    setFormError(null); // Modal açılınca hatayı temizle
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    setFormError(null);
    try {
      const submitData = {
        ...formData,
        vehicleId: formData.vehicleId ? parseInt(formData.vehicleId) : null
      };
      
      if (editingDriver) {
        await driverService.updateDriver(editingDriver.id, submitData);
      } else {
        await driverService.createDriver(submitData);
      }
      setIsModalOpen(false);
      fetchDrivers();
    } catch (err) {
      setFormError(err.response?.data?.message || 'Bir hata oluştu');
    } finally {
      setFormLoading(false);
    }
  };
  const handleDelete = async (id) => {
    if (window.confirm('Bu sürücüyü silmek istediğinize emin misiniz?')) {
      try {
        await driverService.deleteDriver(id);
        fetchDrivers();
      } catch (err) {
        alert('Silme işlemi başarısız: ' + (err.response?.data?.message || err.message));
      }
    }
  };

  const handleExport = async () => {
    try {
      if (!window.confirm('Sürücü listesi dışa aktarılsın mı?')) return;
      
      const response = await driverService.getAllDrivers({ limit: 1000 });
      let data = [];
      if (response.data && Array.isArray(response.data)) {
        data = response.data;
      } else if (response.data?.drivers && Array.isArray(response.data.drivers)) {
        data = response.data.drivers;
      }

      if (data.length > 0) {
        const exportData = data.map(d => ({
            'Ad Soyad': d.fullName,
            'TC Kimlik No': d.identityNumber || '-',
            'Ehliyet No': d.licenseNumber || '-',
            'Ehliyet Sınıfı': d.licenseClass || '-',
            'Telefon': d.phone,
            'E-posta': d.email,
            'Durum': d.status === 'ACTIVE' ? 'Aktif' : (d.status === 'ON_LEAVE' ? 'İzinli' : 'Pasif'),
            'Atanan Araç': d.vehicle?.plate || '-'
        }));
        exportToCSV(exportData, 'suruculer');
      } else {
        alert('Dışa aktarılacak veri bulunamadı.');
      }
    } catch (err) {
      console.error('Export error:', err);
      alert('Dışa aktarma sırasında hata oluştu.');
    }
  };

  // Status Badge Helper
  const getStatusBadge = (status) => {
    const styles = {
      ACTIVE: { bg: '#dcfce7', color: '#166534', label: 'Aktif' },
      ON_LEAVE: { bg: '#fee2e2', color: '#991b1b', label: 'İzinli' },
      INACTIVE: { bg: '#f3f4f6', color: '#374151', label: 'Pasif' }
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
          <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#1f2937' }}>Sürücü Yönetimi</h1>
          <p style={{ color: '#6b7280', fontSize: '14px', marginTop: '4px' }}>
            Toplam {drivers.length} sürücü listeleniyor
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
              <Icons.Plus /> Yeni Sürücü Ekle
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
                <th style={{ padding: '16px 24px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' }}>Sürücü</th>
                <th style={{ padding: '16px 24px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' }}>İletişim</th>
                <th style={{ padding: '16px 24px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' }}>Ehliyet</th>
                <th style={{ padding: '16px 24px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' }}>Durum</th>
                <th style={{ padding: '16px 24px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' }}>Atanan Araç</th>
                <th style={{ padding: '16px 24px', textAlign: 'right', fontSize: '12px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' }}>İşlemler</th>
              </tr>
            </thead>
            <tbody>
              {drivers.map((driver) => (
                <tr key={driver.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                  <td style={{ padding: '16px 24px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{
                        width: '40px', height: '40px', background: '#f3f4f6', borderRadius: '50%',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4b5563', fontWeight: 'bold'
                      }}>
                        {driver.fullName.charAt(0)}
                      </div>
                      <div>
                        <div style={{ fontWeight: '600', color: '#1f2937' }}>{driver.fullName}</div>
                        <div style={{ fontSize: '12px', color: '#6b7280' }}>
                           {driver.birthDate ? `${new Date().getFullYear() - new Date(driver.birthDate).getFullYear()} Yaşında` : ''}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '16px 24px' }}>
                    <div style={{ fontSize: '14px', color: '#374151' }}>{driver.phone}</div>
                    <div style={{ fontSize: '13px', color: '#6b7280' }}>{driver.email}</div>
                  </td>
                  <td style={{ padding: '16px 24px' }}>
                    <div style={{ fontFamily: 'monospace', background: '#fef3c7', padding: '2px 8px', borderRadius: '4px', display: 'inline-block', fontSize: '12px', color: '#92400e' }}>
                      {driver.licenseNumber}
                    </div>
                    <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '2px' }}>
                      Sınıf: {driver.licenseClass || driver.licenseType || '-'}
                    </div>
                  </td>
                  <td style={{ padding: '16px 24px' }}>
                    {getStatusBadge(driver.status)}
                  </td>
                  <td style={{ padding: '16px 24px' }}>
                    {driver.vehicle ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#eff6ff', padding: '4px 8px', borderRadius: '6px', color: '#1e40af', fontSize: '13px' }}>
                            <Icons.Vehicle /> {driver.vehicle.plate}
                        </div>
                    ) : (
                        <span style={{ color: '#9ca3af', fontSize: '13px', fontStyle: 'italic' }}>Atanmamış</span>
                    )}
                  </td>
                  <td style={{ padding: '16px 24px', textAlign: 'right' }}>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                      <button 
                        onClick={() => openModal(driver)}
                        style={{ padding: '8px', background: 'transparent', border: '1px solid #e5e7eb', borderRadius: '8px', cursor: 'pointer', color: '#3b82f6' }}>
                        <Icons.Edit />
                      </button>
                      <button 
                         onClick={() => handleDelete(driver.id)}
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

      {/* Driver Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingDriver ? 'Sürücüyü Düzenle' : 'Yeni Sürücü Ekle'}>
        <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '16px' }}>
           {formError && (
             <div style={{ background: '#fee2e2', color: '#991b1b', padding: '12px', borderRadius: '8px', fontSize: '14px' }}>
               {formError}
             </div>
           )}
           <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
             <div>
               <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '6px' }}>Ad Soyad</label>
               <input 
                 name="fullName"
                 value={formData.fullName}
                 onChange={handleInputChange}
                 required
                 placeholder="Ali Yılmaz"
                 style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #d1d5db' }}
               />
             </div>
             <div>
               <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '6px' }}>Telefon</label>
               <input 
                 name="phone"
                 value={formData.phone}
                 onChange={handleInputChange}
                 required
                 placeholder="0532 555 00 00"
                 pattern="^05[0-9]{2} [0-9]{3} [0-9]{2} [0-9]{2}$"
                 title="Format: 05XX XXX XX XX"
                 maxLength="14"
                 style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #d1d5db' }}
               />
               <span style={{ fontSize: '11px', color: '#6b7280', marginTop: '2px' }}>Örn: 0532 555 00 00</span>
             </div>
           </div>

           <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
             <div>
               <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '6px' }}>Email</label>
               <input 
                 name="email"
                 type="email"
                 value={formData.email}
                 onChange={handleInputChange}
                 required
                 placeholder="ali@reeder.com.tr"
                 style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #d1d5db' }}
               />
             </div>
             <div>
               <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '6px' }}>TC Kimlik No (Opsiyonel)</label>
               <input 
                 name="identityNumber"
                 value={formData.identityNumber}
                 onChange={(e) => {
                   // Sadece rakam, maksimum 11 hane
                   const val = e.target.value.replace(/\D/g, '').slice(0, 11);
                   setFormData(prev => ({ ...prev, identityNumber: val }));
                 }}
                 placeholder="12345678901"
                 pattern="\d{11}"
                 title="11 Haneli TC Kimlik Numarası"
                 style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #d1d5db' }}
               />
               <span style={{ fontSize: '11px', color: '#6b7280', marginTop: '2px' }}>11 Haneli TC No</span>
             </div>
           </div>

           <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
             <div>
               <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '6px' }}>Doğum Tarihi</label>
               <input 
                 name="birthDate"
                 type="date"
                 value={formData.birthDate}
                 onChange={handleInputChange}
                 required
                 style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #d1d5db' }}
               />
             </div>
           </div>

           <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
             <div>
               <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '6px' }}>Ehliyet No</label>
               <input 
                 name="licenseNumber"
                 value={formData.licenseNumber}
                 onChange={(e) => {
                   // Sadece rakam
                   const val = e.target.value.replace(/\D/g, '').slice(0, 6);
                   setFormData(prev => ({ ...prev, licenseNumber: val }));
                 }}
                 required
                 placeholder="123456"
                 pattern="\d{6}"
                 title="6 Haneli Belge Numarası"
                 style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #d1d5db' }}
               />
               <span style={{ fontSize: '11px', color: '#6b7280', marginTop: '2px' }}>6 Haneli Belge No</span>
             </div>
             <div>
               <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '6px' }}>Ehliyet Sınıfı</label>
               <select 
                 name="licenseType"
                 value={formData.licenseType}
                 onChange={handleInputChange}
                 style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #d1d5db' }}
               >
                 <option value="B">B - Otomobil</option>
                 <option value="A">A - Motosiklet</option>
                 <option value="C">C - Kamyon</option>
                 <option value="D">D - Otobüs</option>
                 <option value="E">E - Tır</option>
               </select>
             </div>
           </div>

           <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '6px' }}>Ehliyet Geçerlilik Tarihi</label>
              <input 
                name="licenseExpiry"
                type="date"
                value={formData.licenseExpiry}
                onChange={handleInputChange}
                required
                style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #d1d5db' }}
              />
           </div>

           <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '6px' }}>Sürücü Durumu</label>
              <select 
                name="status"
                value={formData.status}
                onChange={handleInputChange}
                style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #d1d5db' }}
              >
                <option value="ACTIVE">Aktif</option>
                <option value="ON_LEAVE">İzinli</option>
                <option value="INACTIVE">Pasif</option>
              </select>
           </div>

           <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '6px' }}>Atanacak Araç (Opsiyonel)</label>
              <select 
                name="vehicleId"
                value={formData.vehicleId}
                onChange={handleInputChange}
                style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #d1d5db' }}
              >
                <option value="">-- Araç Yok / Seçilmedi --</option>
                {Array.isArray(availableVehicles) && availableVehicles.map(vehicle => (
                  <option key={vehicle.id} value={vehicle.id}>
                    {vehicle.plate} - {vehicle.brand} {vehicle.model}
                  </option>
                ))}
              </select>
              <span style={{ fontSize: '11px', color: '#6b7280', marginTop: '2px', display: 'block' }}>
                Sadece boşta olan (sürücüsü olmayan) araçlar listelenir.
              </span>
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
             {formLoading ? 'Kaydediliyor...' : editingDriver ? 'Güncelle' : 'Oluştur'}
           </button>
        </form>
      </Modal>
    </Layout>
  );
}

export default Drivers;
