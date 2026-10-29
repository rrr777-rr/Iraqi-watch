// --- 1. إعداد المشهد والكاميرا والإضاءة ---
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
// إبعاد الكاميرا لرؤية الساعة كاملة
camera.position.set(0, 0, 10); 

const container = document.getElementById('canvas-container');
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setSize(container.clientWidth, container.clientHeight);
renderer.shadowMap.enabled = true;
container.appendChild(renderer.domElement);

// إضاءة استوديو علوية
scene.add(new THREE.AmbientLight(0xffffff, 0.6));
const spotLight = new THREE.DirectionalLight(0xffffff, 1.5);
spotLight.position.set(5, 10, 7);
spotLight.castShadow = true;
scene.add(spotLight);

// --- 2. دالة رسم الواجهة (Canvas) ---
function createDialTexture(bgColor, numColor, style) {
    const canvas = document.createElement('canvas');
    canvas.width = 1024; canvas.height = 1024;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = bgColor; ctx.fillRect(0, 0, 1024, 1024);
    
    const cx = 512, cy = 512, radius = 512;
    const arabicNums = ['١٢','١','٢','٣','٤','٥','٦','٧','٨','٩','١٠','١١'];
    const romanNums = ['XII','I','II','III','IV','V','VI','VII','VIII','IX','X','XI'];
    
    // رسم الأرقام
    for (let i = 0; i < 12; i++) {
        let text = (style === 'arabic') ? arabicNums[i] : (style === 'roman' ? romanNums[i] : (i === 0 ? '12' : i.toString()));
        const angle = (i * Math.PI / 6) - (Math.PI / 2);
        const x = cx + Math.cos(angle) * (radius * 0.75);
        const y = cy + Math.sin(angle) * (radius * 0.75);
        ctx.fillStyle = numColor;
        ctx.font = 'bold 110px "Segoe UI", Arial, sans-serif';
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(text, x, y);
    }
    
    // رسم خطوط الدقائق
    for(let i=0; i<60; i++) {
        const angle = (i * Math.PI / 30);
        ctx.beginPath();
        ctx.moveTo(cx + Math.cos(angle)*radius*0.88, cy + Math.sin(angle)*radius*0.88);
        ctx.lineTo(cx + Math.cos(angle)*radius*0.94, cy + Math.sin(angle)*radius*0.94);
        ctx.strokeStyle = numColor; ctx.lineWidth = (i % 5 === 0) ? 8 : 3; ctx.stroke();
    }
    
    const texture = new THREE.CanvasTexture(canvas);
    texture.anisotropy = renderer.capabilities.getMaxAnisotropy();
    return texture;
}

// --- 3. بناء جسم الساعة ---
const watchGroup = new THREE.Group();

// الإطار
const caseMat = new THREE.MeshStandardMaterial({ color: 0xd4af37, metalness: 0.9, roughness: 0.1 });
const watchCase = new THREE.Mesh(new THREE.CylinderGeometry(1.8, 1.8, 0.3, 64), caseMat);
watchCase.rotation.x = Math.PI / 2;
watchGroup.add(watchCase);

// الواجهة
const dialMat = new THREE.MeshStandardMaterial({ map: createDialTexture('#111111', '#d4af37', 'english'), metalness: 0.2, roughness: 0.8 });
const watchDial = new THREE.Mesh(new THREE.CylinderGeometry(1.7, 1.7, 0.32, 64), dialMat);
watchDial.rotation.x = Math.PI / 2;
watchGroup.add(watchDial);

// الزجاج
const watchGlass = new THREE.Mesh(
    new THREE.CylinderGeometry(1.75, 1.75, 0.05, 64), 
    new THREE.MeshPhysicalMaterial({ color: 0xffffff, transparent: true, opacity: 0.1, transmission: 0.9 })
);
watchGlass.rotation.x = Math.PI / 2;
watchGlass.position.z = 0.18;
watchGroup.add(watchGlass);

// العقارب
const hourPivot = new THREE.Group(), minutePivot = new THREE.Group(), secondPivot = new THREE.Group();
const handMat = new THREE.MeshStandardMaterial({ color: 0xffffff });

const hourHand = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.9, 0.02), handMat); hourHand.position.y = 0.45; hourPivot.add(hourHand);
const minuteHand = new THREE.Mesh(new THREE.BoxGeometry(0.07, 1.3, 0.02), handMat); minuteHand.position.y = 0.65; minutePivot.add(minuteHand);
const secondHand = new THREE.Mesh(new THREE.BoxGeometry(0.02, 1.5, 0.01), new THREE.MeshStandardMaterial({ color: 0xff0000 })); secondHand.position.y = 0.6; secondPivot.add(secondHand);

const handsGroup = new THREE.Group();
handsGroup.add(hourPivot, minutePivot, secondPivot);
handsGroup.position.z = 0.2;
watchGroup.add(handsGroup);

// --- 4. بناء الحزام (جلد / ستيل) ---
const strapGroup = new THREE.Group();
watchGroup.add(strapGroup);

let currentStrapMat;

