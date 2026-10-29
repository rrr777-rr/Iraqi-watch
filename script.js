// --- 1. إعداد المشهد والكاميرا والإضاءة ---
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(35, window.innerWidth / window.innerHeight, 0.1, 1000);
// نضع الكاميرا أمام الساعة مباشرة لتكون عدلة (الساعة 12 في الأعلى)
camera.position.set(0, 0, 12); 

const container = document.getElementById('canvas-container');
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setSize(container.clientWidth, container.clientHeight);
renderer.shadowMap.enabled = true;
// تفعيل خاصية الواقعية في الألوان
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.2;
renderer.outputEncoding = THREE.sRGBEncoding;
container.appendChild(renderer.domElement);

// إضاءة استوديو احترافية (3 أضواء)
const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
scene.add(ambientLight);

// ضوء رئيسي من فوق
const keyLight = new THREE.DirectionalLight(0xffffff, 1.5);
keyLight.position.set(5, 10, 7);
keyLight.castShadow = true;
scene.add(keyLight);

// ضوء ملون خافت من الجانب يعطي فخامة (ذهبي)
const fillLight = new THREE.PointLight(0xd4af37, 1, 20);
fillLight.position.set(-5, 0, 5);
scene.add(fillLight);

// ضوء خلفي لرسم حدود الحزام
const rimLight = new THREE.PointLight(0xffffff, 2, 15);
rimLight.position.set(0, 0, -5);
scene.add(rimLight);

// --- 2. دالة رسم الواجهة (Canvas) ---
function createDialTexture(bgColor, numColor, style) {
    const canvas = document.createElement('canvas');
    canvas.width = 1024; canvas.height = 1024;
    const ctx = canvas.getContext('2d');
    
    // خلفية الواجهة (تدرج لوني يعطي عمق)
    const gradient = ctx.createRadialGradient(512, 512, 100, 512, 512, 512);
    gradient.addColorStop(0, bgColor);
    gradient.addColorStop(1, '#000000'); // يغمق عند الأطراف
    ctx.fillStyle = gradient; 
    ctx.fillRect(0, 0, 1024, 1024);
    
    const cx = 512, cy = 512, radius = 512;
    const arabicNums = ['١٢','١','٢','٣','٤','٥','٦','٧','٨','٩','١٠','١١'];
    const romanNums = ['XII','I','II','III','IV','V','VI','VII','VIII','IX','X','XI'];
    
    // رسم الأرقام بخطوط فخمة
    for (let i = 0; i < 12; i++) {
        let text = (style === 'arabic') ? arabicNums[i] : (style === 'roman' ? romanNums[i] : (i === 0 ? '12' : i.toString()));
        // نضبط الزاوية بحيث تكون الساعة 12 في الأعلى تماماً (زاوية 0)
        const angle = (i * Math.PI / 6) - (Math.PI / 2);
        const x = cx + Math.cos(angle) * (radius * 0.75);
        const y = cy + Math.sin(angle) * (radius * 0.75);
        
        ctx.fillStyle = numColor;
        ctx.font = 'bold 100px "Times New Roman", serif'; // خط كلاسيكي فخم
        ctx.textAlign = 'center'; 
        ctx.textBaseline = 'middle';
        ctx.fillText(text, x, y);
    }
    
    // رسم خطوط الدقائق (Ticks) بشكل احترافي
    for(let i=0; i<60; i++) {
        const angle = (i * Math.PI / 30) - (Math.PI / 2);
        const innerR = radius * (i % 5 === 0 ? 0.85 : 0.9); // خطوط الساعات أطول
        const outerR = radius * 0.95;
        ctx.beginPath();
        ctx.moveTo(cx + Math.cos(angle)*innerR, cy + Math.sin(angle)*innerR);
        ctx.lineTo(cx + Math.cos(angle)*outerR, cy + Math.sin(angle)*outerR);
        ctx.strokeStyle = numColor; 
        ctx.lineWidth = (i % 5 === 0) ? 8 : 2; 
        ctx.stroke();
    }
    
    const texture = new THREE.CanvasTexture(canvas);
    texture.anisotropy = renderer.capabilities.getMaxAnisotropy();
    return texture;
}

// --- 3. دالة صناعة ملمس الجلد (Leather) ---
function createLeatherTexture(isGrainy) {
    const canvas = document.createElement('canvas');
    canvas.width = 512; canvas.height = 512;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, 512, 512);

    if (isGrainy) {
        for (let i = 0; i < 8000; i++) {
            const x = Math.random() * 512;
            const y = Math.random() * 512;
            const r = Math.random() * 1.5;
            ctx.fillStyle = `rgba(0,0,0,${Math.random() * 0.15})`;
            ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
        }
    }
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(4, 4);
    return texture;
}

