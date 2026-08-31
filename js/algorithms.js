/* ============================================
   PathFinder — Pathfinding Algorithm Implementations
   ============================================ */

// ---- Min-Heap Priority Queue ----
class MinHeap {
    constructor(comparator = (a, b) => a.priority - b.priority) {
        this.heap = [];
        this.comparator = comparator;
    }

    size() { return this.heap.length; }
    isEmpty() { return this.heap.length === 0; }
    peek() { return this.heap[0]; }

    push(value) {
        this.heap.push(value);
        this._bubbleUp(this.heap.length - 1);
    }

    pop() {
        if (this.isEmpty()) return undefined;
        const top = this.heap[0];
        const last = this.heap.pop();
        if (this.heap.length > 0) {
            this.heap[0] = last;
            this._sinkDown(0);
        }
        return top;
    }

    _bubbleUp(idx) {
        while (idx > 0) {
            const parentIdx = Math.floor((idx - 1) / 2);
            if (this.comparator(this.heap[idx], this.heap[parentIdx]) >= 0) break;
            [this.heap[parentIdx], this.heap[idx]] = [this.heap[idx], this.heap[parentIdx]];
            idx = parentIdx;
        }
    }

    _sinkDown(idx) {
        const length = this.heap.length;
        while (true) {
            let smallest = idx;
            const left = 2 * idx + 1;
            const right = 2 * idx + 2;
            if (left < length && this.comparator(this.heap[left], this.heap[smallest]) < 0) smallest = left;
            if (right < length && this.comparator(this.heap[right], this.heap[smallest]) < 0) smallest = right;
            if (smallest === idx) break;
            [this.heap[smallest], this.heap[idx]] = [this.heap[idx], this.heap[smallest]];
            idx = smallest;
        }
    }
}

// ---- Helper Functions ----

function getNeighbors(node, grid, allowDiagonals) {
    const neighbors = [];
    const { row, col } = node;
    const rows = grid.length;
    const cols = grid[0].length;

    // Cardinal directions
    const dirs = [
        [-1, 0], [1, 0], [0, -1], [0, 1]
    ];

    // Diagonal directions
    if (allowDiagonals) {
        dirs.push([-1, -1], [-1, 1], [1, -1], [1, 1]);
    }

    for (const [dr, dc] of dirs) {
        const nr = row + dr;
        const nc = col + dc;
        if (nr >= 0 && nr < rows && nc >= 0 && nc < cols) {
            neighbors.push(grid[nr][nc]);
        }
    }

    return neighbors;
}

function manhattanDistance(a, b) {
    return Math.abs(a.row - b.row) + Math.abs(a.col - b.col);
}

function euclideanDistance(a, b) {
    return Math.sqrt((a.row - b.row) ** 2 + (a.col - b.col) ** 2);
}

function reconstructPath(endNode) {
    const path = [];
    let current = endNode;
    while (current !== null) {
        path.unshift(current);
        current = current.previousNode;
    }
    return path;
}

function calculatePathCost(path) {
    let cost = 0;
    for (let i = 1; i < path.length; i++) {
        cost += path[i].weight;
    }
    return cost;
}

function resetGridState(grid) {
    for (const row of grid) {
        for (const node of row) {
            node.distance = Infinity;
            node.heuristic = 0;
            node.totalCost = Infinity;
            node.previousNode = null;
            node.isVisited = false;
            node.isVisitedReverse = false;
            node.distanceReverse = Infinity;
            node.previousNodeReverse = null;
        }
    }
}

