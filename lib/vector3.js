import { Vector4 } from "./vector4.js";

export class Vector3 {

    /**
     * Constructor
     * @param {Vector3, Vector4, Array, Float32Array} [src] the source of elements
     */
    constructor(src) {
        if (src) {
            if (src instanceof Vector3) {
                this.elements = new Float32Array(src.elements);
            }
            else if (src instanceof Vector4) {
                this.elements = src.elements.slice(0, 3);
            }
            else if (src instanceof Array || src instanceof Float32Array) {
                if (src.length === 3) this.elements = new Float32Array(src);
                else throw `Vector3.constructor: "src.length" is ${src.length}`
            }
            else {
                throw `Vector3.constructor: "src" has a type ${src.constructor.name}`;
            }
        }
        else {
            this.elements = new Float32Array(3);
        }
    }

    /**
     * Copy elements
     * @param {Vector3, Vector4, Array, Float32Array} src the source of elements
     * @return {Vector3} this
     */
    set(src) {
        if (src instanceof Vector3) {
            this.elements.set(src.elements);
        }
        else if (src instanceof Vector4) {
            this.elements.set(src.elements.subarray(0, 3));
        }
        else if (src instanceof Array || src instanceof Float32Array) {
            if (src.length === 3) this.elements.set(src);
            else throw `Vector3.set: "src.length" is ${src.length}`
        }
        else {
            throw `Vector3.set: "src" has a type ${src.constructor.name}`;
        }
        return this;
    }

    /**
     * Get x component
     * @return {Number} x
     */
    get x() {
        return this.elements[0];
    }

    /**
     * Set x component
     * @param {Number} value
     */
    set x(value) {
        this.elements[0] = value;
    }

    /**
     * Get y component
     * @return {Number} y
     */
    get y() {
        return this.elements[1];
    }

    /**
     * Set y component
     * @param {Number} value
     */
    set y(value) {
        this.elements[1] = value;
    }

    /**
     * Get z component
     * @return {Number} z
     */
    get z() {
        return this.elements[2];
    }

    /**
     * Set z component
     * @param {Number} value
     */
    set z(value) {
        this.elements[2] = value;
    }

    /**
     * Get r component
     * @return {Number} r
     */
    get r() {
        return this.elements[0];
    }

    /**
     * Set r component
     * @param {Number} value
     */
    set r(value) {
        this.elements[0] = value;
    }

    /**
     * Get g component
     * @return {Number} g
     */
    get g() {
        return this.elements[1];
    }

    /**
     * Set g component
     * @param {Number} value
     */
    set g(value) {
        this.elements[1] = value;
    }

    /**
     * Get b component
     * @return {Number} b
     */
    get b() {
        return this.elements[2];
    }

    /**
     * Set b component
     * @param {Number} value
     */
    set b(value) {
        this.elements[2] = value;
    }

    /**
     * Calculate vector length
     * @return {Number} the vector length
     */
    length() {
        let e = this.elements;

        let x = e[0];
        let y = e[1];
        let z = e[2];

        return Math.sqrt(x * x + y * y + z * z);
    }

    /**
     * Normalize vector
     * @returns {Vector3} this
     */
    normalize() {
        let e = this.elements;

        let l = this.length();

        if (l === 0 || l === 1) return this;

        e[0] /= l;
        e[1] /= l;
        e[2] /= l;

        return this;
    }

    /**
     * Add another vector to vector
     * @param {Vector3} vector the vector
     * @return {Vector3} this
     */
    add(vector) {
        let e = this.elements;
        let t = vector.elements;

        e[0] += t[0];
        e[1] += t[1];
        e[2] += t[2];

        return this;
    }

    /**
     * Calculate sum of the vectors
     * @param {Vector3} vector1 the first vector
     * @param {Vector3} vector2 the second vector
     * @return {Vector3} the result
     */
    static add(vector1, vector2) {
        return new Vector3(vector1).add(vector2);
    }

    /**
     * Multiply vector by the number
     * @param {Number} number the number
     * @return {Vector3} this
     */
    multiply(number) {
        let e = this.elements;

        e[0] *= number;
        e[1] *= number;
        e[2] *= number;

        return this;
    }

    /**
     * Calculate product of vector and the number
     * @param {Vector3} vector the vector
     * @param {Number} number the number
     * @return {Vector3} the result
     */
    static multiply(vector, number) {
        return new Vector3(vector).multiply(number);
    }

}
