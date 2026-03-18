export default class Graph {
    constructor() {
        this.adjacencyList = new Map();
    }

    addVertex(vertex) {
        if (!this.adjacencyList.has(vertex)) {
            this.adjacencyList.set(vertex, []);
        }
    }

    addEdge(vertex1, vertex2, weight, isDirected = false) {
        this.addVertex(vertex1);
        this.addVertex(vertex2);
        this.adjacencyList.get(vertex1).push({ node: vertex2, weight });
        if (!isDirected) {
            this.adjacencyList.get(vertex2).push({ node: vertex1, weight });
        }
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

    getNeighbors(vertex) {
        return this.adjacencyList.get(vertex) || [];
    }

    getVertices() {
        return Array.from(this.adjacencyList.keys());
    }

    clear() {
        this.adjacencyList.clear();
    }
}
