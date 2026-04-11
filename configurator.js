// ============================================================================
// 3D Exhibition Booth Configurator v2 (StyleYourStand-like)
// ============================================================================

// Configuration State
const config = {
    dimensions: {
        length: 4,
        width: 3,
        height: 2.5
    },
    walls: {
        color: 0xffffff,
        material: 'plastic'
    },
    floor: {
        color: 0xcccccc,
        type: 'carpet'
    },
    lighting: {
        intensity: 1,
        type: 'warm'
    },
    furniture: [],
    equipment: [],
    prices: {
        base: 500,
        materials: {
            plastic: 50,
            wood: 150,
            metal: 200,
            fabric: 100
        },
        floor: {
            carpet: 30,
            tile: 40,
            wood: 60
        },
        furniture: {
            table: 200,
            chair: 100,
            counter: 400,
            shelf: 300
        },
        equipment: {
            monitor: 800,
            speaker: 300,
            camera: 500,
            banner: 150
        }
    }
};

// Three.js Setup
let scene, camera, renderer;
let boothGroup, wallsGroup, floorMesh, lightingSetup;
let raycaster = new THREE.Raycaster();
let mouse = new THREE.Vector2();
let isDragging = false;
let previousMousePosition = { x: 0, y: 0 };

// ============================================================================
// INITIALIZATION
// ============================================================================

function init() {
    // Scene
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf5f5f5);
    scene.fog = new THREE.Fog(0xf5f5f5, 100, 1000);

    // Camera
    const width = window.innerWidth - 350;
    const height = window.innerHeight;
    camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
    camera.position.set(6, 5, 6);
    camera.lookAt(0, 1, 0);

    // Renderer
    const canvas = document.getElementById('canvas');
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowShadowMap;

    // Groups
    boothGroup = new THREE.Group();
    scene.add(boothGroup);

    // Lighting
    setupLighting();

    // Initial Booth
    createBooth();

    // Event Listeners
    setupEventListeners();

    // Animation Loop
    animate();

    // Handle Resize
    window.addEventListener('resize', onWindowResize);

    console.log('✅ 3D Configurator initialized');
}

// ============================================================================
// LIGHTING
// ============================================================================

function setupLighting() {
    // Ambient Light
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    // Directional Light (Sun)
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(5, 10, 5);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    directionalLight.shadow.camera.far = 50;
    directionalLight.shadow.camera.left = -20;
    directionalLight.shadow.camera.right = 20;
    directionalLight.shadow.camera.top = 20;
    directionalLight.shadow.camera.bottom = -20;
    scene.add(directionalLight);

    // Point Light (Accent)
    const pointLight = new THREE.PointLight(0xffffff, 0.5);
    pointLight.position.set(-5, 8, -5);
    scene.add(pointLight);

    lightingSetup = { ambientLight, directionalLight, pointLight };
}

// ============================================================================
// CREATE BOOTH
// ============================================================================

function createBooth() {
    // Clear previous booth
    boothGroup.clear();

    const { length, width, height } = config.dimensions;
    const { color: wallColor } = config.walls;
    const { color: floorColor, type: floorType } = config.floor;

    // Floor
    const floorGeometry = new THREE.PlaneGeometry(length, width);
    const floorMaterial = new THREE.MeshStandardMaterial({
        color: floorColor,
        roughness: floorType === 'tile' ? 0.3 : 0.8,
        metalness: floorType === 'metal' ? 0.8 : 0.1
    });
    floorMesh = new THREE.Mesh(floorGeometry, floorMaterial);
    floorMesh.rotation.x = -Math.PI / 2;
    floorMesh.receiveShadow = true;
    boothGroup.add(floorMesh);

    // Walls
    wallsGroup = new THREE.Group();

    const wallMaterial = new THREE.MeshStandardMaterial({
        color: wallColor,
        roughness: config.walls.material === 'plastic' ? 0.3 : 0.8,
        metalness: config.walls.material === 'metal' ? 0.7 : 0.1
    });

    // Front Wall
    const frontWall = createWall(length, height);
    frontWall.position.z = width / 2;
    frontWall.material = wallMaterial;
    wallsGroup.add(frontWall);

    // Back Wall
    const backWall = createWall(length, height);
    backWall.position.z = -width / 2;
    backWall.material = wallMaterial;
    wallsGroup.add(backWall);

    // Left Wall
    const leftWall = createWall(width, height);
    leftWall.rotation.y = Math.PI / 2;
    leftWall.position.x = -length / 2;
    leftWall.material = wallMaterial;
    wallsGroup.add(leftWall);

    // Right Wall
    const rightWall = createWall(width, height);
    rightWall.rotation.y = Math.PI / 2;
    rightWall.position.x = length / 2;
    rightWall.material = wallMaterial;
    wallsGroup.add(rightWall);

    boothGroup.add(wallsGroup);

    // Add furniture and equipment
    addFurniture();
    addEquipment();

    updatePrice();
}

