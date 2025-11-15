# D3: World of Bits

## Game Design Vision

Players explore a real-world map to collect and craft digital tokens located on grid cells across Earth.
Each token starts at a small value and can be combined with another of the same value to produce one of double the value.
Players can only interact with nearby cells, encouraging movement and exploration.
The goal is to craft a high-value token such as 16 or higher.

## Technologies

- TypeScript for main game logic
- Leaflet for map rendering and interaction
- Deno and Vite for building
- GitHub Actions and GitHub Pages for deployment
- `luck()` function for deterministic token spawning

## D3.a: Core Mechanics (Token Collection and Crafting)

**Key Technical Challenge:**
Assemble a map-based interface using Leaflet and make cell contents visible and interactive.

**Key Gameplay Challenge:**
Players collect and craft nearby tokens to reach a target value.

### Steps

#### Setup and Map Rendering

Created a Leaflet map centered on the classroom coordinates.
Added a player marker to represent a fixed player position.
Generated a visible grid of cells approximately 0.0001° on each side.
Used `luck()` to deterministically spawn tokens.
Colored each cell based on token presence and value.
Displayed token values directly on the map through tooltips.
Ensured visible cells render fully to the map edges.

#### Interaction and Distance Limits

Added click-based interaction for each cell.
Limited interaction range to cells within about 30 meters of the player.
Displayed a message when a player was too far away to interact.

#### Token System

Assigned each cell a token value of 2 or null.
Added a `heldToken` variable to represent the player’s inventory.
Allowed the player to pick up a token when empty-handed.
Allowed dropping a held token into an empty cell.
Combined two equal-value tokens into one of double value.

#### Crafting and Feedback

Updated cell visuals immediately after each interaction.
Updated the status panel to show held tokens or interaction messages.
Detected and announced when a token reached the win value (16 or higher).

#### Cleanup and Deployment

Removed the old “poke” popup system.
Planned one cleanup-only commit removing unused debug code.
Deployed the working D3.a version to GitHub Pages.
Marked milestone completion with “D3.a complete.”

## D3.b: Globe-Spanning Gameplay

**Key Technical Challenge:**
Support gameplay anywhere on Earth using a global coordinate system anchored at Null Island and add player movement simulation.

**Key Gameplay Challenge:**
Enable players to move around the world and interact with new cells to craft higher-value tokens.

### Steps

#### Movement Simulation

Added on-screen buttons for North, South, East, and West movement.
Each button moves the player one grid cell in the chosen direction.
The map pans smoothly to follow the player’s new position.
Player movement triggers a refresh of visible grid cells.

#### Global Grid System

Anchored the grid system to a world origin (initially UCSC for testing, later returning to Null Island).
Each grid cell’s token state is generated deterministically from its global coordinates using `luck()`.
Ensured visible cells always fill the map as the player moves.
Retained global consistency while removing cell persistence to simulate “memoryless” behavior.

#### Cell Management

Replaced static cell loops with dynamic spawning and despawning logic.
When the player moves, old cells are removed, and new ones appear at the map edges.
Allowed token “farming” by revisiting areas (intentionally unfixed until D3.c).

#### Crafting and Progress

Kept pickup, drop, and combination mechanics from D3.a.
Raised the win condition to a token value of 32.
Verified that the player can craft higher-value tokens by exploring multiple regions.

#### Cleanup and Deployment

Tested map rendering and tile refresh after movement.
Confirmed visible tiles display correctly after origin change to UCSC.
Cleaned up leftover debug code and deployed the D3.b version to GitHub Pages.
Marked milestone completion with “D3.b complete.”

## D3.c: Object Persistence

**Key Technical Challenge:**
Apply the Flyweight and Memento design patterns to make cell states persist when off-screen while minimizing memory usage.

**Key Gameplay Challenge:**
Make cells remember their modified state even when they scroll off the screen, ensuring continuity of gameplay across map movement.

### Steps

#### Flyweight Pattern

Implemented Flyweight behavior by keeping only visible Leaflet rectangles in memory.
Removed all off-screen rectangles whenever `refreshVisibleCells()` runs.
Reduced memory use while maintaining full map coverage.

#### Memento Pattern

Introduced a `modifiedCells` map to store serialized cell states keyed by coordinates.
When a player modifies a cell, its updated state is saved as a memento.
When a cell returns to view, it restores its previous state from `modifiedCells`.
Cells that match their original seed value are automatically removed from storage.

#### Data Management

Added a `CellState` interface defining coordinates and token value.
Used deterministic regeneration via `luck()` only for unmodified cells.
Ensured modified cells retain their token values after scrolling away and back.

#### Gameplay Behavior

Cells now “remember” player interactions even after leaving the visible area.
Returning to a previously modified region restores all changed cells.
Unmodified cells still regenerate consistently using `luck()`.
Maintained smooth interaction performance through efficient state lookups.

#### Cleanup and Deployment

Refactored rendering logic to separate drawing from state tracking.
Removed temporary debug logs after verification.
Tested persistence by picking up, dropping, and combining tokens, then returning to the same area.
Prepared final deployment of D3.c to GitHub Pages.
Final milestone commit message: “D3.c complete.”

## Notes and Next Actions (Before D3.d)

Plan for D3.d to introduce cross-session persistence using browser storage.
Plan geolocation testing on mobile devices.
Prepare an interface abstraction for movement input.
Ensure memory stability across extended real-world movement.

## D3.d: Gameplay Across Real-world Space and Time

**Key Technical Challenge:**
Use the browser Geolocation API and localStorage to allow real-world movement and cross-session persistence.
Hide movement logic behind a Facade interface so that the rest of the game's code does not depend on whether movement is button-based or geolocation-based.

**Key Gameplay Challenge:**
Allow players to physically move to control the game and resume gameplay seamlessly after closing the page.

### Steps

#### Facade Movement System

Created a unified `MovementController` interface to decouple game logic from movement method.
Implemented two movement classes:

- `ButtonMovementController` for desktop testing
- `GeoMovementController` for real-world GPS movement
  The game now interacts only with the interface, not the specific controller.

#### Geolocation Integration

Integrated the browser Geolocation API using `navigator.geolocation.watchPosition`.
Converted real-world latitude and longitude into grid coordinates.
Automatically updated the player's marker and map position as the device moved.
Displayed live GPS status and coordinate accuracy updates.

#### Runtime Movement Switching

Added a “Switch Movement Mode” button to toggle between button-based and geolocation-based movement.
Added query-string movement selection:

- `index.html?movement=geo`
- `index.html?movement=buttons`
  Ensured both runtime and URL-based selection work cleanly.

#### Persistent Game State

Used `localStorage` to save player location, held token, and all modified cell states.
Automatically restored this data on page load.
Ensured persistence after closing the browser tab or refreshing the page.
Added a “New Game” control that clears localStorage and resets the game.

#### Gameplay Experience

The player now moves by walking around in the real world.
Button mode is still available for desktop testing.
All crafting progress, modified cells, and inventory persist across sessions.
Players can switch modes without losing progress.

#### Cleanup and Deployment

Cleaned up code and verified Facade boundaries.
Tested both movement modes on mobile and desktop.
Deployed the D3.d version to GitHub Pages.
Marked milestone completion with “D3.d complete.”
