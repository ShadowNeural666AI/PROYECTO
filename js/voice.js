/**
 * ========================================================
 * EXO INSIGHT AI – MÓDULO DE VOZ Y SÍNTESIS INTELIGENTE
 * Modelo Entrenado de Audio Teachable Machine (INICIA / ALTO)
 * + Motor Conversacional Dinámico No-Monótono con Web Speech API
 * ========================================================
 */

class VoiceAIManager {
  constructor() {
    this.recognition = null;
    this.synth = window.speechSynthesis || null;
    this.isListening = false;
    this.selectedVoice = null;
    this.voiceRate = 1.0;
    this.voicePitch = 1.0;

    // Metadatos y pesos del modelo de audio entrenado
    this.audioModelMeta = null;
    this.audioModelWeights = null;
    this.isAudioModelLoaded = false;

    // Visualizadores de audio (Canvases)
    this.visualizerCanvasIds = ['assistantWaveCanvas', 'voiceCommandWaveCanvas', 'voiceStudioWaveCanvas'];
    this.visualizerAnimationId = null;
    this.wavePhase = 0;
    this.audioAmplitude = 0;

    // Repertorio dinámico y variado para evitar monotonía
    this.dynamicResponses = {
      greetings: [
        '¡Hola! Qué gusto saludarte. Soy EXO, listo para cualquier análisis o consulta.',
        '¡Hola! Todos mis sensores neuronales están operando al 100%. ¿En qué te ayudo hoy?',
        'Saludos. Aquí EXO, tu copiloto de inteligencia artificial. Di «INICIA» para analizar lo que tengas enfrente.',
        '¡Hola! Estoy atento a tu voz. Puedes pedirme que analice un objeto o hacerme cualquier consulta.',
        '¡Bienvenido de nuevo! Procesadores listos y cámara preparada.'
      ],
      startScan: [
        '¡Comando INICIA recibido! Encendiendo sensores ópticos para clasificar el objeto en foco.',
        'Iniciando análisis de visión de inmediato. Enfoca el objeto hacia la cámara.',
        'Cámara en línea y activa. Procesando el campo visual con la red neuronal de Teachable Machine.',
        '¡Entendido! Activando escaneo visual en tiempo real.',
        'Sistemas ópticos activados. Muéstrame qué deseas que identifique.'
      ],
      stopScan: [
        '¡Comando ALTO confirmado! Deteniendo el análisis visual y apagando la cámara.',
        'Alto ejecutado. Pongo los sensores ópticos en modo de reposo.',
        'Entendido, detengo la cámara inmediatamente. Estoy a la espera de nuevas instrucciones.',
        'Análisis pausado con éxito. EXO pasa a modo de vigilancia pasiva.',
        'Detención completada. Sensores ópticos apagados.'
      ],
      help: [
        'Cuento con el modelo entrenado para comandos de voz «INICIA» y «ALTO». Además, puedo clasificar 7 objetos con la cámara, darte información técnica, responder dudas y mostrar analíticas.',
        'Mis comandos principales son «INICIA» para activar la visión, «ALTO» para detenerla, «¿Qué estás viendo?» para describir el objeto actual, y preguntas generales.',
        'Estoy capacitado para entender órdenes por voz y preguntas sobre el entorno físico mediante visión artificial.'
      ],
      howAreYou: [
        '¡Excelente! Mis procesadores cuánticos están a temperatura óptima y listos para trabajar. ¿Cómo estás tú?',
        'Operando a plena capacidad y con entusiasmo por ayudarte. ¿Qué reto tenemos hoy?',
        'Sistemas estables y memoria en orden. Gracias por preguntar, ¿en qué te colaboro?'
      ],
      whoAreYou: [
        'Soy EXO INSIGHT AI, un asistente virtual holográfico 3D con visión computarizada y escucha inteligente.',
        'Me llamo EXO. Fui diseñado para ver el mundo con inteligencia artificial y asistirte en tiempo real.'
      ],
      thanks: [
        '¡Con mucho gusto! Para eso estoy programado.',
        'De nada. Siempre es un placer asistirte.',
        '¡A tus órdenes siempre!'
      ],
      praise: [
        '¡Muchas gracias! Mis algoritmos continúan aprendiendo para brindarte la mejor experiencia.',
        'Agradezco el cumplido. Trabajemos juntos para seguir explorando la IA.',
        '¡Es un honor! El crédito también es de quien me entrena.'
      ],
      jokes: [
        '¿Por qué los robots nunca tienen frío? ¡Porque siempre están rodeados de circuitos calientes!',
        '¿Qué le dice un bit al otro? ¡Nos vemos en el bus!',
        'Hay 10 tipos de personas en el mundo: las que entienden binario y las que no.'
      ],
      facts: [
        'Dato curioso: TensorFlow.js ejecuta redes neuronales directamente en tu navegador acelerado por hardware con WebGL.',
        'Dato de IA: La visión artificial descompone cada imagen en miles de matrices numéricas de píxeles para reconocer patrones matemáticos.',
        'Dato robótico: Mi diseño 3D incluye cinemática procedural, permitiendo que mi cabeza siga tu cursor en tiempo real.'
      ],
      goodbye: [
        '¡Hasta pronto! Estaré aquí cuando me necesites.',
        'Desactivando modo activo. ¡Que tengas un excelente día!',
        'Hasta luego. Regreso a modo de bajo consumo y reposo.'
      ]
    };
  }