function createWall(width, height) {
    const geometry = new THREE.PlaneGeometry(width, height);
    const mesh = new THREE.Mesh(geometry);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    return mesh;
}

// ============================================================================
// FURNITURE & EQUIPMENT
// ============================================================================

function addFurniture() {
    config.furniture.forEach(item => {
        let object;

        switch (item) {
            case 'table':
                object = createTable();
                object.position.set(0, 0, 0);
                break;
            case 'chair':
                object = createChair();
                object.position.set(1, 0, 0);
                break;
            case 'counter':
                object = createCounter();
                object.position.set(-1, 0, 0);
                break;
            case 'shelf':
                object = createShelf();
                object.position.set(0, 0, 1);
                break;
        }

        if (object) {
            boothGroup.add(object);
        }
    });
}

function addEquipment() {
    config.equipment.forEach((item, index) => {
        let object;

        switch (item) {
            case 'monitor':
                object = createMonitor();
                object.position.set(0, 1.5, config.dimensions.width / 2 - 0.1);
                break;
            case 'speaker':
                object = createSpeaker();
                object.position.set(1, 1.5, config.dimensions.width / 2 - 0.1);
                break;
            case 'camera':
                object = createCamera();
                object.position.set(-1, 2, 0);
                break;
            case 'banner':
                object = createBanner();
                object.position.set(0, 2, config.dimensions.width / 2 - 0.05);
                break;
        }

        if (object) {
            boothGroup.add(object);
        }
    });
}

function createTable() {
    const group = new THREE.Group();
    
    // Tabletop
    const topGeometry = new THREE.BoxGeometry(1.5, 0.05, 0.8);
    const topMaterial = new THREE.MeshStandardMaterial({ color: 0x8B4513, roughness: 0.7 });
    const top = new THREE.Mesh(topGeometry, topMaterial);
    top.position.y = 0.75;
    top.castShadow = true;
    group.add(top);

    // Legs
    for (let i = 0; i < 4; i++) {
        const legGeometry = new THREE.BoxGeometry(0.05, 0.75, 0.05);
        const leg = new THREE.Mesh(legGeometry, topMaterial);
        leg.position.x = (i % 2 === 0 ? 0.7 : -0.7);
        leg.position.z = (i < 2 ? 0.35 : -0.35);
        leg.castShadow = true;
        group.add(leg);
    }

    return group;
}

function createChair() {
    const group = new THREE.Group();
    const material = new THREE.MeshStandardMaterial({ color: 0x333333, roughness: 0.5 });

    // Seat
    const seatGeometry = new THREE.BoxGeometry(0.5, 0.05, 0.5);
    const seat = new THREE.Mesh(seatGeometry, material);
    seat.position.y = 0.4;
    seat.castShadow = true;
    group.add(seat);

    // Backrest
    const backGeometry = new THREE.BoxGeometry(0.5, 0.6, 0.05);
    const back = new THREE.Mesh(backGeometry, material);
    back.position.y = 0.7;
    back.position.z = -0.25;
    back.castShadow = true;
    group.add(back);

    return group;
}

function createCounter() {
    const geometry = new THREE.BoxGeometry(1.2, 0.9, 0.6);
    const material = new THREE.MeshStandardMaterial({ color: 0xcccccc, roughness: 0.6 });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.y = 0.45;
    mesh.castShadow = true;
    return mesh;
}

function createShelf() {
    const group = new THREE.Group();
    const material = new THREE.MeshStandardMaterial({ color: 0x8B4513, roughness: 0.7 });

    for (let i = 0; i < 3; i++) {
        const shelfGeometry = new THREE.BoxGeometry(1, 0.02, 0.4);
        const shelf = new THREE.Mesh(shelfGeometry, material);
        shelf.position.y = 0.5 + i * 0.6;
        shelf.castShadow = true;
        group.add(shelf);
    }

    return group;
}

function createMonitor() {
    const group = new THREE.Group();
    const material = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.3 });

    // Screen
    const screenGeometry = new THREE.BoxGeometry(0.8, 0.5, 0.05);
    const screen = new THREE.Mesh(screenGeometry, material);
    screen.castShadow = true;
    group.add(screen);

    // Stand
    const standGeometry = new THREE.BoxGeometry(0.1, 0.3, 0.1);
    const stand = new THREE.Mesh(standGeometry, material);
    stand.position.y = -0.4;
    stand.castShadow = true;
    group.add(stand);

    return group;
}

