/**
 * ========================================================
 * EXO 3D – ROBOT INTELIGENTE ANIMADO E INTERACTIVO
 * Motor Three.js WebGL con Cinemática Procedural,
 * Escenario Holográfico, Seguimiento de Cursor y Estados de IA
 * ========================================================
 */

class ExoRobot3DManager {
  constructor() {
    this.states = {
      IDLE: 'EXO_IDLE',
      GREETING: 'EXO_GREETING',
      LISTENING: 'EXO_LISTENING',
      THINKING: 'EXO_THINKING',
      SCANNING: 'EXO_SCANNING',
      SPEAKING: 'EXO_SPEAKING',
      SUCCESS: 'EXO_SUCCESS',
      ERROR: 'EXO_ERROR',
      GOODBYE: 'EXO_GOODBYE'
    };

    this.currentState = this.states.IDLE;
    this.previousState = this.states.IDLE;
    this.stateTimer = 0;
    this.isHologramMode = false;
    
    // Coordenadas suavizadas del cursor (-1 a 1)
    this.mouseTarget = { x: 0, y: 0 };
    this.mouseCurrent = { x: 0, y: 0 };

    // Viewports activos
    this.theater = null;
    this.dashboard = null;
    this.mini = null;
    this.portrait = null;
    this.globe = null;

    // Colección de robots en escena
    this.robotInstances = [];

    // Materiales PBR y emisivos compartidos
    this.materials = {};

    this.clock = new THREE.Clock();
    this.fpsLastTime = performance.now();
    this.fpsFrames = 0;
    this.currentFps = 60;
  }

  /**
   * Inicializa Three.js y construye todos los viewports
   */
  init() {
    if (typeof THREE === 'undefined') {
      console.error('Three.js no está cargado');
      return;
    }

    try {
      this.initSharedMaterials();
      this.initDashboardViewport();
      this.initFloatingCompanionViewport();
      this.initTheaterViewport();
      this.initMiniAvatarViewport();
      this.initPortraitViewport();
      this.initHoloGlobe();
      this.setupEventListeners();

      // Iniciar bucle de animación universal
      this.animate = this.animate.bind(this);
      requestAnimationFrame(this.animate);

      // Saludo inicial después de 800ms
      setTimeout(() => {
        this.setState(this.states.GREETING, 3500);
      }, 800);

      console.log('✅ EXO 3D Engine inicializado con éxito');
    } catch (err) {
      console.error('Error inicializando WebGL 3D:', err);
    }
  }

  /**
   * Materiales estándar PBR y emisivos futuristas
   */
  initSharedMaterials() {
    this.materials.whiteArmor = new THREE.MeshStandardMaterial({
      color: 0xf0f4f8,
      metalness: 0.85,
      roughness: 0.22
    });

    this.materials.silverChrome = new THREE.MeshStandardMaterial({
      color: 0x94a3b8,
      metalness: 0.95,
      roughness: 0.15
    });

    this.materials.darkChassis = new THREE.MeshStandardMaterial({
      color: 0x0a1128,
      metalness: 0.75,
      roughness: 0.35
    });

    this.materials.visorGlass = new THREE.MeshStandardMaterial({
      color: 0x030712,
      metalness: 0.9,
      roughness: 0.1,
      transparent: true,
      opacity: 0.95
    });

    this.materials.eyesLed = new THREE.MeshStandardMaterial({
      color: 0x00e5ff,
      emissive: 0x00e5ff,
      emissiveIntensity: 2.4,
      roughness: 0.1
    });

    this.materials.chestCore = new THREE.MeshStandardMaterial({
      color: 0x00e5ff,
      emissive: 0x00e5ff,
      emissiveIntensity: 2.6,
      roughness: 0.1
    });

    this.materials.holoRings = new THREE.MeshBasicMaterial({
      color: 0x00e5ff,
      transparent: true,
      opacity: 0.65,
      side: THREE.DoubleSide
    });

    this.materials.scanLaser = new THREE.MeshBasicMaterial({
      color: 0x00e5ff,
      transparent: true,
      opacity: 0.4,
      side: THREE.DoubleSide
    });
  }

