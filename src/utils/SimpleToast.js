// Sistema de notificaciones toast simple y confiable para web
class SimpleToast {
  static show(title, message, type = 'info') {
    console.log('🍞 [SimpleToast] Mostrando toast:', { title, message, type });
    
    // Crear elemento toast
    const toast = document.createElement('div');
    
    // Colores según tipo
    const colors = {
      success: { bg: '#28a745', text: '#fff' },
      error: { bg: '#dc3545', text: '#fff' },
      warning: { bg: '#ffc107', text: '#212529' },
      info: { bg: '#17a2b8', text: '#fff' }
    };
    
    const color = colors[type] || colors.info;
    
    // Estilos del toast
    toast.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: ${color.bg};
      color: ${color.text};
      padding: 16px 24px;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
      z-index: 999999;
      max-width: 400px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 14px;
      line-height: 1.4;
      animation: slideIn 0.3s ease-out;
      cursor: pointer;
    `;
    
    // Contenido del toast
    toast.innerHTML = `
      <div style="font-weight: bold; margin-bottom: 4px;">${title}</div>
      <div>${message}</div>
    `;
    
    // Agregar animación CSS si no existe
    if (!document.getElementById('simple-toast-styles')) {
      const style = document.createElement('style');
      style.id = 'simple-toast-styles';
      style.textContent = `
        @keyframes slideIn {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        @keyframes slideOut {
          from { transform: translateX(0); opacity: 1; }
          to { transform: translateX(100%); opacity: 0; }
        }
      `;
      document.head.appendChild(style);
    }
    
    // Agregar al DOM
    document.body.appendChild(toast);
    
    // Función para cerrar
    const closeToast = () => {
      toast.style.animation = 'slideOut 0.3s ease-in';
      setTimeout(() => {
        if (toast.parentNode) {
          toast.parentNode.removeChild(toast);
        }
      }, 300);
    };
    
    // Cerrar al hacer clic
    toast.addEventListener('click', closeToast);
    
    // Auto-cerrar después de 4 segundos
    setTimeout(closeToast, 4000);
    
    console.log('✅ [SimpleToast] Toast agregado al DOM');
    return toast;
  }
  
  static success(title, message) {
    return this.show(title, message, 'success');
  }
  
  static error(title, message) {
    return this.show(title, message, 'error');
  }
  
  static warning(title, message) {
    return this.show(title, message, 'warning');
  }
  
  static info(title, message) {
    return this.show(title, message, 'info');
  }
}

export default SimpleToast;
