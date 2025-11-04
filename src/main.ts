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

// Our classroom location
const CLASSROOM_LATLNG = leaflet.latLng(
  36.997936938057016,
  -122.05703507501151,
);

// Tunable gameplay parameters
const GAMEPLAY_ZOOM_LEVEL = 19;
const TILE_DEGREES = 1e-4;
const NEIGHBORHOOD_SIZE = 8;
const CACHE_SPAWN_PROBABILITY = 0.1;
const INTERACTION_RADIUS_METERS = 30;
const WIN_VALUE = 16;

// Create the map (element with id "map" is defined in index.html)
const map = leaflet.map(mapDiv, {
  center: CLASSROOM_LATLNG,
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

// Add a marker to represent the player
const playerMarker = leaflet.marker(CLASSROOM_LATLNG);
playerMarker.bindTooltip("That's you!");
playerMarker.addTo(map);

// Display the player's held token or empty hand
let heldToken: number | null = null;
statusPanelDiv.innerHTML = "Empty hand.";

// Track all cells by coordinates
interface CellData {
  i: number;
  j: number;
  value: number | null; // null means empty
}
const cells = new Map<string, CellData>();

// Add caches to the map by cell numbers
function spawnCache(i: number, j: number) {
  // Convert cell numbers into lat/lng bounds
  const origin = CLASSROOM_LATLNG;
  const bounds = leaflet.latLngBounds([
    [origin.lat + i * TILE_DEGREES, origin.lng + j * TILE_DEGREES],
    [origin.lat + (i + 1) * TILE_DEGREES, origin.lng + (j + 1) * TILE_DEGREES],
  ]);

  // Initialize token data deterministically using luck()
  const cellId = `${i},${j}`;
  const hasToken = luck(cellId) < CACHE_SPAWN_PROBABILITY;
  const tokenValue = hasToken ? 2 : null;
  const data: CellData = { i, j, value: tokenValue };
  cells.set(cellId, data);

  // Add a rectangle to the map to represent the cache
  const rect = leaflet.rectangle(bounds, {
    color: data.value ? "blue" : "gray",
    weight: 1,
  });
  rect.addTo(map);

  // Show token value directly on the map (tooltip)
  rect.bindTooltip(() => data.value?.toString() ?? "empty");

  // Handle interactions with the cache
  rect.on("click", () => {
    const cellCenter = bounds.getCenter();
    const dist = CLASSROOM_LATLNG.distanceTo(cellCenter);

    // Only allow interaction if within the defined radius
    if (dist > INTERACTION_RADIUS_METERS) {
      statusPanelDiv.innerHTML = "Too far away to interact.";
      return;
    }

    // Picking up a token
    if (heldToken === null && data.value !== null) {
      heldToken = data.value;
      data.value = null;
      statusPanelDiv.innerHTML = `Picked up token: ${heldToken}`;
    } // Dropping a token into an empty cell
    else if (heldToken !== null && data.value === null) {
      data.value = heldToken;
      heldToken = null;
      statusPanelDiv.innerHTML = `Placed token in cell (${i}, ${j}).`;
    } // Combining tokens of equal value
    else if (heldToken !== null && data.value === heldToken) {
      data.value *= 2;
      heldToken = null;
      statusPanelDiv.innerHTML = `Combined tokens into ${data.value}!`;
      if (data.value >= WIN_VALUE) {
        alert("You win!");
      }
    } else {
      statusPanelDiv.innerHTML = "No valid action available.";
    }

    // Update cell color and tooltip after interaction
    rect.setStyle({ color: data.value ? "blue" : "gray" });
    rect.bindTooltip(() => data.value?.toString() ?? "empty");
  });
}

// Look around the player's neighborhood for caches to spawn
for (let i = -NEIGHBORHOOD_SIZE; i < NEIGHBORHOOD_SIZE; i++) {
  for (let j = -NEIGHBORHOOD_SIZE; j < NEIGHBORHOOD_SIZE; j++) {
    // If location i,j is lucky enough, spawn a cache!
    spawnCache(i, j);
  }
}
