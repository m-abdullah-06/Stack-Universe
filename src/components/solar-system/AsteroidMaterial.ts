import * as THREE from 'three'
import { shaderMaterial } from '@react-three/drei'
import { extend } from '@react-three/fiber'

/**
 * AsteroidMaterial
 * Animates particles in a circular orbit entirely on the GPU.
 */
const AsteroidMaterial = shaderMaterial(
  {
    uTime: 0,
    uSize: 0.12,
    uOpacity: 0.75,
  },
  // Vertex Shader
  `
    uniform float uTime;
    uniform float uSize;
    
    attribute float aRadius;
    attribute float aSpeed;
    attribute float aOffset;
    attribute float aY;
    
    attribute vec3 color;
    varying vec3 vColor;

    void main() {
      vColor = color;
      
      // Calculate position based on orbit
      float angle = aOffset + uTime * aSpeed;
      vec3 pos = vec3(cos(angle) * aRadius, aY, sin(angle) * aRadius);
      
      vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
      gl_PointSize = uSize * (300.0 / -mvPosition.z);
      gl_Position = projectionMatrix * mvPosition;
    }
  `,
  // Fragment Shader
  `
    uniform float uOpacity;
    varying vec3 vColor;

    void main() {
      // Basic circle shape
      float dist = distance(gl_PointCoord, vec2(0.5));
      if (dist > 0.5) discard;
      
      gl_FragColor = vec4(vColor, uOpacity);
    }
  `
)


export { AsteroidMaterial }
