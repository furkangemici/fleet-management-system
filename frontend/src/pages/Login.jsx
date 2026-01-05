import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import Icons from '../components/Icons';

function Login() {
  const { login, loading } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  
  // Error state'ini localStorage'dan yükle
  const [error, setError] = useState(() => {
    const savedError = sessionStorage.getItem('loginError');
    if (savedError) {
      sessionStorage.removeItem('loginError'); // Bir kere göster
      return savedError;
    }
    return '';
  });
  
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    sessionStorage.removeItem('loginError');

    try {
      await login(formData.email, formData.password);
      // Başarılı giriş - AuthContext otomatik yönlendirecek
    } catch (err) {
      const errorMessage = err?.message || 'Email veya şifre hatalı. Lütfen tekrar deneyin.';
      setError(errorMessage);
      sessionStorage.setItem('loginError', errorMessage);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      fontFamily: "'Inter', sans-serif"
    }}>
      {/* Left Side - Brand & Info */}
      <div style={{
        flex: 1,
        background: 'linear-gradient(135deg, #1e3a8a 0%, #172554 100%)',
        color: 'white',
        padding: '60px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Abstract Background Pattern */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          opacity: 0.1,
          background: `radial-gradient(circle at 20% 150%, #60a5fa 0%, transparent 50%),
                      radial-gradient(circle at 80% -50%, #3b82f6 0%, transparent 50%)`
        }}></div>

        <div style={{ position: 'relative', zIndex: 1,  maxWidth: '500px' }}>
          {/* Logo Area */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            marginBottom: '48px'
          }}>
            <div style={{
              width: '64px',
              height: '64px',
              background: 'rgba(255, 255, 255, 0.1)',
              borderRadius: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.2)'
            }}>
              <Icons.Vehicle />
            </div>
            <div>
              <h1 style={{ fontSize: '32px', fontWeight: 'bold', lineHeight: 1.2 }}>Reeder Fleet</h1>
              <p style={{ opacity: 0.8, fontSize: '16px' }}>Kurumsal Filo Yönetimi</p>
            </div>
          </div>

          <h2 style={{ fontSize: '42px', fontWeight: 'bold', marginBottom: '24px', lineHeight: 1.2 }}>
            Filo Operasyonlarınızı <br/>
            <span style={{ color: '#60a5fa' }}>Tek Noktadan</span> Yönetin.
          </h2>
          
          <p style={{ fontSize: '18px', opacity: 0.8, lineHeight: 1.6, marginBottom: '48px' }}>
            Araçlarınızı, sürücülerinizi ve maliyetlerinizi gerçek zamanlı takip edin. 
            Bakım, ceza ve sigorta süreçlerinizi gelişmiş raporlama araçlarıyla optimize edin.
          </p>

          {/* Features List */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
            {[
              'Gerçek Zamanlı Takip',
              'Sürücü Performansı',
              'Bakım Hatırlatmaları',
              'Üstün Raporlama'
            ].map((feature, idx) => (
              <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  background: 'rgba(96, 165, 250, 0.2)',
                  borderRadius: '50%',
                  padding: '4px',
                  display: 'flex'
                }}>
                  <Icons.Check />
                </div>
                <span style={{ fontWeight: '500' }}>{feature}</span>
              </div>
            ))}
          </div>

          <div style={{ marginTop: 'auto', paddingTop: '64px', fontSize: '14px', opacity: 0.6 }}>
            © {new Date().getFullYear()} Reeder Teknoloji. Tüm hakları saklıdır.
          </div>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#ffffff',
        padding: '40px'
      }}>
        <div style={{ width: '100%', maxWidth: '420px' }}>
          <div style={{ marginBottom: '40px' }}>
            <h2 style={{ fontSize: '32px', fontWeight: 'bold', color: '#1e293b', marginBottom: '12px' }}>
              Tekrar Hoş Geldiniz
            </h2>
            <p style={{ color: '#64748b', fontSize: '16px' }}>
              Hesabınıza giriş yaparak operasyonlarınızı yönetmeye devam edin.
            </p>
          </div>

          {error && (
            <div style={{
              background: '#fef2f2',
              border: '2px solid #fee2e2',
              color: '#991b1b',
              padding: '16px',
              borderRadius: '12px',
              marginBottom: '32px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              fontSize: '14px',
              fontWeight: '500'
            }}>
              <Icons.Alert />
              <span>{error}</span>
            </div>
          )}

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
              <div style={{ position: 'relative' }}>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  placeholder="admin@reeder.com.tr"
                  style={{
                    width: '100%',
                    padding: '16px',
                    paddingLeft: '16px',
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
            </div>

            <div style={{ marginBottom: '32px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <label style={{
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#334155'
                }}>
                  Şifre
                </label>
                <Link to="/forgot-password" style={{ fontSize: '14px', color: '#3b82f6', textDecoration: 'none', fontWeight: '500' }}>Unuttun mu?</Link>
              </div>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  placeholder="••••••••"
                  style={{
                    width: '100%',
                    padding: '16px',
                    paddingRight: '48px', // İkon için boşluk
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
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: '16px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: '#94a3b8',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: 0
                  }}
                >
                  {showPassword ? <Icons.EyeOff /> : <Icons.Eye />}
                </button>
              </div>
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
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}
              onMouseEnter={(e) => !loading && (e.target.style.background = '#1e40af')}
              onMouseLeave={(e) => !loading && (e.target.style.background = '#1e3a8a')}
            >
              {loading ? (
                'Giriş Yapılıyor...'
              ) : (
                 <>
                   Giriş Yap <Icons.ChevronRight />
                 </>
              )}
            </button>
          </form>

          {/* Demo Info */}
          <div style={{
            marginTop: '32px',
            padding: '20px',
            background: '#eff6ff',
            borderRadius: '12px',
            border: '1px solid #dbeafe'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', color: '#1e40af' }}>
              <Icons.Info />
              <span style={{ fontWeight: '600', fontSize: '14px' }}>Demo Erişim Bilgileri</span>
            </div>
            <div style={{ display: 'flex', gap: '24px', fontSize: '14px', color: '#1e3a8a' }}>
              <div>
                <span style={{ color: '#60a5fa', fontSize: '12px', display: 'block' }}>Email</span>
                <span style={{ fontFamily: 'monospace', fontWeight: 'bold' }}>admin@reeder.com.tr</span>
              </div>
              <div>
                <span style={{ color: '#60a5fa', fontSize: '12px', display: 'block' }}>Şifre</span>
                <span style={{ fontFamily: 'monospace', fontWeight: 'bold' }}>Reeder2026!</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Responsive Style */}
      <style>{`
        @media (max-width: 900px) {
          div[style*="display: flex"][style*="minHeight: 100vh"] {
            flex-direction: column;
          }
          div[style*="background: linear-gradient"] {
            padding: 40px !important;
            flex: 0 0 auto !important;
          }
          h2[style*="font-size: 42px"] {
            font-size: 32px !important;
          }
        }
      `}</style>
    </div>
  );
}

export default Login;
