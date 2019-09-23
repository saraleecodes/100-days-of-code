const canvasSketch = require('canvas-sketch');

// Ensure ThreeJS is in global scope for the 'examples/'
global.THREE = require('three');

// Include any additional ThreeJS examples below
require('three/examples/js/controls/OrbitControls');

const settings = {
  // Make the loop animated
  animate: true,
  // Get a WebGL canvas rather than 2D
  context: 'webgl',
  // Turn on MSAA
  attributes: { antialias: true }
};

const sketch = ({ context }) => {
  // Create a renderer
  const renderer = new THREE.WebGLRenderer({
    context
  });

  // WebGL background color
  renderer.setClearColor('#000', 1);

  // Setup a camera
  const camera = new THREE.PerspectiveCamera(45, 1, 0.01, 100);
  camera.position.set(0, 0, 5);
  camera.lookAt(new THREE.Vector3());

  // Setup camera controller
  const controls = new THREE.OrbitControls(camera);

  // create an AudioListener and add it to the camera
  const listener = new THREE.AudioListener();
  camera.add( listener );

  // create an Audio source
  const sound = new THREE.Audio( listener );

  // load a sound and set it as the Audio object's buffer
  const audioLoader = new THREE.AudioLoader();
  audioLoader.load( '../sketches/sounds/DirtyComputer.mp3', function( buffer ) {
	sound.setBuffer( buffer );
	sound.setLoop(false);
	sound.setVolume(0.5);
	sound.play();
  });
  
  // create an AudioAnalyser, passing in the sound and desired fftSize
  const fftSize = 128;
  const analyser = new THREE.AudioAnalyser( sound, fftSize );

  // get the average frequency of the sound
  const data = analyser.getAverageFrequency();

  //
  const uniforms = {

		tAudioData: { value: new THREE.DataTexture( data, fftSize / 2, 1, THREE.LuminanceFormat ) }
  
  };
  
  //shader material
  const material = new THREE.ShaderMaterial( {

	uniforms: uniforms,
	vertexShader: vertexShader.textContent,
	fragmentShader: fragmentShader.textContent

   } );

  // Setup your scene
  const scene = new THREE.Scene();

  
  const geometry = new THREE.PlaneBufferGeometry(1, 1);
  
  const mesh = new THREE.Mesh( geometry, material );
  
  scene.add( mesh );

  
  // Specify an ambient/unlit colour
  scene.add(new THREE.AmbientLight('#59314f'));

  // Add some light
  const light = new THREE.PointLight('#45caf7', 1, 15.5);
  light.position.set(2, 2, -4).multiplyScalar(1.5);
  scene.add(light);

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
    render () {
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
