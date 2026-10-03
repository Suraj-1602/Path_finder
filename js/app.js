/* ============================================
   PathFinder — Main Application Logic
   Grid management, UI, visualization, maze gen
   ============================================ */

// ---- Constants ----
const CELL_SIZE = 25;
const CELL_GAP = 1;
const TOTAL_CELL = CELL_SIZE + CELL_GAP;
const WEIGHT_CYCLE = [3, 5, 10];
const WAYPOINT_LABELS = 'ABCDEFGHIJKLMNOP';

const TOOL = {
    START: 'start',
    END: 'end',
    WALL: 'wall',
    WEIGHT: 'weight',
    WAYPOINT: 'waypoint',
    ERASER: 'eraser'
};
    
// ---- State ----
let grid = [];
let rows = 0;
let cols = 0;
let startNode = null;
let endNode = null;
let currentTool = TOOL.WALL;
let isMouseDown = false;
let isRunning = false;
let animationTimeouts = [];
let waypoints = [];
let waypointIndex = 0;

// ---- DOM Elements ----
const gridEl = document.getElementById('grid');
const gridContainer = document.getElementById('grid-container');
const algorithmSelect = document.getElementById('algorithm-select');
const speedSlider = document.getElementById('speed-slider');
const diagonalToggle = document.getElementById('diagonal-toggle');

const btnVisualize = document.getElementById('btn-visualize');
const btnCompare = document.getElementById('btn-compare');
const btnMaze = document.getElementById('btn-maze');
const btnClearPath = document.getElementById('btn-clear-path');
const btnReset = document.getElementById('btn-reset');
const mazeDropdown = document.getElementById('maze-dropdown');

const statExplored = document.getElementById('stat-explored');
const statPathLength = document.getElementById('stat-path-length');
const statPathCost = document.getElementById('stat-path-cost');
const statTime = document.getElementById('stat-time');

const algoName = document.getElementById('algo-name');
const algoDesc = document.getElementById('algo-desc');
const algoTags = document.getElementById('algo-tags');

const comparisonPanel = document.getElementById('comparison-panel');
const comparisonTbody = document.getElementById('comparison-tbody');
const btnCloseComparison = document.getElementById('btn-close-comparison');

const routingPanel = document.getElementById('routing-panel');
const matrixContainer = document.getElementById('matrix-container');
const tourResult = document.getElementById('tour-result');
const btnComputeMatrix = document.getElementById('btn-compute-matrix');
const btnFindTour = document.getElementById('btn-find-tour');
const btnCloseRouting = document.getElementById('btn-close-routing');

const toastContainer = document.getElementById('toast-container');
const btnSidebar = document.getElementById('btn-sidebar');
const sidebarOverlay = document.getElementById('sidebar-overlay');
const btnHelp = document.getElementById('btn-help');
const helpModal = document.getElementById('help-modal');
const btnCloseHelp = document.getElementById('btn-close-help');
const runStatus = document.getElementById('run-status');
const visualizeLabel = btnVisualize ? btnVisualize.querySelector('.btn-label') : null;

const trafficButton = document.querySelector('[data-tool="weight"]');
const trafficPopup = document.getElementById('traffic-weight-popup');

trafficButton.addEventListener('click', (event) => {
    event.stopPropagation();
    trafficPopup.classList.toggle('hidden');
});

trafficPopup.querySelectorAll('[data-weight]').forEach(button => {
    button.addEventListener('click', (event) => {
        event.stopPropagation();

        selectedWeight = Number(button.dataset.weight);
        
        document.getElementById("traffic-weight-label").textContent = selectedWeight;
        
        document.getElementById("traffic-weight-popup").classList.add("hidden");
        trafficPopup.classList.add('hidden');
    });
});

let mouseUpBound = false;

// ============================================
// INITIALIZATION
// ============================================
function init() {
    calculateGridSize();
    createGrid();
    setDefaultPositions();
    setupEventListeners();
    updateAlgorithmInfo();
    showToast('Welcome! Draw walls and press Visualize to see pathfinding in action.', 'success');
}

