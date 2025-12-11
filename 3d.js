// Stadium Configuration
const STADIUM_CONFIG = {
    totalSeats: 5200,
    sections: 8, // 8 sections around the stadium
    rowsPerSection: 28, // Increased to ensure 5000+ seats
    seatsPerRow: 28, // Base seats per row
    seatWidth: 0.5,
    seatDepth: 0.4,
    seatHeight: 0.3,
    rowSpacing: 0.6,
    sectionSpacing: 2.0,
    stadiumRadius: 30,
    stadiumHeight: 15,
    aisleWidth: 1.5,
    stairsWidth: 1.2
};

// Generate seat data
function generateSeatData() {
    const seats = [];
    let seatId = 1;
    
    // Generate seats for each section
    for (let section = 1; section <= STADIUM_CONFIG.sections; section++) {
        const sectionAngle = (section - 1) * (360 / STADIUM_CONFIG.sections);
        
        for (let row = 1; row <= STADIUM_CONFIG.rowsPerSection; row++) {
            const rowRadius = STADIUM_CONFIG.stadiumRadius + (row - 1) * STADIUM_CONFIG.rowSpacing;
            const rowHeight = (row - 1) * 0.3; // Staggered height for rows
            
            // Calculate seats per row (fewer seats in front rows, more in back)
            // Front rows: ~22 seats, back rows: ~28 seats
            const seatsInRow = Math.floor(STADIUM_CONFIG.seatsPerRow * (0.75 + (row / STADIUM_CONFIG.rowsPerSection) * 0.25));
            const anglePerSeat = (65 / seatsInRow) * (Math.PI / 180); // 65 degree arc per section for better coverage
            
            for (let seatNum = 1; seatNum <= seatsInRow; seatNum++) {
                // Skip seats for aisles (every 9 seats to maximize seat count)
                if (seatNum % 9 === 0) continue;
                
                const seatAngle = sectionAngle * (Math.PI / 180) + (seatNum - seatsInRow / 2) * anglePerSeat;
                const x = Math.cos(seatAngle) * rowRadius;
                const z = Math.sin(seatAngle) * rowRadius;
                const y = rowHeight;
                
                // Randomly assign filled/empty status (60% filled for demo)
                const isFilled = Math.random() < 0.6;
                
                seats.push({
                    id: seatId++,
                    section: section,
                    row: row,
                    seatNumber: seatNum,
                    x: x,
                    y: y,
                    z: z,
                    angle: seatAngle,
                    isFilled: isFilled,
                    status: isFilled ? 'filled' : 'empty'
                });
            }
        }
    }
    
    return seats;
}

// Initialize Three.js scene
let scene, camera, renderer, controls;
let seatMeshes = [];
let stadiumStructure = [];

function init() {
    // Create scene
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x1a1a2e);
    
    // Create camera
    camera = new THREE.PerspectiveCamera(
        75,
        window.innerWidth / window.innerHeight,
        0.1,
        1000
    );
    camera.position.set(0, 20, 60);
    camera.lookAt(0, 0, 0);
    
    // Create renderer
    const container = document.getElementById('canvas-container');
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    container.appendChild(renderer.domElement);
    
    // Add lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(30, 30, 30);
    directionalLight.castShadow = true;
    scene.add(directionalLight);
    
    const pointLight = new THREE.PointLight(0xffffff, 0.5);
    pointLight.position.set(-30, 20, -30);
    scene.add(pointLight);
    
    // Generate seat data
    const seats = generateSeatData();
    
    // Create stadium structure
    createStadiumStructure();
    
    // Create seats
    createSeats(seats);
    
    // Create stage/center area
    createStage();
    
    // Create solid base to prevent seeing below stadium
    createSolidBase();
    
    // Mouse controls
    setupMouseControls();
    
    // Update statistics
    updateStatistics(seats);
    
    // Animation loop
    animate();
}

