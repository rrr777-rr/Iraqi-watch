// ==========================================
// 1. إعداد المشهد والكاميرا والإضاءة
// ==========================================
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 100);
camera.position.set(0, 0, 8);

const container = document.getElementById('canvas-container');
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
renderer.shadowMap.enabled = true;
container.appendChild(renderer.domElement);

// إضاءة استوديو احترافية
const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(ambientLight);

const mainLight = new THREE.DirectionalLight(0xffffff, 1.5);
mainLight.position.set(5, 10, 7);
mainLight.castShadow = true;
scene.add(mainLight);

const fillLight = new THREE.PointLight(0xd4af37, 2, 20);
fillLight.position.set(-5, 0, 5);
scene.add(fillLight);

// ==========================================
// 2. دالة رسم واجهة الساعة (Canvas Texture)
// ==========================================
function createDialTexture(bgColor, numColor, style) {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d');

    // لون الخلفية
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, 1024, 1024);

    // إعدادات الخط
    const cx = 512, cy = 512;
    const radius = 512;

    // رسم الأرقام
    const arabicNums = ['١٢','١','٢','٣','٤','٥','٦','٧','٨','٩','١٠','١١'];
    const romanNums = ['XII','I','II','III','IV','V','VI','VII','VIII','IX','X','XI'];
    
    for (let i = 0; i < 12; i++) {
        let text = '';
        if (style === 'arabic') text = arabicNums[i];
        else if (style === 'roman') text = romanNums[i];
        else text = (i === 0) ? '12' : i.toString();

        const angle = (i * Math.PI / 6) - (Math.PI / 2);
        const x = cx + Math.cos(angle) * (radius * 0.75);
        const y = cy + Math.sin(angle) * (radius * 0.75);

        ctx.fillStyle = numColor;
        ctx.font = 'bold 100px "Segoe UI", Arial, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(text, x, y);
    }

    // رسم الخطوط الدقيقة (Ticks)
    for(let i=0; i<60; i++) {
        const angle = (i * Math.PI / 30);
        const innerR = radius * 0.9;
        const outerR = radius * 0.95;
        ctx.beginPath();
        ctx.moveTo(cx + Math.cos(angle)*innerR, cy + Math.sin(angle)*innerR);
        ctx.lineTo(cx + Math.cos(angle)*outerR, cy + Math.sin(angle)*outerR);
        ctx.strokeStyle = numColor;
        ctx.lineWidth = (i % 5 === 0) ? 6 : 2; // خطوط سميكة للدقائق الخمس
        ctx.stroke();
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.anisotropy = renderer.capabilities.getMaxAnisotropy();
    return texture;
}

// ==========================================
// 3. بناء الساعة
// ==========================================
const watchGroup = new THREE.Group();

// أ) الحزام (Strap) - مكون من قطعتين
const strapGeo = new THREE.BoxGeometry(1.2, 2.5, 0.1);
const strapMat = new THREE.MeshStandardMaterial({ color: 0x3e2723, roughness: 0.9 });
const strapTop = new THREE.Mesh(strapGeo, strapMat);
strapTop.position.set(0, 2.1, -0.1);
const strapBottom = new THREE.Mesh(strapGeo, strapMat);
strapBottom.position.set(0, -2.1, -0.1);
watchGroup.add(strapTop, strapBottom);

// ب) الإطار (Case)
const caseGeo = new THREE.CylinderGeometry(1.6, 1.6, 0.3, 64);
const caseMat = new THREE.MeshStandardMaterial({ color: 0xd4af37, metalness: 0.9, roughness: 0.2 });
const watchCase = new THREE.Mesh(caseGeo, caseMat);
watchCase.rotation.x = Math.PI / 2;
watchCase.castShadow = true;
watchGroup.add(watchCase);

// ج) الواجهة (Dial)
const dialGeo = new THREE.CylinderGeometry(1.5, 1.5, 0.31, 64);
// ننشئ خامة أولية، وسيتم تحديثها عند التفاعل
const dialMat = new THREE.MeshStandardMaterial({ 
    map: createDialTexture('#111111', '#d4af37', 'english'),
    metalness: 0.2,
    roughness: 0.8
});
const watchDial = new THREE.Mesh(dialGeo, dialMat);
watchDial.rotation.x = Math.PI / 2;
watchGroup.add(watchDial);

