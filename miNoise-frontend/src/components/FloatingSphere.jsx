// src/components/FloatingSphere.jsx
import { Sphere } from "@react-three/drei";
import { useRef } from "react";
import { useFrame } from "@react-three/fiber";

export default function FloatingSphere({ position, color, onClick, selected }) {
    const ref = useRef();

    useFrame(({ clock }) => {
        const t = clock.getElapsedTime();
        // Movimiento suave tipo flotación
        ref.current.position.y = position[1] + Math.sin(t + position[0]) * 0.08;
        ref.current.rotation.y += 0.002;
    });

    return (
        <Sphere
            ref={ref}
            args={[0.25, 64, 64]}
            position={position}
            onClick={onClick}
            scale={selected ? 1.4 : 1}
        >
            <meshPhysicalMaterial
                transmission={1}
                roughness={0.05}
                thickness={1}
                color={color}
                envMapIntensity={1.2}
                clearcoat={1}
                clearcoatRoughness={0.1}
                ior={1.4}
                metalness={0.1}
            />
        </Sphere>
    );
}
