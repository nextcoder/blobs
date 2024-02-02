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

    varying vec3 vViewPosition;
    varying vec3 vWorldNormal;

    float random (in vec2 st) {
        return fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43758.5453123);
    }

    float noise (in vec2 st) {
        vec2 i = floor(st);
        vec2 f = fract(st);
        vNormal = normal;
        vUv = uv;
        depth = position.z;

        float a = random(i);
        float b = random(i + vec2(1.0, 0.0));
        float c = random(i + vec2(0.0, 1.0));
        float d = random(i + vec2(1.0, 1.0));

        vec2 u = f*f*(3.0-2.0*f);

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

      pos.z += noise(pos.xy * u_noise_freq_1 + time * u_spd_modifier_1) * u_noise_amp_1;
      pos.z += noise(rotate2d(PI / 4.) * pos.yx * u_noise_freq_2 - time * u_spd_modifier_2 * 0.9) * u_noise_amp_2;

      float sphereRadius = 2.55;
      if (length(pos) > sphereRadius) {
        pos = normalize(pos) * sphereRadius;
      }

      vec4 mvm = modelViewMatrix * vec4(pos, 1.0);
      gl_Position = projectionMatrix * mvm;

      vec4 worldPosition = modelMatrix * vec4(pos, 1.0);
      vWorldNormal = normalize(mat3(modelMatrix) * normal);
      vViewPosition = cameraPosition - worldPosition.xyz;
    }
    `,
  fragmentShader: `
    uniform sampler2D blobTexture;
    varying vec3 vNormal;
    varying vec2 vUv;
    varying float depth;
    uniform float u_shininess;
    uniform vec3 u_lightDirection_1;
    uniform vec3 u_lightColor_1;
    uniform float u_specularIntensity_1;
    uniform vec3 u_lightColor_2;
    uniform vec3 u_lightDirection_2;
    uniform float u_specularIntensity_2;
    uniform vec3 u_lightColor_3;
    uniform vec3 u_lightDirection_3;
    uniform float u_specularIntensity_3;

    varying vec3 vWorldNormal;
    varying vec3 vViewPosition;

    void main() {
      vec4 textureColor = texture2D(blobTexture, vUv);

      float depthFactor = clamp(2.25 - depth, 0.0, 1.0);
      vec3 finalColor = textureColor.rgb * depthFactor;

      float lightIntensity = 0.1 + (0.9 * (1.0 + dot(normalize(vNormal), vec3(1, 0, 1))));
      finalColor *= lightIntensity;

      float alpha = textureColor.a; // or use a constant like 0.7


      vec3 normalizedNormal = normalize(vWorldNormal);
      vec3 lightDir_1 = normalize(u_lightDirection_1);
      vec3 lightDir_2 = normalize(u_lightDirection_2);
      vec3 lightDir_3 = normalize(u_lightDirection_3);
      vec3 viewDir = normalize(vViewPosition);
      vec3 reflectDir_1 = reflect(-lightDir_1, normalizedNormal);
      vec3 reflectDir_2 = reflect(-lightDir_2, normalizedNormal);
      vec3 reflectDir_3 = reflect(-lightDir_3, normalizedNormal);

      float spec_1 = pow(max(dot(viewDir, reflectDir_1), 0.0), u_shininess);
      float spec_2 = pow(max(dot(viewDir, reflectDir_2), 0.0), u_shininess);
      float spec_3 = pow(max(dot(viewDir, reflectDir_3), 0.0), u_shininess); // Fix: Calculate spec_3 correctly

      vec3 specular_1 = u_specularIntensity_1 * spec_1 * u_lightColor_1;
      vec3 specular_2 = u_specularIntensity_2 * spec_2 * u_lightColor_2;
      vec3 specular_3 = u_specularIntensity_3 * spec_3 * u_lightColor_3;

      finalColor += specular_1 += specular_2 += specular_3;

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
    u_noise_freq_1: { value: 2.5 },
    u_noise_amp_1: { value: 0.3 },
    u_spd_modifier_1: { value: 0.0 },
    // wave 2
    u_noise_freq_2: { value: 3.5 },
    u_noise_amp_2: { value: 0.6 },
    u_spd_modifier_2: { value: 1.7 },
    // wave 3
    blobTexture: { value: new THREE.TextureLoader().load(Image.src) },
    // light 1
    u_lightDirection_1: { value: new THREE.Vector3(1, 0, 0) },
    u_lightColor_1: { value: new THREE.Color(0xc9dbec) },
    u_specularIntensity_1: { value: 0.2 },
    // light 2
    u_lightDirection_2: { value: new THREE.Vector3(-1, 1, 0) },
    u_lightColor_2: { value: new THREE.Color(0xff87e8) },
    u_specularIntensity_2: { value: 0.2 },
    // light 3
    u_lightDirection_3: { value: new THREE.Vector3(-1, -1, 0) },
    u_lightColor_3: { value: new THREE.Color(0xaeb7e5) },
    u_specularIntensity_3: { value: 0.2 },
    u_shininess: { value: 20 },
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
      <sphereGeometry args={[2.55 - 0.3, 1000, 1000]} />
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