function calculateGridSize() {
    const rect = gridContainer.getBoundingClientRect();
    cols = Math.floor((rect.width - 16) / TOTAL_CELL);
    rows = Math.floor((rect.height - 16) / TOTAL_CELL);
    cols = Math.max(10, Math.min(cols, 80));
    rows = Math.max(8, Math.min(rows, 40));
}

function createGrid() {
    grid = [];
    gridEl.innerHTML = '';
    gridEl.style.gridTemplateColumns = `repeat(${cols}, ${CELL_SIZE}px)`;
    gridEl.style.gridTemplateRows = `repeat(${rows}, ${CELL_SIZE}px)`;

    for (let r = 0; r < rows; r++) {
        const row = [];
        for (let c = 0; c < cols; c++) {
            const node = createNode(r, c);
            const el = document.createElement('div');
            el.classList.add('cell');
            el.id = `cell-${r}-${c}`;
            el.dataset.row = r;
            el.dataset.col = c;

            // Mouse events
            el.addEventListener('mousedown', (e) => handleMouseDown(e, r, c));
            el.addEventListener('mouseenter', (e) => handleMouseEnter(e, r, c));
            el.addEventListener('contextmenu', (e) => e.preventDefault());

            node.element = el;
            gridEl.appendChild(el);
            row.push(node);
        }
        grid.push(row);
    }

    if (!mouseUpBound) {
        document.addEventListener('mouseup', handleMouseUp);
        mouseUpBound = true;
    }
}

function setRunStatus(state, label) {
    if (!runStatus) return;
    runStatus.dataset.state = state;
    runStatus.textContent = label;
}

function setRunningUi(running) {
    isRunning = running;
    document.body.classList.toggle('is-running', running);
    btnVisualize.disabled = running;
    btnCompare.disabled = running;
    if (visualizeLabel) {
        visualizeLabel.textContent = running ? 'Searching' : 'Visualize';
    }
    if (running) {
        setRunStatus('running', 'Searching…');
    }
}

function createNode(row, col) {
    return {
        row,
        col,
        isStart: false,
        isEnd: false,
        isWall: false,
        isWaypoint: false,
        waypointLabel: '',
        weight: 1,
        distance: Infinity,
        heuristic: 0,
        totalCost: Infinity,
        previousNode: null,
        isVisited: false,
        isVisitedReverse: false,
        distanceReverse: Infinity,
        previousNodeReverse: null,
        element: null
    };
}

function setDefaultPositions() {
    const startRow = Math.floor(rows / 2);
    const startCol = Math.floor(cols / 4);
    const endRow = Math.floor(rows / 2);
    const endCol = Math.floor(3 * cols / 4);

    setStart(startRow, startCol);
    setEnd(endRow, endCol);
}

// ============================================
// GRID OPERATIONS
// ============================================
function setStart(row, col) {
    if (startNode) {
        startNode.isStart = false;
        startNode.element.classList.remove('cell-start');
    }
    const node = grid[row][col];
    clearNodeState(node);
    node.isStart = true;
    node.element.classList.add('cell-start');
    startNode = node;
}

function setEnd(row, col) {
    if (endNode) {
        endNode.isEnd = false;
        endNode.element.classList.remove('cell-end');
    }
    const node = grid[row][col];
    clearNodeState(node);
    node.isEnd = true;
    node.element.classList.add('cell-end');
    endNode = node;
}

function toggleWall(row, col) {
    const node = grid[row][col];
    if (node.isStart || node.isEnd || node.isWaypoint) return;

    if (node.isWall) {
        node.isWall = false;
        node.element.classList.remove('cell-wall');
    } else {
        clearNodeWeight(node);
        node.isWall = true;
        node.element.classList.add('cell-wall');
    }
}

function setWall(row, col) {
    const node = grid[row][col];
    if (node.isStart || node.isEnd || node.isWaypoint || node.isWall) return;
    clearNodeWeight(node);
    node.isWall = true;
    node.element.classList.add('cell-wall');
}


let selectedWeight = 5;

function cycleWeight(row, col) {
    const node = grid[row][col];

    if (node.isStart || node.isEnd || node.isWall || node.isWaypoint) {
        return;
    }

    clearNodeWeight(node);

    if (selectedWeight === 1) {
        node.weight = 1;
    } else {
        node.weight = selectedWeight;
        node.element.classList.add(`cell-weight-${node.weight}`);
    }
}


