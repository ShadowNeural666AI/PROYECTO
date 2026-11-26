/**
 * ========================================================
 * EXO INSIGHT AI – MÓDULO DE ESTADÍSTICAS Y ANALÍTICA
 * Visualización de Métricas de Inteligencia Artificial con Chart.js
 * ========================================================
 */

class StatisticsManager {
  constructor() {
    this.charts = {
      donut: null,
      objectsBar: null,
      activityLine: null,
      voicePie: null,
      accuracyDist: null
    };

    // Estilos visuales compartidos de Chart.js acordes al tema cyberpunk
    this.themeColors = {
      cyan: '#00e5ff',
      blue: '#0077ff',
      purple: '#7928ca',
      green: '#00ff88',
      orange: '#ff9900',
      red: '#ff3366',
      gridLines: 'rgba(0, 229, 255, 0.08)',
      textPrimary: '#94a3b8'
    };
  }

  /**
   * Inicialización del módulo de estadísticas
   */
  init() {
    if (typeof Chart === 'undefined') {
      console.warn('Chart.js no está cargado');
      return;
    }

    this.configureChartDefaults();
    this.initQuickDonutChart();
    this.initFullAnalyticsCharts();
    this.updateStats();
  }

  /**
   * Configuración de fuentes y colores globales para Chart.js
   */
  configureChartDefaults() {
    Chart.defaults.color = this.themeColors.textPrimary;
    Chart.defaults.font.family = "'Rajdhani', sans-serif";
    Chart.defaults.font.size = 12;
    Chart.defaults.plugins.tooltip.backgroundColor = 'rgba(7, 14, 32, 0.95)';
    Chart.defaults.plugins.tooltip.borderColor = 'rgba(0, 229, 255, 0.3)';
    Chart.defaults.plugins.tooltip.borderWidth = 1;
    Chart.defaults.plugins.tooltip.cornerRadius = 8;
  }

