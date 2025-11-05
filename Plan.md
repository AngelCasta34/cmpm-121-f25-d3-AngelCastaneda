# D3

Players explore a real-world map to collect and craft digital tokens located on grid cells across Earth.
Each token starts at a small value and can be combined with another of the same value to produce one of double the value.
Players can only interact with nearby cells, encouraging movement and exploration.
The goal is to craft a high-value token such as 16 or higher.

Technologies

- TypeScript for main game logic
- Leaflet for map rendering and interaction
- Deno and Vite for building
- GitHub Actions and GitHub Pages for deployment
- `luck()` function for deterministic token spawning

D3.a: Core Mechanics (Token Collection and Crafting)

**Key Technical Challenge:**
Assemble a map-based interface using Leaflet and make cell contents visible and interactive.

**Key Gameplay Challenge:**
Players collect and craft nearby tokens to reach a target value.

Steps

Setup and Map Rendering

Created a Leaflet map centered on the classroom coordinates.
Added a player marker to represent a fixed player position.
Generated a visible grid of cells approximately 0.0001° on each side.
Used `luck()` to deterministically spawn tokens.
Colored each cell based on token presence and value.
Displayed token values directly on the map through tooltips.
Ensured visible cells render fully to the map edges.

Interaction and Distance Limits

Added click-based interaction for each cell.
Limited interaction range to cells within about 30 meters of the player.
Displayed a message when a player was too far away to interact.

Token System

Assigned each cell a token value of 2 or null.
Added a `heldToken` variable to represent the player’s inventory.
Allowed the player to pick up a token when empty-handed.
Allowed dropping a held token into an empty cell.
Combined two equal-value tokens into one of double value.

Crafting and Feedback

Updated cell visuals immediately after each interaction.
Updated the status panel to show held tokens or interaction messages.
Detected and announced when a token reached the win value (16 or higher).

Cleanup and Deployment

Removed the old “poke” popup system.
Plan to add one cleanup-only commit removing unused debug code.
Plan to deploy the working D3.a version to GitHub Pages.
Final commit message will mark the milestone as “D3.a complete.”

D3.b: Globe-Spanning Gameplay

**Key Technical Challenge:**
Support gameplay anywhere on Earth using a global coordinate system anchored at Null Island and add player movement simulation.

**Key Gameplay Challenge:**
Enable players to move around the world and interact with new cells to craft higher-value tokens.

Steps

Movement Simulation

Added on-screen buttons for North, South, East, and West movement.
Each button moves the player one grid cell in the chosen direction.
The map pans smoothly to follow the player’s new position.
Player movement triggers a refresh of visible grid cells.

Global Grid System

Anchored the grid system to a world origin (initially UCSC for testing, later returning to Null Island).
Each grid cell’s token state is generated deterministically from its global coordinates using `luck()`.
Ensured visible cells always fill the map as the player moves.
Retained global consistency while removing cell persistence to simulate “memoryless” behavior.

Cell Management

Replaced static cell loops with dynamic spawning and despawning logic.
When the player moves, old cells are removed, and new ones appear at the map edges.
Allowed token “farming” by revisiting areas (intentionally unfixed until D3.c).

Crafting and Progress

Kept pickup, drop, and combination mechanics from D3.a.
Raised the win condition to a token value of 32.
Verified that the player can craft higher-value tokens by exploring multiple regions.

Cleanup and Deployment

Tested map rendering and tile refresh after movement.
Confirmed visible tiles display correctly after origin change to UCSC.
Plan to clean up leftover debug code and confirm D3.b deployment on GitHub Pages.
Final commit message will mark the milestone as “D3.b complete.”

## Notes and Next Actions

Revert map origin to Null Island for the final D3.b submission to demonstrate a true globe-spanning system.
Begin D3.c development to add persistence so cells remember their state when scrolled offscreen.
Add a visual cue for player position updates or motion direction.
Consider adding keyboard input support for faster navigation during testing.