function placeWaypoint(row, col) {
    const node = grid[row][col];
    if (node.isStart || node.isEnd || node.isWall) return;

    if (node.isWaypoint) {
        // Remove waypoint
        removeWaypoint(node);
        return;
    }

    if (waypoints.length >= WAYPOINT_LABELS.length) {
        showToast('Maximum number of waypoints reached!', 'error');
        return;
    }

    clearNodeState(node);
    node.isWaypoint = true;
    node.waypointLabel = WAYPOINT_LABELS[waypointIndex];
    node.element.classList.add('cell-waypoint');
    node.element.textContent = node.waypointLabel;

    waypoints.push(node);
    waypointIndex++;

    updateRoutingPanelVisibility();
}

function removeWaypoint(node) {
    node.isWaypoint = false;
    node.element.classList.remove('cell-waypoint');
    node.element.textContent = '';

    waypoints = waypoints.filter(w => w !== node);
    // Re-label remaining waypoints
    waypoints.forEach((wp, i) => {
        wp.waypointLabel = WAYPOINT_LABELS[i];
        wp.element.textContent = wp.waypointLabel;
    });
    waypointIndex = waypoints.length;
    updateRoutingPanelVisibility();
}

function eraseCell(row, col) {
    const node = grid[row][col];
    if (node.isStart || node.isEnd) return;
    if (node.isWaypoint) removeWaypoint(node);
    clearNodeState(node);
}

function clearNodeState(node) {
    node.isWall = false;
    node.weight = 1;
    node.element.classList.remove(
        'cell-wall', 'cell-weight-3', 'cell-weight-5', 'cell-weight-10',
        'cell-visited', 'cell-visited-reverse', 'cell-path', 'cell-tour',
        'cell-waypoint'
    );
    node.element.textContent = '';
    if (node.isWaypoint) {
        node.isWaypoint = false;
        waypoints = waypoints.filter(w => w !== node);
    }
}

function clearNodeWeight(node) {
    node.weight = 1;
    node.element.classList.remove('cell-weight-3', 'cell-weight-5', 'cell-weight-10');
}

// ============================================
// MOUSE EVENT HANDLERS
// ============================================
let dragMode = null; // 'start', 'end', or null

function handleMouseDown(e, row, col) {
    if (isRunning) return;
    e.preventDefault();
    isMouseDown = true;

    const node = grid[row][col];

    // Right click = weight cycling
    if (e.button === 2) {
        cycleWeight(row, col);
        dragMode = 'weight';
        return;
    }

    // Drag start/end nodes
    if (node.isStart) {
        dragMode = 'start';
        return;
    }
    if (node.isEnd) {
        dragMode = 'end';
        return;
    }

    dragMode = null;

    switch (currentTool) {
        case TOOL.START: setStart(row, col); break;
        case TOOL.END: setEnd(row, col); break;
        case TOOL.WALL: toggleWall(row, col); break;
        case TOOL.WEIGHT: cycleWeight(row, col); break;
        case TOOL.WAYPOINT: placeWaypoint(row, col); break;
        case TOOL.ERASER: eraseCell(row, col); break;
    }
}

function handleMouseEnter(e, row, col) {
    if (!isMouseDown || isRunning) return;

    if (dragMode === 'start') {
        setStart(row, col);
        return;
    }
    if (dragMode === 'end') {
        setEnd(row, col);
        return;
    }
    if (dragMode === 'weight') {
        const node = grid[row][col];
        if (!node.isStart && !node.isEnd && !node.isWall && !node.isWaypoint && node.weight === 1) {
            node.weight = 3;
            node.element.classList.add('cell-weight-3');
        }
        return;
    }

    switch (currentTool) {
        case TOOL.WALL: setWall(row, col); break;
        case TOOL.ERASER: eraseCell(row, col); break;
    }
}

function handleMouseUp() {
    isMouseDown = false;
    dragMode = null;
}

