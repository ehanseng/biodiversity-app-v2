// Utilidades para notificaciones web nativas
class WebNotifications {
  constructor() {
    this.permission = 'default';
    // No inicializar automáticamente para evitar warnings del navegador
  }

  // Mostrar notificación - SIEMPRE usar fallback toast para mejor compatibilidad web
  showNotification(title, options = {}) {
    console.log('🔔 [WebNotifications] Mostrando toast:', title, options.body);
    
    // Determinar tipo basado en el tag o opciones
    let type = 'info';
    if (options.tag === 'error' || title.toLowerCase().includes('error')) {
      type = 'error';
    } else if (options.tag === 'warning' || title.toLowerCase().includes('advertencia') || title.toLowerCase().includes('requeridos')) {
      type = 'warning';
    } else if (options.tag === 'success' || title.toLowerCase().includes('éxito')) {
      type = 'success';
    }
    
    return this.showFallbackToast(title, options.body, type);
  }

  // Fallback: mostrar toast visual en la página
  showFallbackToast(title, body, type = 'success') {
    console.log('🍞 [WebNotifications] showFallbackToast llamado:', { title, body, type });
    
    const toast = document.createElement('div');
    
    // Obtener color según el tipo
    const getColors = (type) => {
      switch (type) {
        case 'success':
          return { bg: '#28a745', border: '#155724' };
        case 'error':
          return { bg: '#dc3545', border: '#721c24' };
        case 'warning':
          return { bg: '#ffc107', border: '#856404' };
        case 'info':
          return { bg: '#17a2b8', border: '#0c5460' };
        default:
          return { bg: '#28a745', border: '#155724' };
      }
    };

    const colors = getColors(type);
    
    toast.style.cssText = `
      position: fixed;
      bottom: 30px;
      left: 50%;
      transform: translateX(-50%);
      background: ${colors.bg};
      color: white;
      padding: 24px 32px;
      border-radius: 12px;
      border: 3px solid ${colors.border};
      box-shadow: 0 8px 32px rgba(0,0,0,0.4), 0 0 0 2px rgba(255,255,255,0.1);
      z-index: 999999;
      min-width: 320px;
      max-width: 500px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 16px;
      line-height: 1.5;
      text-align: center;
      animation: slideUpIn 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55);
      backdrop-filter: blur(10px);
    `;

    // Agregar animación CSS mejorada
    if (!document.getElementById('toast-animations-v2')) {
      const style = document.createElement('style');
      style.id = 'toast-animations-v2';
      style.textContent = `
        @keyframes popIn {
          0% { 
            transform: translate(-50%, -50%) scale(0.5); 
            opacity: 0; 
          }
          50% { 
            transform: translate(-50%, -50%) scale(1.1); 
            opacity: 0.8; 
          }
          100% { 
            transform: translate(-50%, -50%) scale(1); 
            opacity: 1; 
          }
        }
        @keyframes popOut {
          0% { 
            transform: translateX(-50%) translateY(0); 
            opacity: 1; 
          }
          100% { 
            transform: translateX(-50%) translateY(100%); 
            opacity: 0; 
          }
        }
        @keyframes pulse {
          0%, 100% { transform: translateX(-50%) translateY(0) scale(1); }
          50% { transform: translateX(-50%) translateY(0) scale(1.02); }
        }
        @keyframes slideUpIn {
          0% { 
            transform: translateX(-50%) translateY(100%); 
            opacity: 0; 
          }
          100% { 
            transform: translateX(-50%) translateY(0); 
            opacity: 1; 
          }
        }
      `;
      document.head.appendChild(style);
    }

    // Obtener emoji según el tipo
    const getEmoji = (type) => {
      switch (type) {
        case 'success': return '✅';
        case 'error': return '❌';
        case 'warning': return '⚠️';
        case 'info': return 'ℹ️';
        default: return '✅';
      }
    };

    toast.innerHTML = `
      <div style="display: flex; align-items: center; justify-content: center; margin-bottom: 8px;">
        <span style="font-size: 32px; margin-right: 12px;">${getEmoji(type)}</span>
        <div style="font-weight: 700; font-size: 18px;">${title}</div>
      </div>
      ${body ? `<div style="opacity: 0.95; font-size: 14px; margin-top: 8px;">${body}</div>` : ''}
      <div style="margin-top: 16px; font-size: 12px; opacity: 0.8;">
        Esta notificación se cerrará automáticamente
      </div>
    `;

    // Crear overlay para hacer el fondo más oscuro
    const overlay = document.createElement('div');
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.3);
      z-index: 999998;
      animation: fadeIn 0.3s ease-out;
    `;

    // Agregar animación de overlay
    if (!document.getElementById('overlay-animations')) {
      const style = document.createElement('style');
      style.id = 'overlay-animations';
      style.textContent = `
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes fadeOut {
          from { opacity: 1; }
          to { opacity: 0; }
        }
      `;
      document.head.appendChild(style);
    }

    document.body.appendChild(overlay);
    document.body.appendChild(toast);

    // Agregar efecto de pulso sutil después de aparecer
    setTimeout(() => {
      toast.style.animation = 'pulse 2s ease-in-out infinite';
    }, 400);

    // Función para cerrar el toast
    const closeToast = () => {
      toast.style.animation = 'popOut 0.3s ease-in';
      overlay.style.animation = 'fadeOut 0.3s ease-in';
      
      setTimeout(() => {
        if (toast.parentNode) toast.parentNode.removeChild(toast);
        if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
      }, 300);
    };

    // Cerrar al hacer click en el overlay
    overlay.addEventListener('click', closeToast);
    
    // Cerrar al hacer click en el toast
    toast.addEventListener('click', closeToast);

    // Auto-cerrar después de 5 segundos
    setTimeout(closeToast, 5000);

    return toast;
  }

  async requestPermission() {
    if ('Notification' in window) {
      this.permission = await Notification.requestPermission();
      return this.permission;
    }
    return 'denied';
  }

  // Métodos de conveniencia
  showSuccess(title, body) {
    return this.showNotification(title, {
      body,
      icon: '✅',
      tag: 'success'
    });
  }

  showError(title, body) {
    return this.showNotification(title, {
      body,
      icon: '❌',
      tag: 'error'
    });
  }

  showWarning(title, body) {
    return this.showNotification(title, {
      body,
      icon: '⚠️',
      tag: 'warning'
    });
  }

  showInfo(title, body) {
    return this.showNotification(title, {
      body,
      icon: 'ℹ️',
      tag: 'info'
    });
  }
}

// Instancia global
const webNotifications = new WebNotifications();

export default webNotifications;
