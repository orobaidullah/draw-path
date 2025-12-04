import React, { useState, useRef } from "react";
import "./WelcomeScreen.css";

const BOARD_WIDTH = 600;
const BOARD_HEIGHT = 400;

const OBSTACLES = [
  { x: 150, y: 80, width: 80, height: 180 },
  { x: 300, y: 0, width: 60, height: 160 },
  { x: 380, y: 200, width: 120, height: 60 },
  { x: 480, y: 40, width: 70, height: 140 },
];

const START_NODE = { x: 70, y: BOARD_HEIGHT / 2, r: 30 };
const END_NODE = { x: BOARD_WIDTH - 70, y: BOARD_HEIGHT / 2, r: 30 };

function getDistance(a, b) {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.sqrt(dx * dx + dy * dy);
}

function isPointInsideRect(point, rect) {
  return (
    point.x >= rect.x &&
    point.x <= rect.x + rect.width &&
    point.y >= rect.y &&
    point.y <= rect.y + rect.height
  );
}

const WelcomeScreen = () => {
  const [pathPoints, setPathPoints] = useState([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasLost, setHasLost] = useState(false);
  const [hasWon, setHasWon] = useState(false);
  const [statusMessage, setStatusMessage] = useState(
    "Start on A and draw to B."
  );

  const svgRef = useRef(null);
  const startedFromStartRef = useRef(false);

  const getPointFromEvent = (event) => {
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

    const point = getPointFromEvent(event);
    if (!point) return;

    const startedOnStart = getDistance(point, START_NODE) <= START_NODE.r;

    if (!startedOnStart) {
      setStatusMessage("You must start inside A.");
      return;
    }

    startedFromStartRef.current = true;
    setIsDrawing(true);
    setHasLost(false);
    setHasWon(false);
    setPathPoints([point]);
    setStatusMessage("Good, now stay away from the red blocks…");
  };

  const handleMove = (event) => {
    if (!isDrawing || hasLost || hasWon) return;

    const point = getPointFromEvent(event);
    if (!point) return;

    const isOutsideBoard =
      point.x < 0 ||
      point.x > BOARD_WIDTH ||
      point.y < 0 ||
      point.y > BOARD_HEIGHT;

    if (isOutsideBoard) {
      setIsDrawing(false);
      setHasLost(true);
      setStatusMessage("You left the play area!");
      return;
    }

    // Keep path reasonably small
    setPathPoints((prevPoints) => {
      if (prevPoints.length === 0) return [point];

      const lastPoint = prevPoints[prevPoints.length - 1];
      const movedEnough = getDistance(lastPoint, point) >= 3;

      if (!movedEnough) return prevPoints;

      return [...prevPoints, point];
    });

    // Hit obstacle
    const hitObstacle = OBSTACLES.some((obstacle) =>
      isPointInsideRect(point, obstacle)
    );

    if (hitObstacle) {
      setIsDrawing(false);
      setHasLost(true);
      setStatusMessage("You hit an obstacle!");
      return;
    }

    // Reached end
    const reachedEnd = getDistance(point, END_NODE) <= END_NODE.r;

    if (reachedEnd) {
      setIsDrawing(false);
      setHasWon(true);
      setStatusMessage("You reached B Station");
    }
  };

  const handleEnd = () => {
    if (!isDrawing) return;

    setIsDrawing(false);

    if (!hasWon && startedFromStartRef.current) {
      setHasLost(true);
      setStatusMessage("You let go before reaching B.");
    }
  };

  const handleReset = () => {
    setPathPoints([]);
    setIsDrawing(false);
    setHasLost(false);
    setHasWon(false);
    startedFromStartRef.current = false;
    setStatusMessage("Start on A and draw to B.");
  };

  const pathClassName = hasWon
    ? "path--won"
    : hasLost
    ? "path--lost"
    : "path--active";

  return (
    <div className="welcome-screen">
      <div className="welcome-screen__card">
        <h1 className="welcome-screen__title">A → B Path Game</h1>

        <div className="welcome-screen__status">{statusMessage}</div>

        <div className="welcome-screen__board">
          <svg
            ref={svgRef}
            width={BOARD_WIDTH}
            height={BOARD_HEIGHT}
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

            <rect width={BOARD_WIDTH} height={BOARD_HEIGHT} fill="url(#grid)" />

            {/* Obstacles */}
            {OBSTACLES.map((obstacle, index) => (
              <rect
                key={index}
                className="obstacle"
                x={obstacle.x}
                y={obstacle.y}
                width={obstacle.width}
                height={obstacle.height}
                rx={8}
                ry={8}
              />
            ))}

            {/* Start (A) */}
            <circle
              className="node node--start"
              cx={START_NODE.x}
              cy={START_NODE.y}
              r={START_NODE.r}
            />
            <text
              x={START_NODE.x}
              y={START_NODE.y + 5}
              textAnchor="middle"
              fontSize="20"
              fill="#ecfdf5"
            >
              A
            </text>

            {/* End (B) */}
            <circle
              className="node node--end"
              cx={END_NODE.x}
              cy={END_NODE.y}
              r={END_NODE.r}
            />
            <text
              x={END_NODE.x}
              y={END_NODE.y + 5}
              textAnchor="middle"
              fontSize="20"
              fill="#eff6ff"
            >
              B
            </text>

            {/* Path */}
            {pathPoints.length > 1 && (
              <polyline
                className={`path ${pathClassName}`}
                points={pathPoints.map((p) => `${p.x},${p.y}`).join(" ")}
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