// ============================================
// VISUALIZATION
// ============================================
function getAnimationDelay() {
    const speed = parseInt(speedSlider.value);
    // Map 1-100 to ~80ms down to ~2ms (logarithmic)
    return Math.max(2, Math.round(80 / (speed / 10)));
}

function clearVisualization() {
    // Cancel pending animations
    for (const t of animationTimeouts) clearTimeout(t);
    animationTimeouts = [];
    setRunningUi(false);
    setRunStatus('idle', 'Ready');

    // Remove visualization classes from all cells
    for (const row of grid) {
        for (const node of row) {
            node.element.classList.remove('cell-visited', 'cell-visited-reverse', 'cell-path', 'cell-tour');
        }
    }

    // Restore waypoint labels
    for (const wp of waypoints) {
        if (wp.isWaypoint) {
            wp.element.textContent = wp.waypointLabel;
        }
    }

    resetStats();
}

function runAlgorithmByKey(key, sNode, eNode) {
    const algo = ALGORITHMS[key];
    if (!algo) return null;

    const allowDiag = diagonalToggle.checked;
    const t0 = performance.now();
    const result = algo.fn(grid, sNode || startNode, eNode || endNode, allowDiag);
    const t1 = performance.now();
    result.stats.time = Math.round((t1 - t0) * 100) / 100;
    return result;
}

function visualize() {
    if (isRunning) return;
    if (!startNode || !endNode) {
        showToast('Please place both a start and end point!', 'error');
        return;
    }

    clearVisualization();
    comparisonPanel.classList.add('hidden');

    const algoKey = algorithmSelect.value;
    const result = runAlgorithmByKey(algoKey);

    if (!result) return;

    const delay = getAnimationDelay();
    setRunningUi(true);

    // Animate visited nodes
    const { visitedNodesInOrder, visitedNodesReverse, path, stats } = result;

    for (let i = 0; i < visitedNodesInOrder.length; i++) {
        animationTimeouts.push(setTimeout(() => {
            const node = visitedNodesInOrder[i];
            if (!node.isStart && !node.isEnd && !node.isWaypoint) {
                node.element.classList.add('cell-visited');
            }
        }, delay * i));
    }

    // Animate reverse visited (bidirectional)
    if (visitedNodesReverse && visitedNodesReverse.length > 0) {
        for (let i = 0; i < visitedNodesReverse.length; i++) {
            animationTimeouts.push(setTimeout(() => {
                const node = visitedNodesReverse[i];
                if (!node.isStart && !node.isEnd && !node.isWaypoint) {
                    node.element.classList.add('cell-visited-reverse');
                }
            }, delay * i));
        }
    }

    const totalVisitedTime = delay * Math.max(
        visitedNodesInOrder.length,
        (visitedNodesReverse ? visitedNodesReverse.length : 0)
    );

    // Animate path
    
    // Animate path
    if (path.length > 0) {
        for (let i = 0; i < path.length; i++) {
            animationTimeouts.push(setTimeout(() => {
                const node = path[i];

                if (!node.isStart && !node.isEnd) {
                    node.element.classList.add('cell-path');
                }

                // Finish only after the last path cell is animated
                if (i === path.length - 1) {
                    updateStats(stats);

                    // isRunning = false;
                    // btnVisualize.disabled = false;
                    // btnCompare.disabled = false;
                    setRunningUi(false);
                    setRunStatus('found', 'Path Found');
                }
            }, totalVisitedTime + 40 * i));
        }
    } else {
        animationTimeouts.push(setTimeout(() => {
            updateStats(stats);
    
            isRunning = false;
            btnVisualize.disabled = false;
            btnCompare.disabled = false;
    
            if (!stats.found) {
                showToast(
                    'No path found! The end node is unreachable.',
                    'error'
                );
            }else {
                setRunStatus('found', 'Path Found');
            }
        }, totalVisitedTime));
    }

    // Update stats
    // updateStats(stats);
}

