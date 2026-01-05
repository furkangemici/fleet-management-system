import { useState } from 'react';
import Icons from './Icons';

function PaymentModal({ isOpen, onClose, maintenance, onPaymentComplete }) {
  const [paymentData, setPaymentData] = useState({
    isPaid: maintenance?.isPaid || false,
    paidAt: maintenance?.paidAt ? new Date(maintenance.paidAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
    paymentMethod: maintenance?.paymentMethod || 'CREDIT_CARD',
    invoiceNo: maintenance?.invoiceNo || ''
  });
  const [loading, setLoading] = useState(false);

  if (!isOpen || !maintenance) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await onPaymentComplete({
        ...paymentData,
        isPaid: true
      });
      onClose();
    } catch (error) {
      console.error('Ödeme kaydedilemedi:', error);
      alert('Ödeme kaydedilemedi');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkUnpaid = async () => {
    setLoading(true);
    try {
      await onPaymentComplete({
        isPaid: false,
        paidAt: null,
        paymentMethod: null,
        invoiceNo: null
      });
      onClose();
    } catch (error) {
      console.error('İşlem başarısız:', error);
      alert('İşlem başarısız');
    } finally {
      setLoading(false);
    }
  };

  return (
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
        maxWidth: '500px',
        width: '100%',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)'
      }}>
        {/* Header */}
        <div style={{
          padding: '24px',
          borderBottom: '1px solid #e5e7eb',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '40px',
              height: '40px',
              background: maintenance.isPaid ? '#dcfce7' : '#fef3c7',
              borderRadius: '10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: maintenance.isPaid ? '#166534' : '#92400e'
            }}>
              {maintenance.isPaid ? '✓' : '₺'}
            </div>
            <div>
              <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: '#1f2937', margin: 0 }}>
                Ödeme Yönetimi
              </h2>
              <p style={{ fontSize: '14px', color: '#6b7280', margin: '4px 0 0 0' }}>
                {maintenance.vehicle?.plate} - {maintenance.service}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
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

        {/* Content */}
        <div style={{ padding: '24px' }}>
          {/* Maliyet Bilgisi */}
          <div style={{
            background: '#f9fafb',
            padding: '16px',
            borderRadius: '12px',
            marginBottom: '24px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '14px', color: '#6b7280' }}>Toplam Tutar</span>
              <span style={{ fontSize: '24px', fontWeight: 'bold', color: '#1f2937' }}>
                ₺{maintenance.cost.toLocaleString('tr-TR')}
              </span>
            </div>
          </div>

          {maintenance.isPaid ? (
            /* Ödeme Bilgileri Göster */
            <div>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '4px' }}>
                  Durum
                </label>
                <div style={{
                  padding: '12px',
                  background: '#dcfce7',
                  borderRadius: '8px',
                  color: '#166534',
                  fontWeight: '600',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <Icons.Check />
                  Ödeme Tamamlandı
                </div>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '4px' }}>
                  Ödeme Tarihi
                </label>
                <p style={{ fontSize: '15px', color: '#1f2937', margin: 0 }}>
                  {new Date(maintenance.paidAt).toLocaleDateString('tr-TR')}
                </p>
              </div>

              {maintenance.paymentMethod && (
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '4px' }}>
                    Ödeme Yöntemi
                  </label>
                  <p style={{ fontSize: '15px', color: '#1f2937', margin: 0 }}>
                    {maintenance.paymentMethod === 'CASH' ? 'Nakit' :
                     maintenance.paymentMethod === 'CREDIT_CARD' ? 'Kredi Kartı' :
                     maintenance.paymentMethod === 'BANK_TRANSFER' ? 'Havale' : 'Kurumsal Kart'}
                  </p>
                </div>
              )}

              {maintenance.invoiceNo && (
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '4px' }}>
                    Fatura No
                  </label>
                  <p style={{ fontSize: '15px', color: '#1f2937', margin: 0, fontFamily: 'monospace' }}>
                    {maintenance.invoiceNo}
                  </p>
                </div>
              )}

              <button
                onClick={handleMarkUnpaid}
                disabled={loading}
                style={{
                  width: '100%',
                  padding: '12px',
                  background: '#fef2f2',
                  color: '#991b1b',
                  border: '1px solid #fee2e2',
                  borderRadius: '8px',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  fontSize: '14px',
                  fontWeight: '600',
                  marginTop: '8px'
                }}
              >
                {loading ? 'İşleniyor...' : 'Ödenmedi Olarak İşaretle'}
              </button>
            </div>
          ) : (
            /* Ödeme Formu */
            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#374151', marginBottom: '8px' }}>
                  Ödeme Tarihi *
                </label>
                <input
                  type="date"
                  value={paymentData.paidAt}
                  onChange={(e) => setPaymentData({ ...paymentData, paidAt: e.target.value })}
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

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#374151', marginBottom: '8px' }}>
                  Ödeme Yöntemi *
                </label>
                <select
                  value={paymentData.paymentMethod}
                  onChange={(e) => setPaymentData({ ...paymentData, paymentMethod: e.target.value })}
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
                  <option value="CREDIT_CARD">Kredi Kartı</option>
                  <option value="CASH">Nakit</option>
                  <option value="BANK_TRANSFER">Havale/EFT</option>
                  <option value="CORPORATE_CARD">Kurumsal Kart</option>
                </select>
              </div>

              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#374151', marginBottom: '8px' }}>
                  Fatura Numarası
                </label>
                <input
                  type="text"
                  value={paymentData.invoiceNo}
                  onChange={(e) => setPaymentData({ ...paymentData, invoiceNo: e.target.value })}
                  placeholder="Örn: FTR-2026-001234"
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

              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  type="button"
                  onClick={onClose}
                  style={{
                    flex: 1,
                    padding: '12px',
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
                    flex: 1,
                    padding: '12px',
                    background: loading ? '#9ca3af' : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    fontSize: '14px',
                    fontWeight: '600',
                    color: 'white'
                  }}
                >
                  {loading ? 'Kaydediliyor...' : 'Ödemeyi Kaydet'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

export default PaymentModal;
