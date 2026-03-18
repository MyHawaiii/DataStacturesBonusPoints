/**
 * ==========================================
 * 1. Min-Priority Queue (Min-Heap)
 * ==========================================
 */
class MinPriorityQueue {
    constructor() {
        this.heap = [];
    }
    getLeftChildIndex(parentIndex) { return 2 * parentIndex + 1; }
    getRightChildIndex(parentIndex) { return 2 * parentIndex + 2; }
    getParentIndex(childIndex) { return Math.floor((childIndex - 1) / 2); }
    hasLeftChild(index) { return this.getLeftChildIndex(index) < this.heap.length; }
    hasRightChild(index) { return this.getRightChildIndex(index) < this.heap.length; }
    hasParent(index) { return this.getParentIndex(index) >= 0; }
    leftChild(index) { return this.heap[this.getLeftChildIndex(index)]; }
    rightChild(index) { return this.heap[this.getRightChildIndex(index)]; }
    parent(index) { return this.heap[this.getParentIndex(index)]; }
    swap(indexOne, indexTwo) {
        const temp = this.heap[indexOne];
        this.heap[indexOne] = this.heap[indexTwo];
        this.heap[indexTwo] = temp;
    }
    enqueue(node, priority) {
        this.heap.push({ node, priority });
        this.heapifyUp();
    }
    dequeue() {
        if (this.heap.length === 0) return null;
        if (this.heap.length === 1) return this.heap.pop();
        const item = this.heap[0];
        this.heap[0] = this.heap.pop();
        this.heapifyDown();
        return item;
    }
    heapifyUp() {
        let index = this.heap.length - 1;
        while (this.hasParent(index) && this.parent(index).priority > this.heap[index].priority) {
            this.swap(this.getParentIndex(index), index);
            index = this.getParentIndex(index);
        }
    }
    heapifyDown() {
        let index = 0;
        while (this.hasLeftChild(index)) {
            let smallerChildIndex = this.getLeftChildIndex(index);
            if (this.hasRightChild(index) && this.rightChild(index).priority < this.leftChild(index).priority) {
                smallerChildIndex = this.getRightChildIndex(index);
            }
            if (this.heap[index].priority <= this.heap[smallerChildIndex].priority) {
                break;
            } else {
                this.swap(index, smallerChildIndex);
            }
            index = smallerChildIndex;
        }
    }
    isEmpty() { return this.heap.length === 0; }
}

/**
 * ==========================================
 * 2. Graph Representation
 * ==========================================
 */
class Graph {
    constructor() { this.adjacencyList = new Map(); }
    addVertex(vertex) {
        if (!this.adjacencyList.has(vertex)) this.adjacencyList.set(vertex, []);
    }
    addEdge(vertex1, vertex2, weight, isDirected = false) {
        this.addVertex(vertex1);
        this.addVertex(vertex2);
        this.adjacencyList.get(vertex1).push({ node: vertex2, weight });
        if (!isDirected) this.adjacencyList.get(vertex2).push({ node: vertex1, weight });
    }
    removeVertex(vertex) {
        this.adjacencyList.delete(vertex);
        for (let [v, edges] of this.adjacencyList.entries()) {
            this.adjacencyList.set(v, edges.filter(e => e.node !== vertex));
        }
    }
    removeEdge(vertex1, vertex2, isDirected = false) {
        if (this.adjacencyList.has(vertex1)) {
            this.adjacencyList.set(vertex1, this.adjacencyList.get(vertex1).filter(e => e.node !== vertex2));
        }
        if (!isDirected && this.adjacencyList.has(vertex2)) {
            this.adjacencyList.set(vertex2, this.adjacencyList.get(vertex2).filter(e => e.node !== vertex1));
        }
    }
    getNeighbors(vertex) { return this.adjacencyList.get(vertex) || []; }
    getVertices() { return Array.from(this.adjacencyList.keys()); }
    clear() { this.adjacencyList.clear(); }
}

/**
 * ==========================================
 * 3. Dijkstra's Algorithm (Generator)
 * ==========================================
 */
