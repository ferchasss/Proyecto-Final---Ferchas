import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js'
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js'
console.log(GLTFLoader);

/**
 * Base
 */
// Canvas
const canvas = document.querySelector('canvas.webgl')

// Scene
const scene = new THREE.Scene()

/**
 * Loading Manager (DEBE estar ANTES de los loaders)
 */
const loadingScreen = document.getElementById('loadingScreen');
const progressFill = document.getElementById('progressFill');
const loadingText = document.getElementById('loadingText');

const manager = new THREE.LoadingManager();

manager.onStart = function (url, itemsLoaded, itemsTotal) {
   console.log(`Iniciando carga de: ${url} (${itemsLoaded + 1}/${itemsTotal})`);
};

manager.onProgress = function (url, itemsLoaded, itemsTotal) {
   const progress = (itemsLoaded / itemsTotal) * 100;
   progressFill.style.width = progress + '%';
   loadingText.textContent = Math.round(progress) + '%';
   console.log(`Cargando: ${url} (${itemsLoaded}/${itemsTotal})`);
};

manager.onLoad = function () {
   console.log('✅ ¡Todas las texturas cargadas!');
   setTimeout(() => {
       loadingScreen.classList.add('hidden');
       // Iniciar animación de introducción después de ocultar loading
       setTimeout(() => {
           startIntroAnimation()
       }, 500);
   }, 500);
};

manager.onError = function (url) {
   console.error(`❌ Error al cargar: ${url}`);
};

/**
 * Lights
 */
const ambientLight = new THREE.AmbientLight(0xff9640, .4)
scene.add(ambientLight)

const directionalLight = new THREE.DirectionalLight(0xff9640, .8)
directionalLight.castShadow = true
directionalLight.shadow.mapSize.set(1024, 1024)
directionalLight.shadow.camera.far = 15
directionalLight.shadow.camera.left = - 7
directionalLight.shadow.camera.top = 7
directionalLight.shadow.camera.right = 7
directionalLight.shadow.camera.bottom = - 7
directionalLight.position.set(5, 5, 5)
scene.add(directionalLight)

// const frontLight = new THREE.PointLight("#cec6bfff", 10, 100);
// frontLight.position.set(-2, 3, 8);
// scene.add(frontLight);

const rimLight = new THREE.PointLight("#dcb494ff", 10, 100);
rimLight.position.set(-7, -3, -7);
scene.add(rimLight);

/**
 * Sizes
 */
const sizes = {
    width: window.innerWidth,
    height: window.innerHeight
}

