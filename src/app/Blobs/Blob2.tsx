"use client";

import { useRef } from "react";
import * as THREE from "three";
import { Canvas, useFrame } from "@react-three/fiber";
import Image from "../../../public/06.png";

const boilingShader = {
  vertexShader: `
    #define PI 3.14159265359


    uniform float amplitude;
    varying vec3 vNormal;
    varying vec2 vUv;
    varying float depth;
    uniform float time;
    uniform float u_pointsize;
    uniform float u_noise_amp_1;
    uniform float u_noise_freq_1;
    uniform float u_spd_modifier_1;
    uniform float u_noise_amp_2;
    uniform float u_noise_freq_2;
    uniform float u_spd_modifier_2;

    // 2D Random
    float random (in vec2 st) {
        return fract(sin(dot(st.xy,
                            vec2(12.9898,78.233)))
                    * 43758.5453123);
    }

    // 2D Noise based on Morgan McGuire @morgan3d
    // https://www.shadertoy.com/view/4dS3Wd
    float noise (in vec2 st) {
        vec2 i = floor(st);
        vec2 f = fract(st);
        vNormal = normal;
        vUv = uv;
        depth = position.z;
        // Four corners in 2D of a tile
        float a = random(i);
        float b = random(i + vec2(1.0, 0.0));
        float c = random(i + vec2(0.0, 1.0));
        float d = random(i + vec2(1.0, 1.0));

        // Smooth Interpolation

        // Cubic Hermine Curve.  Same as SmoothStep()
        vec2 u = f*f*(3.0-2.0*f);
        // u = smoothstep(0.,1.,f);

        // Mix 4 coorners percentages
        return mix(a, b, u.x) +
                (c - a)* u.y * (1.0 - u.x) +
                (d - b) * u.x * u.y;
    }

    mat2 rotate2d(float angle){
        return mat2(cos(angle),-sin(angle),
                  sin(angle),cos(angle));
    }

    void main() {
      gl_PointSize = u_pointsize;

      vec3 pos = position;
      // pos.xy is the original 2D dimension of the plane coordinates
      pos.z += noise(pos.xy * u_noise_freq_1 + time * u_spd_modifier_1) * u_noise_amp_1;
      // add noise layering
      // minus time makes the second layer of wave goes the other direction
      pos.z += noise(rotate2d(PI / 4.) * pos.yx * u_noise_freq_2 - time * u_spd_modifier_2 * 0.6) * u_noise_amp_2;

      vec4 mvm = modelViewMatrix * vec4(pos, 1.0);
      gl_Position = projectionMatrix * mvm;
    }
    `,
  fragmentShader: `
    uniform sampler2D blobTexture; // Texture uniform
    varying vec3 vNormal;
    varying vec2 vUv;
    varying float depth;

    void main() {
      // Sample the texture color using UV coordinates
      vec4 textureColor = texture2D(blobTexture, vUv);

      // Adjust the color based on depth and lighting as before
      float depthFactor = clamp(2.2 - depth, 0.0, 1.0);
      vec3 finalColor = textureColor.rgb * depthFactor;

      float lightIntensity = 0.1 + (0.9 * (1.0 + dot(normalize(vNormal), vec3(1, 0, 1))));
      finalColor *= lightIntensity;

      // Use the texture's alpha or a constant alpha value
      float alpha = textureColor.a; // or use a constant like 0.7

      gl_FragColor = vec4(finalColor, alpha);
    }
  `,

  uniforms: {
    time: { value: 0.0 },
    u_mouse: {
      value: {
        x: 0.0,
        y: 0.0,
      },
    },
    u_resolution: {
      value: {
        x: window.innerWidth * window.devicePixelRatio,
        y: window.innerHeight * window.devicePixelRatio,
      },
    },
    u_pointsize: { value: 2.0 },
    // wave 1
    u_noise_freq_1: { value: 3.0 },
    u_noise_amp_1: { value: 0.5 },
    u_spd_modifier_1: { value: 1.0 },
    // wave 2
    u_noise_freq_2: { value: 1.0 },
    u_noise_amp_2: { value: 0.3 },
    u_spd_modifier_2: { value: 1.9 },
    blobTexture: { value: new THREE.TextureLoader().load(Image.src) },
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
