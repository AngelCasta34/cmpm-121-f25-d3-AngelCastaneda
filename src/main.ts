// @deno-types="npm:@types/leaflet"
import leaflet from "leaflet";

// Style sheets
import "leaflet/dist/leaflet.css"; // supporting style for Leaflet
import "./style.css"; // student-controlled page style

// Fix missing marker images
import "./_leafletWorkaround.ts"; // fixes for missing Leaflet images

// Import our luck function
import luck from "./_luck.ts";

// Create basic UI elements

const controlPanelDiv = document.createElement("div");
controlPanelDiv.id = "controlPanel";
document.body.append(controlPanelDiv);

const mapDiv = document.createElement("div");
mapDiv.id = "map";
document.body.append(mapDiv);

const statusPanelDiv = document.createElement("div");
statusPanelDiv.id = "statusPanel";
document.body.append(statusPanelDiv);

// Our world anchor location (UCSC classroom for testing)
const WORLD_ORIGIN = leaflet.latLng(36.997936938057016, -122.05703507501151);

// Tunable gameplay parameters
const GAMEPLAY_ZOOM_LEVEL = 19;
const TILE_DEGREES = 1e-4;
const NEIGHBORHOOD_SIZE = 8;
const CACHE_SPAWN_PROBABILITY = 0.1;
const INTERACTION_RADIUS_METERS = 30;
const WIN_VALUE = 32;

// Create the map (element with id "map" is defined in index.html)
const map = leaflet.map(mapDiv, {
  center: WORLD_ORIGIN,
  zoom: GAMEPLAY_ZOOM_LEVEL,
  minZoom: GAMEPLAY_ZOOM_LEVEL,
  maxZoom: GAMEPLAY_ZOOM_LEVEL,
  zoomControl: false,
  scrollWheelZoom: false,
});

// Populate the map with a background tile layer
leaflet
  .tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution:
      '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
  })
  .addTo(map);

// Player position tracking
let playerI = 0;
let playerJ = 0;
let playerLatLng = WORLD_ORIGIN;

// Convert grid coordinates to lat/lng
function gridToLatLng(i: number, j: number): leaflet.LatLng {
  return leaflet.latLng(
    WORLD_ORIGIN.lat + i * TILE_DEGREES,
    WORLD_ORIGIN.lng + j * TILE_DEGREES,
  );
}

// Convert lat/lng to grid coordinates
function latLngToGrid(latlng: leaflet.LatLng): [number, number] {
  const i = Math.round((latlng.lat - WORLD_ORIGIN.lat) / TILE_DEGREES);
  const j = Math.round((latlng.lng - WORLD_ORIGIN.lng) / TILE_DEGREES);
  return [i, j];
}

// Add a marker to represent the player
const playerMarker = leaflet.marker(WORLD_ORIGIN);
playerMarker.bindTooltip("That's you!");
playerMarker.addTo(map);

// Ensure map tiles render correctly after initial load
setTimeout(() => map.invalidateSize(), 200);

// Display the player's held token
let heldToken: number | null = null;
statusPanelDiv.innerHTML = "Empty hand.";

// Cell state persistence (Memento pattern)
interface CellState {
  i: number;
  j: number;
  value: number | null;
}

const modifiedCells = new Map<string, CellState>();

// Load game state from localStorage
function loadGameState() {
  const saved = localStorage.getItem("worldOfBitsSave");
  if (!saved) return;
  const data = JSON.parse(saved);

  playerI = data.playerI;
  playerJ = data.playerJ;
  heldToken = data.heldToken;

  for (const id in data.modifiedCells) {
    modifiedCells.set(id, data.modifiedCells[id]);
  }

  statusPanelDiv.innerHTML = heldToken
    ? `Restored game. Holding token ${heldToken}.`
    : "Restored game from last session.";

  const pos = gridToLatLng(playerI, playerJ);
  playerMarker.setLatLng(pos);
  map.panTo(pos);
}

// Save game state to localStorage
function saveGameState() {
  const data = {
    playerI,
    playerJ,
    heldToken,
    modifiedCells: Object.fromEntries(modifiedCells),
  };
  localStorage.setItem("worldOfBitsSave", JSON.stringify(data));
}

// Start new game (clears localStorage)
const newGameBtn = document.createElement("button");
newGameBtn.textContent = "New Game";
newGameBtn.addEventListener("click", () => {
  localStorage.removeItem("worldOfBitsSave");
  modifiedCells.clear();
  playerI = 0;
  playerJ = 0;
  heldToken = null;
  map.panTo(WORLD_ORIGIN);
  refreshVisibleCells();
  statusPanelDiv.innerHTML = "Started new game.";
});
controlPanelDiv.appendChild(newGameBtn);

// Movement system (Facade pattern)
interface MovementController {
  start(): void;
}

// Button-based movement controller
class ButtonMovementController implements MovementController {
  constructor() {
    const directions = ["North", "South", "East", "West"];
    directions.forEach((dir) => {
      const btn = document.createElement("button");
      btn.textContent = dir;
      btn.addEventListener("click", () => this.move(dir));
      controlPanelDiv.appendChild(btn);
    });
  }
  start() {
    statusPanelDiv.innerHTML = "Button movement enabled.";
  }
  move(direction: string) {
    if (direction === "North") playerI -= 1;
    if (direction === "South") playerI += 1;
    if (direction === "West") playerJ -= 1;
    if (direction === "East") playerJ += 1;

    const newPos = gridToLatLng(playerI, playerJ);
    playerMarker.setLatLng(newPos);
    map.panTo(newPos);
    refreshVisibleCells();
    saveGameState();
  }
}