// ============================================
// DIJKSTRA'S ALGORITHM
// ============================================
function dijkstra(grid, startNode, endNode, allowDiagonals = false) {
    const visitedNodesInOrder = [];
    resetGridState(grid);

    startNode.distance = 0;
    const pq = new MinHeap((a, b) => a.distance - b.distance);
    pq.push(startNode);

    while (!pq.isEmpty()) {
        const current = pq.pop();

        if (current.isWall) continue;
        if (current.isVisited) continue;
        if (current.distance === Infinity) break;

        current.isVisited = true;
        visitedNodesInOrder.push(current);

        if (current === endNode) break;

        const neighbors = getNeighbors(current, grid, allowDiagonals);
        for (const neighbor of neighbors) {
            if (!neighbor.isVisited && !neighbor.isWall) {
                const moveCost = neighbor.weight;
                const newDist = current.distance + moveCost;
                if (newDist < neighbor.distance) {
                    neighbor.distance = newDist;
                    neighbor.previousNode = current;
                    pq.push(neighbor);
                }
            }
        }
    }

    const path = reconstructPath(endNode);
    const pathFound = endNode.isVisited;

    return {
        visitedNodesInOrder,
        path: pathFound ? path : [],
        stats: {
            nodesExplored: visitedNodesInOrder.length,
            pathLength: pathFound ? path.length : 0,
            pathCost: pathFound ? calculatePathCost(path) : 0,
            found: pathFound
        }
    };
}

// ============================================
// A* SEARCH
// ============================================
function aStar(grid, startNode, endNode, allowDiagonals = false) {
    const visitedNodesInOrder = [];
    resetGridState(grid);

    startNode.distance = 0;
    startNode.heuristic = manhattanDistance(startNode, endNode);
    startNode.totalCost = startNode.heuristic;

    const pq = new MinHeap((a, b) => a.totalCost - b.totalCost);
    pq.push(startNode);

    while (!pq.isEmpty()) {
        const current = pq.pop();

        if (current.isWall) continue;
        if (current.isVisited) continue;

        current.isVisited = true;
        visitedNodesInOrder.push(current);

        if (current === endNode) break;

        const neighbors = getNeighbors(current, grid, allowDiagonals);
        for (const neighbor of neighbors) {
            if (!neighbor.isVisited && !neighbor.isWall) {
                const moveCost = neighbor.weight;
                const newDist = current.distance + moveCost;
                if (newDist < neighbor.distance) {
                    neighbor.distance = newDist;
                    neighbor.heuristic = manhattanDistance(neighbor, endNode);
                    neighbor.totalCost = newDist + neighbor.heuristic;
                    neighbor.previousNode = current;
                    pq.push(neighbor);
                }
            }
        }
    }

    const path = reconstructPath(endNode);
    const pathFound = endNode.isVisited;

    return {
        visitedNodesInOrder,
        path: pathFound ? path : [],
        stats: {
            nodesExplored: visitedNodesInOrder.length,
            pathLength: pathFound ? path.length : 0,
            pathCost: pathFound ? calculatePathCost(path) : 0,
            found: pathFound
        }
    };
}

// ============================================
// BREADTH-FIRST SEARCH (BFS)
// ============================================
function bfs(grid, startNode, endNode, allowDiagonals = false) {
    const visitedNodesInOrder = [];
    resetGridState(grid);

    startNode.distance = 0;
    startNode.isVisited = true;
    const queue = [startNode];

    while (queue.length > 0) {
        const current = queue.shift();

        visitedNodesInOrder.push(current);

        if (current === endNode) break;

        const neighbors = getNeighbors(current, grid, allowDiagonals);
        for (const neighbor of neighbors) {
            if (!neighbor.isVisited && !neighbor.isWall) {
                neighbor.isVisited = true;
                neighbor.distance = current.distance + 1;
                neighbor.previousNode = current;
                queue.push(neighbor);
            }
        }
    }

    const path = reconstructPath(endNode);
    const pathFound = endNode.isVisited;

    return {
        visitedNodesInOrder,
        path: pathFound ? path : [],
        stats: {
            nodesExplored: visitedNodesInOrder.length,
            pathLength: pathFound ? path.length : 0,
            pathCost: pathFound ? calculatePathCost(path) : 0,
            found: pathFound
        }
    };
}

