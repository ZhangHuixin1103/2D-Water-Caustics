import { Vector3 } from "./vector3.js";
import { Vector4 } from "./vector4.js";

export class Vector2 {

    /**
     * Constructor
     * @param {Vector2, Vector3, Vector4, Array, Float32Array} [src] the source of elements
     */
    constructor(src) {
        if (src) {
            if (src instanceof Vector2) {
                this.elements = new Float32Array(src.elements);
            }
            else if (src instanceof Vector3 || src instanceof Vector4) {
                this.elements = src.elements.slice(0, 2);
            }
            else if (src instanceof Array || src instanceof Float32Array) {
                if (src.length === 2) this.elements = new Float32Array(src);
                else throw `Vector2.constructor: "src.length" is ${src.length}`
            }
            else {
                throw `Vector2.constructor: "src" has a type ${src.constructor.name}`;
            }
        }
        else {
            this.elements = new Float32Array(2);
        }
    }

    /**
     * Copy elements
     * @param {Vector2, Vector3, Vector4, Array, Float32Array} src the source of elements
     * @return {Vector2} this
     */
    set(src) {
        if (src instanceof Vector2) {
            this.elements = new Float32Array(src.elements);
        }
        else if (src instanceof Vector3 || src instanceof Vector4) {
            this.elements = src.elements.slice(0, 2);
        }
        else if (src instanceof Array || src instanceof Float32Array) {
            if (src.length === 2) this.elements = new Float32Array(src);
            else throw `Vector2.set: "src.length" is ${src.length}`
        }
        else {
            throw `Vector2.set: "src" has a type ${src.constructor.name}`;
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

}