// Geolocation-based movement controller
class GeoMovementController implements MovementController {
  start() {
    if (!navigator.geolocation) {
      alert("Geolocation not supported by your browser.");
      return;
    }
    navigator.geolocation.watchPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        playerLatLng = leaflet.latLng(lat, lng);

        [playerI, playerJ] = latLngToGrid(playerLatLng);

        playerMarker.setLatLng(playerLatLng);
        map.panTo(playerLatLng);
        refreshVisibleCells();
        saveGameState();

        statusPanelDiv.innerHTML = `GPS active | ${
          lat.toFixed(
            4,
          )
        }, ${lng.toFixed(4)}`;
      },
      (err) => {
        statusPanelDiv.innerHTML = `Geolocation error: ${err.message}`;
      },
      { enableHighAccuracy: true },
    );
  }
}

// Runtime movement mode switching
const switchMovementBtn = document.createElement("button");
switchMovementBtn.textContent = "Switch Movement Mode";
controlPanelDiv.appendChild(switchMovementBtn);

// Create movement controller (query string + runtime switching)
let controller: MovementController | null = null;

function activateMovement(mode: string) {
  if (mode === "geo") {
    controller = new GeoMovementController();
    statusPanelDiv.innerHTML = "Using geolocation mode.";
  } else {
    controller = new ButtonMovementController();
    statusPanelDiv.innerHTML = "Using button mode.";
  }
  controller.start();
  saveGameState();
}

switchMovementBtn.addEventListener("click", () => {
  const current = new URLSearchParams(globalThis.location.search).get(
    "movement",
  );
  const newMode = current === "geo" ? "buttons" : "geo";

  const params = new URLSearchParams(globalThis.location.search);
  params.set("movement", newMode);
  globalThis.location.search = params.toString();
});

// Determine initial mode from query string
const params = new URLSearchParams(globalThis.location.search);
activateMovement(params.get("movement") ?? "buttons");

// Keep track of visible rectangles (Flyweight pattern)
const activeRects: leaflet.Rectangle[] = [];

// Add caches by cell numbers
function refreshVisibleCells() {
  activeRects.forEach((r) => map.removeLayer(r));
  activeRects.length = 0;

  for (let di = -NEIGHBORHOOD_SIZE; di <= NEIGHBORHOOD_SIZE; di++) {
    for (let dj = -NEIGHBORHOOD_SIZE; dj <= NEIGHBORHOOD_SIZE; dj++) {
      const i = playerI + di;
      const j = playerJ + dj;
      const cellId = `${i},${j}`;

      let cellState = modifiedCells.get(cellId);
      if (!cellState) {
        const hasToken = luck(cellId) < CACHE_SPAWN_PROBABILITY;
        cellState = { i, j, value: hasToken ? 2 : null };
      }

      const origin = gridToLatLng(i, j);
      const bounds = leaflet.latLngBounds([
        [origin.lat, origin.lng],
        [origin.lat + TILE_DEGREES, origin.lng + TILE_DEGREES],
      ]);

      const rect = leaflet.rectangle(bounds, {
        color: cellState.value ? "blue" : "gray",
        weight: 1,
      });
      rect.addTo(map);

      rect.bindTooltip(() => cellState!.value?.toString() ?? "empty");

      rect.on("click", () => {
        handleCellClick(i, j, cellState!, rect);
      });

      activeRects.push(rect);
    }
  }
}

// Handle interactions with each cell
function handleCellClick(
  i: number,
  j: number,
  cellState: CellState,
  rect: leaflet.Rectangle,
) {
  const playerPos = gridToLatLng(playerI, playerJ);
  const cellCenter = rect.getBounds().getCenter();
  const dist = playerPos.distanceTo(cellCenter);
  const cellId = `${i},${j}`;

  if (dist > INTERACTION_RADIUS_METERS) {
    statusPanelDiv.innerHTML = "Too far away to interact.";
    return;
  }

  if (heldToken === null && cellState.value !== null) {
    heldToken = cellState.value;
    cellState.value = null;
    rect.setStyle({ color: "gray" });
    modifiedCells.set(cellId, { ...cellState });
    statusPanelDiv.innerHTML = `Picked up token ${heldToken}`;
  } else if (heldToken !== null && cellState.value === null) {
    cellState.value = heldToken;
    heldToken = null;
    rect.setStyle({ color: "blue" });
    modifiedCells.set(cellId, { ...cellState });
    statusPanelDiv.innerHTML = `Placed token in cell (${i}, ${j})`;
  } else if (heldToken !== null && cellState.value === heldToken) {
    cellState.value *= 2;
    heldToken = null;
    rect.setStyle({ color: "blue" });
    rect.bindTooltip(() => cellState.value?.toString() ?? "empty");
    modifiedCells.set(cellId, { ...cellState });
    statusPanelDiv.innerHTML = `Combined into ${cellState.value}!`;

    if (cellState.value >= WIN_VALUE) {
      alert("You win!");
    }
  } else {
    statusPanelDiv.innerHTML = "No valid action available.";
  }

  const baseValue = luck(cellId) < CACHE_SPAWN_PROBABILITY ? 2 : null;
  if (cellState.value === baseValue) {
    modifiedCells.delete(cellId);
  }

  saveGameState();
}

// Restore previous session
loadGameState();

// Initialize map
refreshVisibleCells();
