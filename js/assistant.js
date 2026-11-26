/**
 * ========================================================
 * EXO INSIGHT AI – ASISTENTE INTELIGENTE CONVERSACIONAL
 * Diálogo Contextual Basado en Datos Reales de Visión y Voz
 * ========================================================
 */

class AssistantManager {
  constructor() {
    this.messages = [];
    this.currentVisionContext = {
      className: 'Sin objeto',
      confidence: 0,
      timestamp: null,
      isStreaming: false
    };
  }

  /**
   * Inicialización del Asistente
   */
  init() {
    this.setupUIEvents();
    this.renderInitialMessages();
  }

  /**
   * Carga mensajes iniciales en ambos streams (Dashboard y Full View)
   */
  renderInitialMessages() {
    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    this.messages = [
      {
        sender: 'assistant',
        text: '¡Hola! Soy EXO, tu asistente inteligente. ¿En qué puedo ayudarte hoy?',
        time: timeStr
      }
    ];

    this.syncChatUI();
  }

  /**
   * Agrega un nuevo mensaje al historial de chat
   */
  addMessage(text, sender = 'user') {
    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    const msg = {
      sender,
      text,
      time: timeStr
    };

    this.messages.push(msg);
    this.appendMessageToDOM(msg);
    this.scrollToBottom();
  }

  /**
   * Renderiza el mensaje en los contenedores de chat
   */
  appendMessageToDOM(msg) {
    const streamDash = document.getElementById('chatStream');
    const streamFull = document.getElementById('fullChatMessagesList');

    const html = `
      <div class="chat-message msg-${msg.sender}">
        <div class="msg-avatar">
          <i class="fa-solid ${msg.sender === 'assistant' ? 'fa-robot' : 'fa-user'}"></i>
        </div>
        <div class="msg-body">
          <div class="msg-bubble">${msg.text}</div>
          <div class="msg-meta">
            <span class="msg-time">${msg.time}</span>
            ${msg.sender === 'assistant' ? `<button class="msg-speak-btn" title="Escuchar"><i class="fa-solid fa-volume-high"></i></button>` : ''}
          </div>
        </div>
      </div>
    `;

    if (streamDash) {
      streamDash.insertAdjacentHTML('beforeend', html);
      this.attachSpeakListener(streamDash.lastElementChild, msg.text);
    }

    if (streamFull) {
      streamFull.insertAdjacentHTML('beforeend', html);
      this.attachSpeakListener(streamFull.lastElementChild, msg.text);
    }
  }

  /**
   * Conecta el botón de altavoz dentro de cada burbuja de mensaje
   */
  attachSpeakListener(elem, text) {
    if (!elem) return;
    const btn = elem.querySelector('.msg-speak-btn');
    if (btn && window.voiceManager) {
      btn.addEventListener('click', () => {
        window.voiceManager.speakResponse(text);
      });
    }
  }

  /**
   * Sincroniza la totalidad de mensajes en la interfaz
   */
  syncChatUI() {
    const streamDash = document.getElementById('chatStream');
    const streamFull = document.getElementById('fullChatMessagesList');

    if (streamDash) streamDash.innerHTML = '';
    if (streamFull) streamFull.innerHTML = '';

    this.messages.forEach(msg => this.appendMessageToDOM(msg));
    this.scrollToBottom();
  }

  /**
   * Desplaza el scroll automáticamente al final
   */
  scrollToBottom() {
    const streamDash = document.getElementById('chatStream');
    const streamFull = document.getElementById('fullChatMessagesList');

    if (streamDash) streamDash.scrollTop = streamDash.scrollHeight;
    if (streamFull) streamFull.scrollTop = streamFull.scrollHeight;
  }

  /**
   * Procesa una consulta escrita o hablada del usuario
   * Utiliza el motor conversacional dinámico y no-monótono
   */
  processAssistantQuery(userText) {
    if (!userText || !userText.trim()) return;

    if (window.voiceManager && typeof window.voiceManager.processVoiceCommand === 'function') {
      window.voiceManager.processVoiceCommand(userText);
      return;
    }

    this.addMessage(userText, 'user');
    const reply = `He recibido tu consulta «${userText}». Estoy capacitado para interactuar con la cámara, clasificar objetos y responder tus preguntas.`;
    setTimeout(() => {
      this.addMessage(reply, 'assistant');
    }, 400);
  }

  /**
   * Actualiza los datos de percepción visual transmitidos por vision.js
   */
  updateVisionContext(result) {
    this.currentVisionContext = {
      className: result.className,
      confidence: result.confidence,
      timestamp: result.timestamp || new Date(),
      isStreaming: true
    };

    // Actualizar datos en la columna del asistente expandido
    const ctxObj = document.getElementById('ctxLastObject');
    const ctxConf = document.getElementById('ctxConfidence');
    const ctxTime = document.getElementById('ctxTimestamp');
    const ctxStatus = document.getElementById('ctxVisionStatus');

    if (ctxObj) ctxObj.textContent = result.className;
    if (ctxConf) ctxConf.textContent = `${result.confidence}%`;
    if (ctxTime) ctxTime.textContent = this.currentVisionContext.timestamp.toLocaleTimeString();
    if (ctxStatus) {
      ctxStatus.textContent = 'Activo / Analizando';
      ctxStatus.className = 'context-val text-cyan';
    }
  }

  /**
   * Limpia el chat
   */
  clearChat() {
    this.messages = [];
    this.renderInitialMessages();
    if (window.showToast) window.showToast('Chat restablecido', 'info');
  }

  /**
   * Configura eventos de envío en formularios
   */
  setupUIEvents() {
    // Input en Dashboard
    const dashInput = document.getElementById('chatTextInput');
    const dashSendBtn = document.getElementById('chatSendBtn');

    if (dashInput && dashSendBtn) {
      dashSendBtn.addEventListener('click', () => {
        const text = dashInput.value.trim();
        if (text) {
          this.processAssistantQuery(text);
          dashInput.value = '';
        }
      });

      dashInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          const text = dashInput.value.trim();
          if (text) {
            this.processAssistantQuery(text);
            dashInput.value = '';
          }
        }
      });
    }

    // Input en Vista Completa del Asistente
    const fullInput = document.getElementById('fullChatInput');
    const fullSendBtn = document.getElementById('fullChatSendBtn');

    if (fullInput && fullSendBtn) {
      fullSendBtn.addEventListener('click', () => {
        const text = fullInput.value.trim();
        if (text) {
          this.processAssistantQuery(text);
          fullInput.value = '';
        }
      });

      fullInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          const text = fullInput.value.trim();
          if (text) {
            this.processAssistantQuery(text);
            fullInput.value = '';
          }
        }
      });
    }

    // Limpiar chat
    const clearBtn = document.getElementById('clearChatHistoryBtn');
    if (clearBtn) {
      clearBtn.addEventListener('click', () => this.clearChat());
    }

    // Limpiar chat desde la cabecera
    const clearHeaderBtn = document.getElementById('clearChatBtn');
    if (clearHeaderBtn) {
      clearHeaderBtn.addEventListener('click', () => this.clearChat());
    }
  }
}

// Instanciar asistente globalmente
window.assistantManager = new AssistantManager();
document.addEventListener('DOMContentLoaded', () => {
  window.assistantManager.init();
});