// --- 4. بناء الساعة الفخمة ---
const watchGroup = new THREE.Group();

// أ) الإطار الخارجي (معدن فخم)
const caseMat = new THREE.MeshPhysicalMaterial({ 
    color: 0xd4af37, 
    metalness: 1.0, 
    roughness: 0.15, // لمعة عالية
    clearcoat: 1.0,
    clearcoatRoughness: 0.1
});
const watchCase = new THREE.Mesh(new THREE.CylinderGeometry(1.8, 1.8, 0.4, 64), caseMat);
// نجعل الإطار مسطحاً باتجاه الكاميرا (نقطة مهمة جداً)
watchCase.rotation.x = Math.PI / 2; 
watchGroup.add(watchCase);

// ب) الواجهة (Dial)
const dialMat = new THREE.MeshStandardMaterial({ 
    map: createDialTexture('#0a0a0a', '#d4af37', 'english'), 
    metalness: 0.5, 
    roughness: 0.5 
});
const watchDial = new THREE.Mesh(new THREE.CircleGeometry(1.7, 64), dialMat);
watchDial.position.z = 0.21; // نرفعها قليلاً لتكون داخل الإطار
watchGroup.add(watchDial);

// ج) الزجاج (Crystal Clear)
const watchGlass = new THREE.Mesh(
    new THREE.CylinderGeometry(1.75, 1.75, 0.1, 64), 
    new THREE.MeshPhysicalMaterial({ 
        color: 0xffffff, 
        transmission: 1.0, // شفافية كاملة
        opacity: 1, 
        metalness: 0, 
        roughness: 0, 
        ior: 1.5, // معامل انكسار الزجاج
        thickness: 0.5
    })
);
watchGlass.rotation.x = Math.PI / 2;
watchGlass.position.z = 0.25;
watchGroup.add(watchGlass);

// د) العقارب (تصميم انسيابي مدبب)
function createHand(width, length, color) {
    const shape = new THREE.Shape();
    shape.moveTo(-width/2, 0);
    shape.lineTo(width/2, 0);
    shape.lineTo(width/4, length * 0.8);
    shape.lineTo(0, length); // الرأس المدبب
    shape.lineTo(-width/4, length * 0.8);
    shape.lineTo(-width/2, 0);
    
    const geo = new THREE.ExtrudeGeometry(shape, { depth: 0.02, bevelEnabled: true, bevelThickness: 0.01, bevelSize: 0.01, bevelSegments: 3 });
    const mat = new THREE.MeshStandardMaterial({ color: color, metalness: 0.8, roughness: 0.2 });
    return new THREE.Mesh(geo, mat);
}

const hourPivot = new THREE.Group(), minutePivot = new THREE.Group(), secondPivot = new THREE.Group();

const hourHand = createHand(0.12, 0.9, 0xffffff); hourPivot.add(hourHand);
const minuteHand = createHand(0.08, 1.3, 0xffffff); minutePivot.add(minuteHand);
// عقرب الثواني رفيع وأحمر
const secondHand = new THREE.Mesh(new THREE.BoxGeometry(0.02, 1.4, 0.02), new THREE.MeshStandardMaterial({ color: 0xff0000 }));
secondHand.position.y = 0.6; secondPivot.add(secondHand);

// نقطة المنتصف
const centerPin = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.1, 32), caseMat);
centerPin.rotation.x = Math.PI / 2;
centerPin.position.z = 0.3;

const handsGroup = new THREE.Group();
handsGroup.add(hourPivot, minutePivot, secondPivot, centerPin);
handsGroup.position.z = 0.22; // فوق الواجهة
watchGroup.add(handsGroup);

// --- 5. بناء الحزام (انسيابي وفخم) ---
const strapGroup = new THREE.Group();
watchGroup.add(strapGroup);

let currentStrapMat;