  /**
   * 1. Mini Donut Chart en el Dashboard (conforme al diseño original de la imagen)
   */
  initQuickDonutChart() {
    const canvas = document.getElementById('quickDonutChart');
    if (!canvas) return;

    this.charts.donut = new Chart(canvas, {
      type: 'doughnut',
      data: {
        labels: ['Objetos', 'Comandos', 'Otros'],
        datasets: [{
          data: [45, 35, 20],
          backgroundColor: [
            this.themeColors.blue,
            this.themeColors.green,
            this.themeColors.orange
          ],
          borderColor: '#0b1329',
          borderWidth: 2,
          hoverOffset: 4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '72%',
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (ctx) => ` ${ctx.label}: ${ctx.raw}%`
            }
          }
        }
      }
    });
  }

  /**
   * 2. Gráficos completos en la vista de Estadísticas
   */
  initFullAnalyticsCharts() {
    // A. Bar Chart: Frecuencia de Detección por Objeto
    const barCanvas = document.getElementById('objectsBarChart');
    if (barCanvas) {
      this.charts.objectsBar = new Chart(barCanvas, {
        type: 'bar',
        data: {
          labels: ['Computadora', 'Celular', 'Mouse', 'Teclado', 'Botella', 'Persona'],
          datasets: [{
            label: 'Detecciones',
            data: [18, 12, 7, 9, 6, 14],
            backgroundColor: 'rgba(0, 229, 255, 0.65)',
            borderColor: this.themeColors.cyan,
            borderWidth: 1.5,
            borderRadius: 6
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false }
          },
          scales: {
            x: {
              grid: { color: this.themeColors.gridLines }
            },
            y: {
              beginAtZero: true,
              grid: { color: this.themeColors.gridLines }
            }
          }
        }
      });
    }

    // B. Line Chart: Actividad Cronológica
    const lineCanvas = document.getElementById('activityLineChart');
    if (lineCanvas) {
      this.charts.activityLine = new Chart(lineCanvas, {
        type: 'line',
        data: {
          labels: ['12:00', '13:00', '14:00', '15:00', '16:00', '17:00'],
          datasets: [
            {
              label: 'Detecciones de Cámara',
              data: [5, 12, 8, 15, 20, 24],
              borderColor: this.themeColors.cyan,
              backgroundColor: 'rgba(0, 229, 255, 0.1)',
              tension: 0.4,
              fill: true,
              pointBackgroundColor: this.themeColors.cyan
            },
            {
              label: 'Comandos de Voz',
              data: [3, 7, 5, 11, 14, 18],
              borderColor: this.themeColors.purple,
              backgroundColor: 'rgba(121, 40, 202, 0.08)',
              tension: 0.4,
              fill: true,
              pointBackgroundColor: this.themeColors.purple
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { position: 'top' }
          },
          scales: {
            x: { grid: { color: this.themeColors.gridLines } },
            y: { beginAtZero: true, grid: { color: this.themeColors.gridLines } }
          }
        }
      });
    }

    // C. Pie Chart: Comandos de Voz Más Utilizados
    const pieCanvas = document.getElementById('voiceCommandsPieChart');
    if (pieCanvas) {
      this.charts.voicePie = new Chart(pieCanvas, {
        type: 'pie',
        data: {
          labels: ['Hola asistente', 'Analiza objeto', '¿Qué estás viendo?', 'Detener', 'Ayuda'],
          datasets: [{
            data: [25, 30, 20, 15, 10],
            backgroundColor: [
              this.themeColors.cyan,
              this.themeColors.blue,
              this.themeColors.purple,
              this.themeColors.orange,
              this.themeColors.green
            ],
            borderColor: '#0b1329',
            borderWidth: 2
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { position: 'right' }
          }
        }
      });
    }

    // D. Doughnut Chart: Distribución de Precisión
    const accCanvas = document.getElementById('accuracyDistributionChart');
    if (accCanvas) {
      this.charts.accuracyDist = new Chart(accCanvas, {
        type: 'doughnut',
        data: {
          labels: ['> 95%', '85% - 95%', '70% - 85%', '< 70%'],
          datasets: [{
            data: [58, 26, 12, 4],
            backgroundColor: [
              this.themeColors.green,
              this.themeColors.cyan,
              this.themeColors.orange,
              this.themeColors.red
            ],
            borderColor: '#0b1329',
            borderWidth: 2
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { position: 'right' }
          }
        }
      });
    }
  }

  /**
   * Recalcula estadísticas a partir del historial real en LocalStorage
   */
  updateStats() {
    if (!window.historyManager) return;

    const records = window.historyManager.records || [];
    const visionRecords = records.filter(r => r.type === 'vision');
    const voiceRecords = records.filter(r => r.type === 'voice');

    // 1. KPI: Total análisis visuales
    const totalAnalysesElem = document.getElementById('kpiTotalAnalyses');
    if (totalAnalysesElem) totalAnalysesElem.textContent = visionRecords.length;

    // 2. KPI: Total comandos procesados
    const totalCommandsElem = document.getElementById('kpiTotalCommands');
    if (totalCommandsElem) totalCommandsElem.textContent = voiceRecords.length;

    // 3. KPI: Confianza promedio
    const avgConfidenceElem = document.getElementById('kpiAvgConfidence');
    let avg = 96.4;
    if (visionRecords.length > 0) {
      const sum = visionRecords.reduce((acc, r) => {
        const val = parseFloat(r.confidence) || 90;
        return acc + val;
      }, 0);
      avg = (sum / visionRecords.length).toFixed(1);
    }
    if (avgConfidenceElem) avgConfidenceElem.textContent = `${avg}%`;

    // 4. KPI: Objeto más frecuente
    const topObjectElem = document.getElementById('kpiTopObject');
    const counts = {};
    visionRecords.forEach(r => {
      const name = r.objectName || 'Computadora';
      if (name !== 'Sin objeto') {
        counts[name] = (counts[name] || 0) + 1;
      }
    });

    let topObj = 'Computadora';
    let maxCount = 0;
    for (const [obj, cnt] of Object.entries(counts)) {
      if (cnt > maxCount) {
        maxCount = cnt;
        topObj = obj;
      }
    }
    if (topObjectElem) topObjectElem.textContent = topObj;

    // 5. Actualizar leyenda del Donut en Dashboard
    const totalEvents = records.length || 1;
    const objPct = Math.round((visionRecords.length / totalEvents) * 100) || 45;
    const cmdPct = Math.round((voiceRecords.length / totalEvents) * 100) || 35;
    const otherPct = Math.max(0, 100 - objPct - cmdPct);

    const legObj = document.getElementById('legendObjPercent');
    const legCmd = document.getElementById('legendCmdPercent');
    const legOth = document.getElementById('legendOtherPercent');
    const quickAcc = document.getElementById('quickAccuracyRate');

    if (legObj) legObj.textContent = `${objPct}%`;
    if (legCmd) legCmd.textContent = `${cmdPct}%`;
    if (legOth) legOth.textContent = `${otherPct}%`;
    if (quickAcc) quickAcc.textContent = `${avg}%`;

    if (this.charts.donut) {
      this.charts.donut.data.datasets[0].data = [objPct, cmdPct, otherPct];
      this.charts.donut.update();
    }

    // 6. Actualizar Bar Chart de objetos con datos acumulados
    if (this.charts.objectsBar && Object.keys(counts).length > 0) {
      const labels = Object.keys(counts);
      const data = Object.values(counts);
      this.charts.objectsBar.data.labels = labels;
      this.charts.objectsBar.data.datasets[0].data = data;
      this.charts.objectsBar.update();
    }
  }
}

// Instanciar estadísticas globalmente
window.statisticsManager = new StatisticsManager();
document.addEventListener('DOMContentLoaded', () => {
  window.statisticsManager.init();
});
