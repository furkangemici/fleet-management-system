import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import Icons from '../components/Icons';
import fineService from '../services/fineService';
import vehicleService from '../services/vehicleService';
import driverService from '../services/driverService';
import PaymentModal from '../components/PaymentModal';
import { exportToCSV } from '../utils/exportUtils';

function Fines() {
  const [fines, setFines] = useState([]);
  const [stats, setStats] = useState({ 
    totalCount: 0, 
    paidCount: 0, 
    unpaidCount: 0, 
    totalCost: 0, 
    paidCost: 0, 
    unpaidCost: 0 
  });
  
  // Filtreler
  const [filter, setFilter] = useState('ALL');
  const [search, setSearch] = useState('');
  const [dateFilter, setDateFilter] = useState('ALL'); // ALL, LAST_30_DAYS, THIS_MONTH, CUSTOM
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [selectedVehicleId, setSelectedVehicleId] = useState(''); // Filtre için araç ID
  const [selectedDriverId, setSelectedDriverId] = useState(''); // Filtre için sürücü ID
  
  // Data States
  const [loading, setLoading] = useState(false);
  const [vehicles, setVehicles] = useState([]);
  const [drivers, setDrivers] = useState([]);
  
  // Modal States
  const [showModal, setShowModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedFine, setSelectedFine] = useState(null); // Ödeme veya Düzenleme için seçilen ceza
  const [editingFine, setEditingFine] = useState(null); // Eğer düzenleme yapılıyorsa
  const [formError, setFormError] = useState('');

  const [formData, setFormData] = useState({
    vehicleId: '',
    driverId: '', // Seçilen araca göre otomatik gelir ama değiştirilebilir
    type: '',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    dueDate: '',
    location: '',
    description: ''
  });

  // ========== Yükleme Fonksiyonları ==========

  useEffect(() => {
    fetchVehicles();
    fetchDrivers();
  }, []);

  useEffect(() => {
    fetchFines();
  }, [filter, dateFilter, customStartDate, customEndDate, selectedVehicleId, selectedDriverId]);

  const fetchVehicles = async () => {
    try {
      const response = await vehicleService.getAllVehicles({ limit: 100 });
      
      let vehicleData = [];
      
      if (Array.isArray(response)) {
        vehicleData = response;
      } else if (response.data && Array.isArray(response.data)) {
        vehicleData = response.data;
      } else if (response.vehicles && Array.isArray(response.vehicles)) {
        vehicleData = response.vehicles;
      } else if (response.data?.vehicles && Array.isArray(response.data.vehicles)) {
        vehicleData = response.data.vehicles;
      } else if (response.items && Array.isArray(response.items)) {
        vehicleData = response.items;
      }

      setVehicles(vehicleData);
    } catch (error) {
      console.error('Araçlar yüklenemedi:', error);
    }
  };

  const fetchDrivers = async () => {
    try {
      // Driver servisi kullanarak sürücüleri çek
      // Eğer statik/mock ise direkt setDrivers
      // Gerçek implementasyonda:
      const response = await driverService.getAllDrivers({ limit: 100 });
      
      let driverData = [];
      
      if (Array.isArray(response)) {
        driverData = response;
      } else if (response.data && Array.isArray(response.data)) {
        driverData = response.data;
      } else if (response.drivers && Array.isArray(response.drivers)) {
        driverData = response.drivers;
      } else if (response.data?.drivers && Array.isArray(response.data.drivers)) {
        driverData = response.data.drivers;
      } else if (response.items && Array.isArray(response.items)) {
        driverData = response.items;
      }

      setDrivers(driverData);
    } catch (error) {
      console.error('Sürücüler yüklenemedi:', error);
    }
  };

  const fetchFines = async () => {
    setLoading(true);
    try {
      // Query Parametrelerini Hazırla
      const params = {};
      
      if (filter === 'PAID') params.isPaid = true;
      if (filter === 'UNPAID') params.isPaid = false;
      
      if (selectedVehicleId) params.vehicleId = selectedVehicleId;
      if (selectedDriverId) params.driverId = selectedDriverId;

      // Tarih Filtresi
      const today = new Date();
      if (dateFilter === 'LAST_30_DAYS') {
        const start = new Date();
        start.setDate(today.getDate() - 30);
        params.startDate = start.toISOString();
      } else if (dateFilter === 'THIS_MONTH') {
        const start = new Date(today.getFullYear(), today.getMonth(), 1);
        params.startDate = start.toISOString();
      } else if (dateFilter === 'CUSTOM' && customStartDate) {
        params.startDate = new Date(customStartDate).toISOString();
        if (customEndDate) {
          const end = new Date(customEndDate);
          end.setHours(23, 59, 59); // Gün sonu
          params.endDate = end.toISOString();
        }
      }

      // 1. Liste Çek
      const response = await fineService.getAllFines(params);
      
      let finesData = [];
      if (Array.isArray(response)) {
        finesData = response;
      } else if (response.fines && Array.isArray(response.fines)) {
        finesData = response.fines;
      } else if (response.data && Array.isArray(response.data)) {
        finesData = response.data;
      } else if (response.items && Array.isArray(response.items)) {
        finesData = response.items;
      }
      
      setFines(finesData);

      // 2. İstatistik Çek
      try {
        const statsResponse = await fineService.getStats(params);
        setStats(statsResponse.data || statsResponse); // Bazen data içinde gelebilir
      } catch (statsError) {
        console.error("İstatistikler alınamadı:", statsError);
        // Stats hatası ana akışı bozmasın
      }

    } catch (error) {
      console.error('Cezalar yüklenemedi:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    if (!window.confirm('Cezalar listesi dışa aktarılsın mı?')) return;

    const params = { limit: 10000 };
    if (filter === 'PAID') params.isPaid = true;
    if (filter === 'UNPAID') params.isPaid = false;
    if (selectedVehicleId) params.vehicleId = selectedVehicleId;
    if (selectedDriverId) params.driverId = selectedDriverId;

    const today = new Date();
    if (dateFilter === 'LAST_30_DAYS') {
      const start = new Date();
      start.setDate(today.getDate() - 30);
      params.startDate = start.toISOString();
    } else if (dateFilter === 'THIS_MONTH') {
      const start = new Date(today.getFullYear(), today.getMonth(), 1);
      params.startDate = start.toISOString();
    } else if (dateFilter === 'CUSTOM' && customStartDate) {
      params.startDate = new Date(customStartDate).toISOString();
      if (customEndDate) {
        const end = new Date(customEndDate);
        end.setHours(23, 59, 59);
        params.endDate = end.toISOString();
      }
    }

    try {
      const response = await fineService.getAllFines(params);
      let data = [];
      if (Array.isArray(response)) data = response;
      else if (response.fines && Array.isArray(response.fines)) data = response.fines;
      else if (response.data && Array.isArray(response.data)) data = response.data;
      else if (response.items && Array.isArray(response.items)) data = response.items;

      const exportData = data.map(item => ({
        'Plaka': item.vehicle?.plate || '-',
        'Sürücü': item.driver?.fullName || '-',
        'Ceza Tipi': item.type,
        'Tutar (TL)': item.amount,
        'Ceza Tarihi': item.date ? new Date(item.date).toLocaleDateString('tr-TR') : '-',
        'Konum': item.location || '',
        'Ödeme Durumu': item.isPaid ? 'Ödendi' : 'Ödenmedi',
        'Son Ödeme Tarihi': item.dueDate ? new Date(item.dueDate).toLocaleDateString('tr-TR') : '-',
        'Açıklama': item.description || ''
      }));

      if (exportData.length > 0) exportToCSV(exportData, 'trafik_cezalari');
      else alert('Veri yok');
    } catch (err) {
      console.error(err);
      alert('Dışa aktarma hatası');
    }
  };

  // ========== Form İşlemleri ==========

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    // Eğer araç seçildiyse, sürücüyü otomatik bul
    if (name === 'vehicleId') {
      const vehicle = vehicles.find(v => v.id.toString() === value.toString());
      if (vehicle && vehicle.driver) {
        setFormData(prev => ({ ...prev, driverId: vehicle.driver.id }));
      } else {
         // Araç değişti ama sürücüsü yoksa, driverId'yi temizle veya eski değerde bırak?
         // Temizlemek daha güvenli, yanlış sürücüye ceza yazılmasın
         setFormData(prev => ({ ...prev, driverId: '' }));
      }
    }
  };

  const handleOpenModal = (fine = null) => {
    setFormError('');
    if (fine) {
      setEditingFine(fine);
      setFormData({
        vehicleId: fine.vehicleId,
        driverId: fine.driverId || '',
        type: fine.type,
        amount: fine.amount,
        date: new Date(fine.date).toISOString().split('T')[0],
        dueDate: fine.dueDate ? new Date(fine.dueDate).toISOString().split('T')[0] : '',
        location: fine.location || '',
        description: fine.description || ''
      });
    } else {
      setEditingFine(null);
      setFormData({
        vehicleId: '',
        driverId: '',
        type: '',
        amount: '',
        date: new Date().toISOString().split('T')[0],
        dueDate: '',
        location: '',
        description: ''
      });
    }
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    try {
      const payload = {
        ...formData,
        vehicleId: parseInt(formData.vehicleId),
        driverId: formData.driverId ? parseInt(formData.driverId) : undefined,
        amount: parseFloat(formData.amount)
      };

      if (editingFine) {
        await fineService.updateFine(editingFine.id, payload);
      } else {
        await fineService.createFine(payload);
      }

      setShowModal(false);
      fetchFines(); // Listeyi yenile
    } catch (error) {
      setFormError(error.message || 'Bir hata oluştu');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Bu ceza kaydını silmek istediğinize emin misiniz?')) {
      try {
        await fineService.deleteFine(id);
        fetchFines();
      } catch (error) {
        alert('Silme işlemi başarısız');
      }
    }
  };

  // ========== Ödeme İşlemleri ==========

  const handleOpenPayment = (fine) => {
    // PaymentModal, 'maintenance' objesi bekliyor ve 'cost' alanına bakıyor.
    // Fine objesini PaymentModal'ın anlayacağı şekle map'liyoruz.
    const mappedFine = {
      ...fine,
      cost: fine.amount, // PaymentModal 'cost' kullanıyor
      // Diğer alanlar (isPaid, paidAt, paymentMethod, invoiceNo) zaten uyumlu (schema güncellemesi sonrası)
    };
    setSelectedFine(mappedFine);
    setShowPaymentModal(true);
  };

  const handlePaymentComplete = async (paymentData) => {
    if (!selectedFine) return;
    
    try {
      // Backend updateFine servisini kullanıyoruz
      // PaymentModal'dan isPaid, paidAt, paymentMethod, invoiceNo geliyor
      await fineService.updateFine(selectedFine.id, paymentData);
      
      setShowPaymentModal(false);
      fetchFines(); // Listeyi yenile
    } catch (error) {
      console.error('Ödeme güncellenemedi', error);
      throw error;
    }
  };

  return (
    <Layout>
      {/* Stats Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: '16px',
        marginBottom: '24px'
      }}>
        <div style={{ background: 'white', padding: '20px', borderRadius: '12px', border: '1px solid #e5e7eb' }}>
          <p style={{ fontSize: '13px', color: '#6b7280', marginBottom: '8px' }}>Toplam Ceza</p>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
            <span style={{ fontSize: '24px', fontWeight: 'bold', color: '#1f2937' }}>{stats.totalCount}</span>
            <span style={{ fontSize: '14px', color: '#6b7280' }}>Adet</span>
          </div>
          <p style={{ fontSize: '14px', fontWeight: '600', color: '#1f2937', marginTop: '4px' }}>
            ₺{stats.totalCost.toLocaleString('tr-TR')}
          </p>
        </div>

        <div style={{ background: 'white', padding: '20px', borderRadius: '12px', border: '1px solid #e5e7eb' }}>
          <p style={{ fontSize: '13px', color: '#dc2626', marginBottom: '8px' }}>Ödenmemiş</p>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
            <span style={{ fontSize: '24px', fontWeight: 'bold', color: '#dc2626' }}>{stats.unpaidCount}</span>
            <span style={{ fontSize: '14px', color: '#dc2626' }}>Adet</span>
          </div>
          <p style={{ fontSize: '14px', fontWeight: '600', color: '#dc2626', marginTop: '4px' }}>
            ₺{stats.unpaidCost.toLocaleString('tr-TR')}
          </p>
        </div>

        <div style={{ background: 'white', padding: '20px', borderRadius: '12px', border: '1px solid #e5e7eb' }}>
          <p style={{ fontSize: '13px', color: '#166534', marginBottom: '8px' }}>Ödenmiş</p>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
            <span style={{ fontSize: '24px', fontWeight: 'bold', color: '#166534' }}>{stats.paidCount}</span>
            <span style={{ fontSize: '14px', color: '#166534' }}>Adet</span>
          </div>
          <p style={{ fontSize: '14px', fontWeight: '600', color: '#166534', marginTop: '4px' }}>
            ₺{stats.paidCost.toLocaleString('tr-TR')}
          </p>
        </div>
        
        {/* Quick Filter Card could go here or blank */}
         <div style={{ background: '#eff6ff', padding: '20px', borderRadius: '12px', border: '1px solid #dbeafe', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
            <Icons.Info style={{width: 32, height: 32, color: '#3b82f6', marginBottom: 8}}/>
            <p style={{textAlign: 'center', fontSize: '13px', color: '#1e40af'}}>
                Ödemesi yaklaşan cezaları kontrol etmeyi unutmayın.
            </p>
         </div>
      </div>

      {/* Filters & Actions */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: '16px',
        marginBottom: '24px',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        {/* Sol Taraf: Filtreler */}
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', flex: 1 }}>
            {/* Status Tabs */}
            <div style={{ display: 'flex', background: '#f3f4f6', padding: '4px', borderRadius: '10px' }}>
                {[
                    { key: 'ALL', label: 'Tümü' },
                    { key: 'UNPAID', label: 'Ödenmemiş' },
                    { key: 'PAID', label: 'Ödendi' }
                ].map(tab => (
                    <button
                        key={tab.key}
                        onClick={() => setFilter(tab.key)}
                        style={{
                            padding: '8px 16px',
                            border: 'none',
                            background: filter === tab.key ? 'white' : 'transparent',
                            color: filter === tab.key ? '#1f2937' : '#6b7280',
                            fontWeight: filter === tab.key ? '600' : '500',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            fontSize: '13px',
                            boxShadow: filter === tab.key ? '0 1px 2px rgba(0,0,0,0.05)' : 'none',
                            transition: 'all 0.2s'
                        }}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Date Filters */}
            <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                style={{
                  padding: '8px 12px',
                  borderRadius: '10px',
                  border: '1px solid #e5e7eb',
                  fontSize: '13px',
                  color: '#374151',
                  background: 'white',
                  cursor: 'pointer'
                }}
            >
                <option value="ALL">Tüm Tarihler</option>
                <option value="THIS_MONTH">Bu Ay</option>
                <option value="LAST_30_DAYS">Son 30 Gün</option>
                <option value="CUSTOM">Özel Tarih</option>
            </select>

            {dateFilter === 'CUSTOM' && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'white', padding: '4px 8px', border: '1px solid #e5e7eb', borderRadius: '8px' }}>
                    <input type="date" value={customStartDate} onChange={e => setCustomStartDate(e.target.value)} style={{ border: 'none', fontSize: '13px', outline: 'none' }} />
                    <span style={{color: '#9ca3af'}}>→</span>
                    <input type="date" value={customEndDate} onChange={e => setCustomEndDate(e.target.value)} style={{ border: 'none', fontSize: '13px', outline: 'none' }} />
                </div>
            )}
            
            {/* Vehicle Filter */}
            <select
                value={selectedVehicleId}
                onChange={(e) => setSelectedVehicleId(e.target.value)}
                style={{
                  padding: '8px 12px',
                  borderRadius: '10px',
                  border: '1px solid #e5e7eb',
                  fontSize: '13px',
                  color: '#374151',
                  background: 'white',
                  cursor: 'pointer',
                  maxWidth: '150px'
                }}
            >
                <option value="">Tüm Araçlar</option>
                {vehicles.map(v => (
                    <option key={v.id} value={v.id}>{v.plate}</option>
                ))}
            </select>

            {/* Driver Filter */}
            <select
                value={selectedDriverId}
                onChange={(e) => setSelectedDriverId(e.target.value)}
                style={{
                  padding: '8px 12px',
                  borderRadius: '10px',
                  border: '1px solid #e5e7eb',
                  fontSize: '13px',
                  color: '#374151',
                  background: 'white',
                  cursor: 'pointer',
                  maxWidth: '150px'
                }}
            >
                <option value="">Tüm Sürücüler</option>
                {drivers.map(d => (
                    <option key={d.id} value={d.id}>{d.fullName}</option>
                ))}
            </select>
        </div>

        {/* Sağ Taraf: Buton */}
        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            onClick={handleExport}
            style={{
              padding: '10px 20px',
              background: 'white',
              color: '#374151',
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
            <Icons.TrendingUp /> Dışa Aktar
          </button>
          <button 
           onClick={() => handleOpenModal()}
           style={{
             padding: '10px 20px',
             background: '#2563eb',
             color: 'white',
             border: 'none',
             borderRadius: '10px',
             cursor: 'pointer',
             fontSize: '14px',
             fontWeight: '600',
             display: 'flex',
             alignItems: 'center',
             gap: '8px',
             boxShadow: '0 4px 6px -1px rgba(37, 99, 235, 0.2)'
           }}
           onMouseEnter={(e) => e.currentTarget.style.background = '#1d4ed8'}
           onMouseLeave={(e) => e.currentTarget.style.background = '#2563eb'}
        >
          <Icons.Plus />
          Yeni Ceza Ekle
        </button>
      </div>
    </div>

      {/* Table */}
      <div style={{
        background: 'white',
        borderRadius: '16px',
        overflow: 'hidden',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        border: '1px solid #f3f4f6'
      }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
              <th style={{ padding: '16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' }}>Araç / Sürücü</th>
              <th style={{ padding: '16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' }}>Ceza Türü</th>
              <th style={{ padding: '16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' }}>Tutar</th>
              <th style={{ padding: '16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' }}>Tarih / Konum</th>
              <th style={{ padding: '16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' }}>Durum</th>
              <th style={{ padding: '16px', textAlign: 'right', fontSize: '12px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' }}>İşlemler</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
                 <tr>
                    <td colSpan="6" style={{ padding: '40px', textAlign: 'center', color: '#6b7280' }}>
                        Yükleniyor...
                    </td>
                </tr>
            ) : fines.length === 0 ? (
                <tr>
                    <td colSpan="6" style={{ padding: '40px', textAlign: 'center', color: '#6b7280' }}>
                        Kayıt bulunamadı.
                    </td>
                </tr>
            ) : (
                fines.map(fine => (
              <tr key={fine.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                <td style={{ padding: '16px' }}>
                  <div style={{ fontWeight: '600', color: '#1f2937' }}>{fine.vehicle?.plate}</div>
                  <div style={{ fontSize: '13px', color: '#6b7280' }}>{fine.driver?.fullName || '-'}</div>
                </td>
                <td style={{ padding: '16px' }}>
                  <span style={{ 
                      padding: '4px 10px', 
                      background: '#f3f4f6', 
                      borderRadius: '12px', 
                      fontSize: '13px', 
                      fontWeight: '500',
                      color: '#374151'
                  }}>
                    {fine.type}
                  </span>
                </td>
                <td style={{ padding: '16px' }}>
                  <div style={{ fontWeight: '700', color: '#dc2626' }}>
                    ₺{fine.amount.toLocaleString('tr-TR')}
                  </div>
                </td>
                <td style={{ padding: '16px' }}>
                  <div style={{ fontSize: '14px', color: '#1f2937' }}>
                    {new Date(fine.date).toLocaleDateString('tr-TR')}
                  </div>
                  <div style={{ fontSize: '13px', color: '#9ca3af' }}>{fine.location}</div>
                </td>
                <td style={{ padding: '16px' }}>
                  {fine.isPaid ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                         <span style={{ 
                            display: 'inline-flex', alignItems: 'center', gap: '4px',
                            color: '#166534', background: '#dcfce7', 
                            padding: '4px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: '600', width: 'fit-content'
                        }}>
                            <Icons.Check style={{ width: 12, height: 12 }}/> Ödendi
                        </span>
                        {fine.paidAt && (
                            <span style={{ fontSize: '11px', color: '#6b7280' }}>{new Date(fine.paidAt).toLocaleDateString('tr-TR')}</span>
                        )}
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                        <span style={{ 
                            display: 'inline-flex', alignItems: 'center', gap: '4px',
                            color: '#991b1b', background: '#fee2e2', 
                            padding: '4px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: '600', width: 'fit-content'
                        }}>
                             Ödenmedi
                        </span>
                        {fine.dueDate && (
                            <span style={{ fontSize: '11px', color: '#dc2626', fontWeight: '500' }}>Son: {new Date(fine.dueDate).toLocaleDateString('tr-TR')}</span>
                        )}
                    </div>
                  )}
                </td>
                <td style={{ padding: '16px', textAlign: 'right' }}>
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                    {!fine.isPaid && (
                        <button
                            onClick={() => handleOpenPayment(fine)}
                            title="Ödeme Yap"
                            style={{
                                padding: '8px',
                                background: '#fef3c7',
                                border: '1px solid #fcd34d',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                color: '#b45309',
                                display: 'flex', alignItems: 'center', justifyContent: 'center'
                            }}
                        >
                            <span style={{ fontWeight: 'bold', fontSize: '14px' }}>₺</span>
                        </button>
                    )}
                    
                    <button
                        onClick={() => handleOpenModal(fine)}
                        title="Düzenle"
                        style={{
                            padding: '8px',
                            background: 'white',
                            border: '1px solid #e5e7eb',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            color: '#3b82f6',
                            display: 'flex', alignItems: 'center', justifyContent: 'center'
                        }}
                    >
                        <Icons.Edit />
                    </button>
                    
                    <button
                        onClick={() => handleDelete(fine.id)}
                        title="Sil"
                        style={{
                            padding: '8px',
                            background: 'white',
                            border: '1px solid #e5e7eb',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            color: '#ef4444',
                            display: 'flex', alignItems: 'center', justifyContent: 'center'
                        }}
                    >
                        <Icons.Delete />
                    </button>
                  </div>
                </td>
              </tr>
            )))}
          </tbody>
        </table>
      </div>

      {/* Edit/Create Modal */}
      {showModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
          <div style={{ background: 'white', borderRadius: '16px', width: '500px', padding: '24px', maxHeight: '90vh', overflowY: 'auto' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '20px', color: '#1f2937' }}>
              {editingFine ? 'Cezayı Düzenle' : 'Yeni Ceza Ekle'}
            </h2>

            {formError && (
              <div style={{ padding: '12px', background: '#fee2e2', color: '#991b1b', borderRadius: '8px', marginBottom: '16px', fontSize: '14px' }}>
                {formError}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '6px', color: '#374151' }}>Araç</label>
                <select
                  name="vehicleId"
                  value={formData.vehicleId}
                  onChange={handleInputChange}
                  required
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #d1d5db' }}
                >
                  <option value="">Araç Seçin</option>
                  {vehicles.map(v => (
                    <option key={v.id} value={v.id}>{v.plate} - {v.brand} {v.model}</option>
                  ))}
                </select>
              </div>

              {formData.vehicleId && (
                  <div style={{ marginBottom: '16px' }}>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '6px', color: '#374151' }}>Sürücü (Opsiyonel)</label>
                    <select
                      name="driverId"
                      value={formData.driverId}
                      onChange={handleInputChange}
                      style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #d1d5db' }}
                    >
                      <option value="">Sürücü Yok</option>
                      {/* Burada tüm sürücüleri listelemek gerekebilir ama şimdilik sadece aracın sürücüsü gelmesini bekleyelim veya basit tutalım. 
                          Daha iyisi: Tüm sürücü listesi fetch edilip buraya konulabilir. */}
                      {/* Basitlik için sadece aracın o anki sürücüsü varsa onu gösterelim, 
                          fakat kullanıcı değiştirmek isterse farklı bir API call gerekebilir.
                          Şimdilik "Sürücü Yok" veya "Otomatik" gibi davranıyoruz.
                          
                          Geliştirme: Tüm sürücüler listelenmeli.
                      */}
                      {vehicles.find(v => v.id.toString() === formData.vehicleId.toString())?.driver && (
                          <option value={vehicles.find(v => v.id.toString() === formData.vehicleId.toString()).driver.id}>
                              {vehicles.find(v => v.id.toString() === formData.vehicleId.toString()).driver.fullName}
                          </option>
                      )}
                    </select>
                    <p style={{fontSize: '11px', color: '#6b7280', marginTop: '4px'}}>
                        Araç seçildiğinde o anki sürücü otomatik seçilir.
                    </p>
                  </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                <div>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '6px', color: '#374151' }}>Ceza Türü</label>
                    <input
                    name="type"
                    value={formData.type}
                    onChange={handleInputChange}
                    placeholder="Örn: Hız Sınırı"
                    required
                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #d1d5db' }}
                    />
                </div>
                <div>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '6px', color: '#374151' }}>Tutar (TL)</label>
                    <input
                    type="number"
                    name="amount"
                    value={formData.amount}
                    onChange={handleInputChange}
                    required
                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #d1d5db' }}
                    />
                </div>
              </div>

               <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                <div>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '6px', color: '#374151' }}>Ceza Tarihi</label>
                    <input
                    type="date"
                    name="date"
                    value={formData.date}
                    onChange={handleInputChange}
                    required
                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #d1d5db' }}
                    />
                </div>
                <div>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '6px', color: '#374151' }}>Son Ödeme Tarihi</label>
                    <input
                    type="date"
                    name="dueDate"
                    value={formData.dueDate}
                    onChange={handleInputChange}
                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #d1d5db' }}
                    />
                </div>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '6px', color: '#374151' }}>Konum</label>
                <input
                  name="location"
                  value={formData.location}
                  onChange={handleInputChange}
                  placeholder="Ceza yenilen yer"
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #d1d5db' }}
                />
              </div>

              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '6px', color: '#374151' }}>Açıklama</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows="3"
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #d1d5db' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  style={{ flex: 1, padding: '12px', background: 'white', border: '1px solid #d1d5db', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' }}
                >
                  İptal
                </button>
                <button
                  type="submit"
                  style={{ flex: 1, padding: '12px', background: '#2563eb', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' }}
                >
                  Kaydet
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      <PaymentModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        maintenance={selectedFine} // Fine objesini maintenance props'u olarak gönderiyoruz
        onPaymentComplete={handlePaymentComplete}
      />
    </Layout>
  );
}

export default Fines;