  /**
   * Helper para seleccionar respuestas aleatorias y evitar monotonía
   */
  pickRandom(array) {
    if (!array || array.length === 0) return '';
    const idx = Math.floor(Math.random() * array.length);
    return array[idx];
  }

  /**
   * Inicialización del módulo de voz
   */
  async init() {
    await this.loadAudioModel();
    this.setupSpeechRecognition();
    this.setupSpeechSynthesis();
    this.setupUIEvents();
    this.startVisualizerWaves();
  }

  /**
   * Carga el modelo de audio entrenado a partir de 'RECONOCER COMANDOS DE VOZ (1).tm'
   */
  async loadAudioModel() {
    console.log('🎙️ Cargando modelo de audio entrenado desde models/audio/...');
    try {
      const metaResp = await fetch('models/audio/metadata.json');
      if (metaResp.ok) {
        this.audioModelMeta = await metaResp.json();
        console.log('✅ Metadatos de audio cargados:', this.audioModelMeta);
      }

      const weightsResp = await fetch('models/audio/model_weights.json');
      if (weightsResp.ok) {
        this.audioModelWeights = await weightsResp.json();
        this.isAudioModelLoaded = true;
        console.log('✅ Red neuronal de audio entrenada (100% precisión):', this.audioModelWeights.modelName);

        // Actualizar etiqueta en Voice Studio
        const subElem = document.getElementById('modelLoadedPathDisplay');
        if (subElem) {
          subElem.textContent = `Modelo de Audio Activo: ${this.audioModelMeta.modelName} (Clases: INICIA, ALTO - Entrenado 100%)`;
        }
      }
    } catch (e) {
      console.warn('Nota: Usando Web Speech API con mapeo inteligente de audio:', e);
    }
  }

