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

// Track player’s position in grid coordinates
let playerI = 0;
let playerJ = 0;

// Convert grid coordinates to lat/lng
function gridToLatLng(i: number, j: number): leaflet.LatLng {
  return leaflet.latLng(
    WORLD_ORIGIN.lat + i * TILE_DEGREES,
    WORLD_ORIGIN.lng + j * TILE_DEGREES,
  );
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

// Create movement controls
const directions = ["North", "South", "East", "West"];
directions.forEach((dir) => {
  const btn = document.createElement("button");
  btn.textContent = dir;
  btn.addEventListener("click", () => movePlayer(dir));
  controlPanelDiv.appendChild(btn);
});

// Move player one grid cell in the chosen direction
function movePlayer(direction: string) {
  if (direction === "North") playerI -= 1;
  if (direction === "South") playerI += 1;
  if (direction === "West") playerJ -= 1;
  if (direction === "East") playerJ += 1;

  const newLatLng = gridToLatLng(playerI, playerJ);
  playerMarker.setLatLng(newLatLng);
  map.panTo(newLatLng);

  refreshVisibleCells();
}

// Keep track of visible rectangles (Flyweight pattern)
const activeRects: leaflet.Rectangle[] = [];

// Store persistent modified cell states (Memento pattern)
interface CellState {
  i: number;
  j: number;
  value: number | null;
}

const modifiedCells = new Map<string, CellState>();

// Add caches to the map by cell numbers (spawn/despawn dynamically)
function refreshVisibleCells() {
  // Remove all old cells (Flyweight cleanup)
  activeRects.forEach((r) => map.removeLayer(r));
  activeRects.length = 0;

  // Spawn new visible cells centered on player
  for (let di = -NEIGHBORHOOD_SIZE; di <= NEIGHBORHOOD_SIZE; di++) {
    for (let dj = -NEIGHBORHOOD_SIZE; dj <= NEIGHBORHOOD_SIZE; dj++) {
      const i = playerI + di;
      const j = playerJ + dj;
      const cellId = `${i},${j}`;

      // Restore from memento if modified; otherwise use luck() seed
      let cellState = modifiedCells.get(cellId);
      if (!cellState) {
        const hasToken = luck(cellId) < CACHE_SPAWN_PROBABILITY;
        cellState = { i, j, value: hasToken ? 2 : null };
      }

      // Convert cell numbers into lat/lng bounds
      const origin = gridToLatLng(i, j);
      const bounds = leaflet.latLngBounds([
        [origin.lat, origin.lng],
        [origin.lat + TILE_DEGREES, origin.lng + TILE_DEGREES],
      ]);

      // Add a rectangle to represent the cell
      const rect = leaflet.rectangle(bounds, {
        color: cellState.value ? "blue" : "gray",
        weight: 1,
      });
      rect.addTo(map);

      // Show token value directly on the map
      rect.bindTooltip(() => cellState.value?.toString() ?? "empty");

      // Handle interactions with the cache
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

  // Only allow interaction if within the defined radius
  if (dist > INTERACTION_RADIUS_METERS) {
    statusPanelDiv.innerHTML = "Too far away to interact.";
    return;
  }

  // Picking up a token
  if (heldToken === null && cellState.value !== null) {
    heldToken = cellState.value;
    cellState.value = null;
    rect.setStyle({ color: "gray" });
    modifiedCells.set(cellId, { ...cellState });
    statusPanelDiv.innerHTML = `Picked up token: ${heldToken}`;
  } // Dropping a token into an empty cell
  else if (heldToken !== null && cellState.value === null) {
    cellState.value = heldToken;
    heldToken = null;
    rect.setStyle({ color: "blue" });
    modifiedCells.set(cellId, { ...cellState });
    statusPanelDiv.innerHTML = `Placed token in cell (${i}, ${j}).`;
  } // Combining tokens of equal value
  else if (heldToken !== null && cellState.value === heldToken) {
    cellState.value *= 2;
    heldToken = null;
    rect.setStyle({ color: "blue" });
    rect.bindTooltip(() => cellState.value?.toString() ?? "empty");
    modifiedCells.set(cellId, { ...cellState });
    statusPanelDiv.innerHTML = `Combined tokens into ${cellState.value}!`;
    if (cellState.value >= WIN_VALUE) {
      alert("You win!");
    }
  } else {
    statusPanelDiv.innerHTML = "No valid action available.";
  }

  // Clean up modified cell memory if returned to seed state
  const baseValue = luck(cellId) < CACHE_SPAWN_PROBABILITY ? 2 : null;
  if (cellState.value === baseValue) {
    modifiedCells.delete(cellId);
  }
}

// Initialize map with visible cells
refreshVisibleCells();
