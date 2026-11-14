import { useMemo, useRef, useState, Suspense } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Stars, Text, useProgress } from "@react-three/drei";
import { motion } from "framer-motion";
import * as THREE from "three";
import { projectItems, type ContentItem } from "@/data/portfolio";

const Particles = ({ count = 50 }: { count?: number }) => {
  const mesh = useRef<THREE.Points>(null);
  const positions = useMemo(() => {
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 20;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 14;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 10;
    }
    return pos;
  }, [count]);

  useFrame((state) => {
    if (!mesh.current) return;
    mesh.current.rotation.y = state.clock.elapsedTime * 0.02;
  });

  return (
    <points ref={mesh}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={count} array={positions} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial size={0.06} color="#e50914" transparent opacity={0.6} sizeAttenuation />
    </points>
  );
};

const Portal = () => {
  const meshRef = useRef<THREE.Mesh>(null);
  useFrame((state) => {
    if (!meshRef.current) return;
    meshRef.current.rotation.z = state.clock.elapsedTime * 0.2;
  });

  return (
    <mesh ref={meshRef} position={[0, 2, -6]}>
      <torusGeometry args={[1.8, 0.04, 16, 64]} />
      <meshBasicMaterial color="#e50914" />
    </mesh>
  );
};

const ProjectCard3D = ({
  item,
  position,
  index,
  onClick,
}: {
  item: ContentItem;
  position: [number, number, number];
  index: number;
  onClick: () => void;
}) => {
  const groupRef = useRef<THREE.Group>(null);
  const [hovered, setHovered] = useState(false);

  useFrame((state) => {
    if (!groupRef.current) return;
    groupRef.current.position.y =
      position[1] + Math.sin(state.clock.elapsedTime * 0.8 + index * 1.2) * 0.15;
    groupRef.current.rotation.y =
      Math.sin(state.clock.elapsedTime * 0.3 + index) * 0.08;
  });

  return (
    <group
      ref={groupRef}
      position={position}
      onClick={(event) => {
        event.stopPropagation();
        onClick();
      }}
      onPointerOver={(event) => {
        event.stopPropagation();
        setHovered(true);
        document.body.style.cursor = "pointer";
      }}
      onPointerOut={() => {
        setHovered(false);
        document.body.style.cursor = "auto";
      }}
      scale={hovered ? 1.1 : 1}
    >
      <mesh>
        <boxGeometry args={[2, 2.8, 0.08]} />
        <meshStandardMaterial
          color={hovered ? "#e50914" : "#1a1a2e"}
          emissive={hovered ? "#e50914" : "#220000"}
          emissiveIntensity={hovered ? 0.6 : 0.2}
          roughness={0.4}
          metalness={0.7}
        />
      </mesh>

      <mesh position={[0, 0, -0.01]}>
        <boxGeometry args={[2.1, 2.9, 0.02]} />
        <meshBasicMaterial color={hovered ? "#ff3333" : "#330000"} />
      </mesh>

      <Text
        position={[0, 0.2, 0.06]}
        fontSize={0.16}
        color="white"
        maxWidth={1.6}
        textAlign="center"
        anchorY="middle"
      >
        {item.title.toUpperCase()}
      </Text>

      <Text
        position={[0, -0.3, 0.06]}
        fontSize={0.11}
        color="#e50914"
        maxWidth={1.6}
        textAlign="center"
      >
        {item.match}
      </Text>

      <Text
        position={[0, -0.7, 0.06]}
        fontSize={0.08}
        color="#888888"
        maxWidth={1.6}
        textAlign="center"
      >
        {item.tags.slice(0, 3).join(" · ")}
      </Text>

      <Text
        position={[0, -1.0, 0.06]}
        fontSize={0.09}
        color="#555555"
        maxWidth={1.6}
        textAlign="center"
      >
        {item.year}
      </Text>
    </group>
  );
};

const SceneTitle = () => (
  <group position={[0, 4, -4]}>
    <Text fontSize={0.8} color="#e50914" anchorY="middle" textAlign="center">
      THE UPSIDE DOWN
    </Text>
    <Text position={[0, -0.7, 0]} fontSize={0.18} color="#666666" anchorY="middle" textAlign="center">
      CLICK A CARD TO EXPLORE
    </Text>
  </group>
);

const Scene = ({ onSelectProject }: { onSelectProject: (item: ContentItem) => void }) => {
  const positions: [number, number, number][] = [
    [-3.5, 0.5, 0],
    [-1.2, 1.2, -1],
    [1.2, 0.5, 0],
    [3.5, 1.2, -1],
    [-2.2, -2, -0.5],
    [2.2, -2, -0.5],
  ];

  return (
    <>
      <ambientLight intensity={0.3} />
      <pointLight position={[0, 5, 5]} intensity={1.5} color="#e50914" />
      <pointLight position={[-5, -3, 3]} intensity={0.8} color="#ff4444" />
      <pointLight position={[5, -3, 3]} intensity={0.8} color="#cc0000" />
      <directionalLight position={[0, 3, 5]} intensity={0.4} color="#ffffff" />

      <Stars radius={15} depth={20} count={200} factor={2} saturation={0} fade speed={0.5} />
      <Particles count={50} />
      <Portal />
      <SceneTitle />

      {projectItems.slice(0, 6).map((item, index) => (
        <ProjectCard3D
          key={item.id}
          item={item}
          index={index}
          position={positions[index]}
          onClick={() => onSelectProject(item)}
        />
      ))}

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -4, 0]}>
        <planeGeometry args={[40, 40]} />
        <meshBasicMaterial color="#080008" />
      </mesh>

      <OrbitControls
        enableZoom={false}
        enablePan={false}
        maxPolarAngle={Math.PI / 1.8}
        minPolarAngle={Math.PI / 4}
        autoRotate
        autoRotateSpeed={0.3}
      />
    </>
  );
};

const LoadingFallback = () => {
  const { progress } = useProgress();
  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-[#0a0008]">
      <div className="w-64 text-center">
        <div className="mb-4 h-1 w-full overflow-hidden rounded-full bg-primary/20">
          <motion.div
            className="h-full bg-primary"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
        <p className="animate-pulse font-display text-lg tracking-widest text-primary">
          {progress < 100 ? `LOADING... ${Math.round(progress)}%` : "ENTERING THE UPSIDE DOWN..."}
        </p>
      </div>
    </div>
  );
};

const StrangerThingsScene = ({
  onSelectProject,
}: {
  onSelectProject: (item: ContentItem) => void;
}) => (
  <Suspense fallback={<LoadingFallback />}>
    <Canvas
      camera={{ position: [0, 1, 8], fov: 55 }}
      style={{ background: "#0a0008" }}
      gl={{ antialias: true, powerPreference: "default", failIfMajorPerformanceCaveat: false }}
      dpr={[1, 1.5]}
      onCreated={({ gl }) => {
        gl.getContext().canvas.addEventListener("webglcontextlost", (event) => {
          event.preventDefault();
        });
      }}
    >
      <Scene onSelectProject={onSelectProject} />
    </Canvas>
  </Suspense>
);

export default StrangerThingsScene;
