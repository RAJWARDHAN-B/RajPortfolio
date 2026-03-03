import { useRef, useMemo, useState, useEffect, Suspense } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Text, Float, Stars, OrbitControls } from "@react-three/drei";
import { motion, AnimatePresence } from "framer-motion";
import * as THREE from "three";
import { projectItems, type ContentItem } from "./ContentRow";
import { X, ChevronRight } from "lucide-react";

// Floating particles
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

// Glowing portal ring
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

// Simple 3D project card using basic materials
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
      onClick={(e) => { e.stopPropagation(); onClick(); }}
      onPointerOver={(e) => { e.stopPropagation(); setHovered(true); document.body.style.cursor = "pointer"; }}
      onPointerOut={() => { setHovered(false); document.body.style.cursor = "auto"; }}
      scale={hovered ? 1.1 : 1}
    >
      {/* Card background */}
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

      {/* Card border glow */}
      <mesh position={[0, 0, -0.01]}>
        <boxGeometry args={[2.1, 2.9, 0.02]} />
        <meshBasicMaterial color={hovered ? "#ff3333" : "#330000"} />
      </mesh>

      {/* Title */}
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

      {/* Match badge */}
      <Text
        position={[0, -0.3, 0.06]}
        fontSize={0.11}
        color="#e50914"
        maxWidth={1.6}
        textAlign="center"
      >
        {item.match}
      </Text>

      {/* Tags */}
      <Text
        position={[0, -0.7, 0.06]}
        fontSize={0.08}
        color="#888888"
        maxWidth={1.6}
        textAlign="center"
      >
        {item.tags.slice(0, 3).join(" · ")}
      </Text>

      {/* Year */}
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

// Scene title
const SceneTitle = () => (
  <group position={[0, 4, -4]}>
    <Text
      fontSize={0.8}
      color="#e50914"
      anchorY="middle"
      textAlign="center"
    >
      THE UPSIDE DOWN
    </Text>
    <Text
      position={[0, -0.7, 0]}
      fontSize={0.18}
      color="#666666"
      anchorY="middle"
      textAlign="center"
    >
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

      {projectItems.slice(0, 6).map((item, idx) => (
        <ProjectCard3D
          key={item.id}
          item={item}
          index={idx}
          position={positions[idx]}
          onClick={() => onSelectProject(item)}
        />
      ))}

      {/* Ground plane */}
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

// Fallback component shown while 3D loads
const LoadingFallback = () => (
  <div className="absolute inset-0 flex items-center justify-center bg-[#0a0008]">
    <div className="text-center">
      <div className="w-12 h-12 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
      <p className="text-primary font-display text-lg tracking-widest">ENTERING THE UPSIDE DOWN...</p>
    </div>
  </div>
);

const StrangerThings3D = () => {
  const [active, setActive] = useState(false);
  const [selectedProject, setSelectedProject] = useState<ContentItem | null>(null);

  return (
    <section id="3d-mode" className="py-16 px-4 md:px-12">
      <h2 className="netflix-section-title text-foreground mb-4">Enter The Upside Down</h2>
      <p className="text-muted-foreground text-sm px-[4%] mb-6 max-w-xl">
        Experience my projects in an immersive 3D environment inspired by Stranger Things.
        Click the cards to explore each project.
      </p>

      {!active ? (
        <motion.div
          className="px-[4%]"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
        >
          <button
            onClick={() => setActive(true)}
            className="group relative overflow-hidden bg-card border border-primary/30 rounded-sm px-10 py-5 font-display text-2xl tracking-wider text-primary hover:bg-primary hover:text-primary-foreground transition-all duration-500"
          >
            <span className="relative z-10 flex items-center gap-3">
              ENTER 3D MODE
              <ChevronRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
            </span>
            <div className="absolute inset-0 bg-gradient-to-r from-primary/0 via-primary/5 to-primary/0 group-hover:via-primary/20 transition-all duration-500" />
          </button>
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "80vh" }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="relative rounded-sm overflow-hidden border border-primary/20"
        >
          {/* Exit button */}
          <button
            onClick={() => { setActive(false); setSelectedProject(null); }}
            className="absolute top-4 right-4 z-50 w-10 h-10 rounded-full bg-card/80 backdrop-blur-sm border border-border flex items-center justify-center hover:bg-primary transition-colors"
          >
            <X className="w-5 h-5 text-foreground" />
          </button>

          <Suspense fallback={<LoadingFallback />}>
            <Canvas
              camera={{ position: [0, 1, 8], fov: 55 }}
              style={{ background: "#0a0008" }}
              gl={{ antialias: true, powerPreference: "default", failIfMajorPerformanceCaveat: false }}
              dpr={[1, 1.5]}
              onCreated={({ gl }) => {
                gl.getContext().canvas.addEventListener("webglcontextlost", (e) => {
                  e.preventDefault();
                });
              }}
            >
              <Scene onSelectProject={setSelectedProject} />
            </Canvas>
          </Suspense>

          {/* Project detail overlay */}
          <AnimatePresence>
            {selectedProject && (
              <motion.div
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 50 }}
                className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-card via-card/95 to-transparent p-6 md:p-8"
              >
                <button
                  onClick={() => setSelectedProject(null)}
                  className="absolute top-4 right-4 text-muted-foreground hover:text-foreground"
                >
                  <X className="w-5 h-5" />
                </button>
                <p className="text-primary text-sm font-semibold mb-1">
                  {selectedProject.match} • {selectedProject.category}
                </p>
                <h3 className="font-display text-2xl md:text-4xl text-foreground mb-2">
                  {selectedProject.title.toUpperCase()}
                </h3>
                <p className="text-foreground/80 text-sm max-w-2xl leading-relaxed mb-3">
                  {selectedProject.longDescription}
                </p>
                <div className="flex flex-wrap gap-2">
                  {selectedProject.tags.map((tag) => (
                    <span key={tag} className="text-xs bg-primary/20 text-primary px-3 py-1 rounded-sm">
                      {tag}
                    </span>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </section>
  );
};

export default StrangerThings3D;