function* runDijkstraStepByStep(graph, startNode, endNode) {
    const distances = new Map();
    const previous = new Map();
    const pq = new MinPriorityQueue();
    const visited = new Set();
    
    for (let vertex of graph.getVertices()) {
        if (vertex === startNode) {
            distances.set(vertex, 0);
            pq.enqueue(vertex, 0);
        } else {
            distances.set(vertex, Infinity);
        }
        previous.set(vertex, null);
    }
    
    yield {
        type: 'INIT',
        message: `Initialization: Set distance to source node (${startNode}) to 0 and all other nodes to Infinity. Added source to Priority Queue.`,
        distances: new Map(distances),
        pqState: pq.heap.map(item => ({...item})),
        previous: new Map(previous)
    };

    while (!pq.isEmpty()) {
        const currentItem = pq.dequeue();
        const currentNode = currentItem.node;
        
        yield {
            type: 'EXTRACT_MIN',
            currentNode,
            message: `Extracted node ${currentNode} from Priority Queue with shortest known distance: ${currentItem.priority}.`,
            distances: new Map(distances),
            pqState: pq.heap.map(item => ({...item})),
            previous: new Map(previous)
        };

        if (currentNode === endNode) {
            yield {
                type: 'PATH_FOUND',
                currentNode,
                message: `Reached the destination node ${endNode}! We can now backtrack to find the shortest path.`,
                distances: new Map(distances),
                pqState: pq.heap.map(item => ({...item})),
                previous: new Map(previous)
            };
            break;
        }

        if (visited.has(currentNode)) {
             yield {
                 type: 'ALREADY_VISITED',
                 currentNode,
                 message: `Node ${currentNode} has already been processed optimally. Skipping.`,
                 distances: new Map(distances),
                 pqState: pq.heap.map(item => ({...item})),
                 previous: new Map(previous)
             };
             continue;
        }
        
        visited.add(currentNode);
        const neighbors = graph.getNeighbors(currentNode);
        
        for (let edge of neighbors) {
            const neighborNode = edge.node;
            const weight = edge.weight;
            
            if (visited.has(neighborNode)) continue;

            yield {
                type: 'CHECK_NEIGHBOR',
                currentNode,
                neighborNode,
                weight,
                message: `Checking neighbor ${neighborNode} of node ${currentNode}. Edge weight is ${weight}.`,
                distances: new Map(distances),
                pqState: pq.heap.map(item => ({...item})),
                previous: new Map(previous)
            };

            const candidateDistance = distances.get(currentNode) + weight;
            const knownDistance = distances.get(neighborNode);

            if (candidateDistance < knownDistance) {
                distances.set(neighborNode, candidateDistance);
                previous.set(neighborNode, currentNode);
                pq.enqueue(neighborNode, candidateDistance);
                
                yield {
                    type: 'EDGE_RELAXED',
                    currentNode,
                    neighborNode,
                    weight,
                    candidateDistance,
                    message: `Found a shorter path to ${neighborNode}! Updated distance to ${candidateDistance}. Added ${neighborNode} to Priority Queue.`,
                    distances: new Map(distances),
                    pqState: pq.heap.map(item => ({...item})),
                    previous: new Map(previous)
                };
            } else {
                 yield {
                    type: 'EDGE_NOT_RELAXED',
                    currentNode,
                    neighborNode,
                    weight,
                    candidateDistance,
                    message: `Path to ${neighborNode} via ${currentNode} is NOT shorter. No update.`,
                    distances: new Map(distances),
                    pqState: pq.heap.map(item => ({...item})),
                    previous: new Map(previous)
                };
            }
        }
    }

    const path = [];
    let curr = endNode;
    if (previous.get(curr) !== null || curr === startNode) {
        while (curr !== null) {
            path.unshift(curr);
            curr = previous.get(curr);
        }
    }

    yield {
        type: 'DONE',
        path: path.length > 1 ? path : [],
        message: path.length > 1 ? `Algorithm finished! Shortest path is: ${path.join(' -> ')}` : `Algorithm finished. No path found.`,
        distances: new Map(distances),
        pqState: pq.heap.map(item => ({...item})),
        previous: new Map(previous)
    };
}

/**
 * ==========================================
 * 4. Toast Notification System
 * ==========================================
 */
function showError(message) {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    container.appendChild(toast);
    
    setTimeout(() => toast.classList.add('show'), 10);
    
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 5000);
}

/**
 * ==========================================
 * 5. Application Framework, SPA Routing, & Common Logic
 * ==========================================
 */