  /**
   * Construye un personaje robótico 3D original con articulaciones y jerarquía
   * @param {boolean} isCompact - Si es true, omite extremidades inferiores para mini avatares
   */
  createRobotMesh(isCompact = false) {
    const root = new THREE.Group();
    root.name = 'EXO_ROBOT';

    // 1. TORSO PRINCIPAL
    const torsoGroup = new THREE.Group();
    torsoGroup.position.y = 1.3;

    // Chasis central del pecho
    const chestGeom = new THREE.CylinderGeometry(0.55, 0.42, 0.85, 18);
    const chestMesh = new THREE.Mesh(chestGeom, this.materials.whiteArmor);
    chestMesh.castShadow = true;
    chestMesh.receiveShadow = true;
    torsoGroup.add(chestMesh);

    // Placas de armadura laterales
    const plateGeom = new THREE.BoxGeometry(0.35, 0.6, 0.15);
    const leftPlate = new THREE.Mesh(plateGeom, this.materials.silverChrome);
    leftPlate.position.set(0.42, 0.05, 0.15);
    leftPlate.rotation.y = -0.3;
    torsoGroup.add(leftPlate);

    const rightPlate = leftPlate.clone();
    rightPlate.position.set(-0.42, 0.05, 0.15);
    rightPlate.rotation.y = 0.3;
    torsoGroup.add(rightPlate);

    // Núcleo energético en el pecho (Arc Reactor)
    const coreHousingGeom = new THREE.CylinderGeometry(0.18, 0.18, 0.08, 24);
    coreHousingGeom.rotateX(Math.PI / 2);
    const coreHousing = new THREE.Mesh(coreHousingGeom, this.materials.darkChassis);
    coreHousing.position.set(0, 0.12, 0.46);
    torsoGroup.add(coreHousing);

    const coreCrystalGeom = new THREE.CylinderGeometry(0.13, 0.13, 0.09, 24);
    coreCrystalGeom.rotateX(Math.PI / 2);
    const chestCore = new THREE.Mesh(coreCrystalGeom, this.materials.chestCore);
    chestCore.position.set(0, 0.12, 0.48);
    torsoGroup.add(chestCore);

    // Anillo giratorio del reactor
    const ringGeom = new THREE.TorusGeometry(0.15, 0.015, 8, 24);
    const coreRing = new THREE.Mesh(ringGeom, this.materials.silverChrome);
    coreRing.position.set(0, 0.12, 0.49);
    torsoGroup.add(coreRing);

    // Luz puntual emitida por el pecho
    const chestLight = new THREE.PointLight(0x00e5ff, 1.8, 3.5);
    chestLight.position.set(0, 0.12, 0.65);
    torsoGroup.add(chestLight);

    // Cintura y articulación inferior
    const waistGeom = new THREE.CylinderGeometry(0.35, 0.38, 0.3, 16);
    const waist = new THREE.Mesh(waistGeom, this.materials.darkChassis);
    waist.position.y = -0.52;
    torsoGroup.add(waist);

    if (!isCompact) {
      // Propulsores antigravitatorios inferiores
      const thrusterGeom = new THREE.ConeGeometry(0.16, 0.3, 16);
      thrusterGeom.rotateX(Math.PI);
      const leftThruster = new THREE.Mesh(thrusterGeom, this.materials.silverChrome);
      leftThruster.position.set(0.2, -0.75, 0);
      torsoGroup.add(leftThruster);

      const rightThruster = leftThruster.clone();
      rightThruster.position.set(-0.2, -0.75, 0);
      torsoGroup.add(rightThruster);

      // Flamas de plasma
      const plasmaGeom = new THREE.ConeGeometry(0.09, 0.35, 12);
      const leftPlasma = new THREE.Mesh(plasmaGeom, this.materials.chestCore);
      leftPlasma.position.set(0.2, -0.95, 0);
      torsoGroup.add(leftPlasma);

      const rightPlasma = leftPlasma.clone();
      rightPlasma.position.set(-0.2, -0.95, 0);
      torsoGroup.add(rightPlasma);
    }

    // 2. CUELLO Y CABEZA
    const headGroup = new THREE.Group();
    headGroup.position.set(0, 0.68, 0);

    const neckGeom = new THREE.CylinderGeometry(0.18, 0.22, 0.2, 16);
    const neck = new THREE.Mesh(neckGeom, this.materials.darkChassis);
    neck.position.y = -0.08;
    headGroup.add(neck);

    // Casco blanco brillante
    const helmetGeom = new THREE.SphereGeometry(0.52, 32, 24);
    helmetGeom.scale(1.05, 1.0, 1.15);
    const helmet = new THREE.Mesh(helmetGeom, this.materials.whiteArmor);
    helmet.castShadow = true;
    headGroup.add(helmet);

    // Sensores laterales / Orejeras
    const earGeom = new THREE.CylinderGeometry(0.12, 0.12, 0.1, 16);
    earGeom.rotateZ(Math.PI / 2);
    const leftEar = new THREE.Mesh(earGeom, this.materials.silverChrome);
    leftEar.position.set(0.55, 0, 0);
    headGroup.add(leftEar);

    const rightEar = leftEar.clone();
    rightEar.position.set(-0.55, 0, 0);
    headGroup.add(rightEar);

    // Antena superior
    const antennaGeom = new THREE.CylinderGeometry(0.015, 0.03, 0.25, 8);
    const antenna = new THREE.Mesh(antennaGeom, this.materials.silverChrome);
    antenna.position.set(0, 0.58, -0.05);
    antenna.rotation.x = -0.2;
    headGroup.add(antenna);

    const antennaTipGeom = new THREE.SphereGeometry(0.04, 8, 8);
    const antennaTip = new THREE.Mesh(antennaTipGeom, this.materials.eyesLed);
    antennaTip.position.set(0, 0.72, -0.08);
    headGroup.add(antennaTip);

    // Visor oscuro curvo
    const visorGeom = new THREE.SphereGeometry(0.44, 24, 16, 0, Math.PI, 0, Math.PI * 0.75);
    visorGeom.rotateY(Math.PI / 2);
    const visor = new THREE.Mesh(visorGeom, this.materials.visorGlass);
    visor.position.set(0, 0, 0.22);
    visor.scale.set(0.95, 0.75, 0.95);
    headGroup.add(visor);

    // Ojos LED luminosos y expresivos (compatibles universalmente)
    const eyeGeom = new THREE.SphereGeometry(0.065, 16, 12);
    eyeGeom.scale(1.4, 0.85, 0.6);

    const leftEye = new THREE.Mesh(eyeGeom, this.materials.eyesLed);
    leftEye.position.set(0.18, 0.04, 0.52);
    headGroup.add(leftEye);

    const rightEye = new THREE.Mesh(eyeGeom, this.materials.eyesLed);
    rightEye.position.set(-0.18, 0.04, 0.52);
    headGroup.add(rightEye);

    // Cono de haz láser holográfico para escaneo
    const scanGeom = new THREE.ConeGeometry(0.6, 2.2, 16, 1, true);
    scanGeom.rotateX(-Math.PI / 2);
    const scanBeam = new THREE.Mesh(scanGeom, this.materials.scanLaser);
    scanBeam.position.set(0, 0.04, 1.6);
    scanBeam.visible = false;
    headGroup.add(scanBeam);

    torsoGroup.add(headGroup);

    // 3. BRAZOS ARTICULADOS
    const rightArmGroup = this.createArm(1);
    rightArmGroup.position.set(-0.62, 0.25, 0);
    torsoGroup.add(rightArmGroup);

    const leftArmGroup = this.createArm(-1);
    leftArmGroup.position.set(0.62, 0.25, 0);
    torsoGroup.add(leftArmGroup);

    root.add(torsoGroup);

    // Guardar referencias internas para el ciclo de animación
    const instanceData = {
      root,
      torsoGroup,
      headGroup,
      leftArmGroup,
      rightArmGroup,
      leftEye,
      rightEye,
      chestCore,
      chestLight,
      scanBeam,
      isCompact
    };

    root.userData = instanceData;
    this.robotInstances.push(instanceData);

    return root;
  }

