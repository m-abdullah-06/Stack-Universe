import { StarShaderMaterial } from './StarShaderMaterial'

declare global {
  namespace JSX {
    interface IntrinsicElements {
      starShaderMaterial: any
      nebulaShaderMaterial: any
      asteroidMaterial: any
    }
  }
}