function createStrap(type, color) {
    strapGroup.clear(); // مسح الحزام القديم عند التبديل
    
    if (type === 'leather') {
        // حزام جلد منحني
        currentStrapMat = new THREE.MeshStandardMaterial({ color: color, roughness: 0.8, metalness: 0.1 });
        
        const topCurve = new THREE.CatmullRomCurve3([
            new THREE.Vector3(0, 1.8, 0), new THREE.Vector3(0, 2.8, -0.2), new THREE.Vector3(0, 3.5, -0.8)
        ]);
        const botCurve = new THREE.CatmullRomCurve3([
            new THREE.Vector3(0, -1.8, 0), new THREE.Vector3(0, -2.8, -0.2), new THREE.Vector3(0, -3.5, -0.8)
        ]);

        const strapTop = new THREE.Mesh(new THREE.TubeGeometry(topCurve, 20, 0.7, 8, false), currentStrapMat);
        strapTop.scale.set(1, 1, 0.2);
        const strapBot = new THREE.Mesh(new THREE.TubeGeometry(botCurve, 20, 0.7, 8, false), currentStrapMat);
        strapBot.scale.set(1, 1, 0.2);
        
        strapGroup.add(strapTop, strapBot);

    } else {
        // حزام ستيل (حلقات)
        currentStrapMat = new THREE.MeshStandardMaterial({ color: color, roughness: 0.2, metalness: 0.9 });
        
        for(let i=0; i<4; i++) {
            const linkTop = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.6, 0.15), currentStrapMat);
            linkTop.position.set(0, 2 + (i*0.65), -i*0.1);
            linkTop.rotation.x = -i * 0.15;
            strapGroup.add(linkTop);

            const linkBot = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.6, 0.15), currentStrapMat);
            linkBot.position.set(0, -2 - (i*0.65), -i*0.1);
            linkBot.rotation.x = i * 0.15;
            strapGroup.add(linkBot);
        }
    }
}

// الحالة الافتراضية (جلد بني)
createStrap('leather', '#3e2723');

// تصفير الميلان لتكون مقابل الكاميرا تماماً (مثل المعروضات)
watchGroup.rotation.set(0, 0, 0); 
scene.add(watchGroup);

// --- 5. التحكم بالدوران (سحب) ---
let isDragging = false, prevX = 0, prevY = 0;
container.addEventListener('mousedown', (e) => { isDragging = true; });
container.addEventListener('mousemove', (e) => {
    if (isDragging) {
        watchGroup.rotation.y += (e.clientX - prevX) * 0.01;
        watchGroup.rotation.x += (e.clientY - prevY) * 0.01;
    }
    prevX = e.clientX; prevY = e.clientY;
});
container.addEventListener('mouseup', () => isDragging = false);
        
container.addEventListener('touchstart', (e) => { isDragging = true; prevX = e.touches[0].clientX; prevY = e.touches[0].clientY; });
container.addEventListener('touchmove', (e) => {
    if (isDragging) {
        watchGroup.rotation.y += (e.touches[0].clientX - prevX) * 0.01;
        watchGroup.rotation.x += (e.touches[0].clientY - prevY) * 0.01;
        prevX = e.touches[0].clientX; prevY = e.touches[0].clientY;
    }
});
container.addEventListener('touchend', () => isDragging = false);

// --- 6. ربط أزرار التحكم ---
document.getElementById('num-style').onchange = (e) => {
    dialMat.map = createDialTexture(document.getElementById('dial-color').value, document.getElementById('num-color').value, e.target.value);
    dialMat.needsUpdate = true;
};
document.getElementById('num-color').oninput = (e) => {
    dialMat.map = createDialTexture(document.getElementById('dial-color').value, e.target.value, document.getElementById('num-style').value);
    dialMat.needsUpdate = true;
};
document.getElementById('dial-color').oninput = (e) => {
    dialMat.map = createDialTexture(e.target.value, document.getElementById('num-color').value, document.getElementById('num-style').value);
    dialMat.needsUpdate = true;
};

document.getElementById('strap-type').onchange = (e) => {
    const isLeather = e.target.value === 'leather';
    document.getElementById('leather-options').style.display = isLeather ? 'flex' : 'none';
    document.getElementById('steel-options').style.display = isLeather ? 'none' : 'flex';
    
    if (isLeather) createStrap('leather', document.getElementById('strap-color').value);
    else createStrap('steel', document.getElementById('steel-color').value);
};
        
document.getElementById('strap-color').oninput = (e) => { if(currentStrapMat) currentStrapMat.color.set(e.target.value); };
document.getElementById('steel-color').oninput = (e) => { if(currentStrapMat) currentStrapMat.color.set(e.target.value); };

// --- 7. دورة الرسم والوقت ---
function animate() {
    requestAnimationFrame(animate);
    const now = new Date();
    
    // حساب حركة العقارب
    secondPivot.rotation.z = -(now.getSeconds() / 60) * Math.PI * 2;
    minutePivot.rotation.z = -((now.getMinutes() + now.getSeconds()/60) / 60) * Math.PI * 2;
    hourPivot.rotation.z = -((now.getHours() % 12 + now.getMinutes()/60) / 12) * Math.PI * 2;
            
    renderer.render(scene, camera);
}
animate();

// تحديث الحجم عند تصغير أو تكبير الشاشة
window.addEventListener('resize', () => {
    const width = container.clientWidth;
    const height = container.clientHeight;
    renderer.setSize(width, height);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
});