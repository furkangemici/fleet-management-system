import { useState } from 'react';
import { Link } from 'react-router-dom';
import authService from '../services/authService';
import Icons from '../components/Icons';

function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess(false);

    try {
      await authService.forgotPassword(email);
      setSuccess(true);
      setEmail('');
    } catch (err) {
      setError(err.response?.data?.message || 'Bir hata oluştu. Lütfen tekrar deneyin.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #1e3a8a 0%, #172554 100%)',
      padding: '20px',
      fontFamily: "'Inter', sans-serif"
    }}>
      <div style={{
        width: '100%',
        maxWidth: '480px',
        background: 'white',
        borderRadius: '24px',
        padding: '48px',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
      }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <div style={{
            width: '80px',
            height: '80px',
            background: 'linear-gradient(135deg, #3b82f6 0%, #1e40af 100%)',
            borderRadius: '20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 24px',
            color: 'white'
          }}>
            <Icons.Lock />
          </div>
          <h1 style={{ fontSize: '28px', fontWeight: 'bold', color: '#1e293b', marginBottom: '12px' }}>
            Şifremi Unuttum
          </h1>
          <p style={{ color: '#64748b', fontSize: '15px', lineHeight: 1.6 }}>
            Email adresinizi girin, şifre sıfırlama linki console'a yazdırılacak.
          </p>
        </div>

        {/* Success Message */}
        {success && (
          <div style={{
            background: '#dcfce7',
            border: '1px solid #bbf7d0',
            color: '#166534',
            padding: '16px',
            borderRadius: '12px',
            marginBottom: '24px',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '12px',
            fontSize: '14px'
          }}>
            <Icons.Check />
            <div>
              <strong>Başarılı!</strong>
              <p style={{ marginTop: '4px', opacity: 0.9 }}>
                Şifre sıfırlama linki <strong>backend console'una</strong> yazdırıldı. 
                Lütfen backend terminalini kontrol edin ve linki kopyalayın.
              </p>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div style={{
            background: '#fef2f2',
            border: '1px solid #fee2e2',
            color: '#991b1b',
            padding: '16px',
            borderRadius: '12px',
            marginBottom: '24px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            fontSize: '14px'
          }}>
            <Icons.Alert />
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '24px' }}>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: '600',
              color: '#334155',
              marginBottom: '8px'
            }}>
              E-posta Adresi
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="ornek@reeder.com.tr"
              style={{
                width: '100%',
                padding: '14px 16px',
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '12px',
                fontSize: '15px',
                outline: 'none',
                transition: 'all 0.2s',
                color: '#0f172a'
              }}
              onFocus={(e) => {
                e.target.style.background = 'white';
                e.target.style.borderColor = '#3b82f6';
                e.target.style.boxShadow = '0 0 0 4px rgba(59, 130, 246, 0.1)';
              }}
              onBlur={(e) => {
                e.target.style.background = '#f8fafc';
                e.target.style.borderColor = '#e2e8f0';
                e.target.style.boxShadow = 'none';
              }}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '16px',
              background: loading ? '#94a3b8' : '#1e3a8a',
              color: 'white',
              border: 'none',
              borderRadius: '12px',
              fontSize: '16px',
              fontWeight: '600',
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s',
              marginBottom: '16px'
            }}
            onMouseEnter={(e) => !loading && (e.target.style.background = '#1e40af')}
            onMouseLeave={(e) => !loading && (e.target.style.background = '#1e3a8a')}
          >
            {loading ? 'Gönderiliyor...' : 'Sıfırlama Linki Gönder'}
          </button>

          <Link
            to="/login"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              color: '#64748b',
              textDecoration: 'none',
              fontSize: '14px',
              fontWeight: '500',
              transition: 'color 0.2s'
            }}
            onMouseEnter={(e) => e.target.style.color = '#3b82f6'}
            onMouseLeave={(e) => e.target.style.color = '#64748b'}
          >
            <Icons.ChevronLeft />
            Giriş sayfasına dön
          </Link>
        </form>

        {/* Info Box */}
        <div style={{
          marginTop: '32px',
          padding: '16px',
          background: '#eff6ff',
          borderRadius: '12px',
          border: '1px solid #dbeafe'
        }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', color: '#1e40af' }}>
            <Icons.Info />
            <div style={{ fontSize: '13px', lineHeight: 1.6 }}>
              <strong>Not:</strong> Gerçek mail servisi olmadığı için, şifre sıfırlama linki 
              backend console'una yazdırılacaktır. Lütfen backend terminalini kontrol edin.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ForgotPassword;
