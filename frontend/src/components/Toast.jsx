import React, { useEffect } from 'react';
import Icons from './Icons';

export default function Toast({ toast, onClose }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose(toast.id);
    }, 5000);
    return () => clearTimeout(timer);
  }, [toast.id, onClose]);

  const getStyles = () => {
    switch (toast.type) {
      case 'DANGER': return { bg: '#fef2f2', border: '#fecaca', icon: <Icons.Alert color="#ef4444" /> };
      case 'WARNING': return { bg: '#fffbeb', border: '#fcd34d', icon: <Icons.Alert color="#f59e0b" /> };
      case 'SUCCESS': return { bg: '#f0fdf4', border: '#bbf7d0', icon: <Icons.Check color="#22c55e" /> };
      default: return { bg: '#eff6ff', border: '#bfdbfe', icon: <Icons.Notification color="#3b82f6" /> };
    }
  };

  const style = getStyles();

  return (
    <div style={{
      background: style.bg,
      border: `1px solid ${style.border}`,
      padding: '16px',
      borderRadius: '12px',
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
      marginBottom: '12px',
      width: '320px',
      display: 'flex',
      alignItems: 'start',
      gap: '12px',
      animation: 'slideIn 0.3s ease-out',
      position: 'relative',
      overflow: 'hidden'
    }}>
      <div style={{ marginTop: '2px' }}>
        {style.icon}
      </div>
      <div style={{ flex: 1 }}>
        <h4 style={{ margin: '0 0 4px 0', fontSize: '14px', fontWeight: 'bold', color: '#1f2937' }}>{toast.title}</h4>
        <p style={{ margin: 0, fontSize: '13px', color: '#4b5563', lineHeight: '1.4' }}>{toast.message}</p>
      </div>
      <button 
        onClick={() => onClose(toast.id)} 
        style={{ 
          border: 'none', 
          background: 'transparent', 
          cursor: 'pointer',
          padding: '4px',
          opacity: 0.6
        }}
        onMouseEnter={(e) => e.target.style.opacity = 1}
        onMouseLeave={(e) => e.target.style.opacity = 0.6}
      >
        <Icons.Close size={16} />
      </button>

      {/* Timer Bar */}
      <div style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          height: '3px',
          width: '100%',
          background: style.border,
          animation: 'shrink 5s linear forwards'
      }}></div>
      <style>{`
        @keyframes slideIn {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        @keyframes shrink {
          from { width: 100%; }
          to { width: 0%; }
        }
      `}</style>
    </div>
  );
}