function compareAll() {
    if (isRunning) return;
    if (!startNode || !endNode) {
        showToast('Please place both a start and end point!', 'error');
        return;
    }

    clearVisualization();

    const results = [];
    for (const [key, algo] of Object.entries(ALGORITHMS)) {
        const result = runAlgorithmByKey(key);
        results.push({ key, name: algo.name, ...result });
    }

    // Display comparison table
    comparisonTbody.innerHTML = '';

    // Find best values
    const validResults = results.filter(r => r.stats.found);
    const bestExplored = validResults.length > 0 ? Math.min(...validResults.map(r => r.stats.nodesExplored)) : -1;
    const bestCost = validResults.length > 0 ? Math.min(...validResults.map(r => r.stats.pathCost)) : -1;
    const bestTime = validResults.length > 0 ? Math.min(...validResults.map(r => r.stats.time)) : -1;

    for (const r of results) {
        const tr = document.createElement('tr');
        const exploredClass = r.stats.nodesExplored === bestExplored ? 'best-value' : '';
        const costClass = r.stats.found && r.stats.pathCost === bestCost ? 'best-value' : '';
        const timeClass = r.stats.found && r.stats.time === bestTime ? 'best-value' : '';

        tr.innerHTML = `
            <td>${r.name}</td>
            <td class="${exploredClass}">${r.stats.nodesExplored}</td>
            <td>${r.stats.pathLength}</td>
            <td class="${costClass}">${r.stats.found ? r.stats.pathCost : '—'}</td>
            <td class="${timeClass}">${r.stats.time}ms</td>
            <td class="${r.stats.found ? 'status-found' : 'status-not-found'}">
                ${r.stats.found ? '✓ Found' : '✗ No Path'}
            </td>
        `;
        comparisonTbody.appendChild(tr);
    }

    comparisonPanel.classList.remove('hidden');
    setRunStatus('idle', 'Compared');

    // Restore start/end visuals (algorithms can mess them up)
    startNode.element.classList.add('cell-start');
    endNode.element.classList.add('cell-end');
    for (const wp of waypoints) {
        wp.element.classList.add('cell-waypoint');
        wp.element.textContent = wp.waypointLabel;
    }

    showToast('Algorithm comparison complete!', 'success');
}

function updateStats(stats) {
    statExplored.textContent = stats.nodesExplored || '—';
    statPathLength.textContent = stats.pathLength || '—';
    statPathCost.textContent = stats.found ? stats.pathCost : '—';
    statTime.textContent = stats.time !== undefined ? `${stats.time}` : '—';
}

function resetStats() {
    statExplored.textContent = '—';
    statPathLength.textContent = '—';
    statPathCost.textContent = '—';
    statTime.textContent = '—';
}

function resetGrid() {
    if (isRunning) {
        for (const t of animationTimeouts) clearTimeout(t);
        animationTimeouts = [];
        setRunningUi(false);
    }

    waypoints = [];
    waypointIndex = 0;
    comparisonPanel.classList.add('hidden');
    routingPanel.classList.add('hidden');

    createGrid();
    setDefaultPositions();
    resetStats();
    setRunningUi(false);
    setRunStatus('idle', 'Ready');

    showToast('Grid reset!', 'success');
}

// ============================================
// ALGORITHM INFO UPDATE
// ============================================
function updateAlgorithmInfo() {
    const key = algorithmSelect.value;
    const algo = ALGORITHMS[key];
    if (!algo) return;

    algoName.textContent = algo.name;
    algoDesc.textContent = algo.description;

    algoTags.innerHTML = '';
    for (const tag of algo.tags) {
        const span = document.createElement('span');
        span.className = `tag ${tag.class}`;
        span.textContent = tag.text;
        algoTags.appendChild(span);
    }
}

// ============================================
// MAZE GENERATION
// ============================================
function generateMaze(type) {
    if (isRunning) return;
    clearVisualization();

    // Clear all walls and weights first
    for (const row of grid) {
        for (const node of row) {
            if (!node.isStart && !node.isEnd && !node.isWaypoint) {
                node.isWall = false;
                node.weight = 1;
                node.element.classList.remove('cell-wall', 'cell-weight-3', 'cell-weight-5', 'cell-weight-10');
            }
        }
    }

    switch (type) {
        case 'recursive': recursiveDivisionMaze(); break;
        case 'random-walls': randomWallsMaze(); break;
        case 'random-weights': randomWeightsMaze(); break;
        case 'staircase': staircaseMaze(); break;
    }

    showToast('Maze generated!', 'success');
}

