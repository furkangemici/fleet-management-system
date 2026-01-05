import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import Icons from '../components/Icons';
import maintenanceService from '../services/maintenanceService';
import vehicleService from '../services/vehicleService';
import driverService from '../services/driverService';
import PaymentModal from '../components/PaymentModal';
import { exportToCSV } from '../utils/exportUtils';

function Maintenance() {
  const [maintenances, setMaintenances] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [drivers, setDrivers] = useState([]); // Yeni: Sürücüler
  
  // -- Filtreler --
  const [filter, setFilter] = useState('ALL'); // Status Filter
  const [paymentFilter, setPaymentFilter] = useState('ALL'); // Yeni: Ödeme Filtresi
  const [dateFilter, setDateFilter] = useState('ALL'); 
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [selectedVehicleId, setSelectedVehicleId] = useState(''); // Yeni: Araç Filtresi
  const [selectedDriverId, setSelectedDriverId] = useState(''); // Yeni: Sürücü Filtresi
  
  // -- Stats --
  const [stats, setStats] = useState({ 
    totalCount: 0, 
    paidCount: 0, 
    unpaidCount: 0, 
    totalCost: 0, 
    paidCost: 0, 
    unpaidCost: 0 
  });

  const [showModal, setShowModal] = useState(false);
  const [editingMaintenance, setEditingMaintenance] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedMaintenance, setSelectedMaintenance] = useState(null);
  const [error, setError] = useState('');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentMaintenance, setPaymentMaintenance] = useState(null);

  const [formData, setFormData] = useState({
    vehicleId: '',
    type: 'PERIODIC',
    description: '',
    date: new Date().toISOString().split('T')[0],
    cost: '',
    service: '',
    notes: '',
    status: 'PLANNED',
    nextKm: '',
    nextDate: '',
    // Ödeme bilgileri
    isPaid: false,
    paidAt: '',
    paymentMethod: '',
    invoiceNo: ''
  });

  // Türkiye'deki gerçek araç bakım kategorileri ve fiyatları
  const maintenancePresets = {
    PERIODIC: [
      { name: 'Motor Yağı Değişimi (Sentetik)', cost: 1500, interval: '15.000 km' },
      { name: 'Motor Yağı Değişimi (Mineral)', cost: 800, interval: '10.000 km' },
      { name: 'Yağ + Yağ Filtresi Değişimi', cost: 2500, interval: '15.000 km' },
      { name: 'Hava Filtresi Değişimi', cost: 450, interval: '20.000 km' },
      { name: 'Polen Filtresi Değişimi', cost: 350, interval: '15.000 km' },
      { name: 'Yakıt Filtresi Değişimi', cost: 600, interval: '30.000 km' },
      { name: 'Periyodik Bakım (10.000 km)', cost: 3500, interval: '10.000 km' },
      { name: 'Periyodik Bakım (15.000 km)', cost: 4000, interval: '15.000 km' },
      { name: 'Periyodik Bakım (20.000 km)', cost: 4500, interval: '20.000 km' },
      { name: 'Periyodik Bakım (30.000 km)', cost: 5500, interval: '30.000 km' }
    ],
    HEAVY_MAINTENANCE: [
      { name: 'Triger Seti Değişimi (Kayış)', cost: 5500, interval: '60.000 km' },
      { name: 'Triger Seti Değişimi (Zincir)', cost: 7500, interval: '90.000 km' },
      { name: 'V Kayışı Değişimi', cost: 1200, interval: '60.000 km' },
      { name: 'Devirdaim Pompası Değişimi', cost: 3500, interval: '90.000 km' },
      { name: 'Şanzıman Yağı Değişimi (Manuel)', cost: 2800, interval: '60.000 km' },
      { name: 'Şanzıman Yağı Değişimi (Otomatik)', cost: 4500, interval: '60.000 km' },
      { name: 'Buji Değişimi (Takım)', cost: 1800, interval: '30.000 km' },
      { name: 'Debriyaj Seti Değişimi', cost: 8500, interval: '80.000 km' },
      { name: 'Enjektör Temizleme', cost: 2500, interval: '40.000 km' }
    ],
    BRAKE_SYSTEM: [
      { name: 'Fren Balatası Değişimi (Ön)', cost: 2200, interval: 'Kritik' },
      { name: 'Fren Balatası Değişimi (Arka)', cost: 1800, interval: 'Kritik' },
      { name: 'Fren Diski Değişimi (Ön)', cost: 4800, interval: 'Kritik' },
      { name: 'Fren Diski Değişimi (Arka)', cost: 3500, interval: 'Kritik' },
      { name: 'Fren Hidroliği Yenileme', cost: 1500, interval: 'Kritik' },
      { name: 'El Freni Ayarı', cost: 450, interval: 'Kritik' },
      { name: 'ABS Sensör Değişimi', cost: 2800, interval: 'Kritik' }
    ],
    INSPECTION_PREP: [
      { name: 'TÜVTÜRK Muayene Ücreti', cost: 850, interval: 'Yıllık' },
      { name: 'Muayene Öncesi Genel Kontrol', cost: 1200, interval: 'Yıllık' },
      { name: 'Far Ayarı', cost: 350, interval: 'Muayene' },
      { name: 'Egzoz Emisyon Testi', cost: 350, interval: 'Muayene' },
      { name: 'Alt Takım Kontrolü', cost: 800, interval: 'Muayene' },
      { name: 'Fren Test Cihazı', cost: 250, interval: 'Muayene' }
    ],
    SEASONAL: [
      { name: 'Antifriz Kontrolü ve Değişimi', cost: 650, interval: 'Kış' },
      { name: 'Silecek Değişimi (Takım)', cost: 450, interval: 'Mevsimsel' },
      { name: 'Akü Ölçümü ve Bakımı', cost: 350, interval: 'Kış' },
      { name: 'Akü Değişimi', cost: 2500, interval: '3-4 Yıl' },
      { name: 'Lastik Değişimi (Kışlık - Takım)', cost: 8500, interval: 'Kış' },
      { name: 'Lastik Değişimi (Yazlık - Takım)', cost: 7500, interval: 'Yaz' },
      { name: 'Klima Bakımı + Gaz Dolumu', cost: 1200, interval: 'Yaz' },
      { name: 'Klima Filtresi Değişimi', cost: 550, interval: 'Yaz' }
    ]
  };

  useEffect(() => {
    fetchVehicles();
    fetchDrivers();
  }, []);

  useEffect(() => {
    fetchMaintenances();
  }, [filter, paymentFilter, dateFilter, customStartDate, customEndDate, selectedVehicleId, selectedDriverId]);

  const fetchDrivers = async () => {
    try {
      const response = await driverService.getAllDrivers({ limit: 100 });
      let data = [];
      if (Array.isArray(response)) data = response;
      else if (response.data && Array.isArray(response.data)) data = response.data;
      else if (response.drivers && Array.isArray(response.drivers)) data = response.drivers;
      else if (response.data?.drivers) data = response.data.drivers;
      else if (response.items) data = response.items;
      setDrivers(data);
    } catch (error) {
      console.error('Sürücüler yüklenemedi:', error);
    }
  };

  const fetchMaintenances = async () => {
    try {
      setLoading(true);
      const params = { limit: 100 };
      
      // Filtreler
      if (filter !== 'ALL') params.status = filter;
      if (paymentFilter === 'PAID') params.isPaid = true;
      if (paymentFilter === 'UNPAID') params.isPaid = false;
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

      // Maintenances Fetch
      const response = await maintenanceService.getAllMaintenances(params);
      
      let maintenanceData = [];
      if (Array.isArray(response)) maintenanceData = response;
      else if (response.data && Array.isArray(response.data)) maintenanceData = response.data;
      else if (response.maintenances) maintenanceData = response.maintenances;
      else if (response.data?.maintenances) maintenanceData = response.data.maintenances;
      else if (response.items) maintenanceData = response.items;
      
      setMaintenances(maintenanceData);

      // Stats Fetch
      try {
        const statsResponse = await maintenanceService.getMaintenanceStats(params);
        setStats(statsResponse.data || statsResponse);
      } catch (err) {
        console.error("Stats error", err);
      }

    } catch (error) {
      console.error('Bakım kayıtları yüklenemedi:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchVehicles = async () => {
    try {
      const response = await vehicleService.getAllVehicles({ limit: 100 });
      let vehicleData = [];
      if (Array.isArray(response)) vehicleData = response;
      else if (response.data && Array.isArray(response.data)) vehicleData = response.data;
      else if (response.vehicles) vehicleData = response.vehicles;
      else if (response.data?.vehicles) vehicleData = response.data.vehicles;
      else if (response.items) vehicleData = response.items;
      
      setVehicles(vehicleData);
    } catch (error) {
      console.error('Araçlar yüklenemedi:', error);
    }
  };

  const handlePayment = async (data) => {
    try {
      if (!paymentMaintenance) return;
      
      const updateData = {
        isPaid: data.isPaid,
        paidAt: data.paidAt ? new Date(data.paidAt).toISOString() : null,
        paymentMethod: data.paymentMethod,
        invoiceNo: data.invoiceNo
      };

      await maintenanceService.updateMaintenance(paymentMaintenance.id, updateData);
      
      // Listeyi güncelle
      fetchMaintenances();
      
      // Modal'ı kapat
      setShowPaymentModal(false);
      setPaymentMaintenance(null);
    } catch (error) {
      console.error('Ödeme güncellenemedi:', error);
      alert('Ödeme güncellenemedi');
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handlePresetSelect = (preset) => {
    setFormData(prev => ({
      ...prev,
      description: preset.name,
      cost: preset.cost
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Form validasyonu
      if (!formData.vehicleId) {
        setError('Lütfen bir araç seçin');
        setLoading(false);
        return;
      }

      if (!formData.cost || parseFloat(formData.cost) <= 0) {
        setError('Lütfen geçerli bir maliyet girin');
        setLoading(false);
        return;
      }

      if (!formData.service || formData.service.trim() === '') {
        setError('Lütfen servis adını girin');
        setLoading(false);
        return;
      }

      if (!formData.date) {
        setError('Lütfen bakım tarihini seçin');
        setLoading(false);
        return;
      }

      const submitData = {
        vehicleId: parseInt(formData.vehicleId),
        type: formData.type,
        description: formData.description || '',
        date: formData.date,
        cost: parseFloat(formData.cost),
        service: formData.service.trim(),
        notes: formData.notes?.trim() || undefined,
        status: formData.status,
        nextKm: formData.nextKm ? parseInt(formData.nextKm) : undefined,
        nextDate: formData.nextDate || undefined
      };

      if (editingMaintenance) {
        await maintenanceService.updateMaintenance(editingMaintenance.id, submitData);
      } else {
        await maintenanceService.createMaintenance(submitData);
      }

      await fetchMaintenances();
      handleCloseModal();
    } catch (error) {
      console.error('Bakım kaydı kaydedilemedi:', error);
      
      // Kullanıcı dostu hata mesajları
      let errorMessage = 'Bakım kaydı kaydedilemedi. Lütfen tekrar deneyin.';
      
      // Backend'den gelen özel mesajı kontrol et
      if (error.response?.data?.message) {
        const backendMessage = error.response.data.message;
        
        // Teknik mesajları kullanıcı dostu hale getir
        if (backendMessage.includes('Endpoint') || backendMessage.includes('endpoint')) {
          errorMessage = 'Sistem şu anda bakım kaydı eklemeyi desteklemiyor. Lütfen sistem yöneticisiyle iletişime geçin.';
        } else if (backendMessage.includes('Token') || backendMessage.includes('token')) {
          errorMessage = 'Oturum süreniz dolmuş. Lütfen tekrar giriş yapın.';
        } else if (backendMessage.includes('validation') || backendMessage.includes('geçersiz')) {
          errorMessage = 'Girdiğiniz bilgiler geçersiz. Lütfen kontrol edip tekrar deneyin.';
        } else {
          // Backend'den gelen mesaj anlaşılırsa direkt göster
          errorMessage = backendMessage;
        }
      } 
      // HTTP status kodlarına göre mesajlar
      else if (error.response?.status === 404) {
        errorMessage = 'Seçilen araç bulunamadı. Lütfen farklı bir araç seçin.';
      } else if (error.response?.status === 401) {
        errorMessage = 'Oturum süreniz dolmuş. Lütfen sayfayı yenileyip tekrar giriş yapın.';
      } else if (error.response?.status === 400) {
        errorMessage = 'Lütfen tüm zorunlu alanları eksiksiz doldurun.';
      } else if (error.response?.status === 500) {
        errorMessage = 'Sunucuda bir hata oluştu. Lütfen daha sonra tekrar deneyin.';
      } else if (error.response?.status === 503) {
        errorMessage = 'Sistem şu anda bakım modunda. Lütfen daha sonra tekrar deneyin.';
      } else if (error.message && !error.message.includes('Network')) {
        errorMessage = error.message;
      } else if (error.message?.includes('Network')) {
        errorMessage = 'İnternet bağlantınızı kontrol edin ve tekrar deneyin.';
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (maintenance) => {
    setEditingMaintenance(maintenance);
    setFormData({
      vehicleId: maintenance.vehicleId.toString(),
      type: maintenance.type,
      description: maintenance.description || '',
      date: new Date(maintenance.date).toISOString().split('T')[0],
      cost: maintenance.cost.toString(),
      service: maintenance.service,
      notes: maintenance.notes || '',
      status: maintenance.status,
      nextKm: maintenance.nextKm?.toString() || '',
      nextDate: maintenance.nextDate ? new Date(maintenance.nextDate).toISOString().split('T')[0] : ''
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Bu bakım kaydını silmek istediğinizden emin misiniz?')) {
      return;
    }

    try {
      setLoading(true);
      await maintenanceService.deleteMaintenance(id);
      await fetchMaintenances();
    } catch (error) {
      console.error('Bakım kaydı silinemedi:', error);
      alert('Hata: Bakım kaydı silinemedi');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    if (!window.confirm('Listelenen bakım kayıtları dışa aktarılsın mı?')) return;

    const params = { limit: 10000 };
    if (filter !== 'ALL') params.status = filter;
    if (paymentFilter === 'PAID') params.isPaid = true;
    if (paymentFilter === 'UNPAID') params.isPaid = false;
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
      const response = await maintenanceService.getAllMaintenances(params);
      let data = [];
      if (Array.isArray(response)) data = response;
      else if (response.data && Array.isArray(response.data)) data = response.data;
      else if (response.maintenances) data = response.maintenances;
      else if (response.data?.maintenances) data = response.data.maintenances;
      else if (response.items) data = response.items;

      const exportData = data.map(item => ({
        'Plaka': item.vehicle?.plate || '-',
        'Sürücü': item.vehicle?.driver?.fullName || '-',
        'Bakım Tipi': getTypeStyle(item.type).label,
        'Açıklama': item.description || '',
        'Tarih': item.date ? new Date(item.date).toLocaleDateString('tr-TR') : '-',
        'Maliyet (TL)': item.cost,
        'Servis': item.service || '',
        'Durum': getStatusStyle(item.status).label,
        'Ödeme Durumu': item.isPaid ? 'Ödendi' : 'Ödenmedi',
        'Notlar': item.notes || ''
      }));

      if (exportData.length > 0) exportToCSV(exportData, 'bakim_kayitlari');
      else alert('Veri yok');
    } catch (err) {
      console.error(err);
      alert('Dışa aktarma hatası');
    }
  };



  const handleCloseModal = () => {
    setShowModal(false);
    setEditingMaintenance(null);
    setError('');
    setFormData({
      vehicleId: '',
      type: 'PERIODIC',
      description: '',
      date: new Date().toISOString().split('T')[0],
      cost: '',
      service: '',
      notes: '',
      status: 'PLANNED',
      nextKm: '',
      nextDate: ''
    });
  };

  const handleShowDetail = (maintenance) => {
    setSelectedMaintenance(maintenance);
    setShowDetailModal(true);
  };

  const getTypeStyle = (type) => {
    const styles = {
      PERIODIC: { bg: '#eff6ff', text: '#1e40af', label: 'Periyodik Bakım' },
      HEAVY_MAINTENANCE: { bg: '#fef3c7', text: '#92400e', label: 'Ağır Bakım' },
      BRAKE_SYSTEM: { bg: '#fef2f2', text: '#991b1b', label: 'Fren Sistemi' },
      INSPECTION_PREP: { bg: '#f0fdf4', text: '#166534', label: 'Muayene Hazırlık' },
      SEASONAL: { bg: '#f3e8ff', text: '#6b21a8', label: 'Mevsimsel' }
    };
    return styles[type] || styles.PERIODIC;
  };

  const getStatusStyle = (status) => {
    const styles = {
      PLANNED: { bg: '#fffbeb', text: '#92400e', label: 'Planlandı', icon: <Icons.Calendar /> },
      IN_PROGRESS: { bg: '#eff6ff', text: '#1e40af', label: 'Devam Ediyor', icon: <Icons.Maintenance /> },
      COMPLETED: { bg: '#f0fdf4', text: '#166534', label: 'Tamamlandı', icon: <Icons.Check /> },
      CANCELLED: { bg: '#fef2f2', text: '#991b1b', label: 'İptal', icon: <Icons.Close /> }
    };
    return styles[status] || styles.PLANNED;
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
          <p style={{ fontSize: '13px', color: '#6b7280', marginBottom: '8px' }}>Toplam Bakım</p>
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

        <div style={{ background: '#eff6ff', padding: '20px', borderRadius: '12px', border: '1px solid #dbeafe', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
            <Icons.Info style={{width: 32, height: 32, color: '#3b82f6', marginBottom: 8}}/>
            <p style={{textAlign: 'center', fontSize: '13px', color: '#1e40af'}}>
                Düzenli bakım, araç ömrünü uzatır ve maliyetleri düşürür.
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
            
            {/* Payment Status Tabs */}
            <div style={{ display: 'flex', background: '#f3f4f6', padding: '4px', borderRadius: '10px' }}>
                {[
                    { key: 'ALL', label: 'Tümü' },
                    { key: 'UNPAID', label: 'Ödenmemiş' },
                    { key: 'PAID', label: 'Ödendi' }
                ].map(tab => (
                    <button
                        key={tab.key}
                        onClick={() => setPaymentFilter(tab.key)}
                        style={{
                            padding: '8px 16px',
                            border: 'none',
                            background: paymentFilter === tab.key ? 'white' : 'transparent',
                            color: paymentFilter === tab.key ? '#1f2937' : '#6b7280',
                            fontWeight: paymentFilter === tab.key ? '600' : '500',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            fontSize: '13px',
                            boxShadow: paymentFilter === tab.key ? '0 1px 2px rgba(0,0,0,0.05)' : 'none',
                            transition: 'all 0.2s'
                        }}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Maintenance Status Filter */}
            <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
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
                <option value="ALL">Tüm Durumlar</option>
                <option value="PLANNED">Planlandı</option>
                <option value="IN_PROGRESS">Devam Ediyor</option>
                <option value="COMPLETED">Tamamlandı</option>
                <option value="CANCELLED">İptal</option>
            </select>

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


        </div>

        {/* Action Button */}
        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            onClick={handleExport}
            style={{
              padding: '10px 20px',
              background: 'white',
              color: '#374151',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <Icons.TrendingUp /> Dışa Aktar
          </button>
          <button 
             onClick={async () => {
               await fetchVehicles(); // Her zaman yeniden yükle
               setShowModal(true);
             }}
             style={{
             padding: '10px 20px',
             background: 'linear-gradient(135deg, #1e40af 0%, #3b82f6 100%)',
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
        >
          <Icons.Plus />
          Yeni Bakım Ekle
        </button>
      </div>
    </div>


      {/* Maintenance Table */}
      <div style={{
        background: 'white',
        borderRadius: '16px',
        overflow: 'hidden',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        border: '1px solid #f3f4f6'
      }}>
        {loading && maintenances.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#6b7280' }}>
            Yükleniyor...
          </div>
        ) : maintenances.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#6b7280' }}>
            Bakım kaydı bulunamadı
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                <th style={{ padding: '16px', textAlign: 'left', fontSize: '13px', fontWeight: '600', color: '#6b7280' }}>ARAÇ / SÜRÜCÜ</th>
                <th style={{ padding: '16px', textAlign: 'left', fontSize: '13px', fontWeight: '600', color: '#6b7280' }}>TİP</th>
                <th style={{ padding: '16px', textAlign: 'left', fontSize: '13px', fontWeight: '600', color: '#6b7280' }}>AÇIKLAMA</th>
                <th style={{ padding: '16px', textAlign: 'left', fontSize: '13px', fontWeight: '600', color: '#6b7280' }}>TARİH</th>
                <th style={{ padding: '16px', textAlign: 'left', fontSize: '13px', fontWeight: '600', color: '#6b7280' }}>MALİYET</th>
                <th style={{ padding: '16px', textAlign: 'left', fontSize: '13px', fontWeight: '600', color: '#6b7280' }}>SERVİS</th>
                <th style={{ padding: '16px', textAlign: 'left', fontSize: '13px', fontWeight: '600', color: '#6b7280' }}>DURUM</th>
                <th style={{ padding: '16px', textAlign: 'center', fontSize: '13px', fontWeight: '600', color: '#6b7280' }}>ÖDEME</th>
                <th style={{ padding: '16px', textAlign: 'center', fontSize: '13px', fontWeight: '600', color: '#6b7280' }}>İŞLEMLER</th>
              </tr>
            </thead>
            <tbody>
              {maintenances.map((maintenance) => {
                const typeStyle = getTypeStyle(maintenance.type);
                const statusStyle = getStatusStyle(maintenance.status);
                const vehicle = maintenance.vehicle;
                const driver = maintenance.driver; 
                
                return (
                  <tr
                    key={maintenance.id}
                    style={{ borderBottom: '1px solid #f3f4f6' }}
                    onMouseEnter={(e) => e.currentTarget.style.background = '#f9fafb'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'white'}
                  >
                    <td style={{ padding: '16px' }}>
                      <div style={{ fontSize: '15px', fontWeight: '700', color: '#1f2937' }}>
                        {vehicle?.plate || 'N/A'}
                      </div>
                      {driver && (
                        <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '2px' }}>
                          {driver.fullName}
                        </div>
                      )}
                    </td>
                    <td style={{ padding: '16px' }}>
                      <span style={{
                        padding: '6px 12px',
                        background: typeStyle.bg,
                        color: typeStyle.text,
                        borderRadius: '8px',
                        fontSize: '13px',
                        fontWeight: '600'
                      }}>
                        {typeStyle.label}
                      </span>
                    </td>
                    <td style={{ padding: '16px' }}>
                      <span style={{ fontSize: '14px', color: '#1f2937' }}>
                        {maintenance.description || '-'}
                      </span>
                    </td>
                    <td style={{ padding: '16px' }}>
                      <span style={{ fontSize: '14px', color: '#6b7280' }}>
                        {new Date(maintenance.date).toLocaleDateString('tr-TR')}
                      </span>
                    </td>
                    <td style={{ padding: '16px' }}>
                      <span style={{ fontSize: '15px', fontWeight: '600', color: '#1f2937' }}>
                        ₺{maintenance.cost.toLocaleString('tr-TR')}
                      </span>
                    </td>
                    <td style={{ padding: '16px' }}>
                      <span style={{ fontSize: '14px', color: '#6b7280' }}>
                        {maintenance.service}
                      </span>
                    </td>
                    <td style={{ padding: '16px' }}>
                      <span style={{
                        padding: '6px 12px',
                        background: statusStyle.bg,
                        color: statusStyle.text,
                        borderRadius: '8px',
                        fontSize: '13px',
                        fontWeight: '600',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}>
                        <span style={{ width: 16, height: 16, display: 'flex' }}>{statusStyle.icon}</span>
                        {statusStyle.label}
                      </span>
                    </td>
                    <td style={{ padding: '16px', textAlign: 'center' }}>
                      {maintenance.isPaid ? (
                        <span style={{
                          padding: '6px 12px',
                          background: '#dcfce7',
                          borderRadius: '8px',
                          fontSize: '13px',
                          fontWeight: '600',
                          color: '#166534',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px'
                        }}>
                          ✓ Ödendi
                        </span>
                      ) : (
                        <button
                          onClick={() => {
                            setPaymentMaintenance(maintenance);
                            setShowPaymentModal(true);
                          }}
                          style={{
                            padding: '6px 12px',
                            background: '#fef3c7',
                            border: 'none',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            fontSize: '13px',
                            fontWeight: '600',
                            color: '#92400e',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            transition: 'all 0.2s'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.transform = 'scale(1.05)';
                            e.currentTarget.style.background = '#fde68a';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'scale(1)';
                            e.currentTarget.style.background = '#fef3c7';
                          }}
                        >
                          ₺ Öde
                        </button>
                      )}
                    </td>
                    <td style={{ padding: '16px', textAlign: 'center' }}>
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                        <button 
                          onClick={() => handleShowDetail(maintenance)}
                          title="Detay"
                          style={{
                            padding: '8px',
                            background: 'transparent',
                            border: '1px solid #e5e7eb',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            color: '#3b82f6',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'all 0.2s'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = '#eff6ff';
                            e.currentTarget.style.borderColor = '#3b82f6';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'transparent';
                            e.currentTarget.style.borderColor = '#e5e7eb';
                          }}
                        >
                          <Icons.Info />
                        </button>
                        <button 
                          onClick={() => handleEdit(maintenance)}
                          title="Düzenle"
                          style={{
                            padding: '8px',
                            background: 'transparent',
                            border: '1px solid #e5e7eb',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            color: '#f59e0b',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'all 0.2s'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = '#fef3c7';
                            e.currentTarget.style.borderColor = '#f59e0b';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'transparent';
                            e.currentTarget.style.borderColor = '#e5e7eb';
                          }}
                        >
                          <Icons.Edit />
                        </button>
                        <button 
                          onClick={() => handleDelete(maintenance.id)}
                          title="Sil"
                          style={{
                            padding: '8px',
                            background: 'transparent',
                            border: '1px solid #e5e7eb',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            color: '#ef4444',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'all 0.2s'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = '#fef2f2';
                            e.currentTarget.style.borderColor = '#ef4444';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'transparent';
                            e.currentTarget.style.borderColor = '#e5e7eb';
                          }}
                        >
                          <Icons.Delete />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px'
        }}>
          <div style={{
            background: 'white',
            borderRadius: '16px',
            maxWidth: '900px',
            width: '100%',
            maxHeight: '90vh',
            overflow: 'auto',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)'
          }}>
            <div style={{
              padding: '24px',
              borderBottom: '1px solid #e5e7eb',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: '#1f2937' }}>
                {editingMaintenance ? 'Bakım Kaydını Düzenle' : 'Yeni Bakım Kaydı'}
              </h2>
              <button
                onClick={handleCloseModal}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '24px',
                  cursor: 'pointer',
                  color: '#6b7280',
                  padding: '0',
                  width: '32px',
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                ×
              </button>
            </div>

            {/* Error Alert */}
            {error && (
              <div style={{
                margin: '24px 24px 0 24px',
                padding: '16px',
                background: '#fef2f2',
                border: '1px solid #fee2e2',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
              }}>
                <div style={{
                  width: '20px',
                  height: '20px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#dc2626'
                }}>
                  <Icons.Alert />
                </div>
                <span style={{ color: '#991b1b', fontSize: '14px', fontWeight: '500' }}>
                  {error}
                </span>
              </div>
            )}

            <form onSubmit={handleSubmit} style={{ padding: '24px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                {/* Sol Kolon */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#374151', marginBottom: '8px' }}>
                      Araç *
                    </label>
                    <select
                      name="vehicleId"
                      value={formData.vehicleId}
                      onChange={handleInputChange}
                      required
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        border: '1px solid #d1d5db',
                        borderRadius: '8px',
                        fontSize: '14px',
                        color: '#1f2937'
                      }}
                    >
                      <option value="">
                        {loading ? 'Araçlar yükleniyor...' : vehicles.length === 0 ? 'Araç bulunamadı' : 'Araç Seçin'}
                      </option>
                      {Array.isArray(vehicles) && vehicles.map(vehicle => (
                        <option key={vehicle.id} value={vehicle.id}>
                          {vehicle.plate} - {vehicle.brand} {vehicle.model}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#374151', marginBottom: '8px' }}>
                      Bakım Tipi *
                    </label>
                    <select
                      name="type"
                      value={formData.type}
                      onChange={handleInputChange}
                      required
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        border: '1px solid #d1d5db',
                        borderRadius: '8px',
                        fontSize: '14px',
                        color: '#1f2937'
                      }}
                    >
                      <option value="PERIODIC">Periyodik Bakım (Her 10-20bin km)</option>
                      <option value="HEAVY_MAINTENANCE">Ağır Bakım (60-90bin km)</option>
                      <option value="BRAKE_SYSTEM">Fren Sistemi (Kritik)</option>
                      <option value="INSPECTION_PREP">Muayene Hazırlık</option>
                      <option value="SEASONAL">Mevsimsel Bakım</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#374151', marginBottom: '8px' }}>
                      Hızlı Seçim
                    </label>
                    <select
                      onChange={(e) => {
                        const preset = maintenancePresets[formData.type]?.find(p => p.name === e.target.value);
                        if (preset) handlePresetSelect(preset);
                      }}
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        border: '1px solid #d1d5db',
                        borderRadius: '8px',
                        fontSize: '14px',
                        color: '#1f2937',
                        background: '#f9fafb'
                      }}
                    >
                      <option value="">Hazır şablonlardan seçin...</option>
                      {maintenancePresets[formData.type]?.map((preset, idx) => (
                        <option key={idx} value={preset.name}>
                          {preset.name} - ₺{preset.cost.toLocaleString('tr-TR')} ({preset.interval})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#374151', marginBottom: '8px' }}>
                      Açıklama
                    </label>
                    <textarea
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      rows={3}
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        border: '1px solid #d1d5db',
                        borderRadius: '8px',
                        fontSize: '14px',
                        color: '#1f2937',
                        resize: 'vertical'
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#374151', marginBottom: '8px' }}>
                      Tarih *
                    </label>
                    <input
                      type="date"
                      name="date"
                      value={formData.date}
                      onChange={handleInputChange}
                      required
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        border: '1px solid #d1d5db',
                        borderRadius: '8px',
                        fontSize: '14px',
                        color: '#1f2937'
                      }}
                    />
                  </div>
                </div>

                {/* Sağ Kolon */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#374151', marginBottom: '8px' }}>
                      Maliyet (₺) *
                    </label>
                    <input
                      type="number"
                      name="cost"
                      value={formData.cost}
                      onChange={handleInputChange}
                      required
                      min="0"
                      step="0.01"
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        border: '1px solid #d1d5db',
                        borderRadius: '8px',
                        fontSize: '14px',
                        color: '#1f2937'
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#374151', marginBottom: '8px' }}>
                      Servis Adı *
                    </label>
                    <input
                      type="text"
                      name="service"
                      value={formData.service}
                      onChange={handleInputChange}
                      required
                      placeholder="Örn: Bosch Car Service, TÜVTÜRK"
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        border: '1px solid #d1d5db',
                        borderRadius: '8px',
                        fontSize: '14px',
                        color: '#1f2937'
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#374151', marginBottom: '8px' }}>
                      Durum *
                    </label>
                    <select
                      name="status"
                      value={formData.status}
                      onChange={handleInputChange}
                      required
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        border: '1px solid #d1d5db',
                        borderRadius: '8px',
                        fontSize: '14px',
                        color: '#1f2937'
                      }}
                    >
                      <option value="PLANNED">Planlandı</option>
                      <option value="IN_PROGRESS">Devam Ediyor</option>
                      <option value="COMPLETED">Tamamlandı</option>
                      <option value="CANCELLED">İptal Edildi</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#374151', marginBottom: '8px' }}>
                      Sonraki Bakım KM
                    </label>
                    <input
                      type="number"
                      name="nextKm"
                      value={formData.nextKm}
                      onChange={handleInputChange}
                      min="0"
                      placeholder="Örn: 50000"
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        border: '1px solid #d1d5db',
                        borderRadius: '8px',
                        fontSize: '14px',
                        color: '#1f2937'
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#374151', marginBottom: '8px' }}>
                      Sonraki Bakım Tarihi
                    </label>
                    <input
                      type="date"
                      name="nextDate"
                      value={formData.nextDate}
                      onChange={handleInputChange}
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        border: '1px solid #d1d5db',
                        borderRadius: '8px',
                        fontSize: '14px',
                        color: '#1f2937'
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#374151', marginBottom: '8px' }}>
                      Notlar
                    </label>
                    <textarea
                      name="notes"
                      value={formData.notes}
                      onChange={handleInputChange}
                      rows={3}
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        border: '1px solid #d1d5db',
                        borderRadius: '8px',
                        fontSize: '14px',
                        color: '#1f2937',
                        resize: 'vertical'
                      }}
                    />
                  </div>
                </div>
              </div>

              <div style={{
                marginTop: '24px',
                display: 'flex',
                gap: '12px',
                justifyContent: 'flex-end'
              }}>
                <button
                  type="button"
                  onClick={handleCloseModal}
                  style={{
                    padding: '10px 20px',
                    background: 'white',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '600',
                    color: '#374151'
                  }}
                >
                  İptal
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    padding: '10px 20px',
                    background: loading ? '#9ca3af' : 'linear-gradient(135deg, #1e40af 0%, #3b82f6 100%)',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    fontSize: '14px',
                    fontWeight: '600',
                    color: 'white'
                  }}
                >
                  {loading ? 'Kaydediliyor...' : (editingMaintenance ? 'Güncelle' : 'Kaydet')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {showDetailModal && selectedMaintenance && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px'
        }}>
          <div style={{
            background: 'white',
            borderRadius: '16px',
            maxWidth: '600px',
            width: '100%',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)'
          }}>
            <div style={{
              padding: '24px',
              borderBottom: '1px solid #e5e7eb',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: '#1f2937' }}>
                Bakım Detayı
              </h2>
              <button
                onClick={() => setShowDetailModal(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '24px',
                  cursor: 'pointer',
                  color: '#6b7280',
                  padding: '0',
                  width: '32px',
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                ×
              </button>
            </div>

            <div style={{ padding: '24px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <p style={{ fontSize: '13px', color: '#6b7280', marginBottom: '4px' }}>Araç</p>
                  <p style={{ fontSize: '16px', fontWeight: '600', color: '#1f2937' }}>
                    {selectedMaintenance.vehicle?.plate} - {selectedMaintenance.vehicle?.brand} {selectedMaintenance.vehicle?.model}
                  </p>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div>
                    <p style={{ fontSize: '13px', color: '#6b7280', marginBottom: '4px' }}>Tip</p>
                    <span style={{
                      ...getTypeStyle(selectedMaintenance.type),
                      padding: '6px 12px',
                      borderRadius: '8px',
                      fontSize: '13px',
                      fontWeight: '600',
                      display: 'inline-block'
                    }}>
                      {getTypeStyle(selectedMaintenance.type).label}
                    </span>
                  </div>

                  <div>
                    <p style={{ fontSize: '13px', color: '#6b7280', marginBottom: '4px' }}>Durum</p>
                    <span style={{
                      ...getStatusStyle(selectedMaintenance.status),
                      padding: '6px 12px',
                      borderRadius: '8px',
                      fontSize: '13px',
                      fontWeight: '600',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}>
                      <span style={{ width: 16, height: 16, display: 'flex' }}>{getStatusStyle(selectedMaintenance.status).icon}</span>
                      {getStatusStyle(selectedMaintenance.status).label}
                    </span>
                  </div>
                </div>

                <div>
                  <p style={{ fontSize: '13px', color: '#6b7280', marginBottom: '4px' }}>Açıklama</p>
                  <p style={{ fontSize: '15px', color: '#1f2937' }}>
                    {selectedMaintenance.description || '-'}
                  </p>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div>
                    <p style={{ fontSize: '13px', color: '#6b7280', marginBottom: '4px' }}>Tarih</p>
                    <p style={{ fontSize: '15px', fontWeight: '600', color: '#1f2937' }}>
                      {new Date(selectedMaintenance.date).toLocaleDateString('tr-TR')}
                    </p>
                  </div>

                  <div>
                    <p style={{ fontSize: '13px', color: '#6b7280', marginBottom: '4px' }}>Maliyet</p>
                    <p style={{ fontSize: '15px', fontWeight: '600', color: '#1f2937' }}>
                      ₺{selectedMaintenance.cost.toLocaleString('tr-TR')}
                    </p>
                  </div>
                </div>

                <div>
                  <p style={{ fontSize: '13px', color: '#6b7280', marginBottom: '4px' }}>Servis</p>
                  <p style={{ fontSize: '15px', color: '#1f2937' }}>
                    {selectedMaintenance.service}
                  </p>
                </div>

                {(selectedMaintenance.nextKm || selectedMaintenance.nextDate) && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    {selectedMaintenance.nextKm && (
                      <div>
                        <p style={{ fontSize: '13px', color: '#6b7280', marginBottom: '4px' }}>Sonraki Bakım KM</p>
                        <p style={{ fontSize: '15px', fontWeight: '600', color: '#1f2937' }}>
                          {selectedMaintenance.nextKm.toLocaleString('tr-TR')} km
                        </p>
                      </div>
                    )}

                    {selectedMaintenance.nextDate && (
                      <div>
                        <p style={{ fontSize: '13px', color: '#6b7280', marginBottom: '4px' }}>Sonraki Bakım Tarihi</p>
                        <p style={{ fontSize: '15px', fontWeight: '600', color: '#1f2937' }}>
                          {new Date(selectedMaintenance.nextDate).toLocaleDateString('tr-TR')}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {selectedMaintenance.notes && (
                  <div>
                    <p style={{ fontSize: '13px', color: '#6b7280', marginBottom: '4px' }}>Notlar</p>
                    <p style={{ fontSize: '15px', color: '#1f2937' }}>
                      {selectedMaintenance.notes}
                    </p>
                  </div>
                )}
              </div>

              <div style={{ marginTop: '24px', display: 'flex', gap: '12px' }}>
                <button
                  onClick={() => {
                    setShowDetailModal(false);
                    handleEdit(selectedMaintenance);
                  }}
                  style={{
                    flex: 1,
                    padding: '10px 20px',
                    background: 'linear-gradient(135deg, #1e40af 0%, #3b82f6 100%)',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '600',
                    color: 'white'
                  }}
                >
                  Düzenle
                </button>
                <button
                  onClick={() => setShowDetailModal(false)}
                  style={{
                    flex: 1,
                    padding: '10px 20px',
                    background: 'white',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '600',
                    color: '#374151'
                  }}
                >
                  Kapat
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      <PaymentModal
        isOpen={showPaymentModal}
        onClose={() => {
          setShowPaymentModal(false);
          setPaymentMaintenance(null);
        }}
        maintenance={paymentMaintenance}
        onPaymentComplete={handlePayment}
      />
    </Layout>
  );
}

export default Maintenance;
