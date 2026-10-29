// ==========================================
// 1. إعداد المشهد (Scene) والكاميرا والمحرك
// ==========================================
const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 100);
camera.position.set(0, 0, 5); // موقع الكاميرا

const container = document.getElementById('canvas-container');
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
renderer.shadowMap.enabled = true;
container.appendChild(renderer.domElement);

// ==========================================
// 2. الإضاءة (Lighting)
// ==========================================
const ambientLight = new THREE.AmbientLight(0xffffff, 0.6); // إضاءة عامة
scene.add(ambientLight);

const spotLight = new THREE.SpotLight(0xffffff, 1.5); // إضاءة مركزة
spotLight.position.set(5, 5, 5);
spotLight.castShadow = true;
scene.add(spotLight);

const goldLight = new THREE.PointLight(0xd4af37, 2, 10); // إضاءة خلفية ذهبية للفخامة
goldLight.position.set(-3, 3, 3);
scene.add(goldLight);

// ==========================================
// 3. صناعة الساعة (Watch Model)
// ==========================================
const watchGroup = new THREE.Group();

// أ) الإطار (Case)
const caseGeo = new THREE.CylinderGeometry(1.2, 1.2, 0.3, 64);
const caseMat = new THREE.MeshStandardMaterial({ 
    color: 0xd4af37, // اللون الذهبي
    metalness: 0.9,  // نسبة المعدن
    roughness: 0.1   // نسبة اللمعان
});
const watchCase = new THREE.Mesh(caseGeo, caseMat);
watchCase.rotation.x = Math.PI / 2;
watchCase.castShadow = true;
watchGroup.add(watchCase);

// ب) الواجهة (Dial)
const dialGeo = new THREE.CylinderGeometry(1.05, 1.05, 0.31, 64);
const dialMat = new THREE.MeshStandardMaterial({ 
    color: 0x111111, // اللون الأسود
    metalness: 0.5,
    roughness: 0.4
});
const watchDial = new THREE.Mesh(dialGeo, dialMat);
watchDial.rotation.x = Math.PI / 2;
watchGroup.add(watchDial);

scene.add(watchGroup);

// ==========================================
// 4. التحكم بالحركة (سحب بالماوس أو اللمس)
// ==========================================
let isDragging = false;
let previousMousePosition = { x: 0, y: 0 };

// للكمبيوتر (الماوس)
container.addEventListener('mousedown', (e) => { isDragging = true; });
container.addEventListener('mousemove', (e) => {
    if (isDragging) {
        const deltaMove = { x: e.offsetX - previousMousePosition.x, y: e.offsetY - previousMousePosition.y };
        watchGroup.rotation.y += deltaMove.x * 0.01;
        watchGroup.rotation.x += deltaMove.y * 0.01;
    }
    previousMousePosition = { x: e.offsetX, y: e.offsetY };
});
container.addEventListener('mouseup', () => { isDragging = false; });

// للآيباد والموبايل (اللمس)
container.addEventListener('touchstart', (e) => { 
    isDragging = true; 
    previousMousePosition = { x: e.touches[0].clientX, y: e.touches[0].clientY };
});
container.addEventListener('touchmove', (e) => {
    if (isDragging) {
        const deltaMove = { 
            x: e.touches[0].clientX - previousMousePosition.x, 
            y: e.touches[0].clientY - previousMousePosition.y 
        };
        watchGroup.rotation.y += deltaMove.x * 0.01;
        watchGroup.rotation.x += deltaMove.y * 0.01;
        previousMousePosition = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    }
});
container.addEventListener('touchend', () => { isDragging = false; });

// ==========================================
// 5. التفاعل مع الأزرار (تغيير الألوان)
// ==========================================
document.getElementById('btn-gold').addEventListener('click', () => {
    caseMat.color.setHex(0xd4af37); // تغيير لون الإطار للذهبي
});

document.getElementById('btn-silver').addEventListener('click', () => {
    caseMat.color.setHex(0xe0e0e0); // تغيير لون الإطار للفضي
});

// ==========================================
// 6. دورة الرسم والتحديث (Animation Loop)
// ==========================================
function animate() {
    requestAnimationFrame(animate);
    
    // دوران بطيء تلقائي عندما لا يكون المستخدم يسحب
    if (!isDragging) {
        watchGroup.rotation.y += 0.002; 
    }
    
    renderer.render(scene, camera);
}
animate();

// تحديث حجم الشاشة إذا تغير
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});
