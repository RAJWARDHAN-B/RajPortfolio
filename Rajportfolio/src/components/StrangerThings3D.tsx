import { useRef, useMemo, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Text, Float, Stars, MeshDistortMaterial } from "@react-three/drei";
import { motion, AnimatePresence } from "framer-motion";
import * as THREE from "three";
import { projectItems, type ContentItem } from "./ContentRow";
import { X, ChevronLeft, ChevronRight } from "lucide-react";

// Floating particles like Stranger Things ash/embers
const Particles = ({ count = 200 }: { count?: number }) => {
  const mesh = useRef<THREE.Points>(null);
  const positions = useMemo(() => {
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 30;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 20;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 15;
    }
    return pos;
  }, [count]);

  const colors = useMemo(() => {
    const cols = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const isRed = Math.random() > 0.6;
      cols[i * 3] = isRed ? 0.9 : 0.3;
      cols[i * 3 + 1] = isRed ? 0.1 : 0.1;
      cols[i * 3 + 2] = isRed ? 0.1 : 0.15;
    }
    return cols;
  }, [count]);

  useFrame((state) => {
    if (!mesh.current) return;
    mesh.current.rotation.y = state.clock.elapsedTime * 0.02;
    mesh.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.01) * 0.1;
  });

  return (
    <points ref={mesh}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={count} array={positions} itemSize={3} />
        <bufferAttribute attach="attributes-color" count={count} array={colors} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial size={0.05} vertexColors transparent opacity={0.8} sizeAttenuation />
    </points>
  );
};

// The Upside Down portal
const Portal = () => {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (!meshRef.current) return;
    meshRef.current.rotation.z = state.clock.elapsedTime * 0.3;
  });

  return (
    <mesh ref={meshRef} position={[0, 2.5, -5]}>
      <torusGeometry args={[1.5, 0.05, 16, 100]} />
      <meshStandardMaterial color="#e50914" emissive="#e50914" emissiveIntensity={2} />
    </mesh>
  );
};

// Floating 3D project card
const ProjectCard3D = ({
  item,
  position,
  onClick,
}: {
  item: ContentItem;
  position: [number, number, number];
  onClick: () => void;
}) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);

  useFrame((state) => {
    if (!meshRef.current) return;
    meshRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.5 + position[0]) * 0.1;
  });

  return (
    <Float speed={2} rotationIntensity={0.2} floatIntensity={0.5}>
      <group position={position}>
        <mesh
          ref={meshRef}
          onClick={onClick}
          onPointerEnter={() => setHovered(true)}
          onPointerLeave={() => setHovered(false)}
          scale={hovered ? 1.15 : 1}
        >
          <boxGeometry args={[2.2, 3, 0.1]} />
          <MeshDistortMaterial
            color={hovered ? "#e50914" : "#1a1a1a"}
            emissive={hovered ? "#e50914" : "#330000"}
            emissiveIntensity={hovered ? 0.5 : 0.15}
            roughness={0.3}
            metalness={0.8}
            distort={hovered ? 0.15 : 0.05}
            speed={2}
          />
        </mesh>
        <Text
          position={[0, -0.2, 0.1]}
          fontSize={0.18}
          color="white"
          maxWidth={1.8}
          textAlign="center"
          font="https://fonts.gstatic.com/s/bebasneue/v14/JTUSjIg69CK48gW7PXooxW5rygbi49c.woff2"
          anchorY="middle"
        >
          {item.title.toUpperCase()}
        </Text>
        <Text
          position={[0, -0.7, 0.1]}
          fontSize={0.1}
          color="#e50914"
          maxWidth={1.8}
          textAlign="center"
        >
          {item.match}
        </Text>
        <Text
          position={[0, -0.95, 0.1]}
          fontSize={0.08}
          color="#888888"
          maxWidth={1.8}
          textAlign="center"
        >
          {item.tags.slice(0, 3).join(" • ")}
        </Text>
      </group>
    </Float>
  );
};

// Title text
const StrangerTitle = () => {
  return (
    <Float speed={1} rotationIntensity={0.05} floatIntensity={0.3}>
      <Text
        position={[0, 4.5, -3]}
        fontSize={0.9}
        color="#e50914"
        font="https://fonts.gstatic.com/s/bebasneue/v14/JTUSjIg69CK48gW7PXooxW5rygbi49c.woff2"
        anchorY="middle"
        textAlign="center"
      >
        THE UPSIDE DOWN
      </Text>
      <Text
        position={[0, 3.7, -3]}
        fontSize={0.2}
        color="#666666"
        anchorY="middle"
        textAlign="center"
      >
        EXPLORE PROJECTS IN 3D
      </Text>
    </Float>
  );
};

const Scene = ({ onSelectProject }: { onSelectProject: (item: ContentItem) => void }) => {
  const positions: [number, number, number][] = [
    [-4, 0.5, -2],
    [-1.5, 1, -1],
    [1.5, 0.5, -2],
    [4, 1, -1],
    [-2.5, -2, -1.5],
    [2.5, -2, -1.5],
  ];

  return (
    <>
      <ambientLight intensity={0.15} />
      <pointLight position={[0, 5, 5]} intensity={1} color="#e50914" />
      <pointLight position={[-5, -3, 3]} intensity={0.5} color="#ff3333" />
      <pointLight position={[5, -3, 3]} intensity={0.5} color="#990000" />
      <spotLight position={[0, 10, 0]} angle={0.3} penumbra={1} intensity={0.8} color="#e50914" />

      <Stars radius={20} depth={50} count={1000} factor={3} saturation={0} fade speed={1} />
      <Particles count={300} />
      <Portal />
      <StrangerTitle />

      {projectItems.map((item, idx) => (
        <ProjectCard3D
          key={item.id}
          item={item}
          position={positions[idx % positions.length]}
          onClick={() => onSelectProject(item)}
        />
      ))}

      {/* Ground fog effect */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -4, 0]}>
        <planeGeometry args={[50, 50]} />
        <meshStandardMaterial color="#0a0000" transparent opacity={0.8} />
      </mesh>
    </>
  );
};

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

          <Canvas
            camera={{ position: [0, 1, 8], fov: 60 }}
            style={{ background: "#0a0000" }}
          >
            <Scene onSelectProject={setSelectedProject} />
          </Canvas>

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
