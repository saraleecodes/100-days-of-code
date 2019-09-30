const canvasSketch = require('canvas-sketch');
const createShader = require('canvas-sketch-util/shader');

// Ensure ThreeJS is in global scope for the 'examples/'
global.THREE = require('three');

// Include any additional ThreeJS examples below
require('three/examples/js/controls/OrbitControls');

// audio
let audio, analyser;
const fftSize = 2048;  // https://developer.mozilla.org/en-US/docs/Web/API/AnalyserNode/fftSize
const frequencyRange = {
    bass: [20, 400],
    lowMid: [400, 2600],
    mid: [2600, 5200],
    highMid: [5200, 14000],
    treble: [14000, 16000],
};

const settings = {
  // Make the loop animated
  animate: true,
  // Get a WebGL canvas rather than 2D
  context: 'webgl',
  // Turn on MSAA
  attributes: { antialias: true }
};

// Your glsl code
const frag = `
  precision highp float;

  uniform float time;
  varying vec2 vUv;

  void main () {
    float anim = sin(time) * 0.5 + 0.5;
    gl_FragColor = vec4(vec3(vUv.x * anim), 1.0);
  }
`;

const sketch = ({ context, gl }) => {
  // Create the shader and return it. It will be rendered by regl.
  return createShader({
    // Pass along WebGL context
    gl,
    // Specify fragment and/or vertex shader strings
    frag,
    // Specify additional uniforms to pass down to the shaders
    uniforms: {
      // Expose props from canvas-sketch
      time: ({ time }) => time
    }
  });
  // Create a renderer
  const renderer = new THREE.WebGLRenderer({
    context
  });
  
  // WebGL background color
  renderer.setClearColor('#000', 1);

  // Setup a camera
  const camera = new THREE.PerspectiveCamera(45, 1, 0.01, 100);
  camera.position.set(0, 19, 10);
  camera.lookAt(new THREE.Vector3());

  // Setup camera controller
  const controls = new THREE.OrbitControls(camera);

  // create an AudioListener and add it to the camera
  const audioListener = new THREE.AudioListener();
  const audio = new THREE.Audio( audioListener );

  // load a sound and set it as the Audio object's buffer
  const audioLoader = new THREE.AudioLoader();
  audioLoader.load( '100-days-of-code/src/assets/ilikethat.mp3', function( buffer ) {
	audio.setBuffer( buffer );
	audio.setLoop( false );
	audio.setVolume( 0.5 );
	audio.play();
  });

  // create an AudioAnalyser, passing in the sound and desired fftSize
  const analyser = new THREE.AudioAnalyser( audio, fftSize );
  
  const uniforms = {
	tAudioData: { 
	  value: new THREE.DataTexture( analyser.data, fftSize / 2, 1, THREE.LuminanceFormat ) }
    };

  // get the average frequency of the sound
  const data = analyser.getAverageFrequency();

  // Setup your scene
  const scene = new THREE.Scene();	

  const mesh = new THREE.Mesh(
    new THREE.TorusKnotGeometry(10, 3, 100, 16),
    new THREE.MeshPhysicalMaterial({
      color: 'white',
      roughness: 1,
      flatShading: false,
	  wireframe: true
    })
  );
  
  const mesh2 = new THREE.Mesh(
    new THREE.SphereGeometry(1, 32, 32),
    new THREE.MeshPhysicalMaterial({
      color: 'white',
      roughness: .75,
      flatShading: false
    })
  );
  
  scene.add( mesh, mesh2 );

  // Specify an ambient/unlit colour
  scene.add(new THREE.AmbientLight('#00e6e6'));

  // Add some light
  const light = new THREE.PointLight( 0xffffff, 1.5, 10 );
 
  const light2 = new THREE.HemisphereLight( 0xff00ff, 0x00ffff, 1);
 
  scene.add( light, light2 );
  
  // draw each frame
  return {
    // Handle resize events here
    resize ({ pixelRatio, viewportWidth, viewportHeight }) {
      renderer.setPixelRatio(pixelRatio);
      renderer.setSize(viewportWidth, viewportHeight);
      camera.aspect = viewportWidth / viewportHeight;
      camera.updateProjectionMatrix();
    },
    // Update & render your scene here
    render ({ time }) {
      mesh.rotation.x = time * (3 * Math.PI / 180);
	  mesh.rotation.y = time * (3 * Math.PI / 180);
  	  mesh.rotation.z = time * (3 * Math.PI / 180);
	  mesh2.rotation.x = time * (10 * Math.PI / 180);
	  mesh2.rotation.y = time * (10 * Math.PI / 180);
  	  mesh2.rotation.z = time * (10 * Math.PI / 180);
      controls.update();
	  analyser.getFrequencyData();
      uniforms.tAudioData.value.needsUpdate = true;
      renderer.render(scene, camera);
    },
	
    // Dispose of events & renderer for cleaner hot-reloading
    unload () {
      controls.dispose();
      renderer.dispose();
    }
  };
};

canvasSketch(sketch, settings);