// Shared Visualizer Logic Factory
function createVisualUpdater(cyInstance, explanationsObj) {
    return function processState(state, historyArr, currentIndex, showColors) {
        const { expText, pqSpan, distContainer } = explanationsObj;
        
        expText.innerHTML = `<strong>${state.type}</strong>: ${state.message}`;
        if (state.pqState) pqSpan.innerHTML = state.pqState.map(item => `[${item.node}: ${item.priority}]`).join(', ') || '(Empty)';

        if (state.distances) {
            const tableHtml = ['<table class="dist-table">', '<tr><th>Node</th><th>Distance</th><th>Previous</th></tr>'];
            state.distances.forEach((d, n) => {
                const hl = (state.neighborNode === n && ['EDGE_RELAXED','EDGE_NOT_RELAXED','CHECK_NEIGHBOR'].includes(state.type)) ? ' class="highlight-row"' : '';
                const pNode = (state.previous && state.previous.get(n)) || '-';
                const distStr = d === Infinity ? '&infin;' : d;
                tableHtml.push(`<tr${hl}><td>${n}</td><td>${distStr}</td><td>${pNode}</td></tr>`);
            });
            tableHtml.push('</table>');
            distContainer.innerHTML = tableHtml.join('');

            // Push aggressively into floating table 
            const floatingContent = document.getElementById('floating-table-content');
            if (floatingContent) floatingContent.innerHTML = tableHtml.join('');
        }

        cyInstance.edges().removeClass('eval-edge dynamic-tree-edge path-edge dimmed');
        cyInstance.nodes().removeClass('current visited');

        if (showColors) {
            for (let i = 0; i <= currentIndex; i++) {
                const hState = historyArr[i];
                if (hState && hState.type === 'EXTRACT_MIN' && hState.currentNode) {
                    cyInstance.getElementById(hState.currentNode).addClass('visited');
                }
            }
        }

        if (showColors && state.previous) {
            for (const [node, prevNode] of state.previous.entries()) {
                if (prevNode !== null) {
                    const edges = cyInstance.edges(`[source = "${node}"][target = "${prevNode}"], [source = "${prevNode}"][target = "${node}"]`);
                    edges.addClass('dynamic-tree-edge');
                }
            }
        }

        switch (state.type) {
            case 'EXTRACT_MIN':
                 if (state.currentNode) cyInstance.getElementById(state.currentNode).addClass('current');
                 break;
                 
            case 'CHECK_NEIGHBOR':
            case 'EDGE_NOT_RELAXED':
            case 'EDGE_RELAXED':
                 if (state.currentNode && state.neighborNode && showColors) {
                     cyInstance.edges(`[source = "${state.currentNode}"][target = "${state.neighborNode}"], [source = "${state.neighborNode}"][target = "${state.currentNode}"]`).addClass('eval-edge');
                 }
                 break;
                 
            case 'PATH_FOUND':
            case 'DONE':
                 cyInstance.edges().removeClass('dynamic-tree-edge').addClass('dimmed');
                 if (state.previous) {
                     for (const [node, prevNode] of state.previous.entries()) {
                         if (prevNode !== null) {
                             cyInstance.edges(`[source = "${node}"][target = "${prevNode}"], [source = "${prevNode}"][target = "${node}"]`).removeClass('dimmed').addClass('tree-edge');
                         }
                     }
                 }
                 if (state.path && state.path.length > 0) {
                     for (let i = 0; i < state.path.length - 1; i++) {
                         const u = state.path[i];
                         const v = state.path[i+1];
                         cyInstance.edges(`[source = "${u}"][target = "${v}"], [source = "${v}"][target = "${u}"]`).removeClass('dimmed tree-edge').addClass('path-edge');
                     }
                     expText.innerHTML += `<br><br><strong>Final Path:</strong> ${state.path.join(' &rarr; ')}`;
                 }
                 break;
        }
    }
}

// Global Toolbar Editing Event State Hook
window.currentToolMode = 'addNode';

function rebuildInternalGraph(cyInstance, internalGraphObj) {
    internalGraphObj.clear();
    cyInstance.nodes().forEach(n => internalGraphObj.addVertex(n.id()));
    cyInstance.edges().forEach(e => internalGraphObj.addEdge(e.source().id(), e.target().id(), parseInt(e.data('weight')), false));
}

function attachGraphEditorEvents(cyInstance, internalGraphObj, dropdownUpdater) {
    let firstSelectedNode = null;
    let localNodeCounter = cyInstance.nodes().length;
    let localEdgeCounter = cyInstance.edges().length;

    cyInstance.on('tap', (e) => {
        const mode = window.currentToolMode;
        const target = e.target;

        if (mode === 'addNode' && target === cyInstance) {
            const id = `V${Date.now()}N${localNodeCounter++}`; // Guarantee uniqueness across clears
            internalGraphObj.addVertex(id);
            cyInstance.add({ data: { id, label: `N${localNodeCounter}` }, position: { x: e.position.x, y: e.position.y } });
            dropdownUpdater();
        } 
        else if (mode === 'addEdge' && target.isNode && target.isNode()) {
            if (!firstSelectedNode) {
                firstSelectedNode = target.id();
                target.addClass('current');
            } else {
                const source = firstSelectedNode;
                const dest = target.id();
                cyInstance.getElementById(source).removeClass('current');
                firstSelectedNode = null;
                
                if (source !== dest && !internalGraphObj.getNeighbors(source).some(n => n.node === dest)) {
                    let weightStr = prompt(`Enter non-negative integer weight for edge ${source} -> ${dest}:`, "1");
                    if (weightStr !== null) {
                        const weight = parseInt(weightStr);
                        if (!isNaN(weight) && weight >= 0) {
                            cyInstance.add({ data: { id: `cE${Date.now()}E${localEdgeCounter++}`, source, target: dest, weight } });
                            rebuildInternalGraph(cyInstance, internalGraphObj);
                        } else if (weight < 0) {
                            showError("Error: Dijkstra's Algorithm Mathematically fails with negative edges. It strictly requires non-negative weights!");
                        } else {
                            showError("Failed: Invalid weight! Must be a non-negative integer.");
                        }
                    }
                }
            }
        }
        else if (mode === 'editWeight' && target.isEdge && target.isEdge()) {
            let weightStr = prompt(`Edit weight for this edge:`, target.data('weight'));
            if (weightStr !== null) {
                const weight = parseInt(weightStr);
                if (!isNaN(weight) && weight >= 0) {
                    target.data('weight', weight);
                    rebuildInternalGraph(cyInstance, internalGraphObj);
                } else if (weight < 0) {
                    showError("Error: Dijkstra's Alg inherently breaks with negative edge weights! A negative edge will loop infinitely or trace incorrect shortest paths. Positives entirely required.");
                } else {
                    showError("Invalid weight. Expected a non-negative number.");
                }
            }
        }
        else if (mode === 'remove' && target !== cyInstance) {
            if (target.isNode() || target.isEdge()) {
                target.remove();
                rebuildInternalGraph(cyInstance, internalGraphObj);
                dropdownUpdater();
                firstSelectedNode = null;
            }
        }
    });

    // Reset floating selected node when clicking background broadly
    cyInstance.on('tap', (e) => {
        if (e.target === cyInstance && firstSelectedNode) {
            cyInstance.getElementById(firstSelectedNode).removeClass('current');
            firstSelectedNode = null;
        }
    });
}