  /**
   * Crea una extremidad articulada
   */
  createArm(side) {
    const armGroup = new THREE.Group();

    // Hombrera
    const shoulderGeom = new THREE.SphereGeometry(0.18, 16, 16);
    const shoulder = new THREE.Mesh(shoulderGeom, this.materials.whiteArmor);
    armGroup.add(shoulder);

    // Brazo superior
    const upperArmGeom = new THREE.CylinderGeometry(0.1, 0.08, 0.45, 12);
    upperArmGeom.translate(0, -0.22, 0);
    const upperArm = new THREE.Mesh(upperArmGeom, this.materials.silverChrome);
    armGroup.add(upperArm);

    // Codo
    const elbowGroup = new THREE.Group();
    elbowGroup.position.y = -0.45;

    const elbowJointGeom = new THREE.SphereGeometry(0.1, 12, 12);
    const elbowJoint = new THREE.Mesh(elbowJointGeom, this.materials.darkChassis);
    elbowGroup.add(elbowJoint);

    // Antebrazo
    const forearmGeom = new THREE.CylinderGeometry(0.09, 0.07, 0.45, 12);
    forearmGeom.translate(0, -0.22, 0);
    const forearm = new THREE.Mesh(forearmGeom, this.materials.whiteArmor);
    elbowGroup.add(forearm);

    // Mano
    const handGroup = new THREE.Group();
    handGroup.position.y = -0.45;

    const palmGeom = new THREE.BoxGeometry(0.12, 0.1, 0.06);
    const palm = new THREE.Mesh(palmGeom, this.materials.darkChassis);
    handGroup.add(palm);

    for (let i = -1; i <= 1; i++) {
      const fingerGeom = new THREE.BoxGeometry(0.025, 0.1, 0.03);
      fingerGeom.translate(0, -0.05, 0);
      const finger = new THREE.Mesh(fingerGeom, this.materials.silverChrome);
      finger.position.set(i * 0.04, -0.05, 0);
      handGroup.add(finger);
    }

    elbowGroup.add(handGroup);
    armGroup.add(elbowGroup);

    armGroup.userData = {
      side,
      elbow: elbowGroup,
      hand: handGroup
    };

    return armGroup;
  }

  /**
   * Crea el escenario holográfico con plataforma y partículas
   */
  createHoloStage(scale = 1.0) {
    const stageGroup = new THREE.Group();

    // 1. Disco base
    const baseDiscGeom = new THREE.CylinderGeometry(1.8 * scale, 2.0 * scale, 0.15 * scale, 32);
    const baseDisc = new THREE.Mesh(baseDiscGeom, this.materials.darkChassis);
    baseDisc.position.y = -0.2 * scale;
    stageGroup.add(baseDisc);

    // 2. Anillo interior
    const ring1Geom = new THREE.TorusGeometry(1.5 * scale, 0.025 * scale, 8, 48);
    ring1Geom.rotateX(Math.PI / 2);
    const ring1 = new THREE.Mesh(ring1Geom, this.materials.holoRings);
    ring1.position.y = -0.08 * scale;
    stageGroup.add(ring1);

    // 3. Anillo exterior
    const ring2Geom = new THREE.TorusGeometry(2.1 * scale, 0.03 * scale, 8, 48);
    ring2Geom.rotateX(Math.PI / 2);
    const ring2 = new THREE.Mesh(ring2Geom, this.materials.holoRings);
    ring2.position.y = -0.06 * scale;
    stageGroup.add(ring2);

    // 4. Cilindro de luz
    const beamCylinderGeom = new THREE.CylinderGeometry(1.7 * scale, 1.7 * scale, 3.2 * scale, 32, 1, true);
    const beamCylinderMat = new THREE.MeshBasicMaterial({
      color: 0x00e5ff,
      transparent: true,
      opacity: 0.1,
      side: THREE.DoubleSide
    });
    const beamCylinder = new THREE.Mesh(beamCylinderGeom, beamCylinderMat);
    beamCylinder.position.y = 1.4 * scale;
    stageGroup.add(beamCylinder);

    // 5. Partículas ascendentes
    const particleCount = 120;
    const particleGeom = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount * 3; i += 3) {
      const radius = (0.4 + Math.random() * 1.5) * scale;
      const angle = Math.random() * Math.PI * 2;
      positions[i] = Math.cos(angle) * radius;
      positions[i + 1] = Math.random() * 3.0 * scale - 0.2;
      positions[i + 2] = Math.sin(angle) * radius;
    }
    particleGeom.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const particleMat = new THREE.PointsMaterial({
      color: 0x00e5ff,
      size: 0.035 * scale,
      transparent: true,
      opacity: 0.75,
      blending: THREE.AdditiveBlending
    });
    const particles = new THREE.Points(particleGeom, particleMat);
    stageGroup.add(particles);

