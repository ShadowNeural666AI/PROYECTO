/**
 * ========================================================
 * EXO INSIGHT AI – MÓDULO DE HISTORIAL
 * Persistencia Temporal en LocalStorage y Preparación para PostgreSQL
 * ========================================================
 */

class HistoryManager {
  constructor() {
    this.storageKey = 'exo_insight_history_v1';
    this.records = [];
    this.currentFilter = 'all';
    this.searchQuery = '';
  }

  /**
   * Inicialización del historial
   */
  init() {
    this.loadRecords();
    this.setupUIEvents();
    this.render();
  }

  /**
   * Carga registros desde LocalStorage o inicializa ejemplos si está vacío
   */
  loadRecords() {
    const raw = localStorage.getItem(this.storageKey);
    if (raw) {
      try {
        this.records = JSON.parse(raw);
      } catch (e) {
        console.warn('Error parseando historial guardado:', e);
        this.records = [];
      }
    } else {
      // Registros iniciales de ejemplo coincidentes con la imagen de referencia del usuario
      this.records = [
        {
          id: 'rec_1',
          type: 'vision',
          title: 'Computadora reconocida',
          objectName: 'Computadora',
          confidence: '98.7%',
          detail: 'Laptop o computadora portátil de trabajo.',
          timestamp: new Date(Date.now() - 1000 * 60 * 2).toISOString()
        },
        {
          id: 'rec_2',
          type: 'voice',
          title: 'Comando: ¿Qué estás viendo?',
          objectName: 'WHAT_DO_YOU_SEE',
          confidence: '100%',
          detail: 'Estoy viendo una computadora con un 98.7% de confianza.',
          timestamp: new Date(Date.now() - 1000 * 60 * 3).toISOString()
        },
        {
          id: 'rec_3',
          type: 'vision',
          title: 'Celular reconocido',
          objectName: 'Celular',
          confidence: '94.2%',
          detail: 'Teléfono móvil inteligente detectado.',
          timestamp: new Date(Date.now() - 1000 * 60 * 8).toISOString()
        },
        {
          id: 'rec_4',
          type: 'voice',
          title: 'Comando: Hola asistente',
          objectName: 'GREETING',
          confidence: '100%',
          detail: '¡Hola! Soy EXO, tu asistente inteligente.',
          timestamp: new Date(Date.now() - 1000 * 60 * 12).toISOString()
        }
      ];
      this.saveRecords();
    }
  }