function createSpeaker() {
    const geometry = new THREE.BoxGeometry(0.3, 0.5, 0.3);
    const material = new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.8 });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.castShadow = true;
    return mesh;
}

function createCamera() {
    const geometry = new THREE.BoxGeometry(0.15, 0.15, 0.2);
    const material = new THREE.MeshStandardMaterial({ color: 0x333333, roughness: 0.4 });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.castShadow = true;
    return mesh;
}

function createBanner() {
    const geometry = new THREE.PlaneGeometry(2, 1);
    const material = new THREE.MeshStandardMaterial({ 
        color: 0xff6b6b,
        emissive: 0xff6b6b,
        emissiveIntensity: 0.3
    });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.castShadow = true;
    return mesh;
}

// ============================================================================
// EVENT LISTENERS
// ============================================================================

function setupEventListeners() {
    // Dimension Controls
    document.querySelectorAll('[data-length]').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('[data-length]').forEach(b => b.classList.remove('selected'));
            e.target.classList.add('selected');
            config.dimensions.length = parseFloat(e.target.dataset.length);
            createBooth();
        });
    });

    document.querySelectorAll('[data-width]').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('[data-width]').forEach(b => b.classList.remove('selected'));
            e.target.classList.add('selected');
            config.dimensions.width = parseFloat(e.target.dataset.width);
            createBooth();
        });
    });

    document.querySelectorAll('[data-height]').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('[data-height]').forEach(b => b.classList.remove('selected'));
            e.target.classList.add('selected');
            config.dimensions.height = parseFloat(e.target.dataset.height);
            createBooth();
        });
    });

    // Wall Color
    document.getElementById('wallColor').addEventListener('change', (e) => {
        config.walls.color = parseInt(e.target.value.slice(1), 16);
        createBooth();
    });

    // Wall Material
    document.querySelectorAll('[data-material]').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('[data-material]').forEach(b => b.classList.remove('selected'));
            e.target.classList.add('selected');
            config.walls.material = e.target.dataset.material;
            createBooth();
        });
    });

    // Floor Color
    document.getElementById('floorColor').addEventListener('change', (e) => {
        config.floor.color = parseInt(e.target.value.slice(1), 16);
        createBooth();
    });

    // Floor Type
    document.querySelectorAll('[data-floor]').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('[data-floor]').forEach(b => b.classList.remove('selected'));
            e.target.classList.add('selected');
            config.floor.type = e.target.dataset.floor;
            createBooth();
        });
    });

    // Furniture
    document.querySelectorAll('[data-furniture]').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const furniture = e.target.dataset.furniture;
            if (config.furniture.includes(furniture)) {
                config.furniture = config.furniture.filter(f => f !== furniture);
                e.target.classList.remove('selected');
            } else {
                config.furniture.push(furniture);
                e.target.classList.add('selected');
            }
            createBooth();
        });
    });

    // Equipment
    document.querySelectorAll('[data-equipment]').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const equipment = e.target.dataset.equipment;
            if (config.equipment.includes(equipment)) {
                config.equipment = config.equipment.filter(eq => eq !== equipment);
                e.target.classList.remove('selected');
            } else {
                config.equipment.push(equipment);
                e.target.classList.add('selected');
            }
            createBooth();
        });
    });

    // Lighting
    document.getElementById('lightIntensity').addEventListener('input', (e) => {
        config.lighting.intensity = parseFloat(e.target.value);
        const value = config.lighting.intensity;
        const label = value < 0.7 ? 'Тусклое' : value > 1.3 ? 'Яркое' : 'Нормальное';
        document.getElementById('lightValue').textContent = label;
        updateLighting();
    });

    document.querySelectorAll('[data-lighting]').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('[data-lighting]').forEach(b => b.classList.remove('selected'));
            e.target.classList.add('selected');
            config.lighting.type = e.target.dataset.lighting;
            updateLighting();
        });
    });

    // Category Headers
    document.querySelectorAll('.category-header').forEach(header => {
        header.addEventListener('click', () => {
            const category = header.parentElement;
            category.classList.toggle('active');
        });
    });

    // Canvas Events
    document.getElementById('canvas').addEventListener('mousedown', onMouseDown);
    document.getElementById('canvas').addEventListener('mousemove', onMouseMove);
    document.getElementById('canvas').addEventListener('mouseup', onMouseUp);
    document.getElementById('canvas').addEventListener('wheel', onMouseWheel, false);
}

// ============================================================================
// MOUSE CONTROLS
// ============================================================================