function recursiveDivisionMaze() {
    // Add border
    for (let r = 0; r < rows; r++) {
        safeSetWall(r, 0);
        safeSetWall(r, cols - 1);
    }
    for (let c = 0; c < cols; c++) {
        safeSetWall(0, c);
        safeSetWall(rows - 1, c);
    }

    divide(1, rows - 2, 1, cols - 2);
}

function divide(rStart, rEnd, cStart, cEnd) {
    if (rEnd - rStart < 2 || cEnd - cStart < 2) return;

    const horizontal = (rEnd - rStart) >= (cEnd - cStart);

    if (horizontal) {
        const wallRow = randomEven(rStart + 1, rEnd);
        if (wallRow === -1) return;
        const passageCol = randomOdd(cStart, cEnd);

        for (let c = cStart; c <= cEnd; c++) {
            if (c !== passageCol) safeSetWall(wallRow, c);
        }

        divide(rStart, wallRow - 1, cStart, cEnd);
        divide(wallRow + 1, rEnd, cStart, cEnd);
    } else {
        const wallCol = randomEven(cStart + 1, cEnd);
        if (wallCol === -1) return;
        const passageRow = randomOdd(rStart, rEnd);

        for (let r = rStart; r <= rEnd; r++) {
            if (r !== passageRow) safeSetWall(r, wallCol);
        }

        divide(rStart, rEnd, cStart, wallCol - 1);
        divide(rStart, rEnd, wallCol + 1, cEnd);
    }
}

function randomEven(min, max) {
    const evens = [];
    for (let i = min; i <= max; i++) {
        if (i % 2 === 0) evens.push(i);
    }
    return evens.length > 0 ? evens[Math.floor(Math.random() * evens.length)] : -1;
}

function randomOdd(min, max) {
    const odds = [];
    for (let i = min; i <= max; i++) {
        if (i % 2 !== 0) odds.push(i);
    }
    if (odds.length === 0) {
        // Fallback: any position
        return min + Math.floor(Math.random() * (max - min + 1));
    }
    return odds[Math.floor(Math.random() * odds.length)];
}

function safeSetWall(row, col) {
    const node = grid[row][col];
    if (node.isStart || node.isEnd || node.isWaypoint) return;
    node.isWall = true;
    node.weight = 1;
    node.element.classList.remove('cell-weight-3', 'cell-weight-5', 'cell-weight-10');
    node.element.classList.add('cell-wall');
}

function randomWallsMaze() {
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            if (Math.random() < 0.3) {
                safeSetWall(r, c);
            }
        }
    }
}

function randomWeightsMaze() {
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            const node = grid[r][c];
            if (node.isStart || node.isEnd || node.isWall || node.isWaypoint) continue;
            if (Math.random() < 0.35) {
                const wIdx = Math.floor(Math.random() * WEIGHT_CYCLE.length);
                node.weight = WEIGHT_CYCLE[wIdx];
                node.element.classList.add(`cell-weight-${node.weight}`);
            }
        }
    }
}

function staircaseMaze() {
    let col = 1;
    let direction = 1; // 1 = right, -1 = left

    for (let r = 2; r < rows - 2; r += 2) {
        for (let c = 0; c < cols; c++) {
            if (c !== col) {
                safeSetWall(r, c);
            }
        }
        col += direction * 4;
        if (col >= cols - 2 || col <= 1) {
            direction *= -1;
            col += direction * 4;
        }
    }
}

// ============================================
// ROUTING MATRIX
// ============================================
function updateRoutingPanelVisibility() {
    if (waypoints.length >= 2) {
        routingPanel.classList.remove('hidden');
        btnFindTour.disabled = true;
    } else {
        routingPanel.classList.add('hidden');
    }
}

let lastRoutingMatrix = null;

