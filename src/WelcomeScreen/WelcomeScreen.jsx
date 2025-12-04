import React, { useState, useRef } from "react";
import "./WelcomeScreen.css";

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
    if (hasWon) return;

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

    // Outside the play area
    if (point.x < 0 || point.x > WIDTH || point.y < 0 || point.y > HEIGHT) {
      setIsDrawing(false);
      setHasLost(true);
      setStatus("You left the play area!");
      return;
    }

    // Keep path reasonably small
    setPath((prev) => {
      if (prev.length === 0) return [point];
      const last = prev[prev.length - 1];
      if (distance(last, point) < 3) return prev;
      return [...prev, point];
    });

    // Hit obstacle
    const hitObstacle = obstacles.some((o) => pointInRect(point, o));
    if (hitObstacle) {
      setIsDrawing(false);
      setHasLost(true);
      setStatus("You hit an obstacle!");
      return;
    }

    // Reached end
    if (distance(point, end) <= end.r) {
      setIsDrawing(false);
      setHasWon(true);
      setStatus("You reached B Station");
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

  const pathStateClass = hasWon
    ? "path--won"
    : hasLost
    ? "path--lost"
    : "path--active";

  return (
    <div className="welcome-screen">
      <div className="welcome-screen__card">
        <h1 className="welcome-screen__title">A → B Path Game</h1>

        <div className="welcome-screen__status">{status}</div>

        <div className="welcome-screen__board">
          <svg
            ref={svgRef}
            width={WIDTH}
            height={HEIGHT}
            className="welcome-screen__svg"
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
            {obstacles.map((o, index) => (
              <rect
                key={index}
                className="obstacle"
                x={o.x}
                y={o.y}
                width={o.width}
                height={o.height}
                rx={8}
                ry={8}
              />
            ))}

            {/* Start (A) */}
            <circle
              className="node node--start"
              cx={start.x}
              cy={start.y}
              r={start.r}
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
              className="node node--end"
              cx={end.x}
              cy={end.y}
              r={end.r}
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
                className={`path ${pathStateClass}`}
                points={path.map((p) => `${p.x},${p.y}`).join(" ")}
              />
            )}
          </svg>
        </div>

        <div className="welcome-screen__footer">
          <button
            type="button"
            onClick={handleReset}
            className="welcome-screen__reset"
          >
            Reset
          </button>
        </div>
      </div>
    </div>
  );
};

export default WelcomeScreen;
