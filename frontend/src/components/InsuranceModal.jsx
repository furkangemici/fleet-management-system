import React, { useState, useEffect } from 'react';
import Icons from './Icons';

export default function InsuranceModal({ isOpen, onClose, onSave, editingInsurance, vehicles }) {
  const [formData, setFormData] = useState({
    vehicleId: '',
    type: 'TRAFFIC',
    company: '',
    policyNo: '',
    startDate: '',
    endDate: '',
    premium: '',
    coverage: '',
    notes: ''
  });

  useEffect(() => {
    if (editingInsurance) {
      setFormData({
        vehicleId: editingInsurance.vehicleId,
        type: editingInsurance.type,
        company: editingInsurance.company,
        policyNo: editingInsurance.policyNo,
        startDate: editingInsurance.startDate ? new Date(editingInsurance.startDate).toISOString().split('T')[0] : '',
        endDate: editingInsurance.startDate ? new Date(editingInsurance.endDate).toISOString().split('T')[0] : '',
        premium: editingInsurance.premium || '',
        coverage: editingInsurance.coverage || '',
        notes: editingInsurance.notes || ''
      });
    } else {
      setFormData({
        vehicleId: '',
        type: 'TRAFFIC',
        company: '',
        policyNo: '',
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0],
        premium: '',
        coverage: '',
        notes: ''
      });
    }
  }, [editingInsurance]);

  const handleSubmit = (e) => {
    e.preventDefault();

    // Policy Validation & Trim
    const policyNo = formData.policyNo.trim();
    if (policyNo.length < 6 || policyNo.length > 25) {
      alert('Poliçe numarası en az 6, en fazla 25 karakter olmalıdır.');
      return;
    }

    onSave({
      ...formData,
      policyNo: policyNo,
      vehicleId: parseInt(formData.vehicleId),
      premium: parseFloat(formData.premium),
      coverage: formData.coverage ? parseFloat(formData.coverage) : null
    });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handlePolicyChange = (e) => {
    let value = e.target.value.toUpperCase();
    // Allow only A-Z, 0-9, - and /
    value = value.replace(/[^A-Z0-9\-\/]/g, '');
    setFormData(prev => ({ ...prev, policyNo: value }));
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0,0,0,0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    }}>
      <div style={{
        background: 'white',
        borderRadius: '16px',
        padding: '24px',
        width: '100%',
        maxWidth: '500px',
        maxHeight: '90vh',
        overflowY: 'auto'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '24px'
        }}>
          <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: '#1f2937' }}>
            {editingInsurance ? 'Sigorta Düzenle' : 'Yeni Sigorta Ekle'}
          </h2>
          <button 
            onClick={onClose}
            style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#6b7280' }}
          >
            <Icons.Close />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
              Araç
            </label>
            <select
              name="vehicleId"
              value={formData.vehicleId}
              onChange={handleChange}
              required
              style={{
                width: '100%',
                padding: '10px',
                borderRadius: '8px',
                border: '1px solid #e5e7eb',
                fontSize: '14px'
              }}
            >
              <option value="">Araç Seçin</option>
              {vehicles.map(v => (
                <option key={v.id} value={v.id}>{v.plate} - {v.brand} {v.model}</option>
              ))}
            </select>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
                Sigorta Tipi
              </label>
              <select
                name="type"
                value={formData.type}
                onChange={handleChange}
                style={{
                  width: '100%',
                  padding: '10px',
                  borderRadius: '8px',
                  border: '1px solid #e5e7eb',
                  fontSize: '14px'
                }}
              >
                <option value="TRAFFIC">Trafik Sigortası</option>
                <option value="KASKO">Kasko</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
                Şirket
              </label>
              <input
                type="text"
                name="company"
                value={formData.company}
                onChange={handleChange}
                placeholder="Örn: Allianz"
                required
                style={{
                  width: '100%',
                  padding: '10px',
                  borderRadius: '8px',
                  border: '1px solid #e5e7eb',
                  fontSize: '14px'
                }}
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
              Poliçe No
            </label>
            <input
              type="text"
              name="policyNo"
              value={formData.policyNo}
              onChange={handlePolicyChange}
              required
              maxLength={25}
              style={{
                width: '100%',
                padding: '10px',
                borderRadius: '8px',
                border: '1px solid #e5e7eb',
                fontSize: '14px',
                fontFamily: 'monospace',
                textTransform: 'uppercase'
              }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
                Başlangıç Tarihi
              </label>
              <input
                type="date"
                name="startDate"
                value={formData.startDate}
                onChange={handleChange}
                required
                style={{
                  width: '100%',
                  padding: '10px',
                  borderRadius: '8px',
                  border: '1px solid #e5e7eb',
                  fontSize: '14px'
                }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
                Bitiş Tarihi
              </label>
              <input
                type="date"
                name="endDate"
                value={formData.endDate}
                onChange={handleChange}
                required
                style={{
                  width: '100%',
                  padding: '10px',
                  borderRadius: '8px',
                  border: '1px solid #e5e7eb',
                  fontSize: '14px'
                }}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
                Prim Tutarı (₺)
              </label>
              <input
                type="number"
                name="premium"
                value={formData.premium}
                onChange={handleChange}
                required
                min="0"
                step="0.01"
                style={{
                  width: '100%',
                  padding: '10px',
                  borderRadius: '8px',
                  border: '1px solid #e5e7eb',
                  fontSize: '14px'
                }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
                Teminat (₺)
              </label>
              <input
                type="number"
                name="coverage"
                value={formData.coverage}
                onChange={handleChange}
                min="0"
                step="0.01"
                placeholder="Opsiyonel"
                style={{
                  width: '100%',
                  padding: '10px',
                  borderRadius: '8px',
                  border: '1px solid #e5e7eb',
                  fontSize: '14px'
                }}
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
              Notlar
            </label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows="3"
              style={{
                width: '100%',
                padding: '10px',
                borderRadius: '8px',
                border: '1px solid #e5e7eb',
                fontSize: '14px',
                resize: 'vertical'
              }}
            />
          </div>

          <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                flex: 1,
                padding: '12px',
                background: '#f3f4f6',
                color: '#374151',
                border: 'none',
                borderRadius: '8px',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              İptal
            </button>
            <button
              type="submit"
              style={{
                flex: 1,
                padding: '12px',
                background: '#2563eb',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              {editingInsurance ? 'Güncelle' : 'Kaydet'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