    stageGroup.userData = {
      ring1,
      ring2,
      beamCylinder,
      particles
    };

    return stageGroup;
  }

  /**
   * 1. Viewport de EXO en el Dashboard Principal (Visible directamente al cargar)
   */
  initDashboardViewport() {
    const canvas = document.getElementById('dashExoCanvas');
    if (!canvas) return;

    const wrapper = canvas.parentElement;
    const width = wrapper.clientWidth || 320;
    const height = wrapper.clientHeight || 160;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 50);
    camera.position.set(0, 1.45, 3.4);
    camera.lookAt(0, 1.25, 0);

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    scene.add(new THREE.AmbientLight(0x0b1a3d, 1.6));
    const keyLight = new THREE.DirectionalLight(0xffffff, 1.4);
    keyLight.position.set(2, 4, 3);
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0x00e5ff, 2.0);
    rimLight.position.set(-3, 2, -2);
    scene.add(rimLight);

    const robot = this.createRobotMesh(false);
    scene.add(robot);

    const stage = this.createHoloStage(0.8);
    scene.add(stage);

    this.dashboard = {
      scene,
      camera,
      renderer,
      wrapper,
      stage
    };

    // ResizeObserver para mantener proporciones perfectas
    if (window.ResizeObserver) {
      new ResizeObserver(() => {
        const w = wrapper.clientWidth;
        const h = wrapper.clientHeight;
        if (w > 0 && h > 0) {
          camera.aspect = w / h;
          camera.updateProjectionMatrix();
          renderer.setSize(w, h);
        }
      }).observe(wrapper);
    }

    // Botón de saludar a EXO en el card del dashboard
    const waveBtn = document.getElementById('dashExoWaveBtn');
    if (waveBtn) {
      waveBtn.addEventListener('click', () => {
        this.triggerClickReaction();
      });
    }

    canvas.addEventListener('click', () => {
      this.triggerClickReaction();
    });
  }

  /**
   * 1.B. Viewport del Robot Asistente 3D FLOTANTE SIN FONDO (Persistent Companion)
   */
  initFloatingCompanionViewport() {
    const canvas = document.getElementById('floatingExoCanvas');
    const container = document.getElementById('floatingExoContainer');
    const wrapper = document.getElementById('floatingExoCanvasWrapper');
    if (!canvas || !container || !wrapper) return;

    const width = 220;
    const height = 250;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 50);
    camera.position.set(0, 1.4, 3.2);
    camera.lookAt(0, 1.25, 0);

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0); // 100% transparente sin fondo

    scene.add(new THREE.AmbientLight(0x0b1a3d, 1.8));
    const keyLight = new THREE.DirectionalLight(0xffffff, 1.5);
    keyLight.position.set(2, 4, 3);
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0x00e5ff, 2.2);
    rimLight.position.set(-3, 2, -2);
    scene.add(rimLight);

    const robot = this.createRobotMesh(false);
    scene.add(robot);

    // Anillos holográficos flotantes sin suelo opaco
    const stage = this.createHoloStage(0.7);
    scene.add(stage);

    this.floating = {
      scene,
      camera,
      renderer,
      wrapper,
      container,
      stage
    };

    // 1. Clic para interactuar
    canvas.addEventListener('click', () => {
      this.triggerClickReaction();
    });

    // 2. Arrastre libre por la pantalla (Draggable)
    let isDragging = false;
    let startX = 0;
    let startY = 0;
    let initialLeft = 0;
    let initialTop = 0;

    wrapper.addEventListener('mousedown', (e) => {
      if (e.target.closest('.floating-exo-toolbar')) return;
      isDragging = true;
      const rect = container.getBoundingClientRect();
      startX = e.clientX;
      startY = e.clientY;
      initialLeft = rect.left;
      initialTop = rect.top;
      container.style.bottom = 'auto';
      container.style.right = 'auto';
      container.style.left = `${initialLeft}px`;
      container.style.top = `${initialTop}px`;
    });

    window.addEventListener('mousemove', (e) => {
      if (!isDragging) return;
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;
      container.style.left = `${initialLeft + dx}px`;
      container.style.top = `${initialTop + dy}px`;
    });

    window.addEventListener('mouseup', () => {
      isDragging = false;
    });

    // 3. Botones de la barra de herramientas flotante
    const micBtn = document.getElementById('floatMicBtn');
    if (micBtn) {
      micBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (window.voiceManager) window.voiceManager.startAudioRecognition();
      });
    }

    const scanBtn = document.getElementById('floatScanBtn');
    if (scanBtn) {
      scanBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (window.visionManager) {
          if (!window.visionManager.isStreaming) {
            window.visionManager.startCamera().then(() => {
              window.visionManager.predictImage();
            });
          } else {
            window.visionManager.predictImage();
          }
        }
      });
    }

    const waveBtn = document.getElementById('floatWaveBtn');
    if (waveBtn) {
      waveBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.triggerClickReaction();
      });
    }

    const theaterBtn = document.getElementById('floatTheaterBtn');
    if (theaterBtn) {
      theaterBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.toggleHologramMode();
      });
    }

    const minBtn = document.getElementById('floatMinBtn');
    if (minBtn) {
      minBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        container.classList.toggle('minimized');
        const isMin = container.classList.contains('minimized');
        minBtn.innerHTML = isMin ? '<i class="fa-solid fa-plus"></i>' : '<i class="fa-solid fa-minus"></i>';
      });
    }
  }

  /**
   * 2. Viewport del Teatro 3D HoloHub (Pantalla completa con OrbitControls)
   */
  initTheaterViewport() {
    const canvas = document.getElementById('theaterExoCanvas');
    if (!canvas) return;

    const wrapper = canvas.parentElement;
    const width = wrapper.clientWidth || 800;
    const height = wrapper.clientHeight || 500;

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x040814, 0.07);

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 1.8, 4.2);

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    const ambLight = new THREE.AmbientLight(0x0b1a3d, 1.8);
    scene.add(ambLight);

    const mainKeyLight = new THREE.DirectionalLight(0xffffff, 1.5);
    mainKeyLight.position.set(3, 5, 4);
    scene.add(mainKeyLight);

    const cyanRimLight = new THREE.DirectionalLight(0x00e5ff, 2.2);
    cyanRimLight.position.set(-4, 3, -3);
    scene.add(cyanRimLight);

    const purpleFillLight = new THREE.PointLight(0x7928ca, 2.0, 8);
    purpleFillLight.position.set(2, 0.5, -2);
    scene.add(purpleFillLight);

    let controls = null;
    if (typeof THREE.OrbitControls !== 'undefined') {
      controls = new THREE.OrbitControls(camera, canvas);
      controls.enableDamping = true;
      controls.dampingFactor = 0.05;
      controls.maxPolarAngle = Math.PI / 2 + 0.1;
      controls.minDistance = 2.0;
      controls.maxDistance = 7.5;
      controls.target.set(0, 1.3, 0);
      controls.update();
    }

    const robot = this.createRobotMesh(false);
    scene.add(robot);

    const stage = this.createHoloStage(1.0);
    scene.add(stage);

    this.theater = {
      scene,
      camera,
      renderer,
      controls,
      wrapper,
      stage,
      defaultCamPos: new THREE.Vector3(0, 1.8, 4.2),
      defaultTarget: new THREE.Vector3(0, 1.3, 0)
    };

    if (window.ResizeObserver) {
      new ResizeObserver(() => {
        const w = wrapper.clientWidth;
        const h = wrapper.clientHeight;
        if (w > 0 && h > 0) {
          camera.aspect = w / h;
          camera.updateProjectionMatrix();
          renderer.setSize(w, h);
        }
      }).observe(wrapper);
    }

    const resetCamBtn = document.getElementById('resetExoCamBtn');
    if (resetCamBtn) {
      resetCamBtn.addEventListener('click', () => {
        if (this.theater.controls) {
          this.theater.camera.position.copy(this.theater.defaultCamPos);
          this.theater.controls.target.copy(this.theater.defaultTarget);
          this.theater.controls.update();
        }
      });
    }

    const wireframeBtn = document.getElementById('toggleExoWireframeBtn');
    if (wireframeBtn) {
      wireframeBtn.addEventListener('click', () => {
        this.toggleHologramMode();
      });
    }
  }

  /**
   * Alterna modo holograma / wireframe en todos los materiales del robot
   */
  toggleHologramMode() {
    this.isHologramMode = !this.isHologramMode;
    Object.values(this.materials).forEach(mat => {
      if (mat && mat.wireframe !== undefined) {
        mat.wireframe = this.isHologramMode;
      }
    });

    const wireframeBtn = document.getElementById('toggleExoWireframeBtn');
    if (wireframeBtn) {
      wireframeBtn.innerHTML = this.isHologramMode 
        ? '<i class="fa-solid fa-cube"></i> Modo Sólido' 
        : '<i class="fa-solid fa-draw-polygon"></i> Modo Holograma';
    }

    if (window.showToast) {
      window.showToast(this.isHologramMode ? 'Modo Holograma 3D Activado' : 'Modo Sólido 3D Restaurado', 'info');
    }
    if (window.soundFX) window.soundFX.playBeep(this.isHologramMode ? 1200 : 700, 'sine', 0.1);
  }

  /**
   * 3. Avatar Mini en la cabecera de Asistente Inteligente
   */
  initMiniAvatarViewport() {
    const canvas = document.getElementById('miniExoCanvas');
    if (!canvas) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 20);
    camera.position.set(0, 1.95, 1.8);
    camera.lookAt(0, 1.9, 0);

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setSize(52, 52);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    const light = new THREE.DirectionalLight(0x00e5ff, 2.5);
    light.position.set(1, 2, 2);
    scene.add(light);
    scene.add(new THREE.AmbientLight(0xffffff, 1.3));

    const robot = this.createRobotMesh(true);
    scene.add(robot);

    this.mini = {
      scene,
      camera,
      renderer
    };
  }

  /**
   * 4. Avatar Portrait en la vista de Asistente Expandido
   */
  initPortraitViewport() {
    const canvas = document.getElementById('portraitExoCanvas');
    if (!canvas) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 20);
    camera.position.set(0, 1.95, 2.2);
    camera.lookAt(0, 1.8, 0);

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setSize(140, 140);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    const light = new THREE.DirectionalLight(0x00e5ff, 2.2);
    light.position.set(1.5, 2.5, 2);
    scene.add(light);
    scene.add(new THREE.AmbientLight(0xffffff, 1.2));

    const robot = this.createRobotMesh(true);
    scene.add(robot);

    this.portrait = {
      scene,
      camera,
      renderer
    };
  }

  /**
   * 5. Globo Holográfico en el pie de la barra lateral
   */
  initHoloGlobe() {
    const canvas = document.getElementById('holoGlobeCanvas');
    if (!canvas) return;

    const width = 130;
    const height = 120;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 50);
    camera.position.set(0, 0, 3.2);

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    const globeGeom = new THREE.SphereGeometry(1.0, 18, 14);
    const globeMat = new THREE.MeshBasicMaterial({
      color: 0x00e5ff,
      wireframe: true,
      transparent: true,
      opacity: 0.45
    });
    const globeMesh = new THREE.Mesh(globeGeom, globeMat);
    scene.add(globeMesh);

    const innerGeom = new THREE.SphereGeometry(0.5, 12, 12);
    const innerMat = new THREE.MeshBasicMaterial({
      color: 0x0077ff,
      transparent: true,
      opacity: 0.65
    });
    const innerMesh = new THREE.Mesh(innerGeom, innerMat);
    scene.add(innerMesh);

    const ringGeom = new THREE.RingGeometry(1.15, 1.25, 32);
    ringGeom.rotateX(Math.PI / 2.5);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0x7928ca,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.75
    });
    const ringMesh = new THREE.Mesh(ringGeom, ringMat);
    scene.add(ringMesh);

    this.globe = {
      scene,
      camera,
      renderer,
      globeMesh,
      ringMesh
    };
  }

  /**
   * Notificación cuando se cambia de pestaña
   */
  onTabChanged(tabId) {
    setTimeout(() => {
      if (tabId === 'exo3d' && this.theater && this.theater.wrapper) {
        const w = this.theater.wrapper.clientWidth;
        const h = this.theater.wrapper.clientHeight;
        if (w > 0 && h > 0) {
          this.theater.camera.aspect = w / h;
          this.theater.camera.updateProjectionMatrix();
          this.theater.renderer.setSize(w, h);
        }
      }
      if (tabId === 'dashboard' && this.dashboard && this.dashboard.wrapper) {
        const w = this.dashboard.wrapper.clientWidth;
        const h = this.dashboard.wrapper.clientHeight;
        if (w > 0 && h > 0) {
          this.dashboard.camera.aspect = w / h;
          this.dashboard.camera.updateProjectionMatrix();
          this.dashboard.renderer.setSize(w, h);
        }
      }
    }, 60);
  }

  /**
   * Eventos del usuario
   */
  setupEventListeners() {
    window.addEventListener('mousemove', (e) => {
      this.mouseTarget.x = (e.clientX / window.innerWidth) * 2 - 1;
      this.mouseTarget.y = -(e.clientY / window.innerHeight) * 2 + 1;
    });

    const theaterCanvas = document.getElementById('theaterExoCanvas');
    if (theaterCanvas) {
      theaterCanvas.addEventListener('click', () => this.triggerClickReaction());
    }

    const miniWrapper = document.getElementById('miniExoViewportWrapper');
    if (miniWrapper) {
      miniWrapper.addEventListener('click', () => this.triggerClickReaction());
    }

    document.querySelectorAll('.btn-state-trigger').forEach(btn => {
      btn.addEventListener('click', () => {
        const stateKey = btn.getAttribute('data-state');
        if (stateKey && this.states[stateKey.replace('EXO_', '')]) {
          this.setState(this.states[stateKey.replace('EXO_', '')]);
        }
      });
    });
  }

  /**
   * Reacción al hacer clic
   */
  triggerClickReaction() {
    if (window.soundFX) window.soundFX.playBeep(880, 'sine', 0.15);
    this.showSpeechBubble('¡Hola! Soy EXO. Estoy a tus órdenes.', 3000);
    this.setState(this.states.GREETING, 3000);
  }

  showSpeechBubble(text, duration = 3500) {
    this.showFloatingSpeech(text, duration);

    const bubble = document.getElementById('holoSpeechBubble');
    const textElem = document.getElementById('holoSpeechText');
    if (!bubble || !textElem) return;

    textElem.textContent = text;
    bubble.classList.remove('hidden');

    clearTimeout(this.bubbleTimeout);
    this.bubbleTimeout = setTimeout(() => {
      bubble.classList.add('hidden');
    }, duration);
  }

  /**
   * Muestra el diálogo en el Asistente 3D Flotante
   */
  showFloatingSpeech(text, duration = 4000) {
    const bubble = document.getElementById('floatingExoBubble');
    const textElem = document.getElementById('floatingExoBubbleText');
    if (!bubble || !textElem) return;

    textElem.textContent = text;
    bubble.classList.remove('hidden');

    clearTimeout(this.floatingBubbleTimeout);
    this.floatingBubbleTimeout = setTimeout(() => {
      bubble.classList.add('hidden');
    }, duration);
  }

  /**
   * Cambia el estado actual del robot con duración opcional
   */
  setState(newState, autoReturnMs = null) {
    if (!Object.values(this.states).includes(newState)) return;

    this.previousState = this.currentState;
    this.currentState = newState;
    this.stateTimer = 0;

    const stateTag = document.getElementById('theaterCurrentStateTag');
    if (stateTag) stateTag.textContent = newState;

    const dashStatus = document.getElementById('dashExoStatusLabel');
    if (dashStatus) dashStatus.textContent = `EXO: ${newState.replace('EXO_', '')}`;

    const exoStateText = document.getElementById('exoStateText');
    if (exoStateText) exoStateText.textContent = `Estado: ${newState.replace('EXO_', '')}`;

    const topbarExoStatus = document.getElementById('topbarExoStatus');
    if (topbarExoStatus) {
      const labelMap = {
        EXO_IDLE: 'Reposo',
        EXO_GREETING: 'Saludando',
        EXO_LISTENING: 'Escuchando',
        EXO_THINKING: 'Pensando',
        EXO_SCANNING: 'Escaneando',
        EXO_SPEAKING: 'Hablando',
        EXO_SUCCESS: 'Éxito',
        EXO_ERROR: 'Alerta',
        EXO_GOODBYE: 'Despedida'
      };
      topbarExoStatus.textContent = `EXO: ${labelMap[newState] || newState}`;
    }

    document.querySelectorAll('.btn-state-trigger').forEach(btn => {
      if (btn.getAttribute('data-state') === newState) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });

    this.updateLightsForState(newState);

    if (autoReturnMs && newState !== this.states.IDLE) {
      clearTimeout(this.autoReturnTimeout);
      this.autoReturnTimeout = setTimeout(() => {
        if (this.currentState === newState) {
          this.setState(this.states.IDLE);
        }
      }, autoReturnMs);
    }
  }

  /**
   * Iluminación según el estado
   */
  updateLightsForState(state) {
    if (!this.materials.eyesLed || !this.materials.chestCore) return;

    let eyeColor = 0x00e5ff;
    let coreColor = 0x00e5ff;
    let eyeIntensity = 2.4;

    switch (state) {
      case this.states.LISTENING:
        eyeColor = 0x0077ff;
        coreColor = 0x0077ff;
        eyeIntensity = 3.2;
        break;
      case this.states.THINKING:
        eyeColor = 0xc084fc;
        coreColor = 0x7928ca;
        eyeIntensity = 2.6;
        break;
      case this.states.SCANNING:
        eyeColor = 0x00f0ff;
        coreColor = 0x00e5ff;
        eyeIntensity = 3.5;
        break;
      case this.states.SPEAKING:
        eyeColor = 0x38bdf8;
        coreColor = 0x00e5ff;
        eyeIntensity = 2.8;
        break;
      case this.states.SUCCESS:
        eyeColor = 0x00ff88;
        coreColor = 0x00ff88;
        eyeIntensity = 3.2;
        break;
      case this.states.ERROR:
        eyeColor = 0xff3366;
        coreColor = 0xff3366;
        eyeIntensity = 3.5;
        break;
      case this.states.GOODBYE:
        eyeColor = 0x64748b;
        coreColor = 0x334155;
        eyeIntensity = 0.8;
        break;
      default:
        eyeColor = 0x00e5ff;
        coreColor = 0x00e5ff;
        eyeIntensity = 2.4;
        break;
    }

    this.materials.eyesLed.color.setHex(eyeColor);
    this.materials.eyesLed.emissive.setHex(eyeColor);
    this.materials.eyesLed.emissiveIntensity = eyeIntensity;

    this.materials.chestCore.color.setHex(coreColor);
    this.materials.chestCore.emissive.setHex(coreColor);

    this.robotInstances.forEach(inst => {
      if (inst.chestLight) inst.chestLight.color.setHex(coreColor);
    });
  }

  /**
   * Bucle universal de renderizado
   */
  animate() {
    requestAnimationFrame(this.animate);

    const delta = this.clock.getDelta();
    const elapsedTime = this.clock.getElapsedTime();
    this.stateTimer += delta;

    this.fpsFrames++;
    const now = performance.now();
    if (now - this.fpsLastTime >= 1000) {
      this.currentFps = Math.round((this.fpsFrames * 1000) / (now - this.fpsLastTime));
      const fpsElem = document.getElementById('exoFpsCounter');
      if (fpsElem) fpsElem.textContent = `FPS: ${this.currentFps}`;
      this.fpsFrames = 0;
      this.fpsLastTime = now;
    }

    this.mouseCurrent.x += (this.mouseTarget.x - this.mouseCurrent.x) * 0.08;
    this.mouseCurrent.y += (this.mouseTarget.y - this.mouseCurrent.y) * 0.08;

    // Actualizar cinemática de cada robot activo
    this.robotInstances.forEach(robotData => {
      this.updateSingleRobotKinematics(robotData, elapsedTime, delta);
    });

    // Actualizar escenarios holográficos
    if (this.theater && this.theater.stage) {
      this.updateSingleStage(this.theater.stage, elapsedTime);
    }
    if (this.dashboard && this.dashboard.stage) {
      this.updateSingleStage(this.dashboard.stage, elapsedTime);
    }
    if (this.floating && this.floating.stage) {
      this.updateSingleStage(this.floating.stage, elapsedTime);
    }

    // Renderizar viewports
    if (this.dashboard) {
      this.dashboard.renderer.render(this.dashboard.scene, this.dashboard.camera);
    }

    if (this.floating) {
      this.floating.renderer.render(this.floating.scene, this.floating.camera);
    }

    if (this.theater) {
      if (this.theater.controls) this.theater.controls.update();
      this.theater.renderer.render(this.theater.scene, this.theater.camera);
    }

    if (this.mini) {
      this.mini.renderer.render(this.mini.scene, this.mini.camera);
    }

    if (this.portrait) {
      this.portrait.renderer.render(this.portrait.scene, this.portrait.camera);
    }

    if (this.globe) {
      this.globe.globeMesh.rotation.y += 0.008;
      this.globe.globeMesh.rotation.x = Math.sin(elapsedTime * 0.5) * 0.1;
      this.globe.ringMesh.rotation.z += 0.012;
      this.globe.renderer.render(this.globe.scene, this.globe.camera);
    }
  }

  /**
   * Cinemática individual de una instancia de robot
   */
  updateSingleRobotKinematics(data, time, delta) {
    const { root, headGroup, rightArmGroup, leftArmGroup, leftEye, rightEye, scanBeam, isCompact } = data;

    // 1. Movimiento permanente de flotación
    const hoverY = Math.sin(time * 2.2) * 0.07;
    const bodyTiltZ = Math.sin(time * 1.4) * 0.025;
    root.position.y = hoverY;
    root.rotation.z = bodyTiltZ;

    // 2. Seguimiento de cursor
    const targetHeadRotY = -this.mouseCurrent.x * 0.55;
    const targetHeadRotX = this.mouseCurrent.y * 0.45;

    // 3. Parpadeo periódico
    const blinkCycle = time % 4.5;
    if (blinkCycle > 4.35 && blinkCycle < 4.45) {
      leftEye.scale.y = 0.1;
      rightEye.scale.y = 0.1;
    } else {
      leftEye.scale.y = 0.85;
      rightEye.scale.y = 0.85;
    }

    if (scanBeam) {
      scanBeam.visible = (this.currentState === this.states.SCANNING);
    }

    // 4. Animaciones según estado
    switch (this.currentState) {
      case this.states.IDLE:
        headGroup.rotation.y += (targetHeadRotY - headGroup.rotation.y) * 0.1;
        headGroup.rotation.x += (targetHeadRotX - headGroup.rotation.x) * 0.1;
        headGroup.rotation.z = Math.sin(time * 1.5) * 0.04;

        if (rightArmGroup) {
          rightArmGroup.rotation.z = -0.15 + Math.sin(time * 2.0) * 0.05;
          rightArmGroup.rotation.x = Math.sin(time * 1.8) * 0.05;
          rightArmGroup.userData.elbow.rotation.x = -0.2;
        }
        if (leftArmGroup) {
          leftArmGroup.rotation.z = 0.15 - Math.sin(time * 2.0) * 0.05;
          leftArmGroup.rotation.x = -Math.sin(time * 1.8) * 0.05;
          leftArmGroup.userData.elbow.rotation.x = -0.2;
        }
        break;

      case this.states.GREETING:
        headGroup.rotation.y += (0 - headGroup.rotation.y) * 0.15;
        headGroup.rotation.x += (-0.05 - headGroup.rotation.x) * 0.15;

        if (rightArmGroup) {
          rightArmGroup.rotation.z = -1.35;
          rightArmGroup.rotation.x = -0.6;
          rightArmGroup.userData.elbow.rotation.x = -1.2;
          rightArmGroup.userData.hand.rotation.z = Math.sin(time * 12.0) * 0.35;
        }
        break;

      case this.states.LISTENING:
        headGroup.rotation.y += (targetHeadRotY * 0.5 - headGroup.rotation.y) * 0.15;
        headGroup.rotation.z = 0.18 + Math.sin(time * 6.0) * 0.04;
        headGroup.rotation.x = -0.1;

        if (rightArmGroup) {
          rightArmGroup.rotation.x = -0.35;
          rightArmGroup.userData.elbow.rotation.x = -0.6;
        }
        if (leftArmGroup) {
          leftArmGroup.rotation.x = -0.35;
          leftArmGroup.userData.elbow.rotation.x = -0.6;
        }
        break;

      case this.states.THINKING:
        headGroup.rotation.y = Math.sin(time * 3.0) * 0.25;
        headGroup.rotation.x = -0.25;
        headGroup.rotation.z = -0.15;
        break;

      case this.states.SCANNING:
        headGroup.rotation.y = Math.sin(time * 4.5) * 0.45;
        headGroup.rotation.x = 0.15;
        if (scanBeam) {
          scanBeam.rotation.z = Math.sin(time * 6.0) * 0.2;
        }
        break;

      case this.states.SPEAKING:
        headGroup.rotation.x = -0.05 + Math.sin(time * 8.0) * 0.08;
        headGroup.rotation.y = targetHeadRotY * 0.7 + Math.sin(time * 4.0) * 0.05;

        if (rightArmGroup) {
          rightArmGroup.rotation.x = -0.4 + Math.sin(time * 5.0) * 0.15;
          rightArmGroup.userData.elbow.rotation.x = -0.7 + Math.cos(time * 5.0) * 0.2;
        }
        if (leftArmGroup) {
          leftArmGroup.rotation.x = -0.3 - Math.sin(time * 4.0) * 0.15;
          leftArmGroup.userData.elbow.rotation.x = -0.6 - Math.cos(time * 4.0) * 0.2;
        }
        break;

      case this.states.SUCCESS:
        headGroup.rotation.x = -0.2;
        if (rightArmGroup) {
          rightArmGroup.rotation.z = -1.6;
          rightArmGroup.userData.elbow.rotation.x = -0.8;
        }
        if (leftArmGroup) {
          leftArmGroup.rotation.z = 1.6;
          leftArmGroup.userData.elbow.rotation.x = -0.8;
        }
        break;

      case this.states.ERROR:
        headGroup.rotation.y = Math.sin(time * 14.0) * 0.35;
        headGroup.rotation.x = 0.15;
        if (rightArmGroup) rightArmGroup.rotation.z = -0.05;
        if (leftArmGroup) leftArmGroup.rotation.z = 0.05;
        break;

      case this.states.GOODBYE:
        headGroup.rotation.x = 0.2;
        root.position.y = -0.15;
        if (rightArmGroup) {
          rightArmGroup.rotation.z = -0.8;
          rightArmGroup.userData.elbow.rotation.x = -0.5;
        }
        break;
    }
  }

  /**
   * Animación del escenario holográfico
   */
  updateSingleStage(stage, time) {
    if (!stage || !stage.userData) return;

    const { ring1, ring2, beamCylinder, particles } = stage.userData;

    if (ring1) ring1.rotation.z += 0.015;
    if (ring2) ring2.rotation.z -= 0.022;

    if (beamCylinder) {
      beamCylinder.material.opacity = 0.08 + Math.sin(time * 3.0) * 0.04;
    }

    if (particles) {
      const positions = particles.geometry.attributes.position.array;
      for (let i = 1; i < positions.length; i += 3) {
        positions[i] += 0.012;
        if (positions[i] > 3.0) {
          positions[i] = -0.2;
        }
      }
      particles.geometry.attributes.position.needsUpdate = true;
    }
  }
}

// Instanciar motor globalmente
window.exoRobot = new ExoRobot3DManager();
document.addEventListener('DOMContentLoaded', () => {
  window.exoRobot.init();
});
