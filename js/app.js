/**
 * ========================================================
 * EXO INSIGHT AI – CONTROLADOR MAESTRO DE LA APLICACIÓN
 * Navegación por Pestañas, Reloj en Tiempo Real, Efectos de Sonido
 * Sintetizados por Web Audio API y Notificaciones Toast
 * ========================================================
 */

class SoundFXManager {
  constructor() {
    this.ctx = null;
  }

  initCtx() {
    if (!this.ctx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) {
        this.ctx = new AudioContext();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  /**
   * Genera un beep electrónico futurista
   */
  playBeep(freq = 880, type = 'sine', duration = 0.12) {
    try {
      this.initCtx();
      if (!this.ctx) return;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(freq * 1.5, this.ctx.currentTime + duration);

      gain.gain.setValueAtTime(0.08, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + duration);
    } catch (e) {}
  }

  /**
   * Genera un sonido de barrido de escaneo láser
   */
  playLaserScan() {
    try {
      this.initCtx();
      if (!this.ctx) return;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(1400, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(300, this.ctx.currentTime + 0.25);

      gain.gain.setValueAtTime(0.06, this.ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.001, this.ctx.currentTime + 0.25);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.25);
    } catch (e) {}
  }
}

class AppController {
  constructor() {
    this.currentTab = 'dashboard';
  }

  init() {
    window.soundFX = new SoundFXManager();
    this.setupClock();
    this.setupTabNavigation();
    this.setupMobileMenu();
    this.setupNotifications();
    this.setupQuickLaunchButtons();
    this.setupSystemReset();
  }

  /**
   * Reloj digital de precisión en el encabezado
   */
  setupClock() {
    const clockElem = document.getElementById('realTimeClock');
    const update = () => {
      if (clockElem) {
        const now = new Date();
        clockElem.textContent = now.toLocaleTimeString();
      }
    };
    update();
    setInterval(update, 1000);
  }

  /**
   * Cambio de pestañas entre vistas
   */
  setupTabNavigation() {
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
      item.addEventListener('click', (e) => {
        e.preventDefault();
        const tab = item.getAttribute('data-tab');
        if (tab) {
          this.switchTab(tab);
        }
      });
    });
  }

  switchTab(tabId) {
    if (window.soundFX) window.soundFX.playBeep(1100, 'sine', 0.08);

    this.currentTab = tabId;

    // Actualizar sidebar activa
    document.querySelectorAll('.nav-item').forEach(item => {
      if (item.getAttribute('data-tab') === tabId) {
        item.classList.add('active');
      } else {
        item.classList.remove('active');
      }
    });

    // Ocultar todas las vistas y mostrar la seleccionada
    document.querySelectorAll('.view-panel').forEach(panel => {
      panel.classList.remove('active');
    });

    const activeView = document.getElementById(`view-${tabId}`);
    if (activeView) {
      activeView.classList.add('active');
    }

    // Cerrar sidebar en dispositivos móviles al cambiar de pestaña
    const sidebar = document.getElementById('mainSidebar');
    if (sidebar) sidebar.classList.remove('open');

    // Notificar al motor 3D del cambio de pestaña para auto-ajuste de viewports
    if (window.exoRobot && typeof window.exoRobot.onTabChanged === 'function') {
      window.exoRobot.onTabChanged(tabId);
    }
  }

  /**
   * Menú hamburguesa para pantallas móviles
   */
  setupMobileMenu() {
    const menuBtn = document.getElementById('mobileMenuBtn');
    const sidebar = document.getElementById('mainSidebar');

    if (menuBtn && sidebar) {
      menuBtn.addEventListener('click', () => {
        sidebar.classList.toggle('open');
      });
    }
  }

  /**
   * Menú desplegable de notificaciones
   */
  setupNotifications() {
    const btn = document.getElementById('notificationsBtn');
    const menu = document.getElementById('notificationsMenu');
    const clearBtn = document.getElementById('clearNotifsBtn');
    const badge = document.getElementById('notifBadge');
    const list = document.getElementById('notifList');

    if (btn && menu) {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        menu.classList.toggle('hidden');
      });

      document.addEventListener('click', (e) => {
        if (!menu.contains(e.target) && e.target !== btn) {
          menu.classList.add('hidden');
        }
      });
    }

    if (clearBtn && list && badge) {
      clearBtn.addEventListener('click', () => {
        list.innerHTML = `<li style="text-align:center; color:var(--text-muted); font-size:12px; padding:10px;">No hay notificaciones pendientes.</li>`;
        badge.style.display = 'none';
      });
    }
  }

  /**
   * Botones de acceso rápido para interactuar con EXO 3D
   */
  setupQuickLaunchButtons() {
    const quickExoBtn = document.getElementById('quickExoBtn');
    if (quickExoBtn) {
      quickExoBtn.addEventListener('click', () => {
        if (window.exoRobot) {
          window.exoRobot.triggerClickReaction();
        }
      });
    }

    const dashExoWaveBtn = document.getElementById('dashExoWaveBtn');
    if (dashExoWaveBtn) {
      dashExoWaveBtn.addEventListener('click', () => {
        if (window.exoRobot) {
          window.exoRobot.triggerClickReaction();
        }
      });
    }
  }

  /**
   * Restablecimiento de datos a valores de fábrica
   */
  setupSystemReset() {
    const resetBtn = document.getElementById('resetAllDataBtn');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        if (confirm('¿Deseas restablecer todos los parámetros, modelos y registros de EXO INSIGHT AI?')) {
          localStorage.clear();
          location.reload();
        }
      });
    }
  }
}

/**
 * Notificaciones Flotantes (Toasts)
 */
window.showToast = function(message, type = 'info') {
  const container = document.getElementById('toastContainer');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `cyber-toast toast-${type}`;

  const iconClass = type === 'success' ? 'fa-circle-check text-green' : (type === 'error' ? 'fa-triangle-exclamation text-red' : 'fa-circle-info text-cyan');

  toast.innerHTML = `
    <i class="fa-solid ${iconClass} toast-icon"></i>
    <span class="toast-text">${message}</span>
  `;

  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(50px)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 4000);
};

// Iniciar aplicación
window.app = new AppController();
document.addEventListener('DOMContentLoaded', () => {
  window.app.init();
});