// ============================================
// GREEDY BEST-FIRST SEARCH
// ============================================
function greedyBestFirst(grid, startNode, endNode, allowDiagonals = false) {
    const visitedNodesInOrder = [];
    resetGridState(grid);

    startNode.heuristic = manhattanDistance(startNode, endNode);
    const pq = new MinHeap((a, b) => a.heuristic - b.heuristic);
    pq.push(startNode);

    while (!pq.isEmpty()) {
        const current = pq.pop();

        if (current.isWall) continue;
        if (current.isVisited) continue;

        current.isVisited = true;
        visitedNodesInOrder.push(current);

        if (current === endNode) break;

        const neighbors = getNeighbors(current, grid, allowDiagonals);
        for (const neighbor of neighbors) {
            if (!neighbor.isVisited && !neighbor.isWall) {
                neighbor.heuristic = manhattanDistance(neighbor, endNode);
                neighbor.previousNode = current;
                pq.push(neighbor);
            }
        }
    }

    const path = reconstructPath(endNode);
    const pathFound = endNode.isVisited;

    return {
        visitedNodesInOrder,
        path: pathFound ? path : [],
        stats: {
            nodesExplored: visitedNodesInOrder.length,
            pathLength: pathFound ? path.length : 0,
            pathCost: pathFound ? calculatePathCost(path) : 0,
            found: pathFound
        }
    };
}

// ============================================
// BIDIRECTIONAL BFS
// ============================================
function bidirectionalBFS(grid, startNode, endNode, allowDiagonals = false) {
    const visitedFromStart = [];
    const visitedFromEnd = [];
    resetGridState(grid);

    startNode.distance = 0;
    startNode.isVisited = true;
    endNode.distanceReverse = 0;
    endNode.isVisitedReverse = true;

    const queueStart = [startNode];
    const queueEnd = [endNode];

    let meetingNode = null;

    while (queueStart.length > 0 || queueEnd.length > 0) {
        // Expand from start
        if (queueStart.length > 0) {
            const current = queueStart.shift();
            visitedFromStart.push(current);

            if (current.isVisitedReverse) {
                meetingNode = current;
                break;
            }

            const neighbors = getNeighbors(current, grid, allowDiagonals);
            for (const neighbor of neighbors) {
                if (!neighbor.isVisited && !neighbor.isWall) {
                    neighbor.isVisited = true;
                    neighbor.distance = current.distance + 1;
                    neighbor.previousNode = current;
                    queueStart.push(neighbor);

                    if (neighbor.isVisitedReverse) {
                        meetingNode = neighbor;
                        break;
                    }
                }
            }
            if (meetingNode) break;
        }

        // Expand from end
        if (queueEnd.length > 0) {
            const current = queueEnd.shift();
            visitedFromEnd.push(current);

            if (current.isVisited && !visitedFromEnd.includes(current)) {
                meetingNode = current;
                break;
            }

            const neighbors = getNeighbors(current, grid, allowDiagonals);
            for (const neighbor of neighbors) {
                if (!neighbor.isVisitedReverse && !neighbor.isWall) {
                    neighbor.isVisitedReverse = true;
                    neighbor.distanceReverse = current.distanceReverse + 1;
                    neighbor.previousNodeReverse = current;
                    queueEnd.push(neighbor);

                    if (neighbor.isVisited) {
                        meetingNode = neighbor;
                        break;
                    }
                }
            }
            if (meetingNode) break;
        }
    }

    // Build combined path
    let path = [];
    let pathFound = false;

    if (meetingNode) {
        pathFound = true;
        // Path from start to meeting node
        const pathFromStart = [];
        let current = meetingNode;
        while (current !== null) {
            pathFromStart.unshift(current);
            current = current.previousNode;
        }

        // Path from meeting node to end
        const pathFromEnd = [];
        current = meetingNode.previousNodeReverse;
        while (current !== null) {
            pathFromEnd.push(current);
            current = current.previousNodeReverse;
        }

        path = [...pathFromStart, ...pathFromEnd];
    }

    // Mark visited from end with a reverse flag for visualization
    const totalVisited = visitedFromStart.length + visitedFromEnd.length;

    return {
        visitedNodesInOrder: visitedFromStart,
        visitedNodesReverse: visitedFromEnd,
        path,
        stats: {
            nodesExplored: totalVisited,
            pathLength: path.length,
            pathCost: pathFound ? calculatePathCost(path) : 0,
            found: pathFound
        }
    };
}