window.addEventListener('resize', () =>
{
    sizes.width = window.innerWidth
    sizes.height = window.innerHeight
    camera.aspect = sizes.width / sizes.height
    camera.updateProjectionMatrix()
    renderer.setSize(sizes.width, sizes.height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    composer.setSize(sizes.width, sizes.height)
})

/**
 * Camera
 */
const camera = new THREE.PerspectiveCamera(75, sizes.width / sizes.height, 0.1, 100)
camera.position.set(9, 15, 5)  // Cambiar de (2, 2, 2) a la posición inicial de la animación
scene.add(camera)

const controls = new OrbitControls(camera, canvas)
controls.target.set(9, 8, 0.5)  // También ajusta el target inicial
controls.enableDamping = true
controls.maxDistance = 10

/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({
    canvas: canvas
})
renderer.shadowMap.enabled = true
renderer.shadowMap.type = THREE.PCFSoftShadowMap
renderer.setSize(sizes.width, sizes.height)
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
renderer.outputEncoding = THREE.sRGBEncoding
renderer.toneMapping = THREE.ReinhardToneMapping
renderer.toneMappingExposure = 1.0

// Composer para postprocessing (Bloom)
const composer = new EffectComposer(renderer)
const renderPass = new RenderPass(scene, camera)
composer.addPass(renderPass)

const bloomParams = {
    strength: 3,
    radius: 1.0,
    threshold: 0.50,
}
const bloomPass = new UnrealBloomPass(new THREE.Vector2(sizes.width, sizes.height), bloomParams.strength, bloomParams.radius, bloomParams.threshold)
composer.addPass(bloomPass)

/**
 * Loaders (CON manager asignado)
 */
const gltfLoader = new GLTFLoader(manager);
const loader = new THREE.TextureLoader(manager);
const cubeTexLoader = new THREE.CubeTextureLoader(manager);

// Cargar environment map
const envMap = cubeTexLoader.load([
   './assets/texturas/posx.jpg', './assets/texturas/negx.jpg',
   './assets/texturas/posy.jpg', './assets/texturas/negy.jpg',
   './assets/texturas/posz.jpg', './assets/texturas/negz.jpg'
]);
scene.background = envMap;

/**
 * Load Models
 */
gltfLoader.load('/models/Casa/casa_web.gltf',
    function (gltf)  {
       console.log('casa_web cargada');
       scene.add(gltf.scene);
       gltf.scene.position.x = 9;
       gltf.scene.position.z = .5;

       const spotLight = new THREE.SpotLight(0xffffff, 1.2, 12, Math.PI * 0.06, 0.0, 1);
       spotLight.position.set(gltf.scene.position.x, gltf.scene.position.y + 9, gltf.scene.position.z);
       spotLight.castShadow = true;
       spotLight.penumbra = 0.0;
       spotLight.shadow.mapSize.set(1024, 1024);
       spotLight.shadow.camera.near = 0.5;
       spotLight.shadow.camera.far = 60;

       spotLight.target.position.copy(gltf.scene.position);
       scene.add(spotLight);
       scene.add(spotLight.target);

       const spotHelper = new THREE.SpotLightHelper(spotLight);
       scene.add(spotHelper);

       window.__spotHelper = spotHelper;
       window.casaWebScene = gltf.scene;
       window.casaSpotLight = spotLight;

       // Spotlight adicional arriba de la casa (más intensa)
       const topSpotLight = new THREE.SpotLight(0xffffff, 3.0, 60, Math.PI * 0.04, 0.05, 1)
       topSpotLight.color.set(0xffffff) // blanco puro
       topSpotLight.position.set(gltf.scene.position.x, gltf.scene.position.y + 6, gltf.scene.position.z)
       topSpotLight.castShadow = true
       topSpotLight.shadow.mapSize.set(2048, 2048) // mejor calidad de sombras
       topSpotLight.shadow.camera.near = 0.5
       topSpotLight.shadow.camera.far = 80
       topSpotLight.penumbra = 0.05
       topSpotLight.target.position.copy(gltf.scene.position)
       scene.add(topSpotLight)
       scene.add(topSpotLight.target)

       // Helper para desarrollo
       const topSpotHelper = new THREE.SpotLightHelper(topSpotLight)
       scene.add(topSpotHelper)
       window.topSpotLight = topSpotLight
       window.topSpotHelper = topSpotHelper

       // Ajuste opcional para brillo global (si la luz sigue viéndose tenue)
       renderer.toneMappingExposure = 1.2

       // quitar/debug: no forzar intensidad alta ni esfera de debug aquí
       // si quieres verificar, aumenta temporalmente topSpotLight.intensity antes de desplegar

       // Asegurar que los meshes de la casa reciben sombras (si no lo hacen)
       gltf.scene.traverse((child) => {
         if (child.isMesh) {
           child.receiveShadow = true
           child.castShadow = true
         }
       })
    }
);

gltfLoader.load('/models/Casa/lampara.gltf',
    function (gltf)  {
       console.log('lampara cargada');
       gltf.scene.traverse((child) => {
           if (child.isMesh) {
               const lightColor = 0xecbf2d;
               if (Array.isArray(child.material)) {
                   child.material.forEach(m => {
                       if (m.color) m.color.set(lightColor);
                       if (m.emissive) m.emissive.set(0xecbf2d);
                       m.needsUpdate = true;
                   });
               } else if (child.material) {
                   if (child.material.color) child.material.color.set(lightColor);
                   if (child.material.emissive) child.material.emissive.set(0xecbf2d);
                   child.material.needsUpdate = true;
               } else {
                   child.material = new THREE.MeshStandardMaterial({ color: lightColor });
               }
               child.castShadow = true;
               child.receiveShadow = true;
           }
       });

       scene.add(gltf.scene);
       gltf.scene.position.x = 9;
       gltf.scene.position.z = .5;
       window.lampModel = gltf.scene;
       window.lampInitialY = gltf.scene.position.y;
    }
);

gltfLoader.load('/models/Casa/venatanas.gltf',
    function (gltf)  {
       console.log('ventanas cargadas');
       const glassMaterial = new THREE.MeshPhysicalMaterial({
           color: 0xffffff,
           metalness: 0,
           roughness: 0.05,
           transmission: 0.9,
           transparent: true,
           opacity: 1,
           ior: 1.45,
           thickness: 0.1,
           envMap: envMap,
           envMapIntensity: 1.0,
           reflectivity: 0.5,
           side: THREE.DoubleSide
       });

       gltf.scene.traverse((child) => {
           if (child.isMesh) {
               child.material = glassMaterial;
               child.castShadow = true;
               child.receiveShadow = true;
           }
       });

       scene.add(gltf.scene);
       gltf.scene.position.x = 9;
       gltf.scene.position.z = .5;
    }
);

//ventanas
gltfLoader.load('/models/Casa/camara.gltf',
    function (gltf)  {
       console.log('camaras cargada');
       scene.add(gltf.scene);
       gltf.scene.position.x = 9;
       gltf.scene.position.z = .5;

       // Aplicar material negro medio brillante a todos los meshes de la cámara
       // Conserva mapas si existen, pero fuerza un material estándar con algo de metalness/roughness
       const blackGlossMaterial = new THREE.MeshStandardMaterial({
           color: 0x111111,            // negro muy oscuro (ajusta si quieres más claro)
           metalness: 0.6,             // hace más reflejante
           roughness: 0.25,            // menos rugosidad = más brillo
           envMap: (typeof envMap !== 'undefined') ? envMap : null,
           envMapIntensity: 1.0,
           // side: THREE.FrontSide   // opcional
       });

       gltf.scene.traverse((child) => {
           if (child.isMesh) {
               // si el mesh tiene mapa de color y quieres preservarlo, descomenta estas líneas:
               // if (child.material && child.material.map) {
               //     blackGlossMaterial.map = child.material.map;
               // }

               child.material = blackGlossMaterial.clone(); // clone para evitar compartir estado entre meshes
               child.castShadow = true;
               child.receiveShadow = true;
               child.material.needsUpdate = true;
           }
       });

       // Exponer referencia para interacción por click
       window.camaraModel = gltf.scene;
    }
);

gltfLoader.load('/models/Casa/casa_fer.gltf',
    function (gltf)  {
       console.log('casa_fer cargada');
       scene.add(gltf.scene);
       gltf.scene.position.x = 9;
       gltf.scene.position.z = .5;
    }
);

gltfLoader.load('/models/Casa/aerosol 1.gltf',
    function (gltf)  {
       console.log('aerosol 1 cargada');
       scene.add(gltf.scene);
       gltf.scene.position.x = 9;
       gltf.scene.position.z = .5;
       window.aerosol1Model = gltf.scene;
       window.aerosol1InitialY = gltf.scene.position.y;
    }
);

gltfLoader.load('/models/Casa/aerosol 2.gltf',
    function (gltf)  {
       console.log('aerosol 2 cargada');
       scene.add(gltf.scene);
       gltf.scene.position.x = 9;
       gltf.scene.position.z = .5;
       window.aerosol2Model = gltf.scene;
       window.aerosol2InitialY = gltf.scene.position.y;
    }
);

gltfLoader.load('/models/Casa/album.gltf',
    function (gltf)  {
       console.log('album cargada');
       scene.add(gltf.scene);
       gltf.scene.position.x = 9;
       gltf.scene.position.z = .5;
       window.albumModel = gltf.scene;
       window.albumInitialY = gltf.scene.position.y;
    }
);

gltfLoader.load('/models/Casa/album 2.gltf',
    function (gltf)  {
       console.log('album 2 cargada');
       scene.add(gltf.scene);
       gltf.scene.position.x = 9;
       gltf.scene.position.z = .5;
       window.album2Model = gltf.scene;
       window.album2InitialY = gltf.scene.position.y;
    }
);

gltfLoader.load('/models/Casa/computadora.gltf',
    function (gltf)  {
       console.log('computadora cargada');
       scene.add(gltf.scene);
       gltf.scene.position.x = 9;
       gltf.scene.position.z = .5;
       
       // Calcular centro del bounding box para el zoom
       const box = new THREE.Box3().setFromObject(gltf.scene);
       const center = box.getCenter(new THREE.Vector3());
       
       // Guardar referencia global para interacción
       window.computadoraModel = gltf.scene;
       window.computadoraCenter = center;
    }
);

gltfLoader.load('/models/Casa/disco.gltf',
    function (gltf)  {
       console.log('disco cargada');
       scene.add(gltf.scene);
       gltf.scene.position.x = 9;
       gltf.scene.position.z = .5;
       window.discoModel = gltf.scene;
       window.discoInitialY = gltf.scene.position.y;
    }
);

gltfLoader.load('/models/Casa/libro.gltf',
    function (gltf)  {
       console.log('libro cargada');
       scene.add(gltf.scene);
       gltf.scene.position.x = 9;
       gltf.scene.position.z = .5;
       window.libroModel = gltf.scene;
       window.libroInitialY = gltf.scene.position.y;
    }
);

gltfLoader.load('/models/Casa/pincel solo.gltf',
    function (gltf)  {
       console.log('pincel solo cargada');
       scene.add(gltf.scene);
       gltf.scene.position.x = 9;
       gltf.scene.position.z = .5;
       window.pincelModel = gltf.scene;
       window.pincelInitialY = gltf.scene.position.y;
    }
);

gltfLoader.load('/models/Casa/plano.gltf',
    function (gltf)  {
       console.log('plano cargada');
       
       // Cargar la textura pantalla.jpg
       const pantallaTexture = loader.load('./assets/texturas/pantalla.jpg');
       pantallaTexture.encoding = THREE.sRGBEncoding;
       pantallaTexture.flipY = false; // ajusta si la textura aparece volteada
       
       // Crear material con la textura
       const pantallaMaterial = new THREE.MeshStandardMaterial({
           map: pantallaTexture,
           emissive: 0x222222,      // un poco de brillo propio
           emissiveMap: pantallaTexture,
           emissiveIntensity: 0.3,
           side: THREE.DoubleSide
       });
       
       // Aplicar textura a todos los meshes del plano
       gltf.scene.traverse((child) => {
           if (child.isMesh) {
               child.material = pantallaMaterial;
               child.castShadow = true;
               child.receiveShadow = true;
           }
       });
       
       scene.add(gltf.scene);
       gltf.scene.position.x = 9;
       gltf.scene.position.z = .5;
       
       window.planoModel = gltf.scene;
       window.planoInitialY = gltf.scene.position.y;
    }
);


/**
 * Audio Setup
 */
// Crear listener de audio (se adjunta a la cámara)
const listener = new THREE.AudioListener();
camera.add(listener);

// Crear fuente de audio
const sound = new THREE.Audio(listener);

// Cargar archivo de audio con debug completo
const audioLoader = new THREE.AudioLoader(manager);
audioLoader.load(
    './assets/audio/musica.mp3',
    // onLoad
    function(buffer) {
        console.log('✅ Audio buffer cargado:', buffer);
        sound.setBuffer(buffer);
        sound.setLoop(true);
        sound.setVolume(0.5); // subir volumen para prueba
        console.log('✅ Audio configurado - listo para reproducir');
    },
    // onProgress
    function(xhr) {
        console.log('🎵 Cargando audio:', (xhr.loaded / xhr.total * 100).toFixed(2) + '%');
    },
    // onError
    function(error) {
        console.error('❌ ERROR cargando audio:', error);
        console.error('❌ Verifica que existe: ./assets/audio/musica.mp3');
    }
);

// Función para iniciar música con debug
function playMusic() {
    console.log('🎵 playMusic() llamada');
    console.log('   sound.buffer existe:', !!sound.buffer);
    console.log('   sound.isPlaying:', sound.isPlaying);
    console.log('   listener conectado:', listener.context.state);
    
    if (sound.buffer && !sound.isPlaying) {
        try {
            sound.play();
            console.log('✅ Música REPRODUCIENDO');
        } catch(e) {
            console.error('❌ Error al reproducir:', e);
        }
    } else if (!sound.buffer) {
        console.warn('⚠️ Audio aún no está cargado');
    } else if (sound.isPlaying) {
        console.log('ℹ️ Música ya está sonando');
    }
}

// Fallback: reproducir con cualquier click
let musicAttempted = false;
canvas.addEventListener('click', () => {
    if (!musicAttempted && sound.buffer) {
        console.log('🖱️ Click detectado - intentando reproducir música');
        playMusic();
        musicAttempted = true;
    }
});

/**
 * Animate
 */
const clock = new THREE.Clock()
let previousTime = 0

const tick = () =>
{
    const elapsedTime = clock.getElapsedTime()
    const deltaTime = elapsedTime - previousTime
    previousTime = elapsedTime

    controls.update()

    const offset = camera.position.clone().sub(controls.target)
    const distance = offset.length()
    if (distance > 10) {
        offset.setLength(10)
        camera.position.copy(controls.target).add(offset)
    }

    if (camera.position.y < 2) {
        camera.position.y = 2
        if (controls.target.y < 2) controls.target.y = 2
        controls.update()
    }

    if (window.__spotHelper) window.__spotHelper.update()
    if (window.topSpotHelper) window.topSpotHelper.update()

    composer.render()
    window.requestAnimationFrame(tick)
}

tick()

// Agregar GSAP-loading y función para animar la cámara hacia la parte trasera de la casa
function loadGSAP(callback) {
    if (window.gsap) {
        callback()
        return
    }
    const s = document.createElement('script')
    s.src = 'https://cdn.jsdelivr.net/npm/gsap@3.12.2/dist/gsap.min.js'
    s.onload = () => callback()
    document.head.appendChild(s)
}

/**
 * Animación de introducción: cámara comienza arriba en el cielo, luego baja hacia la computadora
 */
function startIntroAnimation() {
    loadGSAP(() => {
        const gsapLib = window.gsap
        controls.enabled = false
        
        const startPos = new THREE.Vector3(9, 15, 5)
        const startTarget = new THREE.Vector3(9, 8, 0.5)
        const endPos = new THREE.Vector3(1, 4, -10)
        const endTarget = new THREE.Vector3(-1, 1, 2)
        
        camera.position.copy(startPos)
        camera.lookAt(startTarget)
        controls.target.copy(startTarget)
        
        setTimeout(() => {
            gsapLib.to(camera.position, {
                x: endPos.x,
                y: endPos.y,
                z: endPos.z,
                duration: 3,
                ease: 'power2.inOut',
                onUpdate: () => {
                    controls.target.lerp(endTarget, 0.05)
                    camera.lookAt(controls.target)
                    controls.update()
                },
                onComplete: () => {
                    controls.target.copy(endTarget)
                    controls.enabled = true
                    
                    // Reproducir música aquí si la añadiste
                    // playMusic();
                }
            })
        }, 1000)
    })
}

// Raycaster y mouse para interacción
const raycaster = new THREE.Raycaster()
const mouse = new THREE.Vector2()
let lampHovering = false
let lampFloatTimeline = null

// Estado para objetos flotantes
const floatStates = {
    aerosol1: { hovering: false, timeline: null },
    aerosol2: { hovering: false, timeline: null },
    album: { hovering: false, timeline: null },
    album2: { hovering: false, timeline: null },
    disco: { hovering: false, timeline: null },
    libro: { hovering: false, timeline: null },
    pincel: { hovering: false, timeline: null },
    vasoPinceles: { hovering: false, timeline: null }
}

function startFloatAnimation(objectName, model, initialY) {
    if (floatStates[objectName].hovering) return;
    
    floatStates[objectName].hovering = true;
    loadGSAP(() => {
        const gsapLib = window.gsap;
        const baseY = initialY !== undefined ? initialY : model.position.y;
        floatStates[objectName].timeline = gsapLib.timeline({ repeat: -1, yoyo: true });
        floatStates[objectName].timeline.to(model.position, { 
            y: baseY + 0.3, 
            duration: 0.6, 
            ease: 'sine.inOut' 
        });
    });
}

function stopFloatAnimation(objectName, model, initialY) {
    if (!floatStates[objectName].hovering) return;
    
    floatStates[objectName].hovering = false;
    if (floatStates[objectName].timeline) {
        loadGSAP(() => {
            const gsapLib = window.gsap;
            floatStates[objectName].timeline.kill();
            floatStates[objectName].timeline = null;
            const baseY = initialY !== undefined ? initialY : model.position.y;
            gsapLib.to(model.position, { 
                y: baseY, 
                duration: 0.4, 
                ease: 'sine.out' 
            });
        });
    }
}

function onMouseMove(event) {
    const rect = canvas.getBoundingClientRect()
    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
    mouse.y = - ((event.clientY - rect.top) / rect.height) * 2 + 1

    raycaster.setFromCamera(mouse, camera)

    // --- Lámpara (ya existente) ---
    if (window.lampModel) {
        const intersects = raycaster.intersectObject(window.lampModel, true)
        if (intersects.length > 0) {
            if (!lampHovering) {
                lampHovering = true
                loadGSAP(() => {
                    const gsapLib = window.gsap
                    const baseY = window.lampInitialY !== undefined ? window.lampInitialY : window.lampModel.position.y
                    lampFloatTimeline = gsapLib.timeline({ repeat: -1, yoyo: true })
                    lampFloatTimeline.to(window.lampModel.position, { y: baseY + 0.6, duration: 0.8, ease: 'sine.inOut' })

                    setTimeout(() => {
                        if (lampFloatTimeline) {
                            lampFloatTimeline.kill()
                            lampFloatTimeline = null
                        }
                        gsapLib.to(window.lampModel.position, { y: baseY, duration: 0.5, ease: 'sine.out' })
                        lampHovering = false
                    }, 5000)
                })
            }
        }
    }

    // --- Objetos flotantes (aerosol1, aerosol2, album, album2, disco, libro, pincel, vasoPinceles) ---
    const floatObjects = [
        { name: 'aerosol1', model: window.aerosol1Model, initialY: window.aerosol1InitialY },
        { name: 'aerosol2', model: window.aerosol2Model, initialY: window.aerosol2InitialY },
        { name: 'album', model: window.albumModel, initialY: window.albumInitialY },
        { name: 'album2', model: window.album2Model, initialY: window.album2InitialY },
        { name: 'disco', model: window.discoModel, initialY: window.discoInitialY },
        { name: 'libro', model: window.libroModel, initialY: window.libroInitialY },
        { name: 'pincel', model: window.pincelModel, initialY: window.pincelInitialY },
        { name: 'vasoPinceles', model: window.vasoPincelesModel, initialY: window.vasoPincelesInitialY }
    ];

    floatObjects.forEach(obj => {
        if (obj.model) {
            const intersects = raycaster.intersectObject(obj.model, true);
            if (intersects.length > 0) {
                startFloatAnimation(obj.name, obj.model, obj.initialY);
            } else {
                stopFloatAnimation(obj.name, obj.model, obj.initialY);
            }
        }
    });

    // Cámara: solo detectar hover para cambiar cursor (sin animación)
    if (window.camaraModel) {
        const camIntersects = raycaster.intersectObject(window.camaraModel, true)
        if (camIntersects.length > 0) {
            canvas.style.cursor = 'pointer'
        } else {
            canvas.style.cursor = 'default'
        }
    }
}

canvas.addEventListener('mousemove', onMouseMove)

// Añadir listener de click sobre el canvas
canvas.addEventListener('click', (event) => {
    const rect = canvas.getBoundingClientRect();
    const clickMouse = new THREE.Vector2(
        ((event.clientX - rect.left) / rect.width) * 2 - 1,
        -((event.clientY - rect.top) / rect.height) * 2 + 1
    );

    raycaster.setFromCamera(clickMouse, camera);

    // Click en cámara -> abrir Instagram
    if (window.camaraModel) {
        const intersects = raycaster.intersectObject(window.camaraModel, true);
        if (intersects.length > 0) {
            window.open('https://www.instagram.com/fer.martinezp_/', '_blank');
            return;
        }
    }

    // Click en plano (pantalla) -> abrir GitHub
    if (window.planoModel) {
        const planoIntersects = raycaster.intersectObject(window.planoModel, true);
        if (planoIntersects.length > 0) {
            window.open('https://github.com/ferchasss', '_blank');
            return;
        }
    }

    // Click en computadora -> zoom in
    if (window.computadoraModel) {
        const computerIntersects = raycaster.intersectObject(window.computadoraModel, true);
        if (computerIntersects.length > 0) {
            zoomToComputadora();
            return;
        }
    }

    // Click en cualquier otro lado -> regresar a posición 2
    if (isZoomedToComputadora) {  // CORREGIDO: cambió de isZoomedToComputer a isZoomedToComputadora
        returnToPosition2();
    }
});

// Estado para controlar el zoom a la computadora
let isZoomedToComputadora = false;
const position2 = { 
    pos: new THREE.Vector3(1, 4, -10), 
    target: new THREE.Vector3(-1, 1, 2) 
};

// Función para animar cámara hacia la computadora
function zoomToComputadora() {
    if (!window.computadoraModel || isZoomedToComputadora) return;
    
    isZoomedToComputadora = true;
    controls.enabled = false;
    
    loadGSAP(() => {
        const gsapLib = window.gsap;
        
        // Usar el centro calculado del bounding box
        const computerCenter = window.computadoraCenter || window.computadoraModel.position.clone();
        
        console.log('🎯 Haciendo zoom a:', computerCenter);
        
        // Posicionar cámara ATRÁS de la computadora (MÁS ABAJO)
        const zoomPos = new THREE.Vector3(
            computerCenter.x,        // mismo X
            computerCenter.y - 0.1,  // más abajo
            computerCenter.z - 1     // ATRÁS
        );
        
        // Apuntar a la PANTALLA (un poco más arriba del centro)
        const zoomTarget = new THREE.Vector3(
            computerCenter.x,
            computerCenter.y + 0.2,  // subir el target para centrar en la pantalla
            computerCenter.z
        );
        
        console.log('📷 Posición cámara:', zoomPos);
        console.log('👁️ Mirando a:', zoomTarget);
        
        gsapLib.to(camera.position, {
            x: zoomPos.x,
            y: zoomPos.y,
            z: zoomPos.z,
            duration: 1.5,
            ease: 'power2.inOut',
            onUpdate: () => {
                controls.target.lerp(zoomTarget, 0.1);
                camera.lookAt(controls.target);
                controls.update();
            },
            onComplete: () => {
                controls.target.copy(zoomTarget);
                controls.enabled = true;
            }
        });
    });
}

// Función para regresar a posición 2
function returnToPosition2() {
    if (!isZoomedToComputadora) return;
    
    isZoomedToComputadora = false;
    controls.enabled = false;
    
    loadGSAP(() => {
        const gsapLib = window.gsap;
        
        gsapLib.to(camera.position, {
            x: position2.pos.x,
            y: position2.pos.y,
            z: position2.pos.z,
            duration: 1.5,
            ease: 'power2.inOut',
            onUpdate: () => {
                controls.target.lerp(position2.target, 0.1);
                camera.lookAt(controls.target);
                controls.update();
            },
            onComplete: () => {
                controls.target.copy(position2.target);
                controls.enabled = true;
            }
        });
    });
}