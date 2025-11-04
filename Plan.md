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
Plan to add one cleanup-only commit removing unused debug code.
Plan to deploy the working D3.a version to GitHub Pages.
Final commit message will mark the milestone as “D3.a complete.”

## Notes and Next Actions

Consider adding color scaling to indicate token value strength.
Begin planning for D3.b, which introduces deterministic world seeding and global gameplay.
Set up early tests for consistent cell spawning behavior.