// Abstracted Basic Visual Settings (For Static Pages)
function configureVisualizerControls(prefix, cyInstance, internalGraphObj) {
    const startBtn = document.getElementById(`${prefix}start-btn`);
    const nextBtn = document.getElementById(`${prefix}next-btn`);
    const prevBtn = document.getElementById(`${prefix}prev-btn`);
    const nextIterBtn = document.getElementById(`${prefix}next-iter-btn`);
    const sourceSelect = document.getElementById(`${prefix}source-node`);
    const destSelect = document.getElementById(`${prefix}dest-node`);
    const showColorsChk = document.getElementById(`${prefix}show-colors-chk`);
    
    const expText = document.getElementById(`${prefix}explanation-text`);
    const pqSpan = document.querySelector(`#${prefix}pq-state span`);
    const distContainer = document.querySelector(`#${prefix}distances-state .distances-table-container`);

    const updater = createVisualUpdater(cyInstance, { expText, pqSpan, distContainer });
    
    let generator = null; let history = []; let historyIdx = -1;

    function applyState() {
        updater(history[historyIdx], history, historyIdx, showColorsChk.checked);
        const isDone = history[historyIdx].type === 'DONE' || history[historyIdx].type === 'PATH_FOUND';
        
        prevBtn.disabled = historyIdx <= 0;
        nextBtn.disabled = isDone && historyIdx === history.length - 1 && generator.next().done; 
        
        if (isDone && historyIdx === history.length - 1) {
            nextBtn.disabled = true; nextIterBtn.disabled = true;
            startBtn.disabled = false; sourceSelect.disabled = false; destSelect.disabled = false;
        } else if (historyIdx < history.length - 1) {
            nextBtn.disabled = false; nextIterBtn.disabled = false;
        }
    }

    startBtn.addEventListener('click', () => {
        if (!sourceSelect.value || !destSelect.value) { showError("Ensure both Source and Destination nodes are selected."); return; }
        
        cyInstance.elements().removeClass('source target visited current path-edge eval-edge tree-edge dimmed dynamic-tree-edge');
        if (cyInstance.getElementById(sourceSelect.value).length) cyInstance.getElementById(sourceSelect.value).addClass('source');
        if (cyInstance.getElementById(destSelect.value).length) cyInstance.getElementById(destSelect.value).addClass('target');

        generator = runDijkstraStepByStep(internalGraphObj, sourceSelect.value, destSelect.value);
        history = []; historyIdx = -1;
        const first = generator.next(); if(first.done) return;
        history.push(first.value); historyIdx = 0;

        startBtn.disabled = true; nextBtn.disabled = false; nextIterBtn.disabled = false;
        sourceSelect.disabled = true; destSelect.disabled = true;
        applyState();
    });

    nextBtn.addEventListener('click', () => {
        if (!generator) return;
        if (historyIdx < history.length - 1) historyIdx++;
        else { const res = generator.next(); if (res.done) return; history.push(res.value); historyIdx++; }
        applyState();
    });

    prevBtn.addEventListener('click', () => {
        if (historyIdx > 0) { historyIdx--; nextBtn.disabled = false; nextIterBtn.disabled = false; applyState(); }
    });

    nextIterBtn.addEventListener('click', () => {
        if (!generator) return;
        while(historyIdx === history.length - 1) {
            const res = generator.next();
            if (res.done) break; history.push(res.value);
            if (res.value.type === 'EXTRACT_MIN' || res.value.type === 'PATH_FOUND' || res.value.type === 'DONE') break;
        }
        historyIdx = history.length - 1; applyState();
    });

    return { reset: () => { startBtn.disabled = false; nextBtn.disabled = true; prevBtn.disabled = true; nextIterBtn.disabled = true;  } };
}