function createStadiumStructure() {
    // Create stadium base/floor
    const floorGeometry = new THREE.CylinderGeometry(
        STADIUM_CONFIG.stadiumRadius - 5,
        STADIUM_CONFIG.stadiumRadius + 20,
        0.5,
        32
    );
    const floorMaterial = new THREE.MeshStandardMaterial({ 
        color: 0x2d5016,
        roughness: 0.8
    });
    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.rotation.x = Math.PI / 2;
    floor.position.y = -0.25;
    floor.receiveShadow = true;
    scene.add(floor);
    stadiumStructure.push(floor);
    
    // Create outer wall
    const wallGeometry = new THREE.CylinderGeometry(
        STADIUM_CONFIG.stadiumRadius + 25,
        STADIUM_CONFIG.stadiumRadius + 25,
        STADIUM_CONFIG.stadiumHeight,
        32
    );
    const wallMaterial = new THREE.MeshStandardMaterial({ 
        color: 0x555555,
        roughness: 0.7
    });
    const wall = new THREE.Mesh(wallGeometry, wallMaterial);
    wall.position.y = STADIUM_CONFIG.stadiumHeight / 2;
    scene.add(wall);
    stadiumStructure.push(wall);
}

function createStage() {
    // Create center stage
    const stageGeometry = new THREE.CylinderGeometry(8, 8, 1, 32);
    const stageMaterial = new THREE.MeshStandardMaterial({ 
        color: 0xff6b6b,
        emissive: 0x330000,
        roughness: 0.3
    });
    const stage = new THREE.Mesh(stageGeometry, stageMaterial);
    stage.position.y = 0.5;
    scene.add(stage);
    
    // Add stage lighting effect
    const stageLight = new THREE.PointLight(0xff6b6b, 2, 20);
    stageLight.position.set(0, 5, 0);
    scene.add(stageLight);
}

function createSolidBase() {
    // Create a large solid base/floor to block view below stadium
    const baseRadius = STADIUM_CONFIG.stadiumRadius + 30;
    const baseGeometry = new THREE.CylinderGeometry(baseRadius, baseRadius, 2, 64);
    const baseMaterial = new THREE.MeshStandardMaterial({ 
        color: 0x1a1a2e, // Match background color
        roughness: 1.0,
        side: THREE.DoubleSide
    });
    const base = new THREE.Mesh(baseGeometry, baseMaterial);
    base.position.y = -1; // Position below stadium
    base.receiveShadow = true;
    scene.add(base);
    stadiumStructure.push(base);
    
    // Add a bottom cap to completely seal the bottom
    const bottomCapGeometry = new THREE.CircleGeometry(baseRadius, 64);
    const bottomCap = new THREE.Mesh(bottomCapGeometry, baseMaterial);
    bottomCap.rotation.x = Math.PI / 2;
    bottomCap.position.y = -2;
    scene.add(bottomCap);
    stadiumStructure.push(bottomCap);
}

function createSeats(seats) {
    const filledMaterial = new THREE.MeshStandardMaterial({ 
        color: 0x4CAF50,
        roughness: 0.5,
        metalness: 0.3
    });
    
    const emptyMaterial = new THREE.MeshStandardMaterial({ 
        color: 0xf44336,
        roughness: 0.5,
        metalness: 0.3
    });
    
    seats.forEach(seat => {
        // Create seat geometry
        const seatGeometry = new THREE.BoxGeometry(
            STADIUM_CONFIG.seatWidth,
            STADIUM_CONFIG.seatHeight,
            STADIUM_CONFIG.seatDepth
        );
        
        const material = seat.isFilled ? filledMaterial.clone() : emptyMaterial.clone();
        const seatMesh = new THREE.Mesh(seatGeometry, material);
        
        seatMesh.position.set(seat.x, seat.y, seat.z);
        seatMesh.rotation.y = seat.angle + Math.PI / 2; // Face center
        seatMesh.castShadow = true;
        seatMesh.receiveShadow = true;
        
        // Store seat data
        seatMesh.userData = seat;
        
        scene.add(seatMesh);
        seatMeshes.push(seatMesh);
    });
    
    // Create stairs and aisles
    createStairsAndAisles();
}