function computeRoutingMatrix() {
    if (waypoints.length < 2) {
        showToast('Place at least 2 waypoints!', 'error');
        return;
    }

    clearVisualization();

    const n = waypoints.length;
    const algoKey = algorithmSelect.value;
    const matrix = [];
    const paths = {};

    for (let i = 0; i < n; i++) {
        matrix[i] = [];
        for (let j = 0; j < n; j++) {
            if (i === j) {
                matrix[i][j] = 0;
            } else {
                const result = runAlgorithmByKey(algoKey, waypoints[i], waypoints[j]);
                matrix[i][j] = result.stats.found ? result.stats.pathCost : Infinity;
                if (result.stats.found) {
                    paths[`${i}-${j}`] = result.path;
                }
            }
        }
    }

    lastRoutingMatrix = { matrix, paths, n };

    // Render matrix table
    let html = '<table class="routing-matrix-table"><thead><tr><th></th>';
    for (let i = 0; i < n; i++) {
        html += `<th>${waypoints[i].waypointLabel}</th>`;
    }
    html += '</tr></thead><tbody>';

    for (let i = 0; i < n; i++) {
        html += `<tr><th>${waypoints[i].waypointLabel}</th>`;
        for (let j = 0; j < n; j++) {
            const val = matrix[i][j];
            if (i === j) {
                html += `<td class="diagonal">0</td>`;
            } else if (val === Infinity) {
                html += `<td class="unreachable">∞</td>`;
            } else {
                html += `<td>${val}</td>`;
            }
        }
        html += '</tr>';
    }
    html += '</tbody></table>';

    matrixContainer.innerHTML = html;
    btnFindTour.disabled = false;
    tourResult.classList.add('hidden');

    // Restore waypoint visuals
    for (const wp of waypoints) {
        wp.element.classList.add('cell-waypoint');
        wp.element.textContent = wp.waypointLabel;
    }
    if (startNode) startNode.element.classList.add('cell-start');
    if (endNode) endNode.element.classList.add('cell-end');

    showToast('Routing matrix computed!', 'success');
}

function findOptimalTour() {
    if (!lastRoutingMatrix || lastRoutingMatrix.n < 2) return;

    const { matrix, paths, n } = lastRoutingMatrix;
    const tspResult = solveTSPNearestNeighbor(matrix);

    if (tspResult.totalCost === -1) {
        showToast('Cannot find a complete tour — some waypoints are unreachable!', 'error');
        return;
    }

    // Show tour result
    const tourLabels = tspResult.tour.map(i => waypoints[i].waypointLabel).join(' → ');
    tourResult.innerHTML = `
        <h4>Optimal Tour (Nearest Neighbor Heuristic)</h4>
        <p>Route: ${tourLabels}</p>
        <p>Total Cost: ${tspResult.totalCost}</p>
    `;
    tourResult.classList.remove('hidden');

    // Visualize the tour path
    clearVisualization();
    let delay = 0;
    const pathDelay = 30;

    for (let i = 0; i < tspResult.tour.length - 1; i++) {
        const from = tspResult.tour[i];
        const to = tspResult.tour[i + 1];
        const pathKey = `${from}-${to}`;
        const path = paths[pathKey];

        if (path) {
            for (let j = 0; j < path.length; j++) {
                animationTimeouts.push(setTimeout(() => {
                    const node = path[j];
                    if (!node.isStart && !node.isEnd && !node.isWaypoint) {
                        node.element.classList.add('cell-tour');
                    }
                }, delay));
                delay += pathDelay;
            }
        }
    }

    setRunStatus('found', 'Tour ready');
    showToast('Optimal tour visualized!', 'success');
}

