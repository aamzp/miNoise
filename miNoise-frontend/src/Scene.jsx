import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Html, Sphere } from "@react-three/drei";
import { useState, useRef } from "react";
import { ScreenQuad } from "@react-three/drei";

import "./styles.css";

// Shader Dither
const DitherShader = {
  uniforms: { time: { value: 0 } },
  vertexShader: `
    varying vec2 vUv;
    void main() {
      vUv = position.xy * 0.5 + 0.5;
      gl_Position = vec4(position.xy, 0.0, 1.0);
    }
  `,
  fragmentShader: `
    uniform float time;
    varying vec2 vUv;

    float bayer4(vec2 p) {
      vec2 pos = mod(p, 4.0);
      if (pos.x < 2.0) {
        if (pos.y < 2.0) return (pos.x + pos.y*2.0) / 16.0;
        else return (pos.x + (pos.y-2.0)*2.0 + 8.0) / 16.0;
      } else {
        if (pos.y < 2.0) return ((pos.x-2.0) + pos.y*2.0 + 4.0) / 16.0;
        else return ((pos.x-2.0) + (pos.y-2.0)*2.0 + 12.0) / 16.0;
      }
    }

    void main() {
      float gradient = 0.3 + 0.7 * vUv.y + 0.2 * sin(time * 0.5);
      float threshold = bayer4(gl_FragCoord.xy);
      float d = gradient + (threshold - 0.5) / 12.0;

      gl_FragColor = vec4(vec3(clamp(d, 0.0, 1.0)), 1.0);
    }
  `
};

function BackgroundDither() {
  const ref = useRef();
  useFrame((state) => {
    if (ref.current) ref.current.uniforms.time.value = state.clock.getElapsedTime();
  });

  return (
    <ScreenQuad>
      <shaderMaterial
        ref={ref}
        uniforms={DitherShader.uniforms}
        vertexShader={DitherShader.vertexShader}
        fragmentShader={DitherShader.fragmentShader}
        depthWrite={false}
        depthTest={false}
      />
    </ScreenQuad>
  );
}

export default function Scene({ songs }) {
  const [selectedSong, setSelectedSong] = useState(null);

  // Calcular centroide
  const center = songs.length > 0
    ? [
        songs.reduce((sum, s) => sum + s.PC1, 0) / songs.length,
        songs.reduce((sum, s) => sum + s.PC2, 0) / songs.length,
        songs.reduce((sum, s) => sum + s.PC3, 0) / songs.length,
      ]
    : [0, 0, 0];

  return (
    <div style={{ width: "100vw", height: "100vh" }}>
      <Canvas
        camera={{ position: [0, 0, 5] }}
        onPointerMissed={() => setSelectedSong(null)}
      >
        <ambientLight />
        <pointLight position={[10, 10, 10]} />

        {/* Fondo dithering */}
        <BackgroundDither />

        <OrbitControls
          enableZoom={true}
          autoRotate={selectedSong === null}
          autoRotateSpeed={1.0}
          target={center}
        />

        {songs.map((song, i) => (
          <group
            key={i}
            position={[song.PC1, song.PC2, song.PC3]}
            onClick={() => setSelectedSong(song)}
          >
            {/* esfera en vez de texto */}
            <Sphere args={[0.05, 16, 16]}>
              <meshStandardMaterial
                color={selectedSong === song ? "cyan" : "orange"}
              />
            </Sphere>

            {/* Tooltip retro solo para el seleccionado */}
            {selectedSong === song && (
              <Html
                center
                style={{
                  background: "black",
                  color: "lime",
                  padding: "5px",
                  borderRadius: "5px",
                  fontSize: "12px",
                }}
              >
                <div>
                  <strong>{song.track_name}</strong><br />
                  {song.artist_name}<br />
                  {song.genre} – {song.year}
                </div>
              </Html>
            )}
          </group>
        ))}
      </Canvas>
    </div>
  );
}