// د) الزجاج (Glass) - طبقة شفافة لتعطي واقعية
const glassGeo = new THREE.CylinderGeometry(1.55, 1.55, 0.05, 64);
const glassMat = new THREE.MeshPhysicalMaterial({ 
    color: 0xffffff, 
    transparent: true, 
    opacity: 0.1, 
    roughness: 0.1,
    transmission: 0.9 
});
const watchGlass = new THREE.Mesh(glassGeo, glassMat);
watchGlass.rotation.x = Math.PI / 2;
watchGlass.position.z = 0.15; // جوة شوي لقدام
watchGroup.add(watchGlass);

// هـ) العقارب (Hands)
const handsGroup = new THREE.Group();
const handMat = new THREE.MeshStandardMaterial({ color: 0xffffff });

// عقرب الساعات
const hourHand = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.8, 0.02), handMat);
hourHand.position.y = 0.4;
const hourPivot = new THREE.Group();
hourPivot.add(hourHand);

// عقرب الدقائق
const minuteHand = new THREE.Mesh(new THREE.BoxGeometry(0.06, 1.1, 0.02), handMat);
minuteHand.position.y = 0.55;
const minutePivot = new THREE.Group();
minutePivot.add(minuteHand);

// عقرب الثواني
const secondHand = new THREE.Mesh(new THREE.BoxGeometry(0.02, 1.2, 0.01), new THREE.MeshStandardMaterial({ color: 0xff0000 }));
secondHand.position.y = 0.5;
const secondPivot = new THREE.Group();
secondPivot.add(secondHand);

// نضيف العقارب للمجموعة عشان نحركها بعدين
handsGroup.add(hourPivot, minutePivot, secondPivot);
handsGroup.position.z = 0.16;
watchGroup.add(handsGroup);

// نضيف الساعة للمشهد ونميلها شوي
watchGroup.rotation.x = 0.2;
watchGroup.rotation.y = -0.3;
scene.add(watchGroup);

// ==========================================
// 4. التحكم بالحركة (سحب)
// ==========================================
let isDragging = false;
let previousMousePosition = { x: 0, y: 0 };

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

// دعم اللمس
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
// 5. ربط الواجهة (UI) بالبرمجة
// ==========================================
document.getElementById('num-style').addEventListener('change', (e) => {
    const style = e.target.value;
    const numColor = document.getElementById('num-color').value;
    const dialColor = document.getElementById('dial-color').value;
    dialMat.map = createDialTexture(dialColor, numColor, style);
    dialMat.needsUpdate = true;
});

document.getElementById('num-color').addEventListener('input', (e) => {
    const numColor = e.target.value;
    const style = document.getElementById('num-style').value;
    const dialColor = document.getElementById('dial-color').value;
    dialMat.map = createDialTexture(dialColor, numColor, style);
    dialMat.needsUpdate = true;
});

document.getElementById('dial-color').addEventListener('input', (e) => {
    const dialColor = e.target.value;
    const numColor = document.getElementById('num-color').value;
    const style = document.getElementById('num-style').value;
    dialMat.map = createDialTexture(dialColor, numColor, style);
    dialMat.needsUpdate = true;
});

document.getElementById('case-color').addEventListener('input', (e) => {
    caseMat.color.set(e.target.value);
});

document.getElementById('strap-color').addEventListener('input', (e) => {
    strapMat.color.set(e.target.value);
});

// ==========================================
// 6. دورة الرسم والوقت الحقيقي
// ==========================================
function animate() {
    requestAnimationFrame(animate);

    // حركة عقارب الساعة الحقيقية
    const now = new Date();
    const seconds = now.getSeconds();
    const minutes = now.getMinutes();
    const hours = now.getHours();

    // حساب الزوايا (بالراديان)
    const secAngle = (seconds / 60) * Math.PI * 2;
    const minAngle = ((minutes + seconds/60) / 60) * Math.PI * 2;
    const hourAngle = ((hours % 12 + minutes/60) / 12) * Math.PI * 2;

    // تدوير العقارب (نستخدم الإشارة السالبة لأن اتجاه الرسم معاكس)
    secondPivot.rotation.z = -secAngle;
    minutePivot.rotation.z = -minAngle;
    hourPivot.rotation.z = -hourAngle;

    renderer.render(scene, camera);
}
animate();

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});