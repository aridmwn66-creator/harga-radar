// Native fallback for the web-only 3D hero. Rendering nothing keeps Expo Go
// free of any WebGL / three.js dependency. See Hero3D.web.tsx for the real one.
export function Hero3D(_props: { height?: number }) {
  return null;
}
