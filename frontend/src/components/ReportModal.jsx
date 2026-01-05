import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Icons from './Icons';

const reportTypes = [
  { id: 'vehicles', label: 'Araç Listesi', path: '/vehicles' },
  { id: 'drivers', label: 'Sürücü Listesi', path: '/drivers' },
  { id: 'maintenances', label: 'Bakım Kayıtları', path: '/maintenance' },
  { id: 'fines', label: 'Trafik Cezaları', path: '/fines' },
  { id: 'insurances', label: 'Sigorta Poliçeleri', path: '/insurance' },
];

function ReportModal({ isOpen, onClose }) {
  const navigate = useNavigate();
  const [selectedType, setSelectedType] = useState(reportTypes[0].id);

  if (!isOpen) return null;

  const handleNavigate = () => {
    const target = reportTypes.find(t => t.id === selectedType);
    if (target) {
        navigate(target.path);
        onClose();
        // Kullanıcıyı yönlendirme hakkında bilgilendir (Opsiyonel olarak alert kaldırılabilir)
        // alert("Lütfen ilgili sayfadaki 'Dışa Aktar' butonunu kullanarak raporunuzu alınız.");
    }
  };

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
    }}>
      <div style={{ background: 'white', padding: '24px', borderRadius: '16px', width: '400px', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
          <div style={{ padding: '10px', background: '#ecfeff', borderRadius: '10px', color: '#06b6d4' }}>
            <Icons.TrendingUp size={24} />
          </div>
          <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: '#1f2937' }}>Rapor Oluştur</h3>
        </div>
        
        <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500', color: '#4b5563' }}>Rapor Türü Seçin</label>
             <select 
                  value={selectedType} 
                  onChange={(e) => setSelectedType(e.target.value)}
                  style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #e5e7eb', fontSize: '14px' }}
              >
                  {reportTypes.map(t => (
                      <option key={t.id} value={t.id}>{t.label}</option>
                  ))}
              </select>
            <p style={{ fontSize: '13px', color: '#6b7280', marginTop: '16px', lineHeight: '1.6', background: '#f3f4f6', padding: '12px', borderRadius: '8px' }}>
              ℹ️ Seçtiğiniz kategoriye yönlendirileceksiniz. Lütfen açılan sayfadaki <b>"Dışa Aktar"</b> butonunu kullanarak o anki filtrelerinize göre rapor alın.
            </p>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
            <button 
              onClick={onClose} 
              style={{ padding: '10px 20px', borderRadius: '8px', border: '1px solid #e5e7eb', background: 'white', cursor: 'pointer' }}>
              İptal
            </button>
            <button 
                onClick={handleNavigate} 
                style={{ padding: '10px 20px', borderRadius: '8px', background: '#3b82f6', color: 'white', border: 'none', cursor: 'pointer', fontWeight: '600' }}
            >
                Sayfaya Git
            </button>
        </div>
      </div>
    </div>
  );
}

export default ReportModal;