// Complex Animation Controller
function configureAnimationControls(prefix, cyInstance, internalGraphObj) {
    const startBtn = document.getElementById(`${prefix}start-btn`);
    const nextBtn = document.getElementById(`${prefix}next-btn`);
    const prevBtn = document.getElementById(`${prefix}prev-btn`);
    const nextIterBtn = document.getElementById(`${prefix}next-iter-btn`);
    
    const fwdBtn = document.getElementById(`${prefix}play-fwd-btn`);
    const backBtn = document.getElementById(`${prefix}play-back-btn`);
    const pauseBtn = document.getElementById(`${prefix}pause-btn`);
    const speedInput = document.getElementById(`${prefix}speed`);
    const speedVal = document.getElementById('speed-val');
    
    const sourceSelect = document.getElementById(`${prefix}source-node`);
    const destSelect = document.getElementById(`${prefix}dest-node`);
    const showColorsChk = document.getElementById(`${prefix}show-colors-chk`);
    
    const expText = document.getElementById(`${prefix}explanation-text`);
    const pqSpan = document.querySelector(`#${prefix}pq-state span`);
    const distContainer = document.querySelector(`#${prefix}distances-state .distances-table-container`);

    const updater = createVisualUpdater(cyInstance, { expText, pqSpan, distContainer });
    
    let generator = null; let history = []; let historyIdx = -1; 
    let fwdAnimInterval = null; let backAnimInterval = null;

    speedInput.addEventListener('input', (e) => {
        speedVal.textContent = `${e.target.value}ms`;
        if (fwdAnimInterval) { stopAnimations(); fwdBtn.click(); } 
        if (backAnimInterval) { stopAnimations(); backBtn.click(); }
    });

    const stopAnimations = () => {
        if (fwdAnimInterval) { clearInterval(fwdAnimInterval); fwdAnimInterval = null; }
        if (backAnimInterval) { clearInterval(backAnimInterval); backAnimInterval = null; }
        fwdBtn.style.color = ''; backBtn.style.color = ''; fwdBtn.style.fontWeight = ''; backBtn.style.fontWeight = '';
        pauseBtn.disabled = true;
    };

    function applyState() {
        updater(history[historyIdx], history, historyIdx, showColorsChk.checked);
        const isDone = history[historyIdx].type === 'DONE' || history[historyIdx].type === 'PATH_FOUND';
        
        prevBtn.disabled = historyIdx <= 0;
        backBtn.disabled = historyIdx <= 0;
        
        const isAtEnd = isDone && historyIdx === history.length - 1 && generator.next().done;
        nextBtn.disabled = isAtEnd; 
        fwdBtn.disabled = isAtEnd;
        
        if (isAtEnd) {
            nextBtn.disabled = true; nextIterBtn.disabled = true; fwdBtn.disabled = true;
            stopAnimations();
            startBtn.disabled = false; sourceSelect.disabled = false; destSelect.disabled = false;
        } else if (historyIdx < history.length - 1 || generator) {
            nextBtn.disabled = false; nextIterBtn.disabled = false; fwdBtn.disabled = false;
        }
    }

    startBtn.addEventListener('click', () => {
        if (!sourceSelect.value || !destSelect.value) { showError("Ensure both nodes are selected."); return; }
        
        cyInstance.elements().removeClass('source target visited current path-edge eval-edge tree-edge dimmed dynamic-tree-edge');
        if (cyInstance.getElementById(sourceSelect.value).length) cyInstance.getElementById(sourceSelect.value).addClass('source');
        if (cyInstance.getElementById(destSelect.value).length) cyInstance.getElementById(destSelect.value).addClass('target');

        generator = runDijkstraStepByStep(internalGraphObj, sourceSelect.value, destSelect.value);
        history = []; historyIdx = -1;
        const first = generator.next(); if(first.done) return;
        history.push(first.value); historyIdx = 0;

        startBtn.disabled = true; sourceSelect.disabled = true; destSelect.disabled = true;
        applyState();
    });

    nextBtn.addEventListener('click', () => {
        stopAnimations();
        if (!generator) return;
        if (historyIdx < history.length - 1) historyIdx++;
        else { const res = generator.next(); if (res.done) return; history.push(res.value); historyIdx++; }
        applyState();
    });

    prevBtn.addEventListener('click', () => {
        stopAnimations();
        if (historyIdx > 0) { historyIdx--; applyState(); }
    });

    nextIterBtn.addEventListener('click', () => {
        stopAnimations();
        if (!generator) return;
        while(historyIdx === history.length - 1) {
            const res = generator.next();
            if (res.done) break; history.push(res.value);
            if (res.value.type === 'EXTRACT_MIN' || res.value.type === 'PATH_FOUND' || res.value.type === 'DONE') break;
        }
        historyIdx = history.length - 1; applyState();
    });

    fwdBtn.addEventListener('click', () => {
        if(!generator) return;
        stopAnimations();
        pauseBtn.disabled = false; fwdBtn.style.color = '#fff'; fwdBtn.style.fontWeight = 'bold';
        const speed = parseInt(speedInput.value);
        fwdAnimInterval = setInterval(() => {
            if (historyIdx < history.length - 1) historyIdx++;
            else {
                const res = generator.next();
                if (res.done) { stopAnimations(); applyState(); return; }
                history.push(res.value); historyIdx++;
            }
            applyState();
        }, speed);
    });

    backBtn.addEventListener('click', () => {
        if(!generator || historyIdx <= 0) return;
        stopAnimations();
        pauseBtn.disabled = false; backBtn.style.color = '#fff'; backBtn.style.fontWeight = 'bold';
        const speed = parseInt(speedInput.value);
        backAnimInterval = setInterval(() => {
            if (historyIdx > 0) { historyIdx--; applyState(); }
            else { stopAnimations(); applyState(); }
        }, speed);
    });

    pauseBtn.addEventListener('click', () => { stopAnimations(); applyState(); });

    return { reset: () => { stopAnimations(); startBtn.disabled = false; nextBtn.disabled = true; prevBtn.disabled = true; nextIterBtn.disabled = true; fwdBtn.disabled = true; backBtn.disabled = true; } };
}

