World of Bits
CMPM 121 – D3 Project

World of Bits is a location-based crafting game played on a real-world map.
Players explore Earth one grid cell at a time, collecting and crafting digital tokens while using deterministic world generation and persistent game state.

The project is built in four milestones:

D3.a: Core mechanics

D3.b: Globe-spanning gameplay

D3.c: Object persistence

D3.d: Cross-session persistence + real-world geolocation

This README documents the game design, technical systems, and progress across all D3 assignments.

Game Design Vision

The world is divided into a global grid, each cell representing a small region of real Earth.

Some cells contain collectible tokens based on deterministic generation using luck().

Players can:

Pick up one token at a time

Drop that token elsewhere

Combine tokens of equal value to create one with double the value

Interactions are limited to nearby cells (~30 meters).

The goal is to craft a high-value token (e.g., 32).

The game encourages exploration, movement, and revisiting areas to hunt for crafting materials.

Technologies Used

TypeScript – main gameplay logic

Leaflet – interactive map and cell rendering

Deno + Vite – build pipeline

GitHub Pages + Actions – automated deployment

luck() hashing function – deterministic token spawning

localStorage – save/load system in D3.d

Geolocation API – real-world movement in D3.d

Milestones
D3.a – Core Mechanics

Goal: Render the map, show grid cells, allow token pickup/drop/combine.
Highlights:

Leaflet map centered on classroom location

Grid rendering using 0.0001° cells

Token spawning via deterministic luck()

Cell tooltips showing token values

Interaction radius checks

Inventory system with single held token

Crafting success and win-condition detection

Deployment included and milestone marked completed.

D3.b – Globe-Spanning Gameplay

Goal: Allow player movement across Earth + dynamic cell loading.
Highlights:

On-screen directional movement buttons

Global grid anchored at world origin

Dynamic spawn/despawn of cells as the player moves

Memoryless cell behavior (intentionally farmable)

Increased crafting requirement (32-value token)

Deployment included and milestone marked completed.

D3.c – Object Persistence

Goal: Cells remember modifications even when off-screen.
Highlights:

Flyweight Pattern:
Only visible rectangles are kept in memory

Memento Pattern:
Modified cells stored in modifiedCells
Restored later upon revisiting

Deterministic vs. modified cell resolution

Automatic cleanup when a cell returns to seed state

Smooth performance across long movement patterns

Deployment included and milestone marked completed.

D3.d – Real-World Space and Time

Goal: Real geolocation control + full persistence across sessions.
Highlights:

Movement (Facade Pattern)

Movement is controlled through a unified MovementController interface.

Two implementations:

Button-based movement (desktop testing)

Geolocation-based movement (real-world walking)

Runtime mode switching button

Query-string control:

index.html?movement=geo

index.html?movement=buttons

Persistence (localStorage)

Saves:

Player grid position

Held token

All modified cell states

Automatic restore on page load

“New Game” button clears all saved data

Deployment included and milestone marked completed.

How to Play

Open the deployed GitHub Pages link.

Choose your movement mode:

Desktop: button mode

Mobile: geolocation mode

Tap cells within range to:

Pick up tokens

Drop tokens

Combine equal tokens

Explore new regions to find more materials.

Reach the win condition by crafting a high-value token (32).

Close the page anytime — your progress is saved.