function createStrap(type, color, shape = 'square', textureType = 'smooth') {
    strapGroup.clear();
    
    if (type === 'leather') {
        const leatherTex = createLeatherTexture(textureType === 'grain');
        
        currentStrapMat = new THREE.MeshPhysicalMaterial({ 
            color: color, 
            roughness: 0.8, 
            metalness: 0.1,
            bumpMap: textureType === 'grain' ? leatherTex : null,
            bumpScale: 0.02,
            clearcoat: 0.3 // لمعة خفيفة للجلد
        });
        
        // تصميم الجلد المنحني باستخدام TubeGeometry
        const curveTop = new THREE.CatmullRomCurve3([
            new THREE.Vector3(0, 1.8, 0), 
            new THREE.Vector3(0, 3, -0.5), 
            new THREE.Vector3(0, 4, -2)
        ]);
        const curveBot = new THREE.CatmullRomCurve3([
            new THREE.Vector3(0, -1.8, 0), 
            new THREE.Vector3(0, -3, -0.5), 
            new THREE.Vector3(0, -4, -2)
        ]);

        const strapTop = new THREE.Mesh(new THREE.TubeGeometry(curveTop, 32, 0.75, 8, false), currentStrapMat);
        strapTop.scale.set(1, 1, 0.15); // تسطيح الحزام
        const strapBot = new THREE.Mesh(new THREE.TubeGeometry(curveBot, 32, 0.75, 8, false), currentStrapMat);
        strapBot.scale.set(1, 1, 0.15);

        strapGroup.add(strapTop, strapBot);

    } else {
        // حزام ستيل (حلقات مترابطة بتناسق)
        currentStrapMat = new THREE.MeshPhysicalMaterial({ color: color, roughness: 0.1, metalness: 1.0, clearcoat: 1.0 });
        
        const segments = 6;
        for(let i=0; i<segments; i++) {
            let geo;
            if (shape === 'round') {
                geo = new THREE.TorusGeometry(0.6, 0.2, 16, 32);
            } else {
                geo = new THREE.BoxGeometry(1.4, 0.7, 0.2);
            }

            const topLink = new THREE.Mesh(geo, currentStrapMat);
            // ترتيب الحلقات بانحناء للخلف
            topLink.position.set(0, 1.8 + (i*0.6), -(i*i)*0.08);
            topLink.rotation.x = i * 0.15;
            if (shape === 'round') topLink.scale.set(1.2, 1, 1);
            strapGroup.add(topLink);

            const botLink = new THREE.Mesh(geo, currentStrapMat);
            botLink.position.set(0, -1.8 - (i*0.6), -(i*i)*0.08);
            botLink.rotation.x = -i * 0.15;
            if (shape === 'round') botLink.scale.set(1.2, 1, 1);
            strapGroup.add(botLink);
        }
    }
}

// الحالة الافتراضية (جلد بني غامق)
createStrap('leather', '#2b1a10');

// --- ⚠️ ضبط زاوية الساعة (تكون عدلة قدامك) ⚠️ ---
// لا نستخدم rotation.y لكي لا تميل لليسار. 
// نستخدم فقط ميلان بسيط جداً للأمام (X) لإعطاء إحساس 3D
watchGroup.rotation.x = 0.1; 

scene.add(watchGroup);

// --- 6. التحكم بالدوران (السحب) ---
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

// --- 7. ربط الأزرار ---
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
    document.querySelectorAll('.leather-options').forEach(el => el.style.display = isLeather ? 'flex' : 'none');
    document.querySelectorAll('.steel-options').forEach(el => el.style.display = isLeather ? 'none' : 'flex');
    
    if (isLeather) {
        createStrap('leather', document.getElementById('strap-color').value, 'square', document.getElementById('leather-texture').value);
    } else {
        createStrap('steel', document.getElementById('steel-color').value, document.getElementById('steel-shape').value);
    }
};

document.getElementById('strap-color').oninput = (e) => { if(currentStrapMat) currentStrapMat.color.set(e.target.value); };
document.getElementById('leather-texture').onchange = (e) => {
    createStrap('leather', document.getElementById('strap-color').value, 'square', e.target.value);
};

document.getElementById('steel-color').oninput = (e) => { if(currentStrapMat) currentStrapMat.color.set(e.target.value); };
document.getElementById('steel-shape').onchange = (e) => {
    createStrap('steel', document.getElementById('steel-color').value, e.target.value);
};

// --- 8. دورة الرسم والوقت ---
function animate() {
    requestAnimationFrame(animate);
    const now = new Date();
    // ضبط حركة العقارب بحيث 12 في الأعلى
    secondPivot.rotation.z = -(now.getSeconds() / 60) * Math.PI * 2;
    minutePivot.rotation.z = -((now.getMinutes() + now.getSeconds()/60) / 60) * Math.PI * 2;
    hourPivot.rotation.z = -((now.getHours() % 12 + now.getMinutes()/60) / 12) * Math.PI * 2;
            
    renderer.render(scene, camera);
}
animate();

window.addEventListener('resize', () => {
    const width = container.clientWidth;
    const height = container.clientHeight;
    renderer.setSize(width, height);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
});