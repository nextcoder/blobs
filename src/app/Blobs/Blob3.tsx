"use client";

import { useRef } from "react";
import * as THREE from "three";
import { Canvas, useFrame } from "@react-three/fiber";

const boilingShader = {
  vertexShader: `
    uniform float time;
    uniform float amplitude;
    varying vec3 vNormal;
    varying vec2 vUv;
    varying float depth;

    float generateNoise(float x, float y, float z) {
      float noise = smoothstep(-3.0, 3.0, sin(x * 1.0 + time) * sin(y * 1.0 + time) * sin(z * 1.0 + time) * amplitude);
      return noise;
    }

    void main() {
      vNormal = normal;
      vUv = uv;
      depth = position.z;

      vec3 newPosition = position + normal * generateNoise(position.x, position.y, position.z);
      gl_Position = projectionMatrix * modelViewMatrix * vec4(newPosition, 1.0);
    }
  `,
  fragmentShader: `
    uniform vec3 color1;
    uniform vec3 color2;
    uniform vec3 color3;
    uniform vec3 color4;
    varying vec3 vNormal;
    varying vec2 vUv;
    varying float depth;

    void main() {
    vec3 horizontalGradient = mix(color1, color2, vUv.x);
    vec3 verticalGradient = mix(color3, color4, vUv.y);

    vec3 color = mix(horizontalGradient, verticalGradient, smoothstep(-0.2, 1.0, vUv.y));

    float depthFactor = clamp(2.6 - depth, 0.0, 1.0);
    vec3 finalColor = color * depthFactor;

    float lightIntensity = 0.1 + (0.9 * (1.0 + dot(normalize(vNormal), vec3(1, 0, 1))));
    finalColor *= lightIntensity;

    float alpha = 0.7;

    gl_FragColor = vec4(finalColor, alpha);
    }
  `,

  uniforms: {
    time: { value: 0 },
    amplitude: { value: 1.0 },
    color1: { value: new THREE.Color("#dd7cf4") },
    color2: { value: new THREE.Color("#99004d") },
    color3: { value: new THREE.Color("#0000ff") },
    color4: { value: new THREE.Color("#00b300") },
  },
};

const Blob = () => {
  const meshRef = useRef<THREE.Mesh | null>(null);
  const shaderRef = useRef<THREE.ShaderMaterial | null>(null);

  useFrame((state, delta) => {
    if (shaderRef.current) {
      shaderRef.current.uniforms.time.value += delta;
    }
  });

  return (
    <mesh ref={meshRef}>
      <sphereGeometry args={[2.2, 1000, 1000]} />
      <shaderMaterial
        ref={shaderRef}
        attach="material"
        args={[boilingShader]}
      />
    </mesh>
  );
};

export default function Scene() {
  return (
    <Canvas>
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} />
      <Blob />
    </Canvas>
  );
}
