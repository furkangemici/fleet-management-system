import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import Icons from '../components/Icons';
import insuranceService from '../services/insuranceService';
import vehicleService from '../services/vehicleService';
import InsuranceModal from '../components/InsuranceModal';
import { exportToCSV } from '../utils/exportUtils';

export default function Insurance() {
  const [insurances, setInsurances] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [selectedVehicleId, setSelectedVehicleId] = useState('');
  const [selectedType, setSelectedType] = useState('ALL');

  // Modal States
  const [showModal, setShowModal] = useState(false);
  const [editingInsurance, setEditingInsurance] = useState(null);

  useEffect(() => {
    fetchVehicles();
  }, []);

  useEffect(() => {
    fetchInsurances();
  }, [selectedVehicleId, selectedType]);

  const fetchVehicles = async () => {
    try {
      const result = await vehicleService.getAllVehicles();
      let list = [];
      if (result?.data?.vehicles) list = result.data.vehicles;
      else if (Array.isArray(result?.data)) list = result.data;
      else if (Array.isArray(result)) list = result;
      
      setVehicles(list);
    } catch (err) {
      console.error('Araçlar yüklenemedi:', err);
    }
  };

  const fetchInsurances = async () => {
    try {
      setLoading(true);
      const params = {};
      if (selectedVehicleId) params.vehicleId = selectedVehicleId;
      if (selectedType !== 'ALL') params.type = selectedType;

      const result = await insuranceService.getAllInsurances(params);
      
      let list = [];
      if (result?.data?.insurances) {
        list = result.data.insurances;
      } else if (Array.isArray(result?.data)) {
        list = result.data;
      } else if (result?.insurances) {
        list = result.insurances;
      } else if (Array.isArray(result)) {
        list = result;
      }

      setInsurances(Array.isArray(list) ? list : []);
    } catch (err) {
      console.error('Sigortalar yüklenemedi:', err);
      setError('Veriler yüklenirken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      if (!window.confirm('Sigorta kayıtları dışa aktarılsın mı?')) return;

      const params = {};
      if (selectedVehicleId) params.vehicleId = selectedVehicleId;
      if (selectedType !== 'ALL') params.type = selectedType;

      const result = await insuranceService.getAllInsurances(params);
      
      let list = [];
      if (result?.data?.insurances) {
        list = result.data.insurances;
      } else if (Array.isArray(result?.data)) {
        list = result.data;
      } else if (result?.insurances) {
        list = result.insurances;
      } else if (Array.isArray(result)) {
        list = result;
      }

      const exportData = list.map(item => ({
        'Plaka': item.vehicle?.plate || '-',
        'Şirket': item.company,
        'Poliçe No': item.policyNo,
        'Tip': item.type === 'KASKO' ? 'Kasko' : (item.type === 'TRAFFIC' ? 'Trafik Sigortası' : item.type),
        'Başlangıç': item.startDate ? new Date(item.startDate).toLocaleDateString('tr-TR') : '-',
        'Bitiş': item.endDate ? new Date(item.endDate).toLocaleDateString('tr-TR') : '-',
        'Prim (TL)': item.premium,
        'Notlar': item.notes || ''
      }));

      if (exportData.length > 0) exportToCSV(exportData, 'sigorta_kayitlari');
      else alert('Veri yok');
    } catch (err) {
      console.error(err);
      alert('Dışa aktarma hatası');
    }
  };

  const handleCreate = () => {
    setEditingInsurance(null);
    setShowModal(true);
  };

  const handleEdit = (insurance) => {
    setEditingInsurance(insurance);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Bu sigorta kaydını silmek istediğinize emin misiniz?')) {
      try {
        await insuranceService.deleteInsurance(id);
        fetchInsurances();
      } catch (err) {
        console.error('Silme işlemi başarısız:', err);
        alert('Silme işlemi başarısız oldu');
      }
    }
  };

  const handleSave = async (formData) => {
    try {
      if (editingInsurance) {
        await insuranceService.updateInsurance(editingInsurance.id, formData);
      } else {
        await insuranceService.createInsurance(formData);
      }
      setShowModal(false);
      fetchInsurances();
    } catch (err) {
      console.error('Kaydetme işlemi başarısız:', err);
      alert('Kaydetme işlemi başarısız oldu: ' + (err.response?.data?.message || err.message));
    }
  };

  const calculateDaysLeft = (endDate) => {
    const end = new Date(endDate);
    const today = new Date();
    const diffTime = end - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getTypeStyle = (type) => {
    const styles = {
      KASKO: { bg: '#eff6ff', text: '#1e40af', label: 'Kasko', icon: <Icons.Insurance /> },
      TRAFFIC: { bg: '#f0fdf4', text: '#166534', label: 'Trafik Sigortası', icon: <Icons.Vehicle /> }
    };
    return styles[type] || styles.TRAFFIC;
  };

  const getDaysLeftColor = (days) => {
    if (days < 0) return { bg: '#fee2e2', text: '#991b1b', label: 'Süresi Dolmuş' };
    if (days < 30) return { bg: '#fef2f2', text: '#991b1b', label: 'Kritik' };
    if (days < 90) return { bg: '#fffbeb', text: '#92400e', label: 'Yaklaşıyor' };
    return { bg: '#f0fdf4', text: '#166534', label: 'Aktif' };
  };

  // Group insurances by vehicle
  const getGroupedInsurances = () => {
    const groups = {};
    insurances.forEach(ins => {
      // Ensure vehicle exists (it should, but safety first)
      if (!ins.vehicle) return;
      
      const vId = ins.vehicle.id;
      if (!groups[vId]) {
        groups[vId] = {
          vehicle: ins.vehicle,
          items: []
        };
      }
      groups[vId].items.push(ins);
    });
    return Object.values(groups);
  };

  const groupedInsurances = getGroupedInsurances();

  // Stats Calculation
  const stats = {
    total: insurances.length,
    kasko: insurances.filter(i => i.type === 'KASKO').length,
    traffic: insurances.filter(i => i.type === 'TRAFFIC').length,
    totalPremium: insurances.reduce((sum, i) => sum + (i.premium || 0), 0),
    expiringSoon: insurances.filter(i => calculateDaysLeft(i.endDate) < 90 && calculateDaysLeft(i.endDate) >= 0).length
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
          <p style={{ fontSize: '13px', color: '#6b7280', marginBottom: '8px' }}>Toplam Sigorta</p>
          <p style={{ fontSize: '28px', fontWeight: 'bold', color: '#1f2937' }}>{stats.total}</p>
        </div>
        <div style={{
          background: 'white',
          padding: '20px',
          borderRadius: '12px',
          border: '1px solid #f3f4f6'
        }}>
          <p style={{ fontSize: '13px', color: '#6b7280', marginBottom: '8px' }}>Kasko</p>
          <p style={{ fontSize: '28px', fontWeight: 'bold', color: '#3b82f6' }}>{stats.kasko}</p>
        </div>
        <div style={{
          background: 'white',
          padding: '20px',
          borderRadius: '12px',
          border: '1px solid #f3f4f6'
        }}>
          <p style={{ fontSize: '13px', color: '#6b7280', marginBottom: '8px' }}>Toplam Prim</p>
          <p style={{ fontSize: '28px', fontWeight: 'bold', color: '#1f2937' }}>₺{stats.totalPremium.toLocaleString('tr-TR')}</p>
        </div>
        <div style={{
          background: 'white',
          padding: '20px',
          borderRadius: '12px',
          border: '1px solid #f3f4f6'
        }}>
          <p style={{ fontSize: '13px', color: '#6b7280', marginBottom: '8px' }}>Yakında Bitenler</p>
          <p style={{ fontSize: '28px', fontWeight: 'bold', color: '#f59e0b' }}>{stats.expiringSoon}</p>
        </div>
      </div>

      {/* Filters & Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '24px',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <div style={{ display: 'flex', gap: '12px' }}>
          <select
            value={selectedVehicleId}
            onChange={(e) => setSelectedVehicleId(e.target.value)}
            style={{
              padding: '10px',
              borderRadius: '8px',
              border: '1px solid #e5e7eb',
              background: 'white',
              fontSize: '14px',
              cursor: 'pointer'
            }}
          >
            <option value="">Tüm Araçlar</option>
            {vehicles.map(v => (
              <option key={v.id} value={v.id}>{v.plate}</option>
            ))}
          </select>

          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            style={{
              padding: '10px',
              borderRadius: '8px',
              border: '1px solid #e5e7eb',
              background: 'white',
              fontSize: '14px',
              cursor: 'pointer'
            }}
          >
            <option value="ALL">Tüm Tipler</option>
            <option value="TRAFFIC">Trafik Sigortası</option>
            <option value="KASKO">Kasko</option>
          </select>
        </div>

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
            onClick={handleCreate}
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
          Yeni Sigorta Ekle
        </button>
      </div>
    </div>

      {/* Vehicle Cards Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(450px, 1fr))', // Reduced width for better fit, but 450px is good for side-by-side details
        gap: '24px'
      }}>
        {loading ? (
          <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '40px', color: '#6b7280' }}>
            Yükleniyor...
          </div>
        ) : insurances.length === 0 ? (
          <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '40px', color: '#6b7280' }}>
            Kayıt bulunamadı.
          </div>
        ) : groupedInsurances.map((group) => (
          <div
            key={group.vehicle.id}
            style={{
              background: 'white',
              borderRadius: '16px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
              border: '1px solid #f3f4f6',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column'
            }}
          >
            {/* Card Header: Vehicle Info */}
            <div style={{
              padding: '20px',
              background: '#f9fafb',
              borderBottom: '1px solid #f3f4f6',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{
                        padding: '10px',
                        background: 'white',
                        borderRadius: '10px',
                        border: '1px solid #e5e7eb',
                        color: '#374151'
                    }}>
                        <Icons.Vehicle />
                    </div>
                    <div>
                        <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 'bold', color: '#1f2937' }}>{group.vehicle.plate}</h3>
                        <p style={{ margin: 0, fontSize: '13px', color: '#6b7280', marginTop: '4px' }}>
                            {group.vehicle.brand} {group.vehicle.model}
                        </p>
                    </div>
                </div>
                {/* Optional: Add vehicle actions here if needed */}
            </div>

            {/* Card Body: Insurances List */}
            <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {group.items.map((insurance) => {
                    const typeStyle = getTypeStyle(insurance.type);
                    const daysLeft = calculateDaysLeft(insurance.endDate);
                    const daysColor = getDaysLeftColor(daysLeft);

                    return (
                        <div key={insurance.id} style={{
                            border: '1px solid #e5e7eb',
                            borderRadius: '12px',
                            padding: '16px',
                            background: '#fff',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '12px'
                        }}>
                             {/* Insurance Row Header */}
                             <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                 <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                     <span style={{
                                        padding: '6px 12px',
                                        background: typeStyle.bg,
                                        color: typeStyle.text,
                                        borderRadius: '8px',
                                        fontSize: '13px',
                                        fontWeight: '600',
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '6px'
                                     }}>
                                        <span style={{ width: 16, height: 16, display: 'flex' }}>{typeStyle.icon}</span>
                                        {typeStyle.label}
                                     </span>
                                     <span style={{
                                        padding: '4px 10px',
                                        background: daysColor.bg,
                                        color: daysColor.text,
                                        borderRadius: '6px',
                                        fontSize: '12px',
                                        fontWeight: '600'
                                     }}>
                                        {daysLeft} gün kaldı
                                     </span>
                                 </div>
                                 
                                 <div style={{ display: 'flex', gap: '6px' }}>
                                     <button 
                                        onClick={() => handleEdit(insurance)}
                                        title="Düzenle"
                                        style={{
                                            padding: '6px',
                                            background: '#f3f4f6',
                                            border: 'none',
                                            borderRadius: '6px',
                                            cursor: 'pointer',
                                            color: '#4b5563'
                                        }}
                                     >
                                         <Icons.Edit />
                                     </button>
                                     <button 
                                        onClick={() => handleDelete(insurance.id)}
                                        title="Sil"
                                        style={{
                                            padding: '6px',
                                            background: '#fee2e2',
                                            border: 'none',
                                            borderRadius: '6px',
                                            cursor: 'pointer',
                                            color: '#ef4444'
                                        }}
                                     >
                                         <Icons.Delete />
                                     </button>
                                 </div>
                             </div>

                             {/* Insurance Details Grid */}
                             <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '13px' }}>
                                 <div>
                                     <span style={{ color: '#6b7280', display: 'block', marginBottom: '2px' }}>Şirket</span>
                                     <span style={{ fontWeight: '500', color: '#374151' }}>{insurance.company}</span>
                                 </div>
                                 <div style={{ textAlign: 'right' }}>
                                     <span style={{ color: '#6b7280', display: 'block', marginBottom: '2px' }}>Poliçe No</span>
                                     <span style={{ fontWeight: '500', color: '#374151', fontFamily: 'monospace' }}>{insurance.policyNo}</span>
                                 </div>
                                 <div>
                                     <span style={{ color: '#6b7280', display: 'block', marginBottom: '2px' }}>Bitiş Tarihi</span>
                                     <span style={{ fontWeight: '500', color: '#374151' }}>{new Date(insurance.endDate).toLocaleDateString('tr-TR')}</span>
                                 </div>
                                 <div style={{ textAlign: 'right' }}>
                                     <span style={{ color: '#6b7280', display: 'block', marginBottom: '2px' }}>Prim</span>
                                     <span style={{ fontWeight: '600', color: '#10b981' }}>₺{insurance.premium?.toLocaleString('tr-TR')}</span>
                                 </div>
                             </div>
                        </div>
                    );
                })}
                
                {group.items.length === 0 && (
                    <p style={{ textAlign: 'center', color: '#9ca3af', fontSize: '14px' }}>Kayıtlı sigorta yok</p>
                )}
            </div>
          </div>
        ))}
      </div>

      <InsuranceModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onSave={handleSave}
        editingInsurance={editingInsurance}
        vehicles={vehicles}
      />
    </Layout>
  );
}
