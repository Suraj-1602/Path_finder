# PathFinder — Traffic Routing Visualization

An interactive web application for visualizing pathfinding algorithms in a smart-city traffic routing context. Draw walls, add traffic weights, and watch algorithms explore the grid in real time.

## Features

- **Five pathfinding algorithms** — Dijkstra's, A* Search, BFS, Greedy Best-First, and Bidirectional BFS
- **Interactive grid** — Place start/end points, draw walls, add traffic weights, and set waypoints
- **Live visualization** — Animated step-by-step exploration with adjustable speed
- **Algorithm comparison** — Run all algorithms on the same grid and compare nodes explored, path cost, and runtime
- **Maze generation** — Recursive division, random walls, random traffic, and staircase patterns
- **Routing matrix** — Compute shortest paths between waypoints and find an optimal tour (TSP nearest-neighbor heuristic)
- **Weighted edges** — Light (3×), moderate (5×), and heavy (10×) traffic costs

## Getting Started

No build step or dependencies required. Open the project in any modern browser:

1. Clone or download this repository
2. Open `index.html` in your browser

Alternatively, serve the folder with a local server:

```bash
# Python
python -m http.server 8000

# Node.js (npx)
npx serve .
```

Then visit `http://localhost:8000`.

## Usage

### Grid Tools

| Tool | Action |
|------|--------|
| **Start** | Place the start node (green) |
| **End** | Place the end node (red) |
| **Wall** | Click and drag to draw walls/buildings |
| **Traffic** | Click cells to cycle traffic weight (3× → 5× → 10× → normal) |
| **Waypoint** | Place labeled waypoints for routing matrix |
| **Eraser** | Remove walls, traffic, or waypoints |

- **Right-click** on a cell to cycle traffic weights quickly
- **Drag** the start or end node to reposition it

### Controls

| Control | Description |
|---------|-------------|
| **Visualize** | Run the selected algorithm and animate the result |
| **Compare All** | Run every algorithm and show a comparison table |
| **Maze** | Generate a preset maze or traffic pattern |
| **Clear Path** | Remove visualization (visited nodes, path) |
| **Reset** | Clear the entire grid |

### Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `V` or `Enter` | Visualize |
| `C` | Clear path |
| `R` | Reset grid |
| `1`–`6` | Select tool (Start, End, Wall, Traffic, Waypoint, Eraser) |

## Algorithms

| Algorithm | Optimal | Weighted | Notes |
|-----------|---------|----------|-------|
| **Dijkstra's** | Yes | Yes | Explores by increasing distance; no heuristic |
| **A\*** | Yes | Yes | Uses Manhattan heuristic; efficient and optimal |
| **BFS** | Yes* | No | Shortest path in unweighted graphs only |
| **Greedy Best-First** | No | No | Fast; heuristic-only, may miss optimal path |
| **Bidirectional BFS** | Yes* | No | Searches from both start and end |

\*Optimal for unweighted shortest path (by hop count).

## Project Structure

```
Math_project_2/
├── index.html          # Main HTML page
├── styles.css          # Dark theme UI styles
├── js/
│   ├── algorithms.js   # Pathfinding implementations & TSP solver
│   └── app.js          # Grid, UI, visualization, maze generation
└── README.md
```

## Routing Matrix & TSP

1. Place at least two **waypoints** on the grid (labeled A, B, C, …)
2. Click **Compute Matrix** to build a cost matrix between all waypoints
3. Click **Find Optimal Tour** to get a nearest-neighbor TSP route and visualize it on the grid

## Tech Stack

- Vanilla HTML, CSS, and JavaScript
- No frameworks or external runtime dependencies
- Google Fonts (Inter, JetBrains Mono)

## License

This project is for educational use as part of a math/computer science pathfinding study.
