export class Water {

    /**
     * Constructor
     * @param {Number} n the vertices number in water side
     * @param {Number} depth the water depth
     */
    constructor(n, depth) {
        this.depth = depth;

        let vertices = [];
        for (let y = 0; y < n; y++) {
            for (let x = 0; x < n; x++) {
                vertices.push(x);
                vertices.push(y);
            }
        }
        this.vertices = new Uint16Array(vertices);

        let indices = [];
        for (let i = 0; i < n * (n - 1); i += n) {
            for (let j = 0; j < n - 1; j++) {
                indices.push(i + j);
                indices.push(i + j + 1);
                indices.push(i + j + n);

                indices.push(i + j + 1);
                indices.push(i + j + n);
                indices.push(i + j + n + 1);
            }
        }
        this.indices = new Uint16Array(indices);
    }

}
