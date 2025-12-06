import { useAnimations, useGLTF, Html } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { button, useControls } from "leva";
import React, { useEffect, useRef, useState } from "react";

import * as THREE from "three";
import { useSpeech } from "../hooks/useSpeech";
import facialExpressions from "../constants/facialExpressions";
import visemesMapping from "../constants/visemesMapping";
import morphTargets from "../constants/morphTargets";

export function Avatar(props) {
  const { nodes, materials, scene } = useGLTF("/models/avatar.glb");
  const { animations } = useGLTF("/models/animations.glb");

  const { message, onMessagePlayed } = useSpeech();

  const [lipsync, setLipsync] = useState();
  const [setupMode, setSetupMode] = useState(false);
  const [blink, setBlink] = useState(false);
  const [facialExpression, setFacialExpression] = useState("");
  const [audio, setAudio] = useState();
  const [audioBlocked, setAudioBlocked] = useState(false);
  const [lastError, setLastError] = useState("");

  const group = useRef();
  const { actions, mixer } = useAnimations(animations, group);
  const [animation, setAnimation] = useState("Idle");

  useEffect(() => {
    if (nodes.Wolf3D_Head && nodes.Wolf3D_Head.morphTargetDictionary) {
      // console.log("Morph Targets available:", Object.keys(nodes.Wolf3D_Head.morphTargetDictionary));
    }
  }, [nodes]);

  // Audio Playback Logic
  useEffect(() => {
    if (!message) {
      setAnimation("Idle");
      setLipsync(null);
      return;
    }

    // console.log("🎵 New message received:", message.text);
    setAnimation("Idle");
    setFacialExpression("");
    setLipsync(message.lipsync);

    try {
      const audioUrl = `data:audio/mp3;base64,${message.audio}`;
      const audioElement = new Audio(audioUrl);

      let hasEnded = false;
      const handleAudioEnd = () => {
        if (hasEnded) return;
        hasEnded = true;
        onMessagePlayed();
      };

      audioElement.onloadeddata = () => {
        audioElement.play().catch(err => {
          console.error("❌ Failed to play audio (Autoplay blocked?):", err);
          setAudioBlocked(true);
          setLastError(err.message);
          // Fallback timeout to clear state if user never unmutes
          setTimeout(() => {
            // Optional: handleAudioEnd(); 
          }, (audioElement.duration || 5) * 1000 + 5000);
        });
      };

      audioElement.onplay = () => {
        setAudioBlocked(false);
        setLastError("");
      };

      audioElement.onended = handleAudioEnd;
      audioElement.onerror = (e) => {
        console.error("Audio error", e);
        handleAudioEnd();
      };

      setAudio(audioElement);

      return () => {
        audioElement.pause();
        audioElement.src = "";
      };
    } catch (error) {
      console.error('❌ Failed to create audio element:', error);
      onMessagePlayed();
    }
  }, [message, onMessagePlayed]);

  const handlePlayAudio = () => {
    if (audio) {
      audio.play().then(() => {
        setAudioBlocked(false);
        setLastError("");
      }).catch(err => setLastError(err.message));
    }
  };

  const lerpMorphTarget = (target, value, speed = 0.1) => {
    scene.traverse((child) => {
      if (child.isSkinnedMesh && child.morphTargetDictionary) {
        const index = child.morphTargetDictionary[target];
        if (index === undefined || child.morphTargetInfluences[index] === undefined) {
          return;
        }
        child.morphTargetInfluences[index] = THREE.MathUtils.lerp(child.morphTargetInfluences[index], value, speed);
      }
    });
  };

  useFrame(() => {
    // Simplified lip sync
    let mouthOpenValue = 0;
    let mouthSmileValue = 0;

    if (message && lipsync && audio && !audio.paused && !audio.ended) {
      const currentAudioTime = audio.currentTime;
      for (let i = 0; i < lipsync.mouthCues.length; i++) {
        const mouthCue = lipsync.mouthCues[i];
        if (currentAudioTime >= mouthCue.start && currentAudioTime <= mouthCue.end) {
          const viseme = mouthCue.value;
          switch (viseme) {
            case 'X': mouthOpenValue = 0.0; mouthSmileValue = 0.0; break;
            case 'A': case 'B': case 'C': mouthOpenValue = 0.5; mouthSmileValue = 0.3; break;
            case 'D': case 'E': case 'F': mouthOpenValue = 0.8; mouthSmileValue = 0.1; break;
            case 'G': case 'H': mouthOpenValue = 0.4; mouthSmileValue = 0.6; break;
            default: mouthOpenValue = 0.3; mouthSmileValue = 0.2;
          }
          break;
        }
      }
    }

    lerpMorphTarget("mouthOpen", mouthOpenValue, 0.9);
    lerpMorphTarget("mouthSmile", mouthSmileValue, 0.9);
    lerpMorphTarget("eyeBlinkLeft", blink ? 1 : 0, 0.5);
    lerpMorphTarget("eyeBlinkRight", blink ? 1 : 0, 0.5);
  });

  useControls("FacialExpressions", {
    animation: {
      value: animation,
      options: animations.map((a) => a.name),
      onChange: (value) => setAnimation(value),
    },
    setupMode: button(() => setSetupMode(!setupMode)),
  });

  useEffect(() => { setBlink(false); }, []);

  return (
    <group {...props} dispose={null} ref={group} position={[0, -0.5, 0]}>
      {nodes.Hips && <primitive object={nodes.Hips} />}
      {nodes.EyeLeft && (
        <skinnedMesh
          name="EyeLeft"
          geometry={nodes.EyeLeft.geometry}
          material={materials.Wolf3D_Eye}
          skeleton={nodes.EyeLeft.skeleton}
          morphTargetDictionary={nodes.EyeLeft.morphTargetDictionary}
          morphTargetInfluences={nodes.EyeLeft.morphTargetInfluences}
        />
      )}
      {nodes.EyeRight && (
        <skinnedMesh
          name="EyeRight"
          geometry={nodes.EyeRight.geometry}
          material={materials.Wolf3D_Eye}
          skeleton={nodes.EyeRight.skeleton}
          morphTargetDictionary={nodes.EyeRight.morphTargetDictionary}
          morphTargetInfluences={nodes.EyeRight.morphTargetInfluences}
        />
      )}
      {nodes.Wolf3D_Head && (
        <skinnedMesh
          name="Wolf3D_Head"
          geometry={nodes.Wolf3D_Head.geometry}
          material={materials.Wolf3D_Skin}
          skeleton={nodes.Wolf3D_Head.skeleton}
          morphTargetDictionary={nodes.Wolf3D_Head.morphTargetDictionary}
          morphTargetInfluences={nodes.Wolf3D_Head.morphTargetInfluences}
        />
      )}
      {nodes.Wolf3D_Teeth && (
        <skinnedMesh
          name="Wolf3D_Teeth"
          geometry={nodes.Wolf3D_Teeth.geometry}
          material={materials.Wolf3D_Teeth}
          skeleton={nodes.Wolf3D_Teeth.skeleton}
          morphTargetDictionary={nodes.Wolf3D_Teeth.morphTargetDictionary}
          morphTargetInfluences={nodes.Wolf3D_Teeth.morphTargetInfluences}
        />
      )}
      {nodes.Wolf3D_Glasses && (
        <skinnedMesh
          geometry={nodes.Wolf3D_Glasses.geometry}
          material={materials.Wolf3D_Glasses}
          skeleton={nodes.Wolf3D_Glasses.skeleton}
        />
      )}
      {nodes.Wolf3D_Headwear && (
        <skinnedMesh
          geometry={nodes.Wolf3D_Headwear.geometry}
          material={materials.Wolf3D_Headwear}
          skeleton={nodes.Wolf3D_Headwear.skeleton}
        />
      )}
      {nodes.Wolf3D_Hair && (
        <skinnedMesh
          geometry={nodes.Wolf3D_Hair.geometry}
          material={materials.Wolf3D_Hair}
          skeleton={nodes.Wolf3D_Hair.skeleton}
        />
      )}
      {nodes.Wolf3D_Beard && (
        <skinnedMesh
          geometry={nodes.Wolf3D_Beard.geometry}
          material={materials.Wolf3D_Beard}
          skeleton={nodes.Wolf3D_Beard.skeleton}
          morphTargetDictionary={nodes.Wolf3D_Beard.morphTargetDictionary}
          morphTargetInfluences={nodes.Wolf3D_Beard.morphTargetInfluences}
        />
      )}
      {nodes.Wolf3D_Body && (
        <skinnedMesh
          geometry={nodes.Wolf3D_Body.geometry}
          material={materials.Wolf3D_Body}
          skeleton={nodes.Wolf3D_Body.skeleton}
        />
      )}
      {nodes.Wolf3D_Outfit_Bottom && (
        <skinnedMesh
          geometry={nodes.Wolf3D_Outfit_Bottom.geometry}
          material={materials.Wolf3D_Outfit_Bottom}
          skeleton={nodes.Wolf3D_Outfit_Bottom.skeleton}
        />
      )}
      {nodes.Wolf3D_Outfit_Footwear && (
        <skinnedMesh
          geometry={nodes.Wolf3D_Outfit_Footwear.geometry}
          material={materials.Wolf3D_Outfit_Footwear}
          skeleton={nodes.Wolf3D_Outfit_Footwear.skeleton}
        />
      )}
      {nodes.Wolf3D_Outfit_Top && (
        <skinnedMesh
          geometry={nodes.Wolf3D_Outfit_Top.geometry}
          material={materials.Wolf3D_Outfit_Top}
          skeleton={nodes.Wolf3D_Outfit_Top.skeleton}
        />
      )}

      {audioBlocked && (
        <Html position={[0, 0, 0]} center zIndexRange={[1000, 1000]}>
          <div style={{ textAlign: 'center', width: '300px' }}>
            <button
              onClick={handlePlayAudio}
              style={{
                background: 'rgba(255, 50, 50, 1)',
                color: 'white',
                padding: '16px 32px',
                borderRadius: '30px',
                border: '4px solid white',
                cursor: 'pointer',
                fontSize: '20px',
                fontWeight: '900',
                pointerEvents: 'auto',
                boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
                marginBottom: '20px'
              }}
            >
              🔊 UNMUTE / PLAY
            </button>
            <div style={{ background: 'black', color: 'white', padding: '10px', borderRadius: '8px' }}>
              Autoplay Blocked. Tap to Enable Audio.
            </div>
            {lastError && <div style={{ color: 'red', background: 'white', padding: '5px', marginTop: '5px' }}>{lastError}</div>}
          </div>
        </Html>
      )}

    </group>
  );
}

useGLTF.preload("/models/avatar.glb");