function onMouseDown(e) {
    isDragging = true;
    previousMousePosition = { x: e.clientX, y: e.clientY };
}

function onMouseMove(e) {
    if (isDragging) {
        const deltaX = e.clientX - previousMousePosition.x;
        const deltaY = e.clientY - previousMousePosition.y;

        if (e.buttons === 1) { // Left click - rotate
            boothGroup.rotation.y += deltaX * 0.01;
            boothGroup.rotation.x += deltaY * 0.01;
        } else if (e.buttons === 2) { // Right click - pan
            camera.position.x -= deltaX * 0.01;
            camera.position.y += deltaY * 0.01;
        }

        previousMousePosition = { x: e.clientX, y: e.clientY };
    }
}

function onMouseUp() {
    isDragging = false;
}

function onMouseWheel(e) {
    e.preventDefault();
    const zoomSpeed = 0.1;
    const direction = camera.position.clone().normalize();

    if (e.deltaY > 0) {
        camera.position.addScaledVector(direction, zoomSpeed);
    } else {
        camera.position.addScaledVector(direction, -zoomSpeed);
    }
}

// ============================================================================
// UTILITIES
// ============================================================================

function updateLighting() {
    const intensity = config.lighting.intensity;
    const type = config.lighting.type;

    lightingSetup.ambientLight.intensity = 0.6 * intensity;
    lightingSetup.directionalLight.intensity = 0.8 * intensity;

    let color = 0xffffff;
    if (type === 'warm') color = 0xffcc99;
    if (type === 'cool') color = 0x99ccff;

    lightingSetup.directionalLight.color.setHex(color);
    lightingSetup.ambientLight.color.setHex(color);
}

function updatePrice() {
    const { length, width, height } = config.dimensions;
    const area = length * width;

    let total = config.prices.base * area;

    // Wall material cost
    total += config.prices.materials[config.walls.material] * (2 * (length + width) * height);

    // Floor cost
    total += config.prices.floor[config.floor.type] * area;

    // Furniture cost
    config.furniture.forEach(item => {
        total += config.prices.furniture[item] || 0;
    });

    // Equipment cost
    config.equipment.forEach(item => {
        total += config.prices.equipment[item] || 0;
    });

    document.getElementById('totalPrice').textContent = `${total.toLocaleString('ru-RU')} €`;
}

function saveConfigure() {
    const configData = {
        dimensions: config.dimensions,
        walls: config.walls,
        floor: config.floor,
        lighting: config.lighting,
        furniture: config.furniture,
        equipment: config.equipment
    };

    const dataString = btoa(JSON.stringify(configData));
    const shareLink = `${window.location.href}?config=${dataString}`;

    alert(`Ссылка сохранена:\n\n${shareLink}\n\nВы можете поделиться этой ссылкой или отправить в Telegram!`);
    console.log('Configuration saved:', configData);
}

function resetConfigure() {
    config.dimensions = { length: 4, width: 3, height: 2.5 };
    config.walls = { color: 0xffffff, material: 'plastic' };
    config.floor = { color: 0xcccccc, type: 'carpet' };
    config.lighting = { intensity: 1, type: 'warm' };
    config.furniture = [];
    config.equipment = [];

    document.querySelectorAll('.option-item').forEach(btn => btn.classList.remove('selected'));
    document.querySelectorAll('[data-length="4"], [data-width="3"], [data-height="2.5"], [data-material="plastic"], [data-floor="carpet"], [data-lighting="warm"]').forEach(btn => btn.classList.add('selected'));

    document.getElementById('wallColor').value = '#ffffff';
    document.getElementById('floorColor').value = '#cccccc';
    document.getElementById('lightIntensity').value = 1;

    createBooth();
}

function onWindowResize() {
    const width = window.innerWidth - 350;
    const height = window.innerHeight;

    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
}

// ============================================================================
// ANIMATION LOOP
// ============================================================================

function animate() {
    requestAnimationFrame(animate);
    renderer.render(scene, camera);
}

// ============================================================================
// LOAD CONFIG FROM URL
// ============================================================================

function loadConfigFromURL() {
    const params = new URLSearchParams(window.location.search);
    const configData = params.get('config');

    if (configData) {
        try {
            const decoded = JSON.parse(atob(configData));
            Object.assign(config, decoded);
            createBooth();
            console.log('Configuration loaded from URL:', config);
        } catch (e) {
            console.error('Error loading configuration:', e);
        }
    }
}

// ============================================================================
// START
// ============================================================================

window.addEventListener('DOMContentLoaded', () => {
    init();
    loadConfigFromURL();
});
