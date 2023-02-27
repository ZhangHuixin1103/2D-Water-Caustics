import { Vector2 } from "../lib/vector2.js";
import { WaveState } from "./state.js";

export class Wave {

    constructor() {
        this.state = WaveState.INACTIVE;

        this.center = new Vector2();

        this.start = 0;
        this.stop = 0;
        this.travel = 0;

        this.amplitude = 0;
        this.speed = 0;
        this.length = 0;
        this.size = 0;
    }

}
