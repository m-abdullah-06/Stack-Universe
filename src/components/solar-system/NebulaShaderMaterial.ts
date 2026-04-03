import * as THREE from 'three'
import { shaderMaterial } from '@react-three/drei'
import { extend } from '@react-three/fiber'

/**
 * NebulaShaderMaterial
 * Features:
 * - Soft edges (circular masking)
 * - Layered 2D/3D noise for gaseous texture
 * - Color shifting based on noise
 */
const NebulaShaderMaterial = shaderMaterial(
  {
    uTime: 0,
    uColor: new THREE.Color('#00e5ff'),
    uOpacity: 0.1,
  },
  // Vertex Shader
  `
    varying vec2 vUv;
    varying vec3 vPosition;

    void main() {
      vUv = uv;
      vPosition = position;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  // Fragment Shader
  `
    uniform float uTime;
    uniform vec3 uColor;
    uniform float uOpacity;

    varying vec2 vUv;
    varying vec3 vPosition;

    // Classic 2D Noise
    float random (vec2 st) {
        return fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43758.5453123);
    }

    float noise (vec2 st) {
        vec2 i = floor(st);
        vec2 f = fract(st);

        float a = random(i);
        float b = random(i + vec2(1.0, 0.0));
        float c = random(i + vec2(0.0, 1.0));
        float d = random(i + vec2(1.0, 1.0));

        vec2 u = f * f * (3.0 - 2.0 * f);

        return mix(a, b, u.x) +
                (c - a)* u.y * (1.0 - u.x) +
                (d - b) * u.x * u.y;
    }

    #define OCTAVES 4
    float fbm (vec2 st) {
        float value = 0.0;
        float amplitude = .5;
        float frequency = 0.;
        for (int i = 0; i < OCTAVES; i++) {
            value += amplitude * noise(st);
            st *= 2.;
            amplitude *= .5;
        }
        return value;
    }

    void main() {
      // Distance from center for soft edges
      float dist = distance(vUv, vec2(0.5));
      float strength = smoothstep(0.5, 0.2, dist);
      
      // Animated noise
      vec2 st = vUv * 3.0;
      float n = fbm(st + uTime * 0.05);
      float n2 = fbm(st * 2.0 - uTime * 0.08);
      
      float combinedNoise = n * n2;
      
      vec3 finalColor = uColor;
      
      // Add some subtle color variation
      finalColor += (n - 0.5) * 0.2;
      
      float alpha = strength * combinedNoise * uOpacity * 4.0;
      
      gl_FragColor = vec4(finalColor, alpha);
    }
  `
)


export { NebulaShaderMaterial }