const cyStyle = [
    { selector: 'node', style: { 'background-color': '#3b82f6', 'label': 'data(label)', 'color': '#ffffff', 'text-valign': 'center', 'text-halign': 'center', 'font-size': '12px', 'width': '35px', 'height': '35px', 'border-width': 2, 'border-color': '#2563eb' } },
    { selector: 'edge', style: { 'width': 3, 'line-color': '#e2e8f0', 'label': 'data(weight)', 'font-size': '12px', 'text-background-color': '#ffffff', 'text-background-opacity': 0.8, 'text-background-padding': '2px', 'text-background-shape': 'round-rectangle', 'color': '#475569', 'curve-style': 'bezier', 'text-rotation': 'autorotate' } },
    { selector: '.source', style: { 'background-color': '#10b981', 'border-color': '#059669', 'border-width': 3 } },
    { selector: '.target', style: { 'background-color': '#f59e0b', 'border-color': '#d97706', 'border-width': 3 } },
    { selector: '.visited', style: { 'background-color': '#8b5cf6', 'border-color': '#7c3aed' } },
    { selector: '.current', style: { 'background-color': '#f43f5e', 'border-color': '#e11d48', 'width': '45px', 'height': '45px', 'border-width': 3 } },
    { selector: '.path-edge', style: { 'line-color': '#10b981', 'width': 5 } },
    { selector: '.eval-edge', style: { 'line-color': '#f43f5e', 'width': 4, 'line-style': 'dashed' } },
    { selector: '.tree-edge', style: { 'line-color': '#3b82f6', 'width': 3 } },
    { selector: '.dynamic-tree-edge', style: { 'line-color': '#10b981', 'width': 3 } },
    { selector: '.dimmed', style: { 'opacity': 0.2 } }
];


