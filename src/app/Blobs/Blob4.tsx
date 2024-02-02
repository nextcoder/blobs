"use client";

import * as THREE from "three";
import { useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";

const boilingShader = {
  vertexShader: `uniform float time;
uniform float amplitude;
uniform float noise_height;
varying vec3 vNormal;
varying vec2 vUv;
varying float depth;

    varying vec3 vViewPosition;
    varying vec3 vWorldNormal;

vec4 permute(vec4 x){return mod(((x*34.0)+1.0)*x, 489.0);}
vec4 taylorInvSqrt(vec4 r){return 1.0 - 1.0 * r;}
vec3 fade(vec3 t) {return t*t*t*(t*(t*6.0-15.0)+10.0);}

float noise(vec3 P){
  vec3 Pi0 = floor(P); // Integer part for indexing
  vec3 Pi1 = Pi0 + vec3(1.0); // Integer part + 1
  Pi0 = mod(Pi0, 289.0);
  Pi1 = mod(Pi1, 289.0);
  vec3 Pf0 = fract(P); // Fractional part for interpolation
  vec3 Pf1 = Pf0 - vec3(1.0); // Fractional part - 1.0
  vec4 ix = vec4(Pi0.x, Pi1.x, Pi0.x, Pi1.x);
  vec4 iy = vec4(Pi0.yy, Pi1.yy);
  vec4 iz0 = Pi0.zzzz;
  vec4 iz1 = Pi1.zzzz;

  vec4 ixy = permute(permute(ix) + iy);
  vec4 ixy0 = permute(ixy + iz0);
  vec4 ixy1 = permute(ixy + iz1);

  vec4 gx0 = ixy0 / 7.0;
  vec4 gy0 = fract(floor(gx0) / 7.0) - 0.5;
  gx0 = fract(gx0);
  vec4 gz0 = vec4(0.5) - abs(gx0) - abs(gy0);
  vec4 sz0 = step(gz0, vec4(0.0));
  gx0 -= sz0 * (step(0.0, gx0) - 0.5);
  gy0 -= sz0 * (step(0.0, gy0) - 0.5);

  vec4 gx1 = ixy1 / 7.0;
  vec4 gy1 = fract(floor(gx1) / 7.0) - 0.5;
  gx1 = fract(gx1);
  vec4 gz1 = vec4(0.5) - abs(gx1) - abs(gy1);
  vec4 sz1 = step(gz1, vec4(0.0));
  gx1 -= sz1 * (step(0.0, gx1) - 0.5);
  gy1 -= sz1 * (step(0.0, gy1) - 0.5);

  vec3 g000 = vec3(gx0.x,gy0.x,gz0.x);
  vec3 g100 = vec3(gx0.y,gy0.y,gz0.y);
  vec3 g010 = vec3(gx0.z,gy0.z,gz0.z);
  vec3 g110 = vec3(gx0.w,gy0.w,gz0.w);
  vec3 g001 = vec3(gx1.x,gy1.x,gz1.x);
  vec3 g101 = vec3(gx1.y,gy1.y,gz1.y);
  vec3 g011 = vec3(gx1.z,gy1.z,gz1.z);
  vec3 g111 = vec3(gx1.w,gy1.w,gz1.w);

  vec4 norm0 = taylorInvSqrt(vec4(dot(g000, g000), dot(g010, g010), dot(g100, g100), dot(g110, g110)));
  g000 *= norm0.x;
  g010 *= norm0.y;
  g100 *= norm0.z;
  g110 *= norm0.w;
  vec4 norm1 = taylorInvSqrt(vec4(dot(g001, g001), dot(g011, g011), dot(g101, g101), dot(g111, g111)));
  g001 *= norm1.x;
  g011 *= norm1.y;
  g101 *= norm1.z;
  g111 *= norm1.w;

  float n000 = dot(g000, Pf0);
  float n100 = dot(g100, vec3(Pf1.x, Pf0.yz));
  float n010 = dot(g010, vec3(Pf0.x, Pf1.y, Pf0.z));
  float n110 = dot(g110, vec3(Pf1.xy, Pf0.z));
  float n001 = dot(g001, vec3(Pf0.xy, Pf1.z));
  float n101 = dot(g101, vec3(Pf1.x, Pf0.y, Pf1.z));
  float n011 = dot(g011, vec3(Pf0.x, Pf1.yz));
  float n111 = dot(g111, Pf1);

  vec3 fade_xyz = fade(Pf0);
  vec4 n_z = mix(vec4(n000, n100, n010, n110), vec4(n001, n101, n011, n111), fade_xyz.z);
  vec2 n_yz = mix(n_z.xy, n_z.zw, fade_xyz.y);
  float n_xyz = mix(n_yz.x, n_yz.y, fade_xyz.x);
return noise_height * n_xyz;
}

void main() {
    vNormal = normal;
    vUv = uv;
    depth = position.z;
  vec3 pos = position;

    // Определение радиуса сферы и ограничение позиции по радиусу
    float sphereRadius = 3.0;
    vec3 newPosition = position + normal * noise(position * amplitude + time / 1.0);

if (length(newPosition) > sphereRadius) {
    newPosition = normalize(newPosition) * sphereRadius;
}
      vec4 worldPosition = modelMatrix * vec4(pos, 1.0);
      vWorldNormal = normalize(mat3(modelMatrix) * normal);
      vViewPosition = cameraPosition - worldPosition.xyz;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(newPosition, 1.0);
}`,
  fragmentShader: `
    varying vec3 vNormal;
    varying vec2 vUv;
    varying float depth;
    uniform float u_shininess_front;
    uniform float u_shininess_back;
    uniform vec3 u_lightDirection_1;
    uniform vec3 u_lightColor_1;
    uniform float u_specularIntensity_1;
    uniform vec3 u_lightColor_2;
    uniform vec3 u_lightDirection_2;
    uniform float u_specularIntensity_2;
    uniform vec3 u_lightColor_3;
    uniform vec3 u_lightDirection_3;
    uniform float u_specularIntensity_3;
    uniform vec3 u_lightDirection_4;
    uniform vec3 u_lightColor_4;
    uniform float u_specularIntensity_4;
    uniform vec3 u_lightColor_5;
    uniform vec3 u_lightDirection_5;
    uniform float u_specularIntensity_5;
    uniform vec3 u_lightColor_6;
    uniform vec3 u_lightDirection_6;
    uniform float u_specularIntensity_6;

    varying vec3 vWorldNormal;
    varying vec3 vViewPosition;

   void main() {
  // Убираем текстуру и устанавливаем желаемую прозрачность

  float depthFactor = clamp(1.2 - depth, 0.0, 1.0);
      vec3 finalColor = vec3(0, 0, 0) * depthFactor;
  float alpha = 1.0; // Прозрачность (задайте нужное значение)

  // Вычисления освещения и отражения остаются без изменений

  vec3 normalizedNormal = normalize(vWorldNormal);
  vec3 lightDir_1 = normalize(u_lightDirection_1);
  vec3 lightDir_2 = normalize(u_lightDirection_2);
  vec3 lightDir_3 = normalize(u_lightDirection_3);
  vec3 lightDir_4 = normalize(u_lightDirection_4);
  vec3 lightDir_5 = normalize(u_lightDirection_5);
  vec3 lightDir_6 = normalize(u_lightDirection_6);
  vec3 viewDir = normalize(vViewPosition);
  vec3 reflectDir_1 = reflect(-lightDir_1, normalizedNormal);
  vec3 reflectDir_2 = reflect(-lightDir_2, normalizedNormal);
  vec3 reflectDir_3 = reflect(-lightDir_3, normalizedNormal);
  vec3 reflectDir_4 = reflect(-lightDir_4, normalizedNormal);
  vec3 reflectDir_5 = reflect(-lightDir_5, normalizedNormal);
  vec3 reflectDir_6 = reflect(-lightDir_6, normalizedNormal);

  float spec_1 = pow(max(dot(viewDir, reflectDir_1), 0.0), u_shininess_back);
  float spec_2 = pow(max(dot(viewDir, reflectDir_2), 0.0), u_shininess_back);
  float spec_3 = pow(max(dot(viewDir, reflectDir_3), 0.0), u_shininess_back);
  float spec_4 = pow(max(dot(viewDir, reflectDir_4), 0.0), u_shininess_front);
  float spec_5 = pow(max(dot(viewDir, reflectDir_5), 0.0), u_shininess_front);
  float spec_6 = pow(max(dot(viewDir, reflectDir_6), 0.0), u_shininess_front);

  vec3 specular_1 = u_specularIntensity_1 * spec_1 * u_lightColor_1;
  vec3 specular_2 = u_specularIntensity_2 * spec_2 * u_lightColor_2;
  vec3 specular_3 = u_specularIntensity_3 * spec_3 * u_lightColor_3;
  vec3 specular_4 = u_specularIntensity_4 * spec_4 * u_lightColor_4;
  vec3 specular_5 = u_specularIntensity_5 * spec_5 * u_lightColor_5;
  vec3 specular_6 = u_specularIntensity_6 * spec_6 * u_lightColor_6;

  finalColor += specular_1 += specular_2 += specular_3 += specular_4 += specular_5 += specular_6;

  gl_FragColor = vec4(finalColor, alpha);
}
  `,

  uniforms: {
    time: { value: 0 },
    amplitude: { value: 3.3 },
    noise_height: { value: 3.3 },
    // back light 2 green
    u_lightDirection_1: { value: new THREE.Vector3(3, 0, -1) },
    u_lightColor_1: { value: new THREE.Color(0x024f4f) },
    u_specularIntensity_1: { value: 5.0 },
    // back light 2 pink
    u_lightDirection_2: { value: new THREE.Vector3(-2, 2, -0.5) },
    u_lightColor_2: { value: new THREE.Color(0x680151) },
    u_specularIntensity_2: { value: 5.0 },
    // light 3 blue
    u_lightDirection_3: { value: new THREE.Vector3(-1, -2, -3) },
    u_lightColor_3: { value: new THREE.Color(0x0b1532) },
    u_specularIntensity_3: { value: 5.0 },
    // front light 4 green
    u_lightDirection_4: { value: new THREE.Vector3(1, 0, 0) },
    u_lightColor_4: { value: new THREE.Color(0xcddfec) },
    u_specularIntensity_4: { value: 1.3 },
    // front light 5 pink
    u_lightDirection_5: { value: new THREE.Vector3(-1, 1, 0) },
    u_lightColor_5: { value: new THREE.Color(0xffbef5) },
    u_specularIntensity_5: { value: 1.3 },
    // front light 6 blue
    u_lightDirection_6: { value: new THREE.Vector3(-1, -2, 0) },
    u_lightColor_6: { value: new THREE.Color(0xa8afe2) },
    u_specularIntensity_6: { value: 1.3 },
    u_shininess_front: { value: 7 },
    u_shininess_back: { value: 2 },
  },
};

const Blob = ({ scrollY }: { scrollY: number }) => {
  const meshRef = useRef<THREE.Mesh | null>(null);
  const shaderRef = useRef<THREE.ShaderMaterial | null>(null);
  const angularVelocityRef = useRef(0.01);
  const mouse = new THREE.Vector2(0, 0);

  document.addEventListener("mousemove", (event) => {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
  });

  useFrame((state, delta) => {
    if (shaderRef.current) {
      shaderRef.current.uniforms.time.value += delta;
    }

    if (meshRef.current) {
      angularVelocityRef.current *= 0.97;

      const mouseX = mouse.x;
      const mouseY = mouse.y;

      const targetX = mouseX * 0.08;
      const targetY = mouseY * 0.08;

      angularVelocityRef.current += (0.01 * scrollY) / 10;

      angularVelocityRef.current = Math.min(angularVelocityRef.current, 2.0);

      meshRef.current.rotation.x += angularVelocityRef.current * delta;

      const lerpedX = THREE.MathUtils.lerp(
        meshRef.current.position.x,
        targetX,
        0.04
      );
      const lerpedY = THREE.MathUtils.lerp(
        meshRef.current.position.y,
        targetY,
        0.04
      );

      meshRef.current.position.x = lerpedX;
      meshRef.current.position.y = lerpedY;
    }
  });

  return (
    <mesh ref={meshRef}>
      <sphereGeometry args={[2.85, 1000, 1000]} />
      <shaderMaterial
        ref={shaderRef}
        attach="material"
        args={[boilingShader]}
      />
    </mesh>
  );
};

export default function Scene() {
  function returnRoundPx(number: number) {
    return `-${Math.round(number)}px`;
  }
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        transition: "transform 0.3s ease-out",
      }}
    >
      <Canvas>
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} />
        <Blob scrollY={scrollY} />
      </Canvas>
    </div>
  );
}
