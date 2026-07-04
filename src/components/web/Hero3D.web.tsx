import { useEffect, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import { useReducedMotion } from 'react-native-reanimated';
import * as THREE from 'three';
import { colors } from '@/theme';

// Web-only 3D hero backdrop (three.js). A slow, low-poly wireframe pair (acid
// lime + electric cyan) drifting inside a faint particle field, matching the
// futuristic-terminal theme. Tasteful and quiet: it sits behind the hero content
// and never competes with it. Performance-guarded: capped pixel ratio, paused
// when the tab is hidden, and rendered as a single static frame when the user
// prefers reduced motion. Fails silently (leaving the themed CSS background) if
// WebGL is unavailable, and disposes all GPU resources on unmount.

type Hero3DProps = { height?: number };

const fadeStyle = {
  position: 'absolute' as const,
  left: 0,
  right: 0,
  bottom: 0,
  height: '60%',
  background: `linear-gradient(to bottom, rgba(10,11,13,0) 0%, ${colors.background} 96%)`,
  pointerEvents: 'none' as const,
};

const canvasStyle = {
  width: '100%',
  height: '100%',
  display: 'block' as const,
};

export function Hero3D({ height = 300 }: Hero3DProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const reduced = useReducedMotion();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
    } catch {
      return; // No WebGL: the themed CSS/grid background stays as-is.
    }

    const parent = canvas.parentElement;
    const sizeOf = (): [number, number] => {
      const w = parent && parent.clientWidth ? parent.clientWidth : canvas.clientWidth || 320;
      const h = parent && parent.clientHeight ? parent.clientHeight : height;
      return [w, h];
    };

    let [w, h] = sizeOf();
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
    renderer.setSize(w, h, false);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(50, w / h, 0.1, 100);
    camera.position.z = 4.4;

    const lime = new THREE.Color(colors.up);
    const cyan = new THREE.Color(colors.cyan);

    const group = new THREE.Group();
    // Sit a little high so the densest wireframe reads behind the brand/search,
    // leaving the content below it clean.
    group.position.y = 0.55;
    scene.add(group);

    const outerGeo = new THREE.IcosahedronGeometry(1.35, 1);
    const outerWire = new THREE.WireframeGeometry(outerGeo);
    const outerMat = new THREE.LineBasicMaterial({ color: lime, transparent: true, opacity: 0.4 });
    const outer = new THREE.LineSegments(outerWire, outerMat);
    group.add(outer);

    const innerGeo = new THREE.IcosahedronGeometry(0.8, 0);
    const innerWire = new THREE.WireframeGeometry(innerGeo);
    const innerMat = new THREE.LineBasicMaterial({ color: cyan, transparent: true, opacity: 0.3 });
    const inner = new THREE.LineSegments(innerWire, innerMat);
    group.add(inner);

    const COUNT = 340;
    const positions = new Float32Array(COUNT * 3);
    for (let i = 0; i < COUNT; i += 1) {
      positions[i * 3] = (Math.random() - 0.5) * 11;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 6.5;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 6 - 1;
    }
    const pointsGeo = new THREE.BufferGeometry();
    pointsGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const pointsMat = new THREE.PointsMaterial({
      color: cyan,
      size: 0.02,
      transparent: true,
      opacity: 0.55,
    });
    const points = new THREE.Points(pointsGeo, pointsMat);
    scene.add(points);

    const render = () => renderer.render(scene, camera);

    let raf = 0;
    let running = false;
    const loop = () => {
      if (!running) return;
      group.rotation.y += 0.0016;
      group.rotation.x += 0.0007;
      inner.rotation.y -= 0.003;
      points.rotation.y += 0.0004;
      render();
      raf = window.requestAnimationFrame(loop);
    };
    const start = () => {
      if (running) return;
      running = true;
      raf = window.requestAnimationFrame(loop);
    };
    const stop = () => {
      running = false;
      window.cancelAnimationFrame(raf);
    };

    const onResize = () => {
      [w, h] = sizeOf();
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h, false);
      render();
    };
    const onVisibility = () => {
      if (document.hidden) stop();
      else if (!reduced) start();
    };

    window.addEventListener('resize', onResize);
    document.addEventListener('visibilitychange', onVisibility);

    if (reduced) {
      // A single, composed static frame. No animation loop.
      group.rotation.set(0.32, 0.6, 0);
      render();
    } else {
      start();
    }

    return () => {
      stop();
      window.removeEventListener('resize', onResize);
      document.removeEventListener('visibilitychange', onVisibility);
      outerGeo.dispose();
      outerWire.dispose();
      outerMat.dispose();
      innerGeo.dispose();
      innerWire.dispose();
      innerMat.dispose();
      pointsGeo.dispose();
      pointsMat.dispose();
      renderer.dispose();
    };
  }, [reduced, height]);

  return (
    <View pointerEvents="none" style={[styles.container, { height }]}>
      <canvas ref={canvasRef} style={canvasStyle} />
      <div style={fadeStyle} aria-hidden />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    overflow: 'hidden',
  },
});
