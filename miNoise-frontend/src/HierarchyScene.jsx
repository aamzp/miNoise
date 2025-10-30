// src/HierarchyScene.jsx
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Html, Environment } from "@react-three/drei";
import { useState } from "react";
import FloatingSphere from "./components/FloatingSphere";
import data from "./data/minoise_hierarchy.json";

export default function HierarchyScene() {
    const [selected, setSelected] = useState(null);

    const genreColors = {
        jazz: "#8ac7db",
        rock: "#f27272",
        pop: "#f3b562",
        electronic: "#b086f9",
        classical: "#9ecf8b",
    };

    return (
        <div style={{ width: "100vw", height: "100vh" }}>
            <Canvas camera={{ position: [0, 0, 10] }}>
                {/* Iluminación */}
                <ambientLight intensity={0.4} />
                <directionalLight position={[5, 5, 5]} intensity={2} />
                <pointLight position={[-10, -10, -10]} intensity={1} />

                {/* Entorno tipo cielo con reflejos */}
                <Environment preset="sunset" background={false} />

                {/* Control de cámara */}
                <OrbitControls autoRotate autoRotateSpeed={0.8} />

                {/* Render jerárquico */}
                {data.map((genre, i) => (
                    <group key={i} position={genre.centroid}>
                        {genre.artists.map((artist, j) =>
                            artist.tracks.map((track, k) => (
                                <FloatingSphere
                                    key={`${i}-${j}-${k}`}
                                    position={[
                                        artist.centroid[0] * 0.8 + track.PC1 * 0.3,
                                        artist.centroid[1] * 0.8 + track.PC2 * 0.3,
                                        artist.centroid[2] * 0.8 + track.PC3 * 0.3,
                                    ]}
                                    color={genreColors[genre.genre] || "#b28bff"}
                                    onClick={() => setSelected(track)}
                                    selected={selected === track}
                                />
                            ))
                        )}
                    </group>
                ))}

                {/* Tooltip retro */}
                {selected && (
                    <Html center>
                        <div className="tooltip">
                            <b>{selected.track_name}</b>
                            <br />
                            {selected.artist_name}
                        </div>
                    </Html>
                )}
            </Canvas>
        </div>
    );
}
