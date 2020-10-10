import { registerGLTFLoader } from '../loaders/gltf-loader'
import registerOrbit from "./orbit"
import {registerRGBELoader} from '../libs/RGBELoader';

export function renderModel(canvas, THREE) {
  console.log(THREE.REVISION);
  registerGLTFLoader(THREE)
  var camera, scene, renderer, controls, pmremGenerator;
  init();
  animate();
  function init() {
    camera = new THREE.PerspectiveCamera(45, canvas.width / canvas.height, 0.25, 100);
    camera.position.set(0, 0, 1);
    camera.lookAt(new THREE.Vector3(0, 2, 0));
    scene = new THREE.Scene();
  
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(wx.getSystemInfoSync().pixelRatio);
    renderer.setSize(canvas.width, canvas.height);
    renderer.toneMappingExposure = 0.8;
    renderer.outputEncoding = THREE.sRGBEncoding;
    
    // model
    const path = ['https://weblf.s3.cn-north-1.amazonaws.com.cn/test0918/LV_M56471/LV_M56471.gltf'
      , 'https://weblf.s3.cn-north-1.amazonaws.com.cn/test0918/LV_M56471/LV_M56471.hdr'];
   loadModelAndTexture(path, THREE, ()=> {
    });

    const { OrbitControls } = registerOrbit(THREE)
    controls = new OrbitControls( camera, renderer.domElement );
    controls.rotateSpeed = 5;
    camera.position.set( 0, 0, 0.5 );
    controls.update();
  }

   function loadGLTF(fileName) {
    return new Promise((resolve, reject) => {
      var loader = new THREE.GLTFLoader();
      loader.load(fileName, (gltf) => {
        resolve(gltf.scene);
      }, undefined, function (e) {
        console.log('load gltf error', e);
        console.error(e);
      });
    });
  }

  function loadModelAndTexture(path, THREE, callback) {
    const model = path[0];
    const env_model = path[1];
    pmremGenerator = new THREE.PMREMGenerator(renderer);
    pmremGenerator.compileEquirectangularShader();
    loadHDRTexture(env_model, THREE).then((envMap) => {
      const sceneEnvMap = envMap;
      scene.environment = sceneEnvMap;
      return loadGLTF(model);
    }).then((bag) => {
      scene.add(bag);
    })
  }

  function loadHDRTexture(url, THREE) {
    console.log('start loadHDRTextrue!');
    const { RGBELoader } = registerRGBELoader(THREE);
    return new Promise((resolve, reject) => {
      new RGBELoader()
        .setDataType(THREE.UnsignedByteType)
        .load(url, (texture) => {
          const sceneEnvMap = pmremGenerator.fromEquirectangular(texture).texture;
          texture.dispose();
          pmremGenerator.dispose();
          resolve(sceneEnvMap);
        });
    });
  }
  function animate() {
    canvas.requestAnimationFrame(animate);
    controls.update()
    renderer.render(scene, camera);
  }
}