function createStairsAndAisles() {
    const stairsMaterial = new THREE.MeshStandardMaterial({ 
        color: 0x9E9E9E,
        roughness: 0.8
    });
    
    // Create stairs between sections
    for (let section = 0; section < STADIUM_CONFIG.sections; section++) {
        const angle = (section * 360 / STADIUM_CONFIG.sections) * (Math.PI / 180);
        const radius = STADIUM_CONFIG.stadiumRadius + 12;
        
        for (let row = 0; row < STADIUM_CONFIG.rowsPerSection; row++) {
            const stepHeight = row * 0.3;
            const stepRadius = radius + row * STADIUM_CONFIG.rowSpacing;
            
            const stepGeometry = new THREE.BoxGeometry(
                STADIUM_CONFIG.stairsWidth,
                0.2,
                0.4
            );
            const step = new THREE.Mesh(stepGeometry, stairsMaterial);
            
            const x = Math.cos(angle) * stepRadius;
            const z = Math.sin(angle) * stepRadius;
            step.position.set(x, stepHeight, z);
            step.rotation.y = angle + Math.PI / 2;
            
            scene.add(step);
            stadiumStructure.push(step);
        }
    }
    
    // Create horizontal aisles
    for (let row = 0; row < STADIUM_CONFIG.rowsPerSection; row += 5) {
        const aisleRadius = STADIUM_CONFIG.stadiumRadius + row * STADIUM_CONFIG.rowSpacing;
        const aisleGeometry = new THREE.RingGeometry(
            aisleRadius - 0.5,
            aisleRadius + 0.5,
            64
        );
        const aisleMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x9E9E9E,
            side: THREE.DoubleSide
        });
        const aisle = new THREE.Mesh(aisleGeometry, aisleMaterial);
        aisle.rotation.x = -Math.PI / 2;
        aisle.position.y = row * 0.3;
        scene.add(aisle);
        stadiumStructure.push(aisle);
    }
}

function setupMouseControls() {
    let isDragging = false;
    let previousMousePosition = { x: 0, y: 0 };
    let isRightClick = false;
    
    renderer.domElement.addEventListener('mousedown', (e) => {
        isDragging = true;
        isRightClick = e.button === 2;
        previousMousePosition = { x: e.clientX, y: e.clientY };
    });
    
    renderer.domElement.addEventListener('mousemove', (e) => {
        if (!isDragging) return;
        
        const deltaX = e.clientX - previousMousePosition.x;
        const deltaY = e.clientY - previousMousePosition.y;
        
        if (isRightClick) {
            // Pan
            const panSpeed = 0.1;
            const panVector = new THREE.Vector3();
            panVector.setFromMatrixColumn(camera.matrix, 0);
            panVector.multiplyScalar(-deltaX * panSpeed);
            camera.position.add(panVector);
            
            panVector.setFromMatrixColumn(camera.matrix, 1);
            panVector.multiplyScalar(deltaY * panSpeed);
            camera.position.add(panVector);
        } else {
            // Rotate around stadium (limited to prevent looking below)
            const spherical = new THREE.Spherical();
            spherical.setFromVector3(camera.position);
            spherical.theta -= deltaX * 0.01;
            spherical.phi += deltaY * 0.01;
            // Limit phi to prevent looking below stadium (0.3 to 1.4 radians = ~17° to ~80°)
            // This prevents 360 rotation and blocks view below
            spherical.phi = Math.max(0.3, Math.min(1.4, spherical.phi));
            
            camera.position.setFromSpherical(spherical);
            camera.lookAt(0, 0, 0);
        }
        
        previousMousePosition = { x: e.clientX, y: e.clientY };
    });
    
    renderer.domElement.addEventListener('mouseup', () => {
        isDragging = false;
    });
    
    renderer.domElement.addEventListener('wheel', (e) => {
        e.preventDefault();
        const zoomSpeed = 0.1;
        const direction = e.deltaY > 0 ? 1 : -1;
        
        const distance = camera.position.length();
        const newDistance = distance + direction * zoomSpeed * distance;
        
        if (newDistance > 10 && newDistance < 200) {
            camera.position.multiplyScalar(newDistance / distance);
        }
    });
    
    // Prevent context menu on right click
    renderer.domElement.addEventListener('contextmenu', (e) => {
        e.preventDefault();
    });
    
    // Handle window resize
    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });
}

function updateStatistics(seats) {
    const total = seats.length;
    const filled = seats.filter(s => s.isFilled).length;
    const empty = total - filled;
    const occupancyRate = ((filled / total) * 100).toFixed(1);
    
    document.getElementById('total-seats').textContent = total.toLocaleString();
    document.getElementById('filled-seats').textContent = filled.toLocaleString();
    document.getElementById('empty-seats').textContent = empty.toLocaleString();
    document.getElementById('occupancy-rate').textContent = occupancyRate + '%';
}

function animate() {
    requestAnimationFrame(animate);
    
    // Rotate stage light slightly
    const stageLight = scene.children.find(child => child.type === 'PointLight' && child.position.y === 5);
    if (stageLight) {
        stageLight.intensity = 2 + Math.sin(Date.now() * 0.001) * 0.5;
    }
    
    renderer.render(scene, camera);
}

// Initialize when page loads
window.addEventListener('load', init);

// Export seat data for external use
function getSeatData() {
    return generateSeatData();
}