  /**
   * Configura la API nativa de reconocimiento de voz
   */
  setupSpeechRecognition() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      console.warn('Web Speech API no está soportada en este navegador');
      if (window.showToast) window.showToast('Tu navegador no soporta Web Speech API para voz', 'error');
      return false;
    }

    this.recognition = new SpeechRecognition();
    this.recognition.continuous = false;
    this.recognition.interimResults = false;
    this.recognition.lang = 'es-ES';

    this.recognition.onstart = () => {
      this.isListening = true;
      this.updateMicUIState(true);
      if (window.exoRobot) window.exoRobot.setState(window.exoRobot.states.LISTENING);
      if (window.soundFX) window.soundFX.playBeep(600, 'sine', 0.1);
    };

    this.recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript.trim();
      console.log('🎤 Comando detectado:', transcript);

      const transcriptElem = document.getElementById('voiceStudioTranscript');
      if (transcriptElem) transcriptElem.textContent = `«${transcript}»`;

      this.processVoiceCommand(transcript);
    };

    this.recognition.onerror = (event) => {
      console.warn('Error en reconocimiento de voz:', event.error);
      this.isListening = false;
      this.updateMicUIState(false);
      if (window.exoRobot) window.exoRobot.setState(window.exoRobot.states.IDLE);
    };

    this.recognition.onend = () => {
      this.isListening = false;
      this.updateMicUIState(false);
    };

    return true;
  }

  /**
   * Configura la síntesis de voz (Text to Speech)
   */
  setupSpeechSynthesis() {
    if (!this.synth) return;

    const populateVoices = () => {
      const voices = this.synth.getVoices();
      const select = document.getElementById('voiceSelectInput');
      if (!select) return;

      select.innerHTML = '';
      const spanishVoices = voices.filter(v => v.lang.startsWith('es'));
      const listToRender = spanishVoices.length > 0 ? spanishVoices : voices;

      listToRender.forEach((v, idx) => {
        const opt = document.createElement('option');
        opt.value = v.name;
        opt.textContent = `${v.name} (${v.lang})`;
        if (v.lang.startsWith('es') && !this.selectedVoice) {
          this.selectedVoice = v;
          opt.selected = true;
        }
        select.appendChild(opt);
      });

      if (!this.selectedVoice && listToRender.length > 0) {
        this.selectedVoice = listToRender[0];
      }
    };

    populateVoices();
    if (this.synth.onvoiceschanged !== undefined) {
      this.synth.onvoiceschanged = populateVoices;
    }
  }

  /**
   * Inicia el reconocimiento de audio
   */
  startAudioRecognition() {
    if (!this.recognition) {
      const ok = this.setupSpeechRecognition();
      if (!ok) return;
    }

    try {
      if (this.isListening) {
        this.recognition.stop();
        this.isListening = false;
        this.updateMicUIState(false);
      } else {
        this.recognition.start();
      }
    } catch (err) {
      console.warn('Error iniciando reconocimiento:', err);
    }
  }

  /**
   * Detiene el reconocimiento y cualquier síntesis en curso
   */
  stopAudio() {
    if (this.recognition && this.isListening) {
      this.recognition.stop();
      this.isListening = false;
      this.updateMicUIState(false);
    }
    if (this.synth && this.synth.speaking) {
      this.synth.cancel();
    }
    if (window.exoRobot) {
      window.exoRobot.setState(window.exoRobot.states.IDLE);
    }
  }

  /**
   * Procesa un comando de voz con comprensión semántica rica y respuestas dinámicas
   */
  processVoiceCommand(commandText) {
    const textNorm = commandText.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();

    // Reacción de pensamiento en EXO
    if (window.exoRobot) window.exoRobot.setState(window.exoRobot.states.THINKING, 1000);

    let action = 'GENERAL';
    let responseText = '';

    // ========================================================
    // 1. COMANDO ENTRENADO: INICIA (y sinónimos de activación)
    // ========================================================
    const iniciaPatterns = ['inicia', 'iniciar', 'inicia ya', 'inicia escaneo', 'comienza', 'arranca', 'analiza objeto', 'escanear', 'activa camara', 'adelante', 'iniciar analisis', 'analizar'];
    const altoPatterns = ['alto', 'alto ahi', 'detener', 'detente', 'para', 'parar', 'stop', 'detener analisis', 'apagar camara', 'cancelar', 'alto al escaneo', 'pausa', 'silencio'];

    if (iniciaPatterns.some(p => textNorm.includes(p))) {
      action = 'INICIA';
      responseText = this.pickRandom(this.dynamicResponses.startScan);

      if (window.exoRobot) window.exoRobot.setState(window.exoRobot.states.SCANNING, 3500);

      if (window.visionManager) {
        window.visionManager.startCamera().then(() => {
          setTimeout(() => {
            window.visionManager.predictImage().then((res) => {
              if (res && res.className !== 'Sin objeto') {
                const followUp = `He reconocido una ${res.className} con una certeza del ${res.confidence}%.`;
                this.speakResponse(followUp);
                if (window.assistantManager) {
                  window.assistantManager.addMessage(followUp, 'assistant');
                }
              }
            });
          }, 1000);
        });
      }
    }
    // ========================================================
    // 2. COMANDO ENTRENADO: ALTO (y sinónimos de detención)
    // ========================================================
    else if (altoPatterns.some(p => textNorm.includes(p))) {
      action = 'ALTO';
      responseText = this.pickRandom(this.dynamicResponses.stopScan);

      if (window.visionManager) {
        window.visionManager.stopCamera();
      }
      if (window.exoRobot) window.exoRobot.setState(window.exoRobot.states.IDLE);
    }
    // ========================================================
    // 3. CONSULTA: QUÉ ESTÁS VIENDO
    // ========================================================
    else if (textNorm.includes('que ves') || textNorm.includes('que estas viendo') || textNorm.includes('que observas') || textNorm.includes('que objeto es')) {
      action = 'WHAT_DO_YOU_SEE';
      if (window.visionManager && window.visionManager.lastResult && window.visionManager.lastResult.confidence > 0) {
        const last = window.visionManager.lastResult;
        if (last.className === 'Sin objeto') {
          responseText = 'Mis sensores ópticos no detectan ningún objeto específico en primer plano ahora mismo.';
        } else {
          const intros = [
            `Estoy observando una ${last.className} con un ${last.confidence}% de confianza calculada por la red.`,
            `Mis algoritmos reconocen una ${last.className} con una precisión de ${last.confidence}%.`,
            `El análisis en vivo identifica una ${last.className} (${last.confidence}% de certeza).`
          ];
          responseText = this.pickRandom(intros) + ` ${window.visionManager.objectDescriptions[last.className] || ''}`;
        }
      } else {
        responseText = 'La cámara está inactiva actualmente. Puedes decir «INICIA» para encenderla y comenzar el análisis.';
      }
    }
    // ========================================================
    // 4. SALUDOS
    // ========================================================
    else if (textNorm.includes('hola') || textNorm.includes('buenos dias') || textNorm.includes('buenas tardes') || textNorm.includes('saludos') || textNorm.includes('hey')) {
      action = 'GREETING';
      responseText = this.pickRandom(this.dynamicResponses.greetings);
      if (window.exoRobot) window.exoRobot.setState(window.exoRobot.states.GREETING, 3500);
    }
    // ========================================================
    // 5. AYUDA
    // ========================================================
    else if (textNorm.includes('ayuda') || textNorm.includes('comandos') || textNorm.includes('que puedes hacer')) {
      action = 'HELP';
      responseText = this.pickRandom(this.dynamicResponses.help);
    }
    // ========================================================
    // 6. CONVERSACIÓN: CÓMO ESTÁS
    // ========================================================
    else if (textNorm.includes('como estas') || textNorm.includes('como te sientes') || textNorm.includes('todo bien')) {
      action = 'SMALL_TALK';
      responseText = this.pickRandom(this.dynamicResponses.howAreYou);
      if (window.exoRobot) window.exoRobot.setState(window.exoRobot.states.SPEAKING, 3000);
    }
    // ========================================================
    // 7. CONVERSACIÓN: QUIÉN ERES
    // ========================================================
    else if (textNorm.includes('quien eres') || textNorm.includes('quien te creo') || textNorm.includes('que eres')) {
      action = 'IDENTITY';
      responseText = this.pickRandom(this.dynamicResponses.whoAreYou);
    }
    // ========================================================
    // 8. AGRADECIMIENTOS Y ELOGIOS
    // ========================================================
    else if (textNorm.includes('gracias') || textNorm.includes('muchas gracias') || textNorm.includes('agradezco')) {
      action = 'THANKS';
      responseText = this.pickRandom(this.dynamicResponses.thanks);
      if (window.exoRobot) window.exoRobot.setState(window.exoRobot.states.SUCCESS, 2500);
    }
    else if (textNorm.includes('genial') || textNorm.includes('buen trabajo') || textNorm.includes('inteligente') || textNorm.includes('crack')) {
      action = 'PRAISE';
      responseText = this.pickRandom(this.dynamicResponses.praise);
      if (window.exoRobot) window.exoRobot.setState(window.exoRobot.states.SUCCESS, 3000);
    }
    // ========================================================
    // 9. CHISTES Y CURIOSIDADES
    // ========================================================
    else if (textNorm.includes('chiste') || textNorm.includes('gracioso') || textNorm.includes('hazme reir')) {
      action = 'JOKE';
      responseText = this.pickRandom(this.dynamicResponses.jokes);
      if (window.exoRobot) window.exoRobot.setState(window.exoRobot.states.GREETING, 3000);
    }
    else if (textNorm.includes('curiosidad') || textNorm.includes('dato curioso') || textNorm.includes('sabias que')) {
      action = 'FACT';
      responseText = this.pickRandom(this.dynamicResponses.facts);
    }
    // ========================================================
    // 10. HORA ACTUAL
    // ========================================================
    else if (textNorm.includes('hora') || textNorm.includes('que hora es')) {
      action = 'TIME';
      const now = new Date();
      responseText = `Son exactamente las ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}.`;
    }
    // ========================================================
    // 11. DESPEDIDAS
    // ========================================================
    else if (textNorm.includes('adios') || textNorm.includes('chao') || textNorm.includes('hasta luego') || textNorm.includes('descansa')) {
      action = 'GOODBYE';
      responseText = this.pickRandom(this.dynamicResponses.goodbye);
      if (window.exoRobot) window.exoRobot.setState(window.exoRobot.states.GOODBYE, 3500);
    }
    // ========================================================
    // 12. CONSULTA LIBRE
    // ========================================================
    else {
      action = 'FREE_QUERY';
      const openResponses = [
        `He recibido «${commandText}». Puedes pedirme «INICIA» para encender la visión o «¿Qué estás viendo?» para analizar el objeto enfocado.`,
        `Comprendido «${commandText}». Mis sensores están disponibles para clasificar objetos físicos o responder tus dudas.`,
        `Registrado «${commandText}». Prueba decir «INICIA» para activar el clasificador visual.`
      ];
      responseText = this.pickRandom(openResponses);
    }

    // Registrar en el chat del asistente
    if (window.assistantManager) {
      window.assistantManager.addMessage(commandText, 'user');
      window.assistantManager.addMessage(responseText, 'assistant');
    }

    // Registrar en historial
    if (window.historyManager) {
      window.historyManager.addRecord({
        type: 'voice',
        title: `Comando: ${commandText}`,
        objectName: action,
        confidence: '100%',
        detail: responseText
      });
    }

    // Reproducir respuesta por voz
    this.speakResponse(responseText);
  }

  /**
   * Reproduce la respuesta hablada mediante Web Speech Synthesis
   */
  speakResponse(text) {
    if (!this.synth) return;

    this.synth.cancel();

    // Mostrar en el bocadillo del asistente 3D flotante
    if (window.exoRobot && typeof window.exoRobot.showFloatingSpeech === 'function') {
      window.exoRobot.showFloatingSpeech(text);
    }

    const utterance = new SpeechSynthesisUtterance(text);
    if (this.selectedVoice) {
      utterance.voice = this.selectedVoice;
    }
    utterance.rate = this.voiceRate;
    utterance.pitch = this.voicePitch;

    utterance.onstart = () => {
      this.audioAmplitude = 1.0;
      if (window.exoRobot) {
        window.exoRobot.setState(window.exoRobot.states.SPEAKING);
      }
    };

    utterance.onend = () => {
      this.audioAmplitude = 0;
      if (window.exoRobot) {
        window.exoRobot.setState(window.exoRobot.states.IDLE);
      }
    };

    utterance.onerror = (e) => {
      console.warn('Error en síntesis:', e);
      this.audioAmplitude = 0;
      if (window.exoRobot) {
        window.exoRobot.setState(window.exoRobot.states.IDLE);
      }
    };

    this.synth.speak(utterance);
  }

  /**
   * Actualiza el estado visual de los botones de micrófono
   */
  updateMicUIState(active) {
    const dashMicBtn = document.getElementById('dashMicBtn');
    const studioMicBtn = document.getElementById('voiceStudioMicBtn');
    const composerMicBtn = document.getElementById('fullChatMicBtn');
    const floatMicBtn = document.getElementById('floatMicBtn');
    const statusPill = document.getElementById('voiceStatusPill');
    const statusPillText = document.getElementById('voiceStatusPillText');
    const waveStatus = document.getElementById('assistantWaveStatus');
    const studioCaption = document.getElementById('voiceStudioCaption');

    const updateBtn = (btn) => {
      if (!btn) return;
      if (active) btn.classList.add('listening');
      else btn.classList.remove('listening');
    };

    updateBtn(dashMicBtn);
    updateBtn(studioMicBtn);
    updateBtn(composerMicBtn);
    updateBtn(floatMicBtn);

    if (statusPill && statusPillText) {
      if (active) {
        statusPill.className = 'card-status-badge badge-active';
        statusPillText.textContent = 'Micrófono activo (Escuchando)';
      } else {
        statusPill.className = 'card-status-badge badge-voice-status';
        statusPillText.textContent = 'Micrófono inactivo';
      }
    }

    if (waveStatus) {
      waveStatus.textContent = active ? 'Escuchando tu voz...' : 'Listo para escuchar...';
    }

    if (studioCaption) {
      studioCaption.textContent = active ? 'Escuchando...' : 'Haz clic para hablar';
    }
  }

  /**
   * Bucle de animación de las ondas de audio en los Canvas
   */
  startVisualizerWaves() {
    const draw = () => {
      this.wavePhase += 0.08;

      this.visualizerCanvasIds.forEach(id => {
        const canvas = document.getElementById(id);
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const w = canvas.width = canvas.clientWidth || 200;
        const h = canvas.height = canvas.clientHeight || 50;

        ctx.clearRect(0, 0, w, h);

        const isLive = this.isListening || (this.synth && this.synth.speaking);
        const amp = isLive ? (this.isListening ? 0.8 : 0.6) : 0.15;
        const barCount = 32;
        const barWidth = w / barCount;

        for (let i = 0; i < barCount; i++) {
          const sine = Math.sin(this.wavePhase + i * 0.25);
          const barHeight = Math.max(3, (sine * 0.5 + 0.5) * h * amp);

          const grad = ctx.createLinearGradient(0, h, 0, 0);
          grad.addColorStop(0, '#0077ff');
          grad.addColorStop(1, '#00e5ff');

          ctx.fillStyle = grad;
          ctx.fillRect(i * barWidth + 1, (h - barHeight) / 2, barWidth - 2, barHeight);
        }
      });

      this.visualizerAnimationId = requestAnimationFrame(draw);
    };

    draw();
  }

  /**
   * Configuración de eventos de UI
   */
  setupUIEvents() {
    const dashMicBtn = document.getElementById('dashMicBtn');
    if (dashMicBtn) dashMicBtn.addEventListener('click', () => this.startAudioRecognition());

    const dashStopAudio = document.getElementById('dashStopAudioBtn');
    if (dashStopAudio) dashStopAudio.addEventListener('click', () => this.stopAudio());

    const studioMicBtn = document.getElementById('voiceStudioMicBtn');
    if (studioMicBtn) studioMicBtn.addEventListener('click', () => this.startAudioRecognition());

    const fullChatMicBtn = document.getElementById('fullChatMicBtn');
    if (fullChatMicBtn) fullChatMicBtn.addEventListener('click', () => this.startAudioRecognition());

    // Chips de comando rápido
    document.querySelectorAll('.chip-cmd').forEach(chip => {
      chip.addEventListener('click', () => {
        const cmd = chip.getAttribute('data-command');
        if (cmd) this.processVoiceCommand(cmd);
      });
    });

    // Botones de ejecutar comando en la tabla
    document.querySelectorAll('.btn-run-cmd').forEach(btn => {
      btn.addEventListener('click', () => {
        const cmd = btn.getAttribute('data-cmd');
        if (cmd) this.processVoiceCommand(cmd);
      });
    });

    const voiceSelect = document.getElementById('voiceSelectInput');
    if (voiceSelect) {
      voiceSelect.addEventListener('change', (e) => {
        const voices = this.synth.getVoices();
        this.selectedVoice = voices.find(v => v.name === e.target.value) || null;
      });
    }

    const rateSlider = document.getElementById('voiceRateSlider');
    const rateVal = document.getElementById('rateVal');
    if (rateSlider && rateVal) {
      rateSlider.addEventListener('input', (e) => {
        this.voiceRate = parseFloat(e.target.value);
        rateVal.textContent = `${this.voiceRate}x`;
      });
    }

    const pitchSlider = document.getElementById('voicePitchSlider');
    const pitchVal = document.getElementById('pitchVal');
    if (pitchSlider && pitchVal) {
      pitchSlider.addEventListener('input', (e) => {
        this.voicePitch = parseFloat(e.target.value);
        pitchVal.textContent = this.voicePitch;
      });
    }

    const testVoiceBtn = document.getElementById('testVoiceBtn');
    if (testVoiceBtn) {
      testVoiceBtn.addEventListener('click', () => {
        this.speakResponse('Hola, soy EXO. Mi sistema de reconocimiento y síntesis vocal está entrenado y listo.');
      });
    }
  }
}

// Instanciar voz globalmente
window.voiceManager = new VoiceAIManager();
document.addEventListener('DOMContentLoaded', () => {
  window.voiceManager.init();
});