// ============================================
// TOAST NOTIFICATIONS
// ============================================
function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    toastContainer.appendChild(toast);

    setTimeout(() => {
        toast.classList.add('toast-out');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// ============================================
// EVENT LISTENERS
// ============================================
function setSidebarOpen(open) {
    document.body.classList.toggle('sidebar-open', open);
    if (btnSidebar) btnSidebar.setAttribute('aria-expanded', String(open));
    if (sidebarOverlay) sidebarOverlay.hidden = !open;
}

function setHelpOpen(open) {
    if (!helpModal) return;
    helpModal.classList.toggle('hidden', !open);
    helpModal.setAttribute('aria-hidden', String(!open));
}

function setupEventListeners() {
    // Visualize button
    btnVisualize.addEventListener('click', visualize);

    // Compare button
    btnCompare.addEventListener('click', compareAll);

    // Clear path
    btnClearPath.addEventListener('click', clearVisualization);

    // Reset grid
    btnReset.addEventListener('click', resetGrid);

    // Algorithm change
    algorithmSelect.addEventListener('change', updateAlgorithmInfo);

    // Tool selection
    const toolBtns = document.querySelectorAll('.tool-btn');
    toolBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            toolBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentTool = btn.dataset.tool;
            if (window.matchMedia('(max-width: 980px)').matches) {
                setSidebarOpen(false);
            }
        });
    });

    // Maze dropdown
    btnMaze.addEventListener('click', (e) => {
        e.stopPropagation();
        const willOpen = mazeDropdown.classList.contains('hidden');
        mazeDropdown.classList.toggle('hidden');
        btnMaze.setAttribute('aria-expanded', String(willOpen));
    });

    document.addEventListener('click', () => {
        mazeDropdown.classList.add('hidden');
        btnMaze.setAttribute('aria-expanded', 'false');
    });

    mazeDropdown.querySelectorAll('button').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            generateMaze(btn.dataset.maze);
            mazeDropdown.classList.add('hidden');
            btnMaze.setAttribute('aria-expanded', 'false');
        });
    });

    if (btnSidebar) {
        btnSidebar.addEventListener('click', (e) => {
            e.stopPropagation();
            setSidebarOpen(!document.body.classList.contains('sidebar-open'));
        });
    }
    if (sidebarOverlay) {
        sidebarOverlay.addEventListener('click', () => setSidebarOpen(false));
    }
    if (btnHelp) btnHelp.addEventListener('click', () => setHelpOpen(true));
    if (btnCloseHelp) btnCloseHelp.addEventListener('click', () => setHelpOpen(false));
    if (helpModal) {
        helpModal.querySelectorAll('[data-close-help]').forEach((el) => {
            el.addEventListener('click', () => setHelpOpen(false));
        });
    }

    // Close comparison panel
    btnCloseComparison.addEventListener('click', () => {
        comparisonPanel.classList.add('hidden');
    });

    // Routing matrix
    btnComputeMatrix.addEventListener('click', computeRoutingMatrix);
    btnFindTour.addEventListener('click', findOptimalTour);
    btnCloseRouting.addEventListener('click', () => {
        routingPanel.classList.add('hidden');
    });

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            setHelpOpen(false);
            setSidebarOpen(false);
            mazeDropdown.classList.add('hidden');
            btnMaze.setAttribute('aria-expanded', 'false');
        }

        if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') return;
        if (helpModal && !helpModal.classList.contains('hidden')) return;

        switch (e.key.toLowerCase()) {
            case 'v': case 'enter':
                e.preventDefault();
                visualize();
                break;
            case 'c':
                e.preventDefault();
                clearVisualization();
                break;
            case 'r':
                e.preventDefault();
                resetGrid();
                break;
            case '1': setToolByKey(TOOL.START); break;
            case '2': setToolByKey(TOOL.END); break;
            case '3': setToolByKey(TOOL.WALL); break;
            case '4': setToolByKey(TOOL.WEIGHT); break;
            case '5': setToolByKey(TOOL.WAYPOINT); break;
            case '6': setToolByKey(TOOL.ERASER); break;
        }
    });

    // Window resize
    let resizeTimeout;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
            const oldStart = startNode ? { row: startNode.row, col: startNode.col } : null;
            const oldEnd = endNode ? { row: endNode.row, col: endNode.col } : null;

            calculateGridSize();
            createGrid();

            if (oldStart && oldStart.row < rows && oldStart.col < cols) {
                setStart(oldStart.row, oldStart.col);
            } else {
                setDefaultPositions();
            }
            if (oldEnd && oldEnd.row < rows && oldEnd.col < cols) {
                setEnd(oldEnd.row, oldEnd.col);
            }
        }, 300);
    });
}

function setToolByKey(tool) {
    currentTool = tool;
    const toolBtns = document.querySelectorAll('.tool-btn');
    toolBtns.forEach(b => {
        b.classList.toggle('active', b.dataset.tool === tool);
    });
}

// ============================================
// START
// ============================================
document.addEventListener('DOMContentLoaded', init);