document.addEventListener('DOMContentLoaded', () => {

    // --- Right Toolbar State Management ---
    document.querySelectorAll('.tool-btn[data-mode]').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('.tool-btn[data-mode]').forEach(b => b.classList.remove('active'));
            const specificBtn = e.currentTarget;
            specificBtn.classList.add('active');
            window.currentToolMode = specificBtn.dataset.mode;
        });
    });

    // --- Sidebar Tabs (Animation Player) ---
    document.querySelectorAll('.sidebar-tabs .tab-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('.sidebar-tabs .tab-btn').forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active-pane'));
            e.target.classList.add('active');
            document.getElementById(e.target.dataset.tab).classList.add('active-pane');
        });
    });

    // --- Floating Draggable Table State ---
    const floatingTable = document.getElementById('floating-table');
    const tableHeader = document.getElementById('floating-table-header');
    let isDragging = false, startX, startY, startLeft, startTop;

    tableHeader.addEventListener('mousedown', (e) => {
        isDragging = true; startX = e.clientX; startY = e.clientY;
        startLeft = parseInt(window.getComputedStyle(floatingTable).left || 0);
        startTop = parseInt(window.getComputedStyle(floatingTable).top || 0);
        document.body.style.userSelect = 'none';
        floatingTable.style.zIndex = '1001';
    });

    document.addEventListener('mousemove', (e) => {
        if (!isDragging) return;
        floatingTable.style.left = `${startLeft + (e.clientX - startX)}px`;
        floatingTable.style.top = `${startTop + (e.clientY - startY)}px`;
    });

    document.addEventListener('mouseup', () => { isDragging = false; document.body.style.userSelect = ''; });

    document.querySelectorAll('.toggle-table-btn').forEach(btn => {
        btn.addEventListener('click', () => floatingTable.classList.toggle('hidden'));
    });

    // --- SPA ROUTING ---
    const pages = document.querySelectorAll('.page');
    const navBtns = document.querySelectorAll('.nav-btn');

    navBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            navBtns.forEach(b => b.classList.remove('active'));
            pages.forEach(p => p.classList.remove('active-page'));
            
            e.target.classList.add('active');
            const tgt = e.target.dataset.target;
            document.getElementById(tgt).classList.add('active-page');
            
            if (tgt === 'page-random' && window.cyRandom) window.cyRandom.resize();
            if (tgt === 'page-custom' && window.cyCustom) window.cyCustom.resize();
            if (tgt === 'page-animate' && window.cyAnim) window.cyAnim.resize();
        });
    });

    // --- RANDOM GRAPH ENGINE ---
    let randomGraph = new Graph();
    window.cyRandom = cytoscape({ container: document.getElementById('cy'), style: cyStyle, layout: {name: 'cose'} });
    const randomControls = configureVisualizerControls('', window.cyRandom, randomGraph);
    
    // Attach Global Editor to Random
    const sourceSelect = document.getElementById('source-node');
    const destSelect = document.getElementById('dest-node');
    attachGraphEditorEvents(window.cyRandom, randomGraph, () => {
        sourceSelect.innerHTML = ''; destSelect.innerHTML = '';
        randomGraph.getVertices().forEach(v => { sourceSelect.add(new Option(v, v)); destSelect.add(new Option(v, v)); });
        if(sourceSelect.options.length > 1) destSelect.value = sourceSelect.options[sourceSelect.options.length - 1].value;
        const sBtn = document.getElementById('start-btn');
        if (sBtn) sBtn.disabled = sourceSelect.options.length < 2;
    });

    const generateBtn = document.getElementById('generate-btn');
    const nodeCountInput = document.getElementById('node-count');
    const randSizeChk = document.getElementById('rand-size-chk');
    const randSourceChk = document.getElementById('rand-source-chk');
    const randDestChk = document.getElementById('rand-dest-chk');

    generateBtn.addEventListener('click', () => {
        let count = parseInt(nodeCountInput.value) || 10;
        if (randSizeChk && randSizeChk.checked) { count = Math.floor(Math.random() * 26) + 5; nodeCountInput.value = count; }

        randomGraph.clear(); const elements = []; const nodes = [];
        for (let i = 0; i < count; i++) {
            const id = `V${i}`; nodes.push(id); randomGraph.addVertex(id);
            elements.push({ data: { id, label: id } });
        }
        let edgeCount = 0;
        for (let i = 1; i < count; i++) {
            const target = nodes[i]; const source = nodes[Math.floor(Math.random() * i)];
            const weight = Math.floor(Math.random() * 20) + 1;
            randomGraph.addEdge(source, target, weight, false);
            elements.push({ data: { id: `cE${edgeCount++}`, source, target, weight } });
        }
        const extraEdges = count + Math.floor(count / 2);
        for (let i = 0; i < extraEdges; i++) {
            const src = nodes[Math.floor(Math.random() * count)];
            const tgt = nodes[Math.floor(Math.random() * count)];
            if (src !== tgt && !randomGraph.getNeighbors(src).some(n => n.node === tgt)) {
                const weight = Math.floor(Math.random() * 20) + 1;
                randomGraph.addEdge(src, tgt, weight, false);
                elements.push({ data: { id: `cE${edgeCount++}`, source: src, target: tgt, weight } });
            }
        }
        
        window.cyRandom.elements().remove(); window.cyRandom.add(elements);
        window.cyRandom.layout({ name: 'cose', padding: 50, nodeRepulsion: 400000, idealEdgeLength: 100, edgeElasticity: 100 }).run();
        
        sourceSelect.innerHTML = ''; destSelect.innerHTML = '';
        randomGraph.getVertices().forEach(v => { sourceSelect.add(new Option(v, v)); destSelect.add(new Option(v, v)); });
        if(sourceSelect.options.length > 1) destSelect.value = sourceSelect.options[sourceSelect.options.length - 1].value;
        const sBtn = document.getElementById('start-btn');
        if (sBtn) sBtn.disabled = sourceSelect.options.length < 2;

        randomControls.reset();
        document.getElementById('explanation-text').innerHTML = `Generated random graph. Tap nodes or edges with Toolbar exactly as you wish!`;
        document.querySelector('#pq-state span').innerHTML = '(Empty)';
        document.querySelector('#distances-state .distances-table-container').innerHTML = '';
    });

    if(randSizeChk) randSizeChk.addEventListener('change', e => nodeCountInput.disabled = e.target.checked);
    if(randSourceChk) randSourceChk.addEventListener('change', e => sourceSelect.disabled = e.target.checked);
    if(randDestChk) randDestChk.addEventListener('change', e => destSelect.disabled = e.target.checked);

    document.getElementById('start-btn').addEventListener('click', () => {
        const vertices = randomGraph.getVertices();
        if (randSourceChk && randSourceChk.checked && vertices.length) sourceSelect.value = vertices[Math.floor(Math.random() * vertices.length)];
        if (randDestChk && randDestChk.checked && vertices.length) destSelect.value = vertices[Math.floor(Math.random() * vertices.length)];
    });

    // --- CUSTOM GRAPH ENGINE ---
    let customGraph = new Graph();
    window.cyCustom = cytoscape({ container: document.getElementById('cy-custom'), style: cyStyle, elements: [] });
    const customControls = configureVisualizerControls('custom-', window.cyCustom, customGraph);
    
    const customSourceSelect = document.getElementById('custom-source-node');
    const customDestSelect = document.getElementById('custom-dest-node');

    attachGraphEditorEvents(window.cyCustom, customGraph, () => {
        customSourceSelect.innerHTML = ''; customDestSelect.innerHTML = '';
        customGraph.getVertices().forEach(v => { customSourceSelect.add(new Option(v, v)); customDestSelect.add(new Option(v, v)); });
        if(customSourceSelect.options.length > 1) customDestSelect.value = customSourceSelect.options[customSourceSelect.options.length - 1].value;
        document.getElementById('custom-start-btn').disabled = customSourceSelect.options.length < 2;
    });

    document.getElementById('clear-custom-btn').addEventListener('click', () => {
        window.cyCustom.elements().remove();
        customGraph.clear();
        
        customSourceSelect.innerHTML = ''; customDestSelect.innerHTML = '';
        document.getElementById('custom-start-btn').disabled = true;

        customControls.reset();
        document.querySelector('#custom-distances-state .distances-table-container').innerHTML = '';
        document.querySelector('#custom-pq-state span').innerHTML = '(Empty)';
    });

    // --- ANIMATION GRAPH ENGINE ---
    let animGraph = new Graph();
    window.cyAnim = cytoscape({ container: document.getElementById('cy-anim'), style: cyStyle, layout: {name: 'cose'} });
    const animControls = configureAnimationControls('anim-', window.cyAnim, animGraph);
    
    const animSourceSelect = document.getElementById('anim-source-node');
    const animDestSelect = document.getElementById('anim-dest-node');

    attachGraphEditorEvents(window.cyAnim, animGraph, () => {
        animSourceSelect.innerHTML = ''; animDestSelect.innerHTML = '';
        animGraph.getVertices().forEach(v => { animSourceSelect.add(new Option(v, v)); animDestSelect.add(new Option(v, v)); });
        if(animSourceSelect.options.length > 1) animDestSelect.value = animSourceSelect.options[animSourceSelect.options.length - 1].value;
        const sBtn = document.getElementById('anim-start-btn');
        if (sBtn) sBtn.disabled = animSourceSelect.options.length < 2;
    });

    const animGenerateBtn = document.getElementById('anim-generate-btn');
    const animNodeCountInput = document.getElementById('anim-node-count');
    const animRandSizeChk = document.getElementById('anim-rand-size-chk');
    const animRandSourceChk = document.getElementById('anim-rand-source-chk');
    const animRandDestChk = document.getElementById('anim-rand-dest-chk');

    animGenerateBtn.addEventListener('click', () => {
        let count = parseInt(animNodeCountInput.value) || 12;
        if (animRandSizeChk && animRandSizeChk.checked) { count = Math.floor(Math.random() * 26) + 5; animNodeCountInput.value = count; }

        animGraph.clear(); const elements = []; const nodes = [];
        for (let i = 0; i < count; i++) {
            const id = `V${i}`; nodes.push(id); animGraph.addVertex(id);
            elements.push({ data: { id, label: id } });
        }
        let edgeCount = 0;
        for (let i = 1; i < count; i++) {
            const target = nodes[i]; const source = nodes[Math.floor(Math.random() * i)];
            const weight = Math.floor(Math.random() * 99) + 1;
            animGraph.addEdge(source, target, weight, false);
            elements.push({ data: { id: `cE${edgeCount++}`, source, target, weight } });
        }
        const extraEdges = count + Math.floor(count / 2);
        for (let i = 0; i < extraEdges; i++) {
            const src = nodes[Math.floor(Math.random() * count)];
            const tgt = nodes[Math.floor(Math.random() * count)];
            if (src !== tgt && !animGraph.getNeighbors(src).some(n => n.node === tgt)) {
                const weight = Math.floor(Math.random() * 99) + 1;
                animGraph.addEdge(src, tgt, weight, false);
                elements.push({ data: { id: `cE${edgeCount++}`, source: src, target: tgt, weight } });
            }
        }
        
        window.cyAnim.elements().remove(); window.cyAnim.add(elements);
        window.cyAnim.layout({ name: 'cose', padding: 50, nodeRepulsion: 400000, idealEdgeLength: 100, edgeElasticity: 100 }).run();
        
        animSourceSelect.innerHTML = ''; animDestSelect.innerHTML = '';
        animGraph.getVertices().forEach(v => { animSourceSelect.add(new Option(v, v)); animDestSelect.add(new Option(v, v)); });
        if(animSourceSelect.options.length > 1) animDestSelect.value = animSourceSelect.options[animSourceSelect.options.length - 1].value;
        const sBtn = document.getElementById('anim-start-btn');
        if (sBtn) sBtn.disabled = animSourceSelect.options.length < 2;

        animControls.reset();
        document.getElementById('anim-explanation-text').innerHTML = `Generated test graph. Lock & Load to start Animation Player!`;
        document.querySelector('#anim-pq-state span').innerHTML = '(Empty)';
        document.querySelector('#anim-distances-state .distances-table-container').innerHTML = '';
    });

    if(animRandSizeChk) animRandSizeChk.addEventListener('change', e => animNodeCountInput.disabled = e.target.checked);
    if(animRandSourceChk) animRandSourceChk.addEventListener('change', e => animSourceSelect.disabled = e.target.checked);
    if(animRandDestChk) animRandDestChk.addEventListener('change', e => animDestSelect.disabled = e.target.checked);

    document.getElementById('anim-start-btn').addEventListener('click', () => {
        const vertices = animGraph.getVertices();
        if (animRandSourceChk && animRandSourceChk.checked && vertices.length) animSourceSelect.value = vertices[Math.floor(Math.random() * vertices.length)];
        if (animRandDestChk && animRandDestChk.checked && vertices.length) animDestSelect.value = vertices[Math.floor(Math.random() * vertices.length)];
        
        // Immediately switch from Graph Setup tab to Player tab logically
        document.querySelector('.sidebar-tabs button[data-tab="anim-play-tab"]').click();
    });

    // Start App with Random init in background
    generateBtn.click();
    animGenerateBtn.click(); // Init animation page background
});
