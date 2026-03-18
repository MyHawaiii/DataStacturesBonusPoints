class MinPriorityQueue {
    constructor() { this.heap = []; }
    getLeftChildIndex(parentIndex) { return 2 * parentIndex + 1; }
    getRightChildIndex(parentIndex) { return 2 * parentIndex + 2; }
    getParentIndex(childIndex) { return Math.floor((childIndex - 1) / 2); }
    hasLeftChild(index) { return this.getLeftChildIndex(index) < this.heap.length; }
    hasRightChild(index) { return this.getRightChildIndex(index) < this.heap.length; }
    hasParent(index) { return this.getParentIndex(index) >= 0; }
    leftChild(index) { return this.heap[this.getLeftChildIndex(index)]; }
    rightChild(index) { return this.heap[this.getRightChildIndex(index)]; }
    parent(index) { return this.heap[this.getParentIndex(index)]; }
    swap(indexOne, indexTwo) { const temp = this.heap[indexOne]; this.heap[indexOne] = this.heap[indexTwo]; this.heap[indexTwo] = temp; }
    enqueue(node, priority) { this.heap.push({ node, priority }); this.heapifyUp(); }
    dequeue() { if (this.heap.length === 0) return null; if (this.heap.length === 1) return this.heap.pop(); const item = this.heap[0]; this.heap[0] = this.heap.pop(); this.heapifyDown(); return item; }
    heapifyUp() { let index = this.heap.length - 1; while (this.hasParent(index) && this.parent(index).priority > this.heap[index].priority) { this.swap(this.getParentIndex(index), index); index = this.getParentIndex(index); } }
    heapifyDown() { let index = 0; while (this.hasLeftChild(index)) { let smallerChildIndex = this.getLeftChildIndex(index); if (this.hasRightChild(index) && this.rightChild(index).priority < this.leftChild(index).priority) { smallerChildIndex = this.getRightChildIndex(index); } if (this.heap[index].priority <= this.heap[smallerChildIndex].priority) { break; } else { this.swap(index, smallerChildIndex); } index = smallerChildIndex; } }
    isEmpty() { return this.heap.length === 0; }
}

class Graph {
    constructor() { this.adjacencyList = new Map(); }
    addVertex(vertex) { if (!this.adjacencyList.has(vertex)) this.adjacencyList.set(vertex, []); }
    addEdge(vertex1, vertex2, weight, isDirected = false) { this.addVertex(vertex1); this.addVertex(vertex2); this.adjacencyList.get(vertex1).push({ node: vertex2, weight }); if (!isDirected) this.adjacencyList.get(vertex2).push({ node: vertex1, weight }); }
    removeVertex(vertex) { this.adjacencyList.delete(vertex); for (let [v, edges] of this.adjacencyList.entries()) { this.adjacencyList.set(v, edges.filter(e => e.node !== vertex)); } }
    removeEdge(vertex1, vertex2, isDirected = false) { if (this.adjacencyList.has(vertex1)) { this.adjacencyList.set(vertex1, this.adjacencyList.get(vertex1).filter(e => e.node !== vertex2)); } if (!isDirected && this.adjacencyList.has(vertex2)) { this.adjacencyList.set(vertex2, this.adjacencyList.get(vertex2).filter(e => e.node !== vertex1)); } }
    getNeighbors(vertex) { return this.adjacencyList.get(vertex) || []; }
    getVertices() { return Array.from(this.adjacencyList.keys()); }
    clear() { this.adjacencyList.clear(); }
}

function* runDijkstraStepByStep(graph, startNode, endNode) {
    const distances = new Map();
    const previous = new Map();
    const pq = new MinPriorityQueue();
    const visited = new Set();

    for (let vertex of graph.getVertices()) {
        if (vertex === startNode) { distances.set(vertex, 0); pq.enqueue(vertex, 0); } else { distances.set(vertex, Infinity); }
        previous.set(vertex, null);
    }

    const _sn = () => ({ distances: new Map(distances), pqState: pq.heap.map(item => ({ ...item })), previous: new Map(previous), visitedSet: Array.from(visited), allNodes: graph.getVertices() });

    yield { type: 'INIT', codeLine: 1, message: `Initialization: Set distance to source node (${startNode}) to 0 and all other nodes to Infinity. Added source to Priority Queue.`, ..._sn() };

    while (!pq.isEmpty()) {
        const currentItem = pq.dequeue();
        const currentNode = currentItem.node;

        if (visited.has(currentNode)) { continue; }

        yield { type: 'EXTRACT_MIN', codeLine: 3, currentNode, priority: currentItem.priority, message: `Extracted node ${currentNode} from Priority Queue with shortest known distance: ${currentItem.priority}.`, ..._sn() };

        if (endNode && currentNode === endNode) {
            visited.add(currentNode);
            yield { type: 'PATH_FOUND', codeLine: 2, currentNode, message: `Reached the destination node ${endNode}! We can now backtrack to find the shortest path.`, ..._sn() };
            break;
        }

        visited.add(currentNode);
        yield { type: 'NODE_FINALIZED', codeLine: 4, currentNode, message: `Finalized distance to ${currentNode}. Added to visited set (T = T \\ {u}).`, ..._sn() };

        const neighbors = graph.getNeighbors(currentNode);

        for (let edge of neighbors) {
            const neighborNode = edge.node;
            if (visited.has(neighborNode)) continue;

            const weight = edge.weight;
            yield { type: 'CHECK_NEIGHBOR', codeLine: 5, currentNode, neighborNode, weight, message: `Checking neighbor ${neighborNode} of node ${currentNode}. Edge weight is ${weight}.`, ..._sn() };

            const candidateDistance = distances.get(currentNode) + weight;
            const knownDistance = distances.get(neighborNode);

            if (candidateDistance < knownDistance) {
                distances.set(neighborNode, candidateDistance);
                previous.set(neighborNode, currentNode);
                pq.enqueue(neighborNode, candidateDistance);
                yield { type: 'EDGE_RELAXED', codeLine: 6, currentNode, neighborNode, weight, candidateDistance, message: `Found a shorter path to ${neighborNode}! Updated distance to ${candidateDistance}. Added ${neighborNode} to Priority Queue.`, ..._sn() };
            } else {
                yield { type: 'EDGE_NOT_RELAXED', codeLine: 6, currentNode, neighborNode, weight, candidateDistance, message: `Path to ${neighborNode} via ${currentNode} is NOT shorter. No update.`, ..._sn() };
            }
        }
    }

    const path = [];
    if (endNode) {
        let curr = endNode;
        if (previous.get(curr) !== null || curr === startNode) { while (curr !== null) { path.unshift(curr); curr = previous.get(curr); } }
    }

    const doneMsg = endNode ? (path.length > 1 ? `Algorithm finished! Shortest path is: ${path.join(' -> ')}` : `Algorithm finished. No path found.`) : `Algorithm finished. Full graph traversed.`;
    yield { type: 'DONE', codeLine: 2, path: path.length > 1 ? path : [], message: doneMsg, ..._sn() };
}

function showError(message) {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    container.appendChild(toast);
    setTimeout(() => toast.classList.add('show'), 10);
    setTimeout(() => { toast.classList.remove('show'); setTimeout(() => toast.remove(), 300); }, 5000);
}

function openWeightModal(defaultWeight) {
    return new Promise((resolve) => {
        const modal = document.getElementById('edge-weight-modal');
        const input = document.getElementById('edge-weight-input');
        const saveBtn = document.getElementById('save-weight-btn');
        const cancelBtn = document.getElementById('cancel-weight-btn');

        modal.classList.remove('hidden');
        input.value = defaultWeight;
        input.focus();

        const cleanup = () => {
            modal.classList.add('hidden');
            saveBtn.removeEventListener('click', onSave);
            cancelBtn.removeEventListener('click', onCancel);
        };

        const onSave = () => { cleanup(); resolve(input.value); };
        const onCancel = () => { cleanup(); resolve(null); };

        saveBtn.addEventListener('click', onSave);
        cancelBtn.addEventListener('click', onCancel);
    });
}