// ============================================
// ALGORITHM REGISTRY
// ============================================
const ALGORITHMS = {
    dijkstra: {
        name: "Dijkstra's Algorithm",
        fn: dijkstra,
        description: "Explores nodes in order of increasing distance from the start. Guarantees the shortest path even with weighted edges. Does not use a heuristic.",
        tags: [
            { text: 'Optimal', class: 'tag-green' },
            { text: 'Weighted', class: 'tag-blue' },
            { text: 'Complete', class: 'tag-amber' }
        ]
    },
    astar: {
        name: "A* Search",
        fn: aStar,
        description: "Combines actual path cost with a heuristic estimate (Manhattan distance) to efficiently find the shortest path. The gold standard for pathfinding.",
        tags: [
            { text: 'Optimal', class: 'tag-green' },
            { text: 'Weighted', class: 'tag-blue' },
            { text: 'Heuristic', class: 'tag-violet' }
        ]
    },
    bfs: {
        name: "Breadth-First Search",
        fn: bfs,
        description: "Explores all nodes at the current depth before moving deeper. Finds shortest path in unweighted graphs, but ignores edge weights.",
        tags: [
            { text: 'Unweighted', class: 'tag-amber' },
            { text: 'Complete', class: 'tag-green' },
            { text: 'Level-Order', class: 'tag-blue' }
        ]
    },
    greedy: {
        name: "Greedy Best-First",
        fn: greedyBestFirst,
        description: "Uses only the heuristic (estimated distance to goal) to guide search. Very fast but does NOT guarantee the shortest path.",
        tags: [
            { text: 'Not Optimal', class: 'tag-red' },
            { text: 'Fast', class: 'tag-green' },
            { text: 'Heuristic', class: 'tag-violet' }
        ]
    },
    bidirectional: {
        name: "Bidirectional BFS",
        fn: bidirectionalBFS,
        description: "Searches simultaneously from both start and end. Meeting in the middle drastically reduces search space. Unweighted shortest path only.",
        tags: [
            { text: 'Unweighted', class: 'tag-amber' },
            { text: 'Fast', class: 'tag-green' },
            { text: 'Two-Way', class: 'tag-blue' }
        ]
    }
};

// ============================================
// TSP NEAREST NEIGHBOR HEURISTIC
// ============================================
function solveTSPNearestNeighbor(matrix) {
    const n = matrix.length;
    if (n <= 1) return { tour: [0], totalCost: 0 };

    let bestTour = null;
    let bestCost = Infinity;

    // Try starting from each node
    for (let start = 0; start < n; start++) {
        const visited = new Set();
        const tour = [start];
        visited.add(start);
        let totalCost = 0;

        while (tour.length < n) {
            const current = tour[tour.length - 1];
            let nearest = -1;
            let minDist = Infinity;

            for (let i = 0; i < n; i++) {
                if (!visited.has(i) && matrix[current][i] < minDist && matrix[current][i] !== Infinity) {
                    minDist = matrix[current][i];
                    nearest = i;
                }
            }

            if (nearest === -1) break; // Unreachable node
            tour.push(nearest);
            visited.add(nearest);
            totalCost += minDist;
        }

        // Return to start
        if (tour.length === n) {
            totalCost += (matrix[tour[tour.length - 1]][start] || 0);
            if (totalCost < bestCost) {
                bestCost = totalCost;
                bestTour = [...tour, start];
            }
        }
    }

    return {
        tour: bestTour || [0],
        totalCost: bestCost === Infinity ? -1 : bestCost
    };
}
