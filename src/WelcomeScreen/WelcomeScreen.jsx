import React, { useState, useRef } from "react";

const WIDTH = 600;
const HEIGHT = 400;

const obstacles = [
  { x: 150, y: 80, width: 80, height: 180 },
  { x: 300, y: 0, width: 60, height: 160 },
  { x: 380, y: 200, width: 120, height: 60 },
  { x: 480, y: 40, width: 70, height: 140 },
];

const start = { x: 70, y: HEIGHT / 2, r: 30 };
const end = { x: WIDTH - 70, y: HEIGHT / 2, r: 30 };

function distance(a, b) {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.sqrt(dx * dx + dy * dy);
}

function pointInRect(point, rect) {
  return (
    point.x >= rect.x &&
    point.x <= rect.x + rect.width &&
    point.y >= rect.y &&
    point.y <= rect.y + rect.height
  );
}

const WelcomeScreen = () => {
  const [path, setPath] = useState([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasLost, setHasLost] = useState(false);
  const [hasWon, setHasWon] = useState(false);
  const [status, setStatus] = useState("Start on A and draw to B.");
  const svgRef = useRef(null);
  const startedFromStartRef = useRef(false);

  const getRelativePoint = (event) => {
    const svg = svgRef.current;
    if (!svg) return null;

    const rect = svg.getBoundingClientRect();
    const clientX = event.clientX ?? event.touches?.[0]?.clientX;
    const clientY = event.clientY ?? event.touches?.[0]?.clientY;

    if (clientX == null || clientY == null) return null;

    const x = clientX - rect.left;
    const y = clientY - rect.top;
    return { x, y };
  };

  const handleStart = (event) => {
    event.preventDefault();
    if (hasWon) return; // ignore once finished

    const point = getRelativePoint(event);
    if (!point) return;

    const onStart = distance(point, start) <= start.r;
    if (!onStart) {
      setStatus("You must start inside A.");
      return;
    }

    startedFromStartRef.current = true;
    setIsDrawing(true);
    setHasLost(false);
    setHasWon(false);
    setPath([point]);
    setStatus("Good, now stay away from the red blocks…");
  };

  const handleMove = (event) => {
    if (!isDrawing || hasLost || hasWon) return;

    const point = getRelativePoint(event);
    if (!point) return;

    // Bounds check
    if (point.x < 0 || point.x > WIDTH || point.y < 0 || point.y > HEIGHT) {
      setIsDrawing(false);
      setHasLost(true);
      setStatus("You left the play area!");
      return;
    }

    // Add to path (only if moved a bit to keep polyline reasonable)
    setPath((prev) => {
      if (prev.length === 0) return [point];
      const last = prev[prev.length - 1];
      if (distance(last, point) < 3) return prev;
      return [...prev, point];
    });

    // Collision with obstacles
    const hitObstacle = obstacles.some((o) => pointInRect(point, o));
    if (hitObstacle) {
      setIsDrawing(false);
      setHasLost(true);
      setStatus("You hit an obstacle!");
      return;
    }

    // Reached B?
    if (distance(point, end) <= end.r) {
      setIsDrawing(false);
      setHasWon(true);
      setStatus("Nice! You reached B safely 🎉");
      return;
    }
  };

  const handleEnd = () => {
    if (!isDrawing) return;
    setIsDrawing(false);

    if (!hasWon && startedFromStartRef.current) {
      setHasLost(true);
      setStatus("You let go before reaching B.");
    }
  };

  const handleReset = () => {
    setPath([]);
    setIsDrawing(false);
    setHasLost(false);
    setHasWon(false);
    startedFromStartRef.current = false;
    setStatus("Start on A and draw to B.");
  };

  const strokeColor = hasWon ? "#22c55e" : hasLost ? "#ef4444" : "#facc15";

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#0f172a",
        color: "#e5e7eb",
        fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
        padding: 16,
      }}
    >
      <div
        style={{
          background: "#020617",
          padding: 20,
          borderRadius: 16,
          boxShadow: "0 20px 40px rgba(0,0,0,0.5)",
          border: "1px solid rgba(148, 163, 184, 0.4)",
          maxWidth: 760,
          width: "100%",
        }}
      >
        <h1 style={{ fontSize: 24, marginBottom: 4 }}>A → B Path Game</h1>
        <p style={{ marginBottom: 12, fontSize: 14, color: "#94a3b8" }}>
          Hold the mouse down inside A, draw a path to B, and don&apos;t touch
          the red blocks.
        </p>

        <div
          style={{
            marginBottom: 12,
            padding: "8px 12px",
            borderRadius: 999,
            fontSize: 14,
            background: "rgba(15,23,42,0.9)",
            border: "1px solid rgba(148,163,184,0.5)",
          }}
        >
          {status}
        </div>

        <div
          style={{
            borderRadius: 12,
            overflow: "hidden",
            border: "1px solid rgba(148,163,184,0.5)",
            background: "#020617",
          }}
        >
          <svg
            ref={svgRef}
            width={WIDTH}
            height={HEIGHT}
            style={{ touchAction: "none", display: "block" }}
            onMouseDown={handleStart}
            onMouseMove={handleMove}
            onMouseUp={handleEnd}
            onMouseLeave={handleEnd}
            onTouchStart={handleStart}
            onTouchMove={handleMove}
            onTouchEnd={handleEnd}
          >
            {/* Background grid */}
            <defs>
              <pattern
                id="grid"
                x="0"
                y="0"
                width="20"
                height="20"
                patternUnits="userSpaceOnUse"
              >
                <path
                  d="M 20 0 L 0 0 0 20"
                  fill="none"
                  stroke="#1e293b"
                  strokeWidth="0.5"
                />
              </pattern>
            </defs>
            <rect width={WIDTH} height={HEIGHT} fill="url(#grid)" />

            {/* Obstacles */}
            {obstacles.map((o, i) => (
              <rect
                key={i}
                x={o.x}
                y={o.y}
                width={o.width}
                height={o.height}
                rx={8}
                ry={8}
                fill="#b91c1c"
                fillOpacity="0.9"
                stroke="#fecaca"
                strokeWidth="2"
              />
            ))}

            {/* Start (A) */}
            <circle
              cx={start.x}
              cy={start.y}
              r={start.r}
              fill="#16a34a"
              stroke="#bbf7d0"
              strokeWidth="3"
            />
            <text
              x={start.x}
              y={start.y + 5}
              textAnchor="middle"
              fontSize="20"
              fill="#ecfdf5"
            >
              A
            </text>

            {/* End (B) */}
            <circle
              cx={end.x}
              cy={end.y}
              r={end.r}
              fill="#2563eb"
              stroke="#bfdbfe"
              strokeWidth="3"
            />
            <text
              x={end.x}
              y={end.y + 5}
              textAnchor="middle"
              fontSize="20"
              fill="#eff6ff"
            >
              B
            </text>

            {/* Path */}
            {path.length > 1 && (
              <polyline
                points={path.map((p) => `${p.x},${p.y}`).join(" ")}
                fill="none"
                stroke={strokeColor}
                strokeWidth="4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            )}
          </svg>
        </div>

        <div
          style={{
            display: "flex",
            marginTop: 12,
            justifyContent: "space-between",
            alignItems: "center",
            gap: 8,
          }}
        >
          <button
            onClick={handleReset}
            style={{
              padding: "8px 16px",
              borderRadius: 999,
              border: "none",
              fontSize: 14,
              fontWeight: 500,
              cursor: "pointer",
              background:
                "linear-gradient(to right, rgb(59,130,246), rgb(129,140,248))",
              color: "white",
              boxShadow: "0 10px 20px rgba(37,99,235,0.4)",
            }}
          >
            Reset
          </button>
          <span style={{ fontSize: 12, color: "#64748b" }}>
            Tip: try moving slowly near the obstacles.
          </span>
        </div>
      </div>
    </div>
  );
};

export default WelcomeScreen;