function createVisualUpdater(cyInstance, explanationsObj) {
    return function processState(state, historyArr, currentIndex, showColors) {
        const { expText, pqSpan, distContainer } = explanationsObj;

        expText.innerHTML = `<strong>${state.type}</strong>: ${state.message}`;
        if (state.pqState) {
            pqSpan.innerHTML = state.pqState.length ? `<div style="display:flex; flex-wrap:wrap; gap:5px; margin-top:5px;">` + state.pqState.map(item => `<span style="background:#f1f5f9;border:1px solid #cbd5e1;padding:2px 6px;border-radius:4px;font-size:0.85rem;font-family:monospace;">${item.node}: <strong style="color:#ef4444;">${item.priority}</strong></span>`).join('') + `</div>` : '<span style="color:#64748b;">(Empty)</span>';
            const heapContent = document.getElementById('floating-heap-content');
            if (heapContent) {
                if (state.pqState.length === 0) {
                    heapContent.innerHTML = '<div style="padding:20px;text-align:center;color:#64748b;">(Empty Heap)</div>';
                } else {
                    let html = '<div class="heap-tree">';
                    let levelSize = 1; let cIdx = 0;
                    while (cIdx < state.pqState.length) {
                        html += '<div class="heap-level">';
                        for (let i = 0; i < levelSize && cIdx < state.pqState.length; i++, cIdx++) {
                            const item = state.pqState[cIdx];
                            const isMin = cIdx === 0 ? ' min-element' : '';
                            html += `<div class="heap-node${isMin}"><span class="node-id">${item.node}</span><span class="node-val">${item.priority}</span></div>`;
                        }
                        html += '</div>';
                        levelSize *= 2;
                    }
                    html += '</div>';
                    heapContent.innerHTML = html;
                }
            }
        }

        if (state.distances) {
            const tableHtml = ['<table class="dist-table">', '<tr><th>Node</th><th>Distance</th><th>Previous</th></tr>'];
            state.distances.forEach((d, n) => {
                const hl = (state.neighborNode === n && ['EDGE_RELAXED', 'EDGE_NOT_RELAXED', 'CHECK_NEIGHBOR', 'TRAP_TRIGGERED'].includes(state.type)) ? ' class="highlight-row"' : '';
                const pNode = (state.previous && state.previous.get(n)) || '-';
                const distStr = d === Infinity ? '&infin;' : d;
                tableHtml.push(`<tr${hl}><td>${n}</td><td>${distStr}</td><td>${pNode}</td></tr>`);
            });
            tableHtml.push('</table>');
            distContainer.innerHTML = tableHtml.join('');
            const floatingContent = document.getElementById('floating-table-content');
            if (floatingContent) floatingContent.innerHTML = tableHtml.join('');
        }

        if (state.codeLine) {
            document.querySelectorAll('.code-line').forEach(el => el.classList.remove('active-line'));
            const activeLine = document.getElementById(`code-line-${state.codeLine}`);
            if (activeLine) activeLine.classList.add('active-line');
        }
        if (state.visitedSet && state.allNodes) {
            const vList = document.getElementById('visited-nodes-list');
            if (vList) {
                vList.innerHTML = state.allNodes.map(node => {
                    const isVisited = state.visitedSet.includes(node);
                    return isVisited
                        ? `<span style="text-decoration:line-through; color:#ef4444; margin-right:5px;">${node}</span>`
                        : `<span style="color:#f8fafc; margin-right:5px;">${node}</span>`;
                }).join('');
            }
        }

        cyInstance.edges().removeClass('evaluating-edge dynamic-tree-edge path-edge dimmed');
        cyInstance.nodes().removeClass('current-node finalized in-queue dimmed');
        const mathBar = cyInstance.container().parentElement.querySelector('.math-status-bar');
        if (mathBar) { mathBar.classList.add('hidden'); mathBar.innerHTML = ''; }

        if (showColors) {
            for (let i = 0; i <= currentIndex; i++) {
                const hState = historyArr[i];
                if (hState && hState.type === 'NODE_FINALIZED' && hState.currentNode) cyInstance.getElementById(hState.currentNode).addClass('finalized');
            }
            if (state.pqState) {
                state.pqState.forEach(item => {
                    const el = cyInstance.getElementById(item.node);
                    if (!el.hasClass('finalized')) el.addClass('in-queue');
                });
            }
        }

        if (showColors && state.previous) {
            for (const [node, prevNode] of state.previous.entries()) {
                if (prevNode !== null) {
                    const directEdge = cyInstance.edges(`[source = "${prevNode}"][target = "${node}"]`);
                    const undirEdge = cyInstance.edges(`[source = "${node}"][target = "${prevNode}"]`).not('.directed');
                    directEdge.add(undirEdge).addClass('dynamic-tree-edge');
                }
            }
        }

        switch (state.type) {
            case 'NODE_FINALIZED':
                if (state.currentNode && showColors) cyInstance.getElementById(state.currentNode).addClass('current-node').removeClass('in-queue');
                break;
            case 'EXTRACT_MIN':
                if (state.currentNode) cyInstance.getElementById(state.currentNode).addClass('current-node').removeClass('in-queue finalized');
                break;
            case 'CHECK_NEIGHBOR':
            case 'EDGE_NOT_RELAXED':
            case 'EDGE_RELAXED':
                if (state.currentNode && state.neighborNode && showColors) {
                    const u = state.currentNode; const v = state.neighborNode;
                    const cEdge = cyInstance.edges(`[source = "${u}"][target = "${v}"], [source = "${v}"][target = "${u}"]`);
                    cEdge.addClass('evaluating-edge');
                    cyInstance.getElementById(u).addClass('current-node').removeClass('in-queue finalized');
                    cyInstance.getElementById(v).addClass('current-node').removeClass('in-queue finalized');
                    cyInstance.elements().not(cyInstance.getElementById(u)).not(cyInstance.getElementById(v)).not(cEdge).addClass('dimmed');
                    const targetD = state.type === 'CHECK_NEIGHBOR' ? state.distances.get(v) : (historyArr[currentIndex - 1] ? historyArr[currentIndex - 1].distances.get(v) : Infinity);
                    const dU = state.candidateDistance !== undefined ? state.candidateDistance - state.weight : state.distances.get(u);
                    const tStr = targetD === Infinity ? '∞' : targetD;
                    const sym = state.type === 'EDGE_RELAXED' ? '&lt;' : (state.type === 'EDGE_NOT_RELAXED' ? '&ge;' : '?');
                    const mathBar = cyInstance.container().parentElement.querySelector('.math-status-bar');
                    if (mathBar) {
                        mathBar.innerHTML = `Distance(${u}) + Weight &rarr; ${dU} + ${state.weight} = <strong style="color:#ef4444;">${dU + state.weight}</strong> &nbsp; ${sym} &nbsp; <strong style="color:#3b82f6;">${tStr}</strong> (Distance(${v}))`;
                        mathBar.classList.remove('hidden');
                    }
                }
                break;
            case 'PATH_FOUND':
            case 'DONE':
                cyInstance.edges().removeClass('dynamic-tree-edge').addClass('dimmed');
                if (state.previous) {
                    for (const [node, prevNode] of state.previous.entries()) {
                        if (prevNode !== null) {
                            const dirE = cyInstance.edges(`[source = "${prevNode}"][target = "${node}"]`);
                            const undirE = cyInstance.edges(`[source = "${node}"][target = "${prevNode}"]`).not('.directed');
                            dirE.add(undirE).removeClass('dimmed').addClass('tree-edge');
                        }
                    }
                }
                if (state.path && state.path.length > 0) {
                    for (let i = 0; i < state.path.length - 1; i++) {
                        const u = state.path[i];
                        const v = state.path[i + 1];
                        const dirPathE = cyInstance.edges(`[source = "${u}"][target = "${v}"]`);
                        const undirPathE = cyInstance.edges(`[source = "${v}"][target = "${u}"]`).not('.directed');
                        dirPathE.add(undirPathE).removeClass('dimmed tree-edge').addClass('path-edge');
                    }
                    expText.innerHTML += `<br><br><strong>Final Path:</strong> ${state.path.join(' &rarr; ')}`;
                }
                break;
        }
    }
}