  /**
   * Guarda registros en LocalStorage
   */
  saveRecords() {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.records));
      // Notificar al módulo de estadísticas que los datos cambiaron
      if (window.statisticsManager) {
        window.statisticsManager.updateStats();
      }
    } catch (e) {
      console.warn('No se pudo guardar en LocalStorage:', e);
    }
  }

  /**
   * Agrega un nuevo evento al historial
   */
  addRecord(data) {
    const record = {
      id: 'rec_' + Date.now() + '_' + Math.floor(Math.random() * 1000),
      type: data.type || 'vision', // 'vision' | 'voice'
      title: data.title || 'Evento registrado',
      objectName: data.objectName || 'Sin clasificar',
      confidence: data.confidence || '95%',
      detail: data.detail || 'Operación ejecutada con éxito',
      timestamp: new Date().toISOString()
    };

    // Agregar al inicio
    this.records.unshift(record);

    // Limitar tamaño máximo en memoria local a 200 items
    if (this.records.length > 200) {
      this.records.pop();
    }

    this.saveRecords();
    this.render();
  }

  /**
   * Elimina un registro por ID
   */
  deleteRecord(id) {
    this.records = this.records.filter(r => r.id !== id);
    this.saveRecords();
    this.render();
  }

  /**
   * Limpia la totalidad del historial
   */
  clearAll() {
    if (confirm('¿Estás seguro de que deseas eliminar todo el historial de análisis?')) {
      this.records = [];
      this.saveRecords();
      this.render();
      if (window.showToast) window.showToast('Historial vaciado correctamente', 'info');
    }
  }

  /**
   * Exporta el historial en formato JSON para descarga
   */
  exportJSON() {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(this.records, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `exo_history_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  }

  /**
   * Formatea la hora o fecha relativa
   */
  formatTime(isoString) {
    const date = new Date(isoString);
    return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
  }

  formatFullDate(isoString) {
    const date = new Date(isoString);
    return `${date.toLocaleDateString()} ${this.formatTime(isoString)}`;
  }

  /**
   * Renderiza el historial en el dashboard y en la vista completa
   */
  render() {
    this.renderRecentList();
    this.renderFullTable();
  }

  /**
   * Renderiza la lista compacta del Dashboard (conforme a la captura de pantalla)
   */
  renderRecentList() {
    const list = document.getElementById('recentHistoryList');
    if (!list) return;

    const recent = this.records.slice(0, 5);

    if (recent.length === 0) {
      list.innerHTML = `<li style="text-align:center; color:var(--text-muted); padding:10px; font-size:12px;">Sin registros recientes</li>`;
      return;
    }

    list.innerHTML = recent.map(item => `
      <li class="recent-hist-item">
        <div class="hist-item-left">
          <i class="fa-solid ${item.type === 'vision' ? 'fa-camera hist-item-icon cyan' : 'fa-microphone hist-item-icon purple'}"></i>
          <span>${item.title}</span>
        </div>
        <span class="hist-item-time">${this.formatTime(item.timestamp)}</span>
      </li>
    `).join('');
  }

  /**
   * Renderiza la tabla completa con filtros y buscador
   */
  renderFullTable() {
    const tbody = document.getElementById('historyTableBody');
    const emptyState = document.getElementById('historyEmptyState');
    if (!tbody) return;

    let filtered = this.records;

    // Filtro por tipo
    if (this.currentFilter !== 'all') {
      filtered = filtered.filter(r => r.type === this.currentFilter);
    }

    // Filtro por búsqueda
    if (this.searchQuery) {
      const q = this.searchQuery.toLowerCase();
      filtered = filtered.filter(r => 
        r.title.toLowerCase().includes(q) || 
        r.objectName.toLowerCase().includes(q) ||
        r.detail.toLowerCase().includes(q)
      );
    }

    if (filtered.length === 0) {
      tbody.innerHTML = '';
      if (emptyState) emptyState.classList.remove('hidden');
      return;
    }

    if (emptyState) emptyState.classList.add('hidden');

    tbody.innerHTML = filtered.map(item => `
      <tr>
        <td>${this.formatFullDate(item.timestamp)}</td>
        <td>
          <span class="hist-type-pill ${item.type === 'vision' ? 'type-vision' : 'type-voice'}">
            <i class="fa-solid ${item.type === 'vision' ? 'fa-camera' : 'fa-microphone'}"></i>
            ${item.type === 'vision' ? 'Visión' : 'Voz'}
          </span>
        </td>
        <td><strong>${item.title}</strong></td>
        <td><span style="color:var(--neon-green); font-family:var(--font-mono); font-weight:700;">${item.confidence}</span></td>
        <td>${item.detail}</td>
        <td>
          <button class="btn-icon-minimal" style="color:var(--neon-red);" onclick="window.historyManager.deleteRecord('${item.id}')" title="Eliminar">
            <i class="fa-solid fa-trash-can"></i>
          </button>
        </td>
      </tr>
    `).join('');
  }

  /**
   * Configura eventos de la interfaz
   */
  setupUIEvents() {
    // Botón Ver todo desde el Dashboard
    const seeAllBtn = document.getElementById('seeAllHistoryBtn');
    if (seeAllBtn && window.app) {
      seeAllBtn.addEventListener('click', () => {
        window.app.switchTab('history');
      });
    }

    // Buscador
    const searchInput = document.getElementById('historySearchInput');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this.searchQuery = e.target.value.trim();
        this.renderFullTable();
      });
    }

    // Píldoras de filtro
    document.querySelectorAll('.pill-filter').forEach(pill => {
      pill.addEventListener('click', () => {
        document.querySelectorAll('.pill-filter').forEach(p => p.classList.remove('active'));
        pill.classList.add('active');
        this.currentFilter = pill.getAttribute('data-filter');
        this.renderFullTable();
      });
    });

    // Exportar y limpiar
    const exportBtn = document.getElementById('exportHistoryBtn');
    if (exportBtn) exportBtn.addEventListener('click', () => this.exportJSON());

    const clearBtn = document.getElementById('clearFullHistoryBtn');
    if (clearBtn) clearBtn.addEventListener('click', () => this.clearAll());
  }
}

// Instanciar historial globalmente
window.historyManager = new HistoryManager();
document.addEventListener('DOMContentLoaded', () => {
  window.historyManager.init();
});
