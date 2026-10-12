import React, { useState, useRef } from "react";
import rupeeTreeImg from "../assets/rupee_tree_bg.jpg";

export default function RupeeTreeBackground({ children, showBothSides = true }) {
  const containerRef = useRef(null);
  const [hasMoved, setHasMoved] = useState(false);

  const handleMouseMove = (e) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    if (!hasMoved) setHasMoved(true);

    containerRef.current.style.setProperty("--mouse-x", `${x}px`);
    containerRef.current.style.setProperty("--mouse-y", `${y}px`);
  };

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      style={{
        minHeight: "100vh",
        width: "100%",
        backgroundColor: "#03060c",
        position: "relative",
        overflow: "hidden",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px",
        boxSizing: "border-box",
        "--mouse-x": "50%",
        "--mouse-y": "50%"
      }}
    >
      <style>{`
        @keyframes rupeeFloatSlow {
          0%, 100% { transform: translateY(0px) scale(1); }
          50% { transform: translateY(-12px) scale(1.015); }
        }
        @keyframes rupeeFloatSlowFlipped {
          0%, 100% { transform: scaleX(-1) translateY(0px) scale(1); }
          50% { transform: scaleX(-1) translateY(-12px) scale(1.015); }
        }
        @keyframes emberDrift {
          0% { transform: translateY(0) translateX(0); opacity: 0; }
          25% { opacity: 0.8; }
          75% { opacity: 0.6; }
          100% { transform: translateY(-120px) translateX(25px); opacity: 0; }
        }
        @keyframes subtlePulse {
          0%, 100% { opacity: 0.22; filter: drop-shadow(0 0 15px rgba(249,115,22,0.2)); }
          50% { opacity: 0.38; filter: drop-shadow(0 0 30px rgba(168,85,247,0.35)); }
        }
      `}</style>

      {/* 🔮 DYNAMIC MOUSE SPOTLIGHT (Aura following cursor across the black screen) */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          zIndex: 1,
          background: hasMoved
            ? "radial-gradient(650px circle at var(--mouse-x) var(--mouse-y), rgba(168, 85, 247, 0.22), rgba(234, 88, 12, 0.15) 35%, rgba(3, 6, 12, 0) 70%)"
            : "radial-gradient(700px circle at 50% 50%, rgba(168, 85, 247, 0.15), rgba(234, 88, 12, 0.1) 40%, rgba(3, 6, 12, 0) 75%)",
          transition: "opacity 0.3s ease"
        }}
      />

      {/* 🌿 LEFT SIDE RUPEE MONEY TREE */}
      <div
        style={{
          position: "absolute",
          left: "-5vw",
          top: "50%",
          transform: "translateY(-50%)",
          width: "46vw",
          maxWidth: "580px",
          height: "85vh",
          maxHeight: "750px",
          pointerEvents: "none",
          zIndex: 2,
          display: "flex",
          alignItems: "center",
          justifyContent: "center"
        }}
      >
        {/* Layer A: Ambient resting silhouette (mysterious & subtle) */}
        <img
          src={rupeeTreeImg}
          alt="Indian Rupee Tree Left Ambient"
          style={{
            position: "absolute",
            width: "100%",
            height: "100%",
            objectFit: "contain",
            mixBlendMode: "screen",
            animation: "subtlePulse 6s ease-in-out infinite, rupeeFloatSlow 8s ease-in-out infinite"
          }}
        />

        {/* Layer B: Interactive Mouse-Reveal Full Glow */}
        <img
          src={rupeeTreeImg}
          alt="Indian Rupee Tree Left Reveal"
          style={{
            position: "absolute",
            width: "100%",
            height: "100%",
            objectFit: "contain",
            mixBlendMode: "screen",
            WebkitMaskImage: hasMoved
              ? "radial-gradient(circle 480px at var(--mouse-x) var(--mouse-y), black 25%, rgba(0,0,0,0.5) 60%, transparent 100%)"
              : "radial-gradient(circle 500px at 25% 50%, black 20%, transparent 80%)",
            maskImage: hasMoved
              ? "radial-gradient(circle 480px at var(--mouse-x) var(--mouse-y), black 25%, rgba(0,0,0,0.5) 60%, transparent 100%)"
              : "radial-gradient(circle 500px at 25% 50%, black 20%, transparent 80%)",
            animation: "rupeeFloatSlow 8s ease-in-out infinite",
            filter: "drop-shadow(0 0 35px rgba(249, 115, 22, 0.6)) brightness(1.25)"
          }}
        />
      </div>

      {/* 🌿 RIGHT SIDE RUPEE MONEY TREE (Framing the opposite side) */}
      {showBothSides && (
        <div
          style={{
            position: "absolute",
            right: "-5vw",
            top: "50%",
            transform: "translateY(-50%)",
            width: "46vw",
            maxWidth: "580px",
            height: "85vh",
            maxHeight: "750px",
            pointerEvents: "none",
            zIndex: 2,
            display: "flex",
            alignItems: "center",
            justifyContent: "center"
          }}
        >
          {/* Layer A: Ambient resting silhouette flipped */}
          <img
            src={rupeeTreeImg}
            alt="Indian Rupee Tree Right Ambient"
            style={{
              position: "absolute",
              width: "100%",
              height: "100%",
              objectFit: "contain",
              mixBlendMode: "screen",
              animation: "subtlePulse 6s ease-in-out infinite 3s, rupeeFloatSlowFlipped 8s ease-in-out infinite 1s"
            }}
          />

          {/* Layer B: Interactive Mouse-Reveal Full Glow flipped */}
          <img
            src={rupeeTreeImg}
            alt="Indian Rupee Tree Right Reveal"
            style={{
              position: "absolute",
              width: "100%",
              height: "100%",
              objectFit: "contain",
              mixBlendMode: "screen",
              WebkitMaskImage: hasMoved
                ? "radial-gradient(circle 480px at var(--mouse-x) var(--mouse-y), black 25%, rgba(0,0,0,0.5) 60%, transparent 100%)"
                : "radial-gradient(circle 500px at 75% 50%, black 20%, transparent 80%)",
              maskImage: hasMoved
                ? "radial-gradient(circle 480px at var(--mouse-x) var(--mouse-y), black 25%, rgba(0,0,0,0.5) 60%, transparent 100%)"
                : "radial-gradient(circle 500px at 75% 50%, black 20%, transparent 80%)",
              animation: "rupeeFloatSlowFlipped 8s ease-in-out infinite 1s",
              filter: "drop-shadow(0 0 35px rgba(168, 85, 247, 0.6)) brightness(1.25)"
            }}
          />
        </div>
      )}

      {/* ✨ FLOATING AMBIENT EMBER PARTICLES */}
      <div style={{ position: "absolute", inset: 0, pointerEvents: "none", zIndex: 3, overflow: "hidden" }}>
        {[
          { left: "8%", top: "75%", delay: "0s", duration: "7s", size: "4px", color: "#f97316" },
          { left: "14%", top: "60%", delay: "1.5s", duration: "8s", size: "6px", color: "#c084fc" },
          { left: "20%", top: "80%", delay: "3s", duration: "6.5s", size: "3px", color: "#fb923c" },
          { left: "82%", top: "70%", delay: "0.8s", duration: "7.5s", size: "5px", color: "#e879f9" },
          { left: "88%", top: "65%", delay: "2.2s", duration: "8.5s", size: "4px", color: "#ea580c" },
          { left: "93%", top: "80%", delay: "4s", duration: "6s", size: "6px", color: "#f97316" }
        ].map((ember, i) => (
          <div
            key={i}
            style={{
              position: "absolute",
              left: ember.left,
              top: ember.top,
              width: ember.size,
              height: ember.size,
              borderRadius: "50%",
              backgroundColor: ember.color,
              boxShadow: `0 0 10px ${ember.color}, 0 0 20px ${ember.color}`,
              animation: `emberDrift ${ember.duration} linear infinite`,
              animationDelay: ember.delay
            }}
          />
        ))}
      </div>

      {/* 🎯 FOREGROUND CONTENT (Login / Register Card) */}
      <div style={{ position: "relative", zIndex: 10, width: "100%", display: "flex", justifyContent: "center" }}>
        {children}
      </div>
    </div>
  );
}