window.currentToolMode = 'pointer';

function zoomCy(cyInstance, delta) {
    const zoom = cyInstance.zoom();
    const newZoom = Math.min(Math.max(zoom + delta, 0.1), 5);
    cyInstance.zoom({ level: newZoom, renderedPosition: { x: cyInstance.width() / 2, y: cyInstance.height() / 2 } });
    const pct = Math.round(newZoom * 100);
    const zoomLabel = cyInstance.container().closest('.app-container')?.querySelector('.zoom-pct-label');
    if (zoomLabel) zoomLabel.textContent = `${pct}%`;
}

function rebuildInternalGraph(cyInstance, internalGraphObj) {
    internalGraphObj.clear();
    cyInstance.nodes().forEach(n => internalGraphObj.addVertex(n.id()));
    cyInstance.edges().forEach(e => internalGraphObj.addEdge(e.source().id(), e.target().id(), parseInt(e.data('weight')), e.hasClass('directed')));
}

function attachGraphEditorEvents(prefix, cyInstance, internalGraphObj, dropdownUpdater) {
    let firstSelectedNode = null;
    let localNodeCounter = cyInstance.nodes().length;
    let localEdgeCounter = cyInstance.edges().length;

    cyInstance.on('tap', async (e) => {
        const mode = window.currentToolMode;
        const target = e.target;

        if (mode === 'addNode' && target === cyInstance) {
            const id = `V${Date.now()}N${localNodeCounter++}`;
            internalGraphObj.addVertex(id);
            cyInstance.add({ data: { id, label: `N${localNodeCounter}` }, position: { x: e.position.x, y: e.position.y } });
            dropdownUpdater();
        }
        else if (mode === 'editDirection' && target.isEdge && target.isEdge()) {
            const wasDirected = target.hasClass('directed');
            const src = target.source().id();
            const tgt = target.target().id();
            const weight = parseInt(target.data('weight')) || 1;
            if (!wasDirected) {
                target.addClass('directed');
                internalGraphObj.removeEdge(src, tgt, false);
                internalGraphObj.addEdge(src, tgt, weight, true);
            } else {
                const existsReverse = internalGraphObj.getNeighbors(tgt).some(n => n.node === src);
                if (!existsReverse) {
                    const edgeId = target.id();
                    target.remove();
                    cyInstance.add({ data: { id: edgeId, source: tgt, target: src, weight }, classes: 'directed' });
                    internalGraphObj.removeEdge(src, tgt, true);
                    internalGraphObj.addEdge(tgt, src, weight, true);
                } else {
                    target.removeClass('directed');
                    internalGraphObj.removeEdge(src, tgt, true);
                    internalGraphObj.addEdge(src, tgt, weight, false);
                }
            }
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
                    let weightStr = await openWeightModal("1");
                    if (weightStr !== null) {
                        const weight = parseInt(weightStr);
                        const allowNeg = document.getElementById('allow-negative-chk')?.checked || document.getElementById('custom-allow-negative-chk')?.checked || document.getElementById('anim-allow-negative-chk')?.checked;

                        if (!isNaN(weight)) {
                            if (weight < 0 && !allowNeg) {
                                showError("Disabled! Enable Negative Edges via the checkboxes to allow mathematically dangerous graphs.");
                            } else {
                                const isDirected = document.getElementById(`${prefix}directed-chk`)?.checked || false;
                                cyInstance.add({ data: { id: `cE${Date.now()}E${localEdgeCounter++}`, source, target: dest, weight }, classes: isDirected ? 'directed' : '' });
                                rebuildInternalGraph(cyInstance, internalGraphObj);
                            }
                        } else {
                            showError("Failed: Invalid weight! Must be an integer.");
                        }
                    }
                }
            }
        }
        else if (mode === 'editWeight' && target.isEdge && target.isEdge()) {
            let weightStr = await openWeightModal(target.data('weight'));
            if (weightStr !== null) {
                const weight = parseInt(weightStr);
                const allowNeg = document.getElementById('allow-negative-chk')?.checked || document.getElementById('custom-allow-negative-chk')?.checked || document.getElementById('anim-allow-negative-chk')?.checked;

                if (!isNaN(weight)) {
                    if (weight < 0 && !allowNeg) {
                        showError("Disabled! Enable Negative Edges via the checkboxes to allow mathematically dangerous graphs.");
                    } else {
                        target.data('weight', weight);
                        rebuildInternalGraph(cyInstance, internalGraphObj);
                    }
                } else {
                    showError("Invalid weight.");
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

    cyInstance.on('tap', (e) => {
        if (e.target === cyInstance && firstSelectedNode) {
            cyInstance.getElementById(firstSelectedNode).removeClass('current');
            firstSelectedNode = null;
        }
    });
}

function configureVisualizerControls(prefix, cyInstance, internalGraphObj) {
    const startBtn = document.getElementById(`${prefix}start-btn`);
    const resetBtn = document.getElementById(`${prefix}reset-btn`);
    const startOverBtn = document.getElementById(`${prefix}start-over-btn`);
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

    if (resetBtn) {
        resetBtn.addEventListener('click', () => {
            generator = null; history = []; historyIdx = -1;
            cyInstance.elements().removeClass('source target visited current path-edge eval-edge tree-edge dimmed dynamic-tree-edge finalized in-queue current-node');
            cyInstance.edges().removeStyle('label'); cyInstance.edges().removeStyle('font-size'); cyInstance.edges().removeStyle('font-weight'); cyInstance.edges().removeStyle('color'); cyInstance.edges().removeStyle('text-background-opacity');
            expText.innerHTML = `Welcome! Graph ready.`; pqSpan.innerHTML = '<span style="color:#64748b;">(Empty)</span>'; distContainer.innerHTML = '';
            const fTable = document.getElementById('floating-table-content'); if (fTable) fTable.innerHTML = '';
            const fHeap = document.getElementById('floating-heap-content'); if (fHeap) fHeap.innerHTML = '';
            startBtn.disabled = false; sourceSelect.disabled = false; destSelect.disabled = false;
            nextBtn.disabled = true; prevBtn.disabled = true; nextIterBtn.disabled = true;
            resetBtn.classList.add('hidden'); startBtn.classList.remove('hidden');
        });
    }
    if (startOverBtn) {
        startOverBtn.addEventListener('click', () => {
            generator = null; history = []; historyIdx = -1;
            cyInstance.elements().removeClass('source target visited current path-edge eval-edge tree-edge dimmed dynamic-tree-edge finalized in-queue current-node');
            cyInstance.edges().removeStyle('label'); cyInstance.edges().removeStyle('font-size'); cyInstance.edges().removeStyle('font-weight'); cyInstance.edges().removeStyle('color'); cyInstance.edges().removeStyle('text-background-opacity');
            expText.innerHTML = `Welcome! Graph ready.`; pqSpan.innerHTML = '<span style="color:#64748b;">(Empty)</span>'; distContainer.innerHTML = '';
            const fTable = document.getElementById('floating-table-content'); if (fTable) fTable.innerHTML = '';
            const fHeap = document.getElementById('floating-heap-content'); if (fHeap) fHeap.innerHTML = '';
            startBtn.disabled = false; sourceSelect.disabled = false; destSelect.disabled = false;
            nextBtn.disabled = true; prevBtn.disabled = true; nextIterBtn.disabled = true; startOverBtn.disabled = true;
        });
    }

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
        if (!sourceSelect.value) { showError("Ensure Source node is selected."); return; }
        cyInstance.elements().removeClass('source target visited current path-edge eval-edge tree-edge dimmed dynamic-tree-edge');
        if (cyInstance.getElementById(sourceSelect.value).length) cyInstance.getElementById(sourceSelect.value).addClass('source');
        if (destSelect.value && cyInstance.getElementById(destSelect.value).length) cyInstance.getElementById(destSelect.value).addClass('target');
        generator = runDijkstraStepByStep(internalGraphObj, sourceSelect.value, destSelect.value);
        history = []; historyIdx = -1;
        const first = generator.next(); if (first.done) return;
        history.push(first.value); historyIdx = 0;
        startBtn.disabled = true; nextBtn.disabled = false; nextIterBtn.disabled = false;
        sourceSelect.disabled = true; destSelect.disabled = true;
        if (resetBtn) resetBtn.classList.remove('hidden');
        if (startOverBtn) startOverBtn.disabled = false;
        applyState();
    });
    nextBtn.addEventListener('click', () => { if (!generator) return; if (historyIdx < history.length - 1) historyIdx++; else { const res = generator.next(); if (res.done) return; history.push(res.value); historyIdx++; } applyState(); });
    prevBtn.addEventListener('click', () => { if (historyIdx > 0) { historyIdx--; nextBtn.disabled = false; nextIterBtn.disabled = false; applyState(); } });
    nextIterBtn.addEventListener('click', () => { if (!generator) return; while (historyIdx === history.length - 1) { const res = generator.next(); if (res.done) break; history.push(res.value); if (res.value.type === 'EXTRACT_MIN' || res.value.type === 'PATH_FOUND' || res.value.type === 'DONE' || res.value.type === 'TRAP_TRIGGERED') break; } historyIdx = history.length - 1; applyState(); });

    return { reset: () => { startBtn.disabled = false; nextBtn.disabled = true; prevBtn.disabled = true; nextIterBtn.disabled = true; if (startOverBtn) startOverBtn.disabled = true; } };
}

function configureAnimationControls(prefix, cyInstance, internalGraphObj) {
    const startBtn = document.getElementById(`${prefix}start-btn`);
    const resetBtn = document.getElementById(`${prefix}reset-btn`);
    const startOverBtn = document.getElementById(`${prefix}start-over-btn`);
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
    let generator = null; let history = []; let historyIdx = -1; let fwdAnimInterval = null; let backAnimInterval = null;

    const stopAnimations = () => { if (fwdAnimInterval) { clearInterval(fwdAnimInterval); fwdAnimInterval = null; } if (backAnimInterval) { clearInterval(backAnimInterval); backAnimInterval = null; } fwdBtn.style.color = ''; backBtn.style.color = ''; fwdBtn.style.fontWeight = ''; backBtn.style.fontWeight = ''; pauseBtn.disabled = true; };

    if (resetBtn) {
        resetBtn.addEventListener('click', () => {
            stopAnimations();
            generator = null; history = []; historyIdx = -1;
            cyInstance.elements().removeClass('source target visited current path-edge eval-edge tree-edge dimmed dynamic-tree-edge finalized in-queue current-node');
            cyInstance.edges().removeStyle('label'); cyInstance.edges().removeStyle('font-size'); cyInstance.edges().removeStyle('font-weight'); cyInstance.edges().removeStyle('color'); cyInstance.edges().removeStyle('text-background-opacity');
            expText.innerHTML = `Welcome! Graph ready.`; pqSpan.innerHTML = '<span style="color:#64748b;">(Empty)</span>'; distContainer.innerHTML = '';
            const fTable = document.getElementById('floating-table-content'); if (fTable) fTable.innerHTML = '';
            const fHeap = document.getElementById('floating-heap-content'); if (fHeap) fHeap.innerHTML = '';
            startBtn.disabled = false; sourceSelect.disabled = false; destSelect.disabled = false;
            nextBtn.disabled = true; prevBtn.disabled = true; nextIterBtn.disabled = true; fwdBtn.disabled = true; backBtn.disabled = true; pauseBtn.disabled = true;
            resetBtn.classList.add('hidden'); startBtn.classList.remove('hidden');
        });
    }
    if (startOverBtn) {
        startOverBtn.addEventListener('click', () => {
            stopAnimations();
            generator = null; history = []; historyIdx = -1;
            cyInstance.elements().removeClass('source target visited current path-edge eval-edge tree-edge dimmed dynamic-tree-edge finalized in-queue current-node');
            cyInstance.edges().removeStyle('label'); cyInstance.edges().removeStyle('font-size'); cyInstance.edges().removeStyle('font-weight'); cyInstance.edges().removeStyle('color'); cyInstance.edges().removeStyle('text-background-opacity');
            expText.innerHTML = `Welcome! Graph ready.`; pqSpan.innerHTML = '<span style="color:#64748b;">(Empty)</span>'; distContainer.innerHTML = '';
            const fTable = document.getElementById('floating-table-content'); if (fTable) fTable.innerHTML = '';
            const fHeap = document.getElementById('floating-heap-content'); if (fHeap) fHeap.innerHTML = '';
            startBtn.disabled = false; sourceSelect.disabled = false; destSelect.disabled = false;
            nextBtn.disabled = true; prevBtn.disabled = true; nextIterBtn.disabled = true; fwdBtn.disabled = true; backBtn.disabled = true; pauseBtn.disabled = true; startOverBtn.disabled = true;
        });
    }

    speedInput.addEventListener('input', (e) => { speedVal.textContent = `${e.target.value}ms`; if (fwdAnimInterval) { stopAnimations(); fwdBtn.click(); } if (backAnimInterval) { stopAnimations(); backBtn.click(); } });

    function applyState() {
        updater(history[historyIdx], history, historyIdx, showColorsChk.checked);
        const isDone = history[historyIdx].type === 'DONE' || history[historyIdx].type === 'PATH_FOUND';
        prevBtn.disabled = historyIdx <= 0; backBtn.disabled = historyIdx <= 0;
        const isAtEnd = isDone && historyIdx === history.length - 1 && generator.next().done;
        nextBtn.disabled = isAtEnd; fwdBtn.disabled = isAtEnd;
        if (isAtEnd) { nextBtn.disabled = true; nextIterBtn.disabled = true; fwdBtn.disabled = true; stopAnimations(); startBtn.disabled = false; sourceSelect.disabled = false; destSelect.disabled = false; } else if (historyIdx < history.length - 1 || generator) { nextBtn.disabled = false; nextIterBtn.disabled = false; fwdBtn.disabled = false; }
    }

    startBtn.addEventListener('click', () => { if (!sourceSelect.value) { showError("Ensure Source node is selected."); return; } cyInstance.elements().removeClass('source target visited current path-edge eval-edge tree-edge dimmed dynamic-tree-edge'); if (cyInstance.getElementById(sourceSelect.value).length) cyInstance.getElementById(sourceSelect.value).addClass('source'); if (destSelect.value && cyInstance.getElementById(destSelect.value).length) cyInstance.getElementById(destSelect.value).addClass('target'); generator = runDijkstraStepByStep(internalGraphObj, sourceSelect.value, destSelect.value); history = []; historyIdx = -1; const first = generator.next(); if (first.done) return; history.push(first.value); historyIdx = 0; startBtn.disabled = true; sourceSelect.disabled = true; destSelect.disabled = true; if (resetBtn) resetBtn.classList.remove('hidden'); if (startOverBtn) startOverBtn.disabled = false; applyState(); });
    nextBtn.addEventListener('click', () => { stopAnimations(); if (!generator) return; if (historyIdx < history.length - 1) historyIdx++; else { const res = generator.next(); if (res.done) return; history.push(res.value); historyIdx++; } applyState(); });
    prevBtn.addEventListener('click', () => { stopAnimations(); if (historyIdx > 0) { historyIdx--; applyState(); } });
    nextIterBtn.addEventListener('click', () => { stopAnimations(); if (!generator) return; while (historyIdx === history.length - 1) { const res = generator.next(); if (res.done) break; history.push(res.value); if (res.value.type === 'EXTRACT_MIN' || res.value.type === 'PATH_FOUND' || res.value.type === 'DONE' || res.value.type === 'TRAP_TRIGGERED') break; } historyIdx = history.length - 1; applyState(); });
    fwdBtn.addEventListener('click', () => { if (!generator) return; stopAnimations(); pauseBtn.disabled = false; fwdBtn.style.color = '#fff'; fwdBtn.style.fontWeight = 'bold'; const speed = parseInt(speedInput.value); fwdAnimInterval = setInterval(() => { if (historyIdx < history.length - 1) historyIdx++; else { const res = generator.next(); if (res.done) { stopAnimations(); applyState(); return; } history.push(res.value); historyIdx++; } applyState(); }, speed); });
    backBtn.addEventListener('click', () => { if (!generator || historyIdx <= 0) return; stopAnimations(); pauseBtn.disabled = false; backBtn.style.color = '#fff'; backBtn.style.fontWeight = 'bold'; const speed = parseInt(speedInput.value); backAnimInterval = setInterval(() => { if (historyIdx > 0) { historyIdx--; applyState(); } else { stopAnimations(); applyState(); } }, speed); });
    pauseBtn.addEventListener('click', () => { stopAnimations(); applyState(); });

    return { reset: () => { stopAnimations(); startBtn.disabled = false; nextBtn.disabled = true; prevBtn.disabled = true; nextIterBtn.disabled = true; fwdBtn.disabled = true; backBtn.disabled = true; if (startOverBtn) startOverBtn.disabled = true; } };
}

const cyStyle = [{ selector: 'node', style: { 'background-color': '#e2e8f0', 'label': 'data(label)', 'color': '#1e293b', 'text-valign': 'center', 'text-halign': 'center', 'font-size': '12px', 'width': '35px', 'height': '35px', 'border-width': 2, 'border-color': '#64748b', 'transition-property': 'background-color, border-color, underlay-opacity, underlay-color, underlay-padding', 'transition-duration': '0.3s' } }, { selector: 'edge', style: { 'width': 3, 'line-color': '#cbd5e1', 'label': 'data(weight)', 'font-size': '12px', 'text-background-color': '#ffffff', 'text-background-opacity': 0.8, 'text-background-padding': '2px', 'text-background-shape': 'round-rectangle', 'color': '#475569', 'curve-style': 'bezier', 'text-rotation': 'autorotate', 'target-arrow-shape': 'none' } }, { selector: '.directed', style: { 'target-arrow-shape': 'triangle', 'target-arrow-color': '#cbd5e1' } }, { selector: '.directed.evaluating-edge', style: { 'target-arrow-color': '#a855f7' } }, { selector: '.directed.path-edge', style: { 'target-arrow-color': '#10b981' } }, { selector: '.directed.tree-edge', style: { 'target-arrow-color': '#3b82f6' } }, { selector: '.directed.dynamic-tree-edge', style: { 'target-arrow-color': '#10b981' } }, { selector: '.in-queue', style: { 'border-color': '#f97316', 'border-width': 4, 'underlay-color': '#f97316', 'underlay-padding': 6, 'underlay-opacity': 0.4 } }, { selector: '.current-node', style: { 'border-color': '#3b82f6', 'border-width': 6, 'underlay-color': '#3b82f6', 'underlay-padding': 10, 'underlay-opacity': 0.5, 'background-color': '#eff6ff', 'color': '#1e3a8a' } }, { selector: '.evaluating-edge', style: { 'line-color': '#a855f7', 'width': 5, 'line-style': 'dashed' } }, { selector: '.finalized', style: { 'background-color': '#10b981', 'border-color': '#059669', 'color': '#ffffff' } }, { selector: '.dimmed', style: { 'opacity': 0.2 } }, { selector: '.source', style: { 'background-color': '#10b981', 'border-color': '#059669', 'border-width': 4, 'color': '#ffffff' } }, { selector: '.target', style: { 'background-color': '#f59e0b', 'border-color': '#d97706', 'border-width': 4, 'color': '#ffffff' } }, { selector: '.path-edge', style: { 'line-color': '#10b981', 'width': 5 } }, { selector: '.tree-edge', style: { 'line-color': '#3b82f6', 'width': 3 } }, { selector: '.dynamic-tree-edge', style: { 'line-color': '#10b981', 'width': 3 } }, { selector: '.glow-success', style: { 'underlay-color': '#10b981', 'underlay-padding': 12, 'underlay-opacity': 0.9 } }, { selector: '.glow-fail', style: { 'underlay-color': '#ef4444', 'underlay-padding': 12, 'underlay-opacity': 0.9 } }];

document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.tool-btn[data-mode]').forEach(btn => { btn.addEventListener('click', (e) => { document.querySelectorAll('.tool-btn[data-mode]').forEach(b => b.classList.remove('active')); const specificBtn = e.currentTarget; specificBtn.classList.add('active'); window.currentToolMode = specificBtn.dataset.mode; }); });
    document.querySelectorAll('.sidebar-tabs .tab-btn').forEach(btn => { btn.addEventListener('click', (e) => { document.querySelectorAll('.sidebar-tabs .tab-btn').forEach(b => b.classList.remove('active')); document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active-pane')); e.target.classList.add('active'); document.getElementById(e.target.dataset.tab).classList.add('active-pane'); }); });

    const floatingTable = document.getElementById('floating-table');
    const tableHeader = document.getElementById('floating-table-header');
    const floatingHeap = document.getElementById('floating-heap');
    const heapHeader = document.getElementById('floating-heap-header');
    const floatingCode = document.getElementById('floating-code');
    const codeHeader = document.getElementById('floating-code-header');

    let isDragging = false, currentDrag = null, startX, startY, startLeft, startTop;
    const attachDrag = (header, container) => {
        header.addEventListener('mousedown', (e) => {
            isDragging = true; currentDrag = container; startX = e.clientX; startY = e.clientY;
            const rect = container.getBoundingClientRect();
            startLeft = rect.left; startTop = rect.top;
            container.style.right = 'auto'; container.style.bottom = 'auto';
            container.style.left = `${startLeft}px`; container.style.top = `${startTop}px`;
            document.body.style.userSelect = 'none'; container.style.zIndex = '1001';
        });
    };
    attachDrag(tableHeader, floatingTable);
    attachDrag(heapHeader, floatingHeap);
    if (codeHeader && floatingCode) attachDrag(codeHeader, floatingCode);

    document.addEventListener('mousemove', (e) => {
        if (!isDragging || !currentDrag) return;
        currentDrag.style.left = `${startLeft + (e.clientX - startX)}px`;
        currentDrag.style.top = `${startTop + (e.clientY - startY)}px`;
    });
    document.addEventListener('mouseup', () => {
        isDragging = false; if (currentDrag) currentDrag.style.zIndex = '1000';
        currentDrag = null; document.body.style.userSelect = '';
    });

    document.querySelectorAll('.toggle-table-btn').forEach(btn => { btn.addEventListener('click', () => { floatingTable.classList.toggle('hidden'); document.querySelectorAll('.toggle-table-btn').forEach(b => b.classList.toggle('active', !floatingTable.classList.contains('hidden'))); }); });
    document.querySelectorAll('.toggle-heap-btn').forEach(btn => { btn.addEventListener('click', () => { floatingHeap.classList.toggle('hidden'); document.querySelectorAll('.toggle-heap-btn').forEach(b => b.classList.toggle('active', !floatingHeap.classList.contains('hidden'))); }); });
    document.querySelectorAll('.toggle-code-btn').forEach(btn => { btn.addEventListener('click', () => { if (floatingCode) { floatingCode.classList.toggle('hidden'); document.querySelectorAll('.toggle-code-btn').forEach(b => b.classList.toggle('active', !floatingCode.classList.contains('hidden'))); } }); });
    const closeTableBtn = document.getElementById('close-table-btn');
    if (closeTableBtn) closeTableBtn.addEventListener('click', () => { floatingTable.classList.add('hidden'); document.querySelectorAll('.toggle-table-btn').forEach(b => b.classList.remove('active')); });
    const closeHeapBtn = document.getElementById('close-heap-btn');
    if (closeHeapBtn) closeHeapBtn.addEventListener('click', () => { floatingHeap.classList.add('hidden'); document.querySelectorAll('.toggle-heap-btn').forEach(b => b.classList.remove('active')); });
    const closeCodeBtn = document.getElementById('close-code-btn');
    if (closeCodeBtn) closeCodeBtn.addEventListener('click', () => { if (floatingCode) floatingCode.classList.add('hidden'); document.querySelectorAll('.toggle-code-btn').forEach(b => b.classList.remove('active')); });

    const pages = document.querySelectorAll('.page'); const navBtns = document.querySelectorAll('.nav-btn');
    const resetFloatingPanels = () => {
        floatingTable.classList.add('hidden'); floatingHeap.classList.add('hidden');
        if (floatingCode) floatingCode.classList.add('hidden');
        document.querySelectorAll('.toggle-table-btn, .toggle-heap-btn, .toggle-code-btn').forEach(b => b.classList.remove('active'));
        const tCont = document.getElementById('floating-table-content'); if (tCont) tCont.innerHTML = '';
        const hCont = document.getElementById('floating-heap-content'); if (hCont) hCont.innerHTML = '';
        const vList = document.getElementById('visited-nodes-list'); if (vList) vList.innerHTML = '';
        document.querySelectorAll('.code-line').forEach(el => el.style.color = '#cbd5e1');
    };
    navBtns.forEach(btn => { btn.addEventListener('click', (e) => { navBtns.forEach(b => b.classList.remove('active')); pages.forEach(p => p.classList.remove('active-page')); e.target.classList.add('active'); const tgt = e.target.dataset.target; document.getElementById(tgt).classList.add('active-page'); resetFloatingPanels(); if (tgt === 'page-random' && window.cyRandom) window.cyRandom.resize(); if (tgt === 'page-custom' && window.cyCustom) window.cyCustom.resize(); if (tgt === 'page-animate' && window.cyAnim) window.cyAnim.resize(); if (tgt === 'page-quiz' && window.cyQuiz) window.cyQuiz.resize(); }); });

    const cyMap = { 'cy': () => window.cyRandom, 'cy-custom': () => window.cyCustom, 'cy-anim': () => window.cyAnim };
    document.querySelectorAll('.right-toolbar[data-cy]').forEach(toolbar => {
        const getCy = cyMap[toolbar.dataset.cy];
        const zInBtn = toolbar.querySelector('.zoom-in-btn');
        const zOutBtn = toolbar.querySelector('.zoom-out-btn');
        if (zInBtn && getCy) zInBtn.addEventListener('click', () => zoomCy(getCy(), 0.15));
        if (zOutBtn && getCy) zOutBtn.addEventListener('click', () => zoomCy(getCy(), -0.15));
    });

    const applyDirectedToggle = (cyInstance, internalGraphObj, isDirected) => {
        cyInstance.edges().forEach(edge => {
            const wasDirected = edge.hasClass('directed');
            if (isDirected && !wasDirected) {
                if (Math.random() > 0.5) {
                    edge.addClass('directed');
                }
            } else if (!isDirected && wasDirected) {
                edge.removeClass('directed');
            }
        });
        rebuildInternalGraph(cyInstance, internalGraphObj);
    };

    let randomGraph = new Graph();
    window.cyRandom = cytoscape({ container: document.getElementById('cy'), style: cyStyle, layout: { name: 'cose' } });
    const randomControls = configureVisualizerControls('', window.cyRandom, randomGraph);
    const sourceSelect = document.getElementById('source-node'); const destSelect = document.getElementById('dest-node');
    attachGraphEditorEvents('', window.cyRandom, randomGraph, () => { sourceSelect.innerHTML = ''; destSelect.innerHTML = '<option value="">-- All Nodes --</option>'; randomGraph.getVertices().forEach(v => { sourceSelect.add(new Option(v, v)); destSelect.add(new Option(v, v)); }); const sBtn = document.getElementById('start-btn'); if (sBtn) sBtn.disabled = sourceSelect.options.length < 2; });

    const generateBtn = document.getElementById('generate-btn'); const nodeCountInput = document.getElementById('node-count'); const randSizeChk = document.getElementById('rand-size-chk'); const randSourceChk = document.getElementById('rand-source-chk'); const randDestChk = document.getElementById('rand-dest-chk');
    generateBtn.addEventListener('click', () => { const dirChk = document.getElementById('directed-chk')?.checked; const randDirChk = document.getElementById('rand-directed-chk')?.checked; let count = parseInt(nodeCountInput.value) || 10; if (randSizeChk && randSizeChk.checked) { count = Math.floor(Math.random() * 26) + 5; nodeCountInput.value = count; } randomGraph.clear(); const elements = []; const nodes = []; for (let i = 0; i < count; i++) { const id = `V${i}`; nodes.push(id); randomGraph.addVertex(id); elements.push({ data: { id, label: id } }); } let edgeCount = 0; for (let i = 1; i < count; i++) { const target = nodes[i]; const source = nodes[Math.floor(Math.random() * i)]; const weight = Math.floor(Math.random() * 20) + 1; const isDir = dirChk || (randDirChk && Math.random() > 0.5); randomGraph.addEdge(source, target, weight, isDir); elements.push({ data: { id: `cE${edgeCount++}`, source, target, weight }, classes: isDir ? 'directed' : '' }); } const extraEdges = count + Math.floor(count / 2); for (let i = 0; i < extraEdges; i++) { const src = nodes[Math.floor(Math.random() * count)]; const tgt = nodes[Math.floor(Math.random() * count)]; if (src !== tgt && !randomGraph.getNeighbors(src).some(n => n.node === tgt)) { const weight = Math.floor(Math.random() * 20) + 1; const isDir = dirChk || (randDirChk && Math.random() > 0.5); randomGraph.addEdge(src, tgt, weight, isDir); elements.push({ data: { id: `cE${edgeCount++}`, source: src, target: tgt, weight }, classes: isDir ? 'directed' : '' }); } } window.cyRandom.elements().remove(); window.cyRandom.add(elements); window.cyRandom.layout({ name: 'cose', padding: 50, nodeRepulsion: 400000, idealEdgeLength: 100, edgeElasticity: 100 }).run(); sourceSelect.innerHTML = ''; destSelect.innerHTML = '<option value="">-- All Nodes --</option>'; randomGraph.getVertices().forEach(v => { sourceSelect.add(new Option(v, v)); destSelect.add(new Option(v, v)); }); const sBtn = document.getElementById('start-btn'); if (sBtn) sBtn.disabled = sourceSelect.options.length < 2; randomControls.reset(); document.getElementById('explanation-text').innerHTML = `Generated random graph.`; document.querySelector('#pq-state span').innerHTML = '(Empty)'; document.querySelector('#distances-state .distances-table-container').innerHTML = ''; });
    if (randSizeChk) randSizeChk.addEventListener('change', e => nodeCountInput.disabled = e.target.checked); if (randSourceChk) randSourceChk.addEventListener('change', e => sourceSelect.disabled = e.target.checked); if (randDestChk) randDestChk.addEventListener('change', e => destSelect.disabled = e.target.checked);
    document.getElementById('start-btn').addEventListener('click', () => { const vertices = randomGraph.getVertices(); if (randSourceChk && randSourceChk.checked && vertices.length) sourceSelect.value = vertices[Math.floor(Math.random() * vertices.length)]; if (randDestChk && randDestChk.checked && vertices.length) destSelect.value = vertices[Math.floor(Math.random() * vertices.length)]; });

    let customGraph = new Graph();
    window.cyCustom = cytoscape({ container: document.getElementById('cy-custom'), style: cyStyle, elements: [] });
    const customControls = configureVisualizerControls('custom-', window.cyCustom, customGraph);
    const customSourceSelect = document.getElementById('custom-source-node'); const customDestSelect = document.getElementById('custom-dest-node');
    attachGraphEditorEvents('custom-', window.cyCustom, customGraph, () => { customSourceSelect.innerHTML = ''; customDestSelect.innerHTML = '<option value="">-- All Nodes --</option>'; customGraph.getVertices().forEach(v => { customSourceSelect.add(new Option(v, v)); customDestSelect.add(new Option(v, v)); }); document.getElementById('custom-start-btn').disabled = customSourceSelect.options.length < 2; });
    document.getElementById('clear-custom-btn').addEventListener('click', () => { window.cyCustom.elements().remove(); customGraph.clear(); customSourceSelect.innerHTML = ''; customDestSelect.innerHTML = '<option value="">-- All Nodes --</option>'; document.getElementById('custom-start-btn').disabled = true; customControls.reset(); document.querySelector('#custom-distances-state .distances-table-container').innerHTML = ''; document.querySelector('#custom-pq-state span').innerHTML = '(Empty)'; });

    let animGraph = new Graph();
    window.cyAnim = cytoscape({ container: document.getElementById('cy-anim'), style: cyStyle, layout: { name: 'cose' } });
    const animControls = configureAnimationControls('anim-', window.cyAnim, animGraph);
    const animSourceSelect = document.getElementById('anim-source-node'); const animDestSelect = document.getElementById('anim-dest-node');
    attachGraphEditorEvents('anim-', window.cyAnim, animGraph, () => { animSourceSelect.innerHTML = ''; animDestSelect.innerHTML = '<option value="">-- All Nodes --</option>'; animGraph.getVertices().forEach(v => { animSourceSelect.add(new Option(v, v)); animDestSelect.add(new Option(v, v)); }); const sBtn = document.getElementById('anim-start-btn'); if (sBtn) sBtn.disabled = animSourceSelect.options.length < 2; });

    const animGenerateBtn = document.getElementById('anim-generate-btn'); const animNodeCountInput = document.getElementById('anim-node-count'); const animRandSizeChk = document.getElementById('anim-rand-size-chk'); const animRandSourceChk = document.getElementById('anim-rand-source-chk'); const animRandDestChk = document.getElementById('anim-rand-dest-chk');
    animGenerateBtn.addEventListener('click', () => { const dirChk = document.getElementById('anim-directed-chk')?.checked; const randDirChk = document.getElementById('anim-rand-directed-chk')?.checked; let count = parseInt(animNodeCountInput.value) || 12; if (animRandSizeChk && animRandSizeChk.checked) { count = Math.floor(Math.random() * 26) + 5; animNodeCountInput.value = count; } animGraph.clear(); const elements = []; const nodes = []; for (let i = 0; i < count; i++) { const id = `V${i}`; nodes.push(id); animGraph.addVertex(id); elements.push({ data: { id, label: id } }); } let edgeCount = 0; for (let i = 1; i < count; i++) { const target = nodes[i]; const source = nodes[Math.floor(Math.random() * i)]; const weight = Math.floor(Math.random() * 99) + 1; const isDir = dirChk || (randDirChk && Math.random() > 0.5); animGraph.addEdge(source, target, weight, isDir); elements.push({ data: { id: `cE${edgeCount++}`, source, target, weight }, classes: isDir ? 'directed' : '' }); } const extraEdges = count + Math.floor(count / 2); for (let i = 0; i < extraEdges; i++) { const src = nodes[Math.floor(Math.random() * count)]; const tgt = nodes[Math.floor(Math.random() * count)]; if (src !== tgt && !animGraph.getNeighbors(src).some(n => n.node === tgt)) { const weight = Math.floor(Math.random() * 99) + 1; const isDir = dirChk || (randDirChk && Math.random() > 0.5); animGraph.addEdge(src, tgt, weight, isDir); elements.push({ data: { id: `cE${edgeCount++}`, source: src, target: tgt, weight }, classes: isDir ? 'directed' : '' }); } } window.cyAnim.elements().remove(); window.cyAnim.add(elements); window.cyAnim.layout({ name: 'cose', padding: 50, nodeRepulsion: 400000, idealEdgeLength: 100, edgeElasticity: 100 }).run(); animSourceSelect.innerHTML = ''; animDestSelect.innerHTML = '<option value="">-- All Nodes --</option>'; animGraph.getVertices().forEach(v => { animSourceSelect.add(new Option(v, v)); animDestSelect.add(new Option(v, v)); }); const sBtn = document.getElementById('anim-start-btn'); if (sBtn) sBtn.disabled = animSourceSelect.options.length < 2; animControls.reset(); document.getElementById('anim-explanation-text').innerHTML = `Generated test graph.`; document.querySelector('#anim-pq-state span').innerHTML = '(Empty)'; document.querySelector('#anim-distances-state .distances-table-container').innerHTML = ''; });
    if (animRandSizeChk) animRandSizeChk.addEventListener('change', e => animNodeCountInput.disabled = e.target.checked); if (animRandSourceChk) animRandSourceChk.addEventListener('change', e => animSourceSelect.disabled = e.target.checked); if (animRandDestChk) animRandDestChk.addEventListener('change', e => animDestSelect.disabled = e.target.checked);

    document.getElementById('anim-start-btn').addEventListener('click', () => { const vertices = animGraph.getVertices(); if (animRandSourceChk && animRandSourceChk.checked && vertices.length) animSourceSelect.value = vertices[Math.floor(Math.random() * vertices.length)]; if (animRandDestChk && animRandDestChk.checked && vertices.length) animDestSelect.value = vertices[Math.floor(Math.random() * vertices.length)]; document.querySelector('.sidebar-tabs button[data-tab="anim-play-tab"]').click(); });

    generateBtn.click(); animGenerateBtn.click();

    let quizGraph = new Graph(); window.cyQuiz = cytoscape({ container: document.getElementById('cy-quiz'), style: cyStyle, layout: { name: 'cose' } }); const quizSourceSelect = document.getElementById('quiz-source-node'); let quizGenerator = null; let quizHistory = []; let quizPqSnapshot = []; let quizDistSnapshot = new Map(); let isWaitingForTap = false; let currentMinNode = null; let currentMinPriority = null;
    document.getElementById('quiz-generate-btn').addEventListener('click', () => { const dirChk = document.getElementById('quiz-directed-chk')?.checked; const randDirChk = document.getElementById('quiz-rand-directed-chk')?.checked; const count = parseInt(document.getElementById('quiz-node-count').value) || 10; quizGraph.clear(); window.cyQuiz.elements().remove(); const elements = []; const nodes = []; for (let i = 0; i < count; i++) { const id = `Q${i}`; nodes.push(id); quizGraph.addVertex(id); elements.push({ data: { id, label: id } }); } let edgeCount = 0; for (let i = 1; i < count; i++) { const target = nodes[i]; const source = nodes[Math.floor(Math.random() * i)]; const weight = Math.floor(Math.random() * 20) + 1; const isDir = dirChk || (randDirChk && Math.random() > 0.5); quizGraph.addEdge(source, target, weight, isDir); elements.push({ data: { id: `qE${edgeCount++}`, source, target, weight }, classes: isDir ? 'directed' : '' }); } for (let i = 0; i < count; i++) { const src = nodes[Math.floor(Math.random() * count)]; const tgt = nodes[Math.floor(Math.random() * count)]; if (src !== tgt && !quizGraph.getNeighbors(src).some(n => n.node === tgt)) { const weight = Math.floor(Math.random() * 20) + 1; const isDir = dirChk || (randDirChk && Math.random() > 0.5); quizGraph.addEdge(src, tgt, weight, isDir); elements.push({ data: { id: `qE${edgeCount++}`, source: src, target: tgt, weight }, classes: isDir ? 'directed' : '' }); } } window.cyQuiz.add(elements); window.cyQuiz.layout({ name: 'cose', padding: 50, nodeRepulsion: 400000, idealEdgeLength: 100, edgeElasticity: 100 }).run(); quizSourceSelect.innerHTML = ''; quizGraph.getVertices().forEach(v => quizSourceSelect.add(new Option(v, v))); quizSourceSelect.disabled = false; document.getElementById('quiz-start-btn').disabled = false; document.getElementById('quiz-explanation-text').innerHTML = 'Graph generated.'; });
    const quizUpdater = createVisualUpdater(window.cyQuiz, { expText: document.getElementById('quiz-explanation-text'), pqSpan: document.querySelector('#quiz-pq-state span'), distContainer: document.querySelector('#quiz-distances-state .distances-table-container') });
    const stepQuiz = () => {
        if (!quizGenerator) return;
        let res = quizGenerator.next();
        while (!res.done) {
            const state = res.value;
            quizHistory.push(state);
            quizUpdater(state, quizHistory, quizHistory.length - 1, true);

            if (state.type === 'EXTRACT_MIN') {
                currentMinPriority = state.priority;
                if (currentMinPriority === 0) {
                    res = quizGenerator.next();
                    continue;
                }
                currentMinNode = state.currentNode;
                quizPqSnapshot = state.pqState.map(i => ({ ...i }));
                quizDistSnapshot = new Map(state.distances);
                window.cyQuiz.getElementById(currentMinNode).removeClass('current-node');
                isWaitingForTap = true;
                const nodeList = state.pqState.map(i => `<span style="font-family:monospace;background:#1e293b;padding:2px 5px;border-radius:3px;">${i.node}: <strong style="color:#f59e0b;">${i.priority}</strong></span>`).join(' ');
                document.getElementById('quiz-explanation-text').innerHTML = `<strong style="color:#3b82f6;">🎯 QUIZ:</strong> Which node should be extracted next (minimum distance)?<br><small style="color:#94a3b8;">Priority Queue: ${nodeList}</small>`;
                document.querySelector('#quiz-pq-state span').innerHTML = '(Hidden — make your guess!)';
                const heapContent = document.getElementById('floating-heap-content');
                if (heapContent) heapContent.innerHTML = '<div style="padding:20px;text-align:center;color:#64748b;">(Hidden during quiz)</div>';
                return;
            }

            if (state.type === 'DONE' || state.type === 'PATH_FOUND') {
                isWaitingForTap = false;
                document.getElementById('quiz-start-btn').disabled = false;
                document.getElementById('quiz-explanation-text').innerHTML = `<strong style="color:#10b981;">✅ Quiz Complete!</strong> ${state.message}`;
                return;
            }

            res = quizGenerator.next();
        }
    };
    document.getElementById('quiz-start-btn').addEventListener('click', () => { const source = quizSourceSelect.value; if (!source) return; window.cyQuiz.elements().removeClass('source target visited current path-edge eval-edge tree-edge dimmed dynamic-tree-edge finalized in-queue current-node'); window.cyQuiz.getElementById(source).addClass('source'); quizGenerator = runDijkstraStepByStep(quizGraph, source, null); quizHistory = []; quizPqSnapshot = []; quizDistSnapshot = new Map(); isWaitingForTap = false; document.getElementById('quiz-start-btn').disabled = true; stepQuiz(); });
    window.cyQuiz.on('tap', 'node', (e) => {
        if (!isWaitingForTap || !quizGenerator) return;
        const target = e.target;
        const tappedId = target.id();
        const tappedDist = quizDistSnapshot.get(tappedId);
        const inHeap = quizPqSnapshot.some(i => i.node === tappedId);
        if (inHeap && tappedDist === currentMinPriority) {
            target.addClass('glow-success');
            setTimeout(() => target.removeClass('glow-success'), 1000);
            isWaitingForTap = false;
            stepQuiz();
        } else {
            target.addClass('glow-fail');
            setTimeout(() => target.removeClass('glow-fail'), 1000);
            const tappedDistStr = tappedDist === Infinity ? '∞' : tappedDist;
            let message;
            if (!inHeap) {
                message = `❌ Incorrect! Node <strong>${tappedId}</strong> is not in the Priority Queue (it may already be finalized or unreachable).`;
            } else {
                message = `❌ Incorrect! Node <strong>${tappedId}</strong> has distance <strong>${tappedDistStr}</strong>, but the minimum is <strong>${currentMinPriority}</strong>. Look for the node with the smallest distance in the queue.`;
            }
            document.getElementById('quiz-error-details').innerHTML = message;
            document.getElementById('quiz-error-modal').classList.remove('hidden');
        }
    });
    const quizCloseBtn = document.getElementById('quiz-error-close-btn'); if (quizCloseBtn) quizCloseBtn.addEventListener('click', () => { document.getElementById('quiz-error-modal').classList.add('hidden'); });

    const directedChk = document.getElementById('directed-chk');
    if (directedChk) directedChk.addEventListener('change', e => { if (window.cyRandom && randomGraph.getVertices().length) applyDirectedToggle(window.cyRandom, randomGraph, e.target.checked); });
    const customDirChk = document.getElementById('custom-directed-chk');
    if (customDirChk) customDirChk.addEventListener('change', e => { if (window.cyCustom && customGraph.getVertices().length) applyDirectedToggle(window.cyCustom, customGraph, e.target.checked); });
    const animDirChk = document.getElementById('anim-directed-chk');
    if (animDirChk) animDirChk.addEventListener('change', e => { if (window.cyAnim && animGraph.getVertices().length) applyDirectedToggle(window.cyAnim, animGraph, e.target.checked); });

    const syncCheckboxes = () => {
        if (randSizeChk) nodeCountInput.disabled = randSizeChk.checked;
        if (randSourceChk) sourceSelect.disabled = randSourceChk.checked;
        if (randDestChk) destSelect.disabled = randDestChk.checked;
        if (animRandSizeChk) animNodeCountInput.disabled = animRandSizeChk.checked;
        if (animRandSourceChk) animSourceSelect.disabled = animRandSourceChk.checked;
        if (animRandDestChk) animDestSelect.disabled = animRandDestChk.checked;
    };
    syncCheckboxes();
});
