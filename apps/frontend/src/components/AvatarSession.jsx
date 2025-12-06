import { Suspense } from "react";
import { Loader, Html } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { Leva } from "leva";
import { Scenario } from "./Scenario";
import { ChatInterface } from "./ChatInterface";
import ErrorBoundary from "./ErrorBoundary";

export default function AvatarSession() {
    return (
        <ErrorBoundary>
            <Loader />
            <Leva collapsed hidden />
            <Canvas
                shadows
                camera={{ position: [0, 0, 0], fov: 10 }}
                style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', zIndex: 1 }}
            >
                <Suspense fallback={<Html center><div className="text-black font-bold bg-white p-2 rounded">Loading 3D Model...</div></Html>}>
                    <Scenario />
                </Suspense>
            </Canvas>
            <ChatInterface />
        </ErrorBoundary>
    );
}
