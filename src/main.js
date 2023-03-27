import { Matrix4 } from "../lib/matrix4.js";
import { Vector3 } from "../lib/vector3.js";

import { Bottom } from "./bottom.js";
import { Camera } from "./camera.js";
import { Light } from "./light.js";
import { FileLoader } from "./loader.js";
import { WaveState } from "./state.js";
import { Water } from "./water.js";
import { Wave } from "./wave.js";
import { WebGL } from "./webgl.js";

const NORMAL_DEPTH_VS = "./ref/glsl/normal-depth-vs.glsl";
const NORMAL_DEPTH_FS = "./ref/glsl/normal-depth-fs.glsl";
const CAUSTIC_VS = "./ref/glsl/caustic-vs.glsl";
const CAUSTIC_FS = "./ref/glsl/caustic-fs.glsl";
const BOTTOM_VS = "./ref/glsl/bottom-vs.glsl";
const BOTTOM_FS = "./ref/glsl/bottom-fs.glsl";
const WATER_VS = "./ref/glsl/water-vs.glsl";
const WATER_FS = "./ref/glsl/water-fs.glsl";

const N_TEMPLATE = "_N_";
const N = 200;
const W_TEMPLATE = "_W_";
const W = 10;

const CAUSTIC_TEXTURE_SIZE = 1024;

const FOV_Y = 30;
const NEAR = 1;
const FAR = 100;

const ANGLES = new Int8Array([-1, 1, -1, -1, 1, 1, 1, -1]);

let canvas;
let gl;
let toolbar;
let about;
let depthInput;
let randomWavesInput;
let interactWavesInput;
let textureInput;
let saveImageButton;

let arrayBuffers;
let elementArrayBuffers;

let bottomProgram;
let bottomProgramAttributes;
let bottomProgramUniforms;
let bottomTexture;

let causticProgram;
let causticProgramAttributes;
let causticProgramUniforms;
let causticFramebuffer;
let causticTexture;

let normalDepthProgram;
let normalDepthProgramAttributes;
let normalDepthProgramUniforms;
let normalDepthFramebuffer;
let normalDepthTexture;

let waterProgram;
let waterProgramAttributes;
let waterProgramUniforms;

let matrix = new Matrix4();

let bottom = new Bottom();
let camera = new Camera(5, 10);
let light = new Light();
let fileLoader = new FileLoader();
let water = new Water(N, 1);
let waves = [];

let loading = 2;
let randomWaves = true;
let saveImage = false;

let mouseMoved;
let mouseX, mouseY;

window.onload = () => {
    fileLoader.addFile(BOTTOM_FS);
    fileLoader.addFile(BOTTOM_VS);
    fileLoader.addFile(CAUSTIC_FS);
    fileLoader.addFile(CAUSTIC_VS);
    fileLoader.addFile(NORMAL_DEPTH_FS);
    fileLoader.addFile(NORMAL_DEPTH_VS);
    fileLoader.addFile(WATER_FS);
    fileLoader.addFile(WATER_VS);

    fileLoader.onload = loadingComplete;

    fileLoader.loadFiles();

    let image = bottom.image;
    image.onload = loadingComplete;
    image.src = "img/sand2.jpg"; // can change sand/tile .jpg yourself
};

window.onresize = resize;

function loadingComplete() {
    loading--;

    if (loading === 0) {
        initialize();
        resize();

        requestAnimationFrame(animate);
    }
}

function resize() {
    canvas.width = window.innerWidth - parseInt(getComputedStyle(toolbar).width);
    canvas.height = window.innerHeight - parseInt(getComputedStyle(about).height);

    gl.viewport(0, 0, canvas.width, canvas.height);
}

function createWave(wave, x, z, start) {
    wave.state = WaveState.CREATED;

    wave.center.x = x;
    wave.center.y = z;

    wave.speed = 0.3;
    wave.length = 0.4;
    wave.size = 0.5;

    wave.travel = 0;
    wave.start = start;
    wave.stop = start + (2 * Math.sqrt(2) + wave.size * wave.length) / wave.speed;
}

function createRandomWave(wave, start) {
    wave.state = WaveState.CREATED;

    let area = Math.round(3 * Math.random());

    if (area === 0) {
        wave.center.x = Math.random() - 2;
        wave.center.y = 3 * Math.random() - 1;
    }
    else if (area === 1) {
        wave.center.x = 3 * Math.random() - 1;
        wave.center.y = Math.random() + 1;
    }
    else if (area === 2) {
        wave.center.x = Math.random() + 1;
        wave.center.y = 3 * Math.random() - 2;
    }
    else {
        wave.center.x = 3 * Math.random() - 2;
        wave.center.y = Math.random() - 2;
    }

    wave.speed = 0.4;
    wave.length = 0.5;
    wave.size = 3.5;
    wave.travel = 0.1;
    wave.start = start;
    wave.stop = start + (3 * Math.sqrt(2) + wave.size * wave.length) / wave.speed;
}

function interactWithWater(canvasX, canvasY) {
    let look = new Vector3(camera.position);

    look.multiply(-1);
    look.normalize();

    let horizontal = camera.horizontal + Math.PI / 2;
    let vertical = camera.vertical + Math.PI / 2;

    let tanY = Math.tan(FOV_Y * Math.PI / 360);
    let tanX = tanY * canvas.width / canvas.height;

    let clipPlaneX = canvasX / canvas.width * 2 - 1;
    let clipPlaneY = -(canvasY / canvas.height * 2 - 1);

    let clipPlaneXV = new Vector3();
    clipPlaneXV.x = Math.sin(horizontal);
    clipPlaneXV.y = 0;
    clipPlaneXV.z = Math.cos(horizontal);
    clipPlaneXV.multiply(tanX);
    clipPlaneXV.multiply(clipPlaneX);

    let projection = Math.cos(vertical);

    let clipPlaneYV = new Vector3();
    clipPlaneYV.x = projection * Math.sin(camera.horizontal);
    clipPlaneYV.y = Math.sin(vertical);
    clipPlaneYV.z = projection * Math.cos(camera.horizontal);
    clipPlaneYV.multiply(tanY);
    clipPlaneYV.multiply(clipPlaneY);

    let ray = new Vector3(look);

    ray.add(clipPlaneXV);
    ray.add(clipPlaneYV);

    let t = (water.depth - camera.position.y) / ray.y;

    let intersection = new Vector3(camera.position);

    intersection.add(Vector3.multiply(ray, t));

    if (intersection.x > -1 && intersection.z > -1 && intersection.x < 1 && intersection.z < 1) {
        for (let i = 0; i < W; i++) {
            let wave = waves[i];

            if (wave.state === WaveState.INACTIVE) {
                let time = Date.now() / 1000;
                createWave(wave, intersection.x, intersection.z, time);
                break;
            }
        }
    }
}

function changeMode() {
    if (randomWavesInput.checked) {
        randomWaves = true;

        let time = Date.now() / 1000;
        for (let i = 0; i < W; i++) createRandomWave(waves[i], time + i);
    }
    else {
        randomWaves = false;

        for (let i = 0; i < W; i++) waves[i].state = WaveState.INACTIVE;
    }
}

function initialize() {
    initializeElements();
    initializeWebGL();
    initializePrograms();
    initializeBuffers();
    initializeVariables();
    initializeTextures();
    initializeFramebuffers();
    initializeWaves();

    camera.horizontal = -Math.PI / 4;
    camera.vertical = Math.PI / 4;
}

function initializeElements() {
    canvas = document.getElementById("canvas");

    canvas.onclick = (event) => {
        if (!(mouseMoved || randomWaves)) {
            interactWithWater(event.clientX, event.clientY);
        }
    };

    canvas.onmousedown = (event) => {
        mouseMoved = false;

        mouseX = event.clientX;
        mouseY = event.clientY;

        document.onmouseup = () => {
            document.onmouseup = null;
            document.onmousemove = null;
        };

        document.onmousemove = (event) => {
            camera.horizontal -= (event.clientX - mouseX) / canvas.width * Math.PI;
            camera.vertical += (event.clientY - mouseY) / canvas.height * Math.PI;

            mouseMoved = true;

            mouseX = event.clientX;
            mouseY = event.clientY;
        };
    };

    canvas.onwheel = (event) => {
        camera.distance += event.deltaY;
    };

    toolbar = document.getElementById("toolbar");
    about = document.getElementById("about");
    depthInput = document.getElementById("depth-input");
    randomWavesInput = document.getElementById("random-waves-input");
    randomWavesInput.onchange = changeMode;
    interactWavesInput = document.getElementById("interact-waves-input");
    interactWavesInput.onchange = changeMode;

    textureInput = document.getElementById("texture-input");
    textureInput.onchange = () => {
        if (textureInput.files.length === 1 && textureInput.files[0].type === "image/jpeg") {
            let image = bottom.image;

            let url = URL.createObjectURL(textureInput.files[0]);

            image.onload = () => {
                URL.revokeObjectURL(url);

                gl.bindTexture(gl.TEXTURE_2D, bottomTexture);

                gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image);

                gl.bindTexture(gl.TEXTURE_2D, null);
            };

            image.src = url;
        }
    };

    saveImageButton = document.getElementById("save-image-button");
    saveImageButton.onclick = () => {
        saveImage = true;
    }
}

function initializeWebGL() {
    gl = canvas.getContext("webgl");

    let extension;

    extension = gl.getExtension("OES_texture_float");
    if (extension == null) throw `initializeWebGL: the "OES_texture_float" extension isn't available`;
    extension = gl.getExtension("OES_standard_derivatives");
    if (extension == null) throw `initializeWebGL: the "OES_standard_derivatives" extension isn't available`;

    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.clearColor(0, 0, 0, 1);
}

function initializePrograms() {
    let bottomVS = WebGL.createShader(gl, fileLoader.getSource(BOTTOM_VS), gl.VERTEX_SHADER);
    let bottomFS = WebGL.createShader(gl, fileLoader.getSource(BOTTOM_FS), gl.FRAGMENT_SHADER);
    bottomProgram = WebGL.createProgram(gl, bottomVS, bottomFS);

    let causticVS = WebGL.createShader(gl, fileLoader.getSource(CAUSTIC_VS).replace(N_TEMPLATE, N), gl.VERTEX_SHADER);
    let causticFS = WebGL.createShader(gl, fileLoader.getSource(CAUSTIC_FS), gl.FRAGMENT_SHADER);
    causticProgram = WebGL.createProgram(gl, causticVS, causticFS);

    let normalDepthVS = WebGL.createShader(gl, fileLoader.getSource(NORMAL_DEPTH_VS), gl.VERTEX_SHADER);
    let normalDepthFS = WebGL.createShader(gl, fileLoader.getSource(NORMAL_DEPTH_FS).replace(N_TEMPLATE, N).replace(W_TEMPLATE, W), gl.FRAGMENT_SHADER);
    normalDepthProgram = WebGL.createProgram(gl, normalDepthVS, normalDepthFS);

    let waterVS = WebGL.createShader(gl, fileLoader.getSource(WATER_VS).replace(N_TEMPLATE, N), gl.VERTEX_SHADER);
    let waterFS = WebGL.createShader(gl, fileLoader.getSource(WATER_FS), gl.FRAGMENT_SHADER);
    waterProgram = WebGL.createProgram(gl, waterVS, waterFS);

    fileLoader.clear();
}

function initializeBuffers() {
    arrayBuffers = {
        angleBuffer: WebGL.createBuffer(gl, ANGLES, gl.ARRAY_BUFFER, gl.STATIC_DRAW),
        vertexBuffer: WebGL.createBuffer(gl, water.vertices, gl.ARRAY_BUFFER, gl.STATIC_DRAW),
        bottomPositionBuffer: WebGL.createBuffer(gl, bottom.positions, gl.ARRAY_BUFFER, gl.STATIC_DRAW),
        bottomCoordinateBuffer: WebGL.createBuffer(gl, bottom.coordinates, gl.ARRAY_BUFFER, gl.STATIC_DRAW)
    };

    elementArrayBuffers = {
        indexBuffer: WebGL.createBuffer(gl, water.indices, gl.ELEMENT_ARRAY_BUFFER, gl.STATIC_DRAW)
    };
}

function initializeVariables() {
    bottomProgramAttributes = {
        a_position: gl.getAttribLocation(bottomProgram, "a_position"),
        a_coordinates: gl.getAttribLocation(bottomProgram, "a_coordinates")
    };
    bottomProgramUniforms = {
        u_matrix: gl.getUniformLocation(bottomProgram, "u_matrix"),
        u_bottomTexture: gl.getUniformLocation(bottomProgram, "u_bottomTexture"),
        u_causticTexture: gl.getUniformLocation(bottomProgram, "u_causticTexture")
    };

    causticProgramAttributes = {
        a_vertex: gl.getAttribLocation(causticProgram, "a_vertex")
    };
    causticProgramUniforms = {
        u_positionTexture: gl.getUniformLocation(causticProgram, "u_positionTexture"),
        u_light: gl.getUniformLocation(causticProgram, "u_light")
    };

    normalDepthProgramAttributes = {
        a_angle: gl.getAttribLocation(normalDepthProgram, "a_angle")
    };
    normalDepthProgramUniforms = {
        u_depth: gl.getUniformLocation(normalDepthProgram, "u_depth"),
        u_waves: []
    };
    for (let i = 0; i < W; i++) {
        let u_wave = {
            state: gl.getUniformLocation(normalDepthProgram, `u_waves[${i}].state`),
            center: gl.getUniformLocation(normalDepthProgram, `u_waves[${i}].center`),
            amplitude: gl.getUniformLocation(normalDepthProgram, `u_waves[${i}].amplitude`),
            speed: gl.getUniformLocation(normalDepthProgram, `u_waves[${i}].speed`),
            length: gl.getUniformLocation(normalDepthProgram, `u_waves[${i}].length`),
            size: gl.getUniformLocation(normalDepthProgram, `u_waves[${i}].size`),
            travel: gl.getUniformLocation(normalDepthProgram, `u_waves[${i}].travel`)
        };
        normalDepthProgramUniforms.u_waves.push(u_wave);
    }

    waterProgramAttributes = {
        a_vertex: gl.getAttribLocation(waterProgram, "a_vertex")
    };
    waterProgramUniforms = {
        u_positionTexture: gl.getUniformLocation(waterProgram, "u_positionTexture"),
        u_light: gl.getUniformLocation(waterProgram, "u_light"),
        u_matrix: gl.getUniformLocation(waterProgram, "u_matrix")
    };
}

function initializeTextures() {
    normalDepthTexture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, normalDepthTexture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, N, N, 0, gl.RGBA, gl.FLOAT, null);

    causticTexture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, causticTexture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, CAUSTIC_TEXTURE_SIZE, CAUSTIC_TEXTURE_SIZE, 0, gl.RGB, gl.UNSIGNED_BYTE, null);

    bottomTexture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, bottomTexture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, bottom.image);

    gl.bindTexture(gl.TEXTURE_2D, null);
}

function initializeFramebuffers() {
    normalDepthFramebuffer = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, normalDepthFramebuffer);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, normalDepthTexture, 0);
    if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) !== gl.FRAMEBUFFER_COMPLETE) throw `initializeFramebuffers: normal-depth framebuffer error`;

    causticFramebuffer = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, causticFramebuffer);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, causticTexture, 0);
    if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) !== gl.FRAMEBUFFER_COMPLETE) throw `initializeFramebuffers: caustic framebuffer error`;

    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
}

function initializeWaves() {
    let time = Date.now() / 1000;

    for (let i = 0; i < W; i++) {
        let wave = new Wave();
        createRandomWave(wave, time + i);
        waves.push(wave);
    }
}

function animate() {
    update();
    draw();

    if (saveImage) {
        saveImage = false;
        let canvasImage = canvas.toDataURL('image/png');
        let xhr = new XMLHttpRequest();
        xhr.responseType = 'blob';
        xhr.onload = function () {
            let a = document.createElement('a');
            a.href = window.URL.createObjectURL(xhr.response);
            a.download = 'scene.png';
            a.style.display = 'none';
            document.body.appendChild(a);
            a.click();
            a.remove();
        };
        xhr.open('GET', canvasImage);
        xhr.send();
    }

    requestAnimationFrame(animate);
}

function update() {
    updateWater();
    updateWaves();
    updateMatrix();
}

function updateWater() {
    water.depth = depthInput.value;
}

function updateWaves() {
    let time = Date.now() / 1000;

    for (let i = 0; i < W; i++) {
        let wave = waves[i];

        if (wave.state === WaveState.INACTIVE && randomWaves) createRandomWave(wave, time);
        if (wave.state === WaveState.CREATED && time >= wave.start) wave.state = WaveState.ACTIVE;
        if (wave.state === WaveState.ACTIVE) {
            if (time <= wave.stop) {
                wave.amplitude = (wave.stop - time) / (wave.stop - wave.start) * 0.01;
                wave.travel = wave.speed * (time - wave.start);
            }
            else {
                wave.state = WaveState.INACTIVE;
            }
        }
    }
}

function updateMatrix() {
    matrix.reset();
    matrix.setPerspective(FOV_Y, canvas.width / canvas.height, NEAR, FAR);
    matrix.lookAt(camera.position.x, camera.position.y, camera.position.z, 0, 0, 0, 0, 1, 0);
}

function draw() {
    gl.bindFramebuffer(gl.FRAMEBUFFER, normalDepthFramebuffer);
    gl.viewport(0, 0, N, N);
    gl.clear(gl.COLOR_BUFFER_BIT);
    drawNormalDepth();

    gl.bindFramebuffer(gl.FRAMEBUFFER, causticFramebuffer);
    gl.viewport(0, 0, CAUSTIC_TEXTURE_SIZE, CAUSTIC_TEXTURE_SIZE);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE);
    gl.clear(gl.COLOR_BUFFER_BIT);
    drawCaustic();

    gl.disable(gl.BLEND);

    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.enable(gl.DEPTH_TEST);
    gl.enable(gl.CULL_FACE);
    gl.cullFace(gl.BACK);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    drawBottom();

    gl.disable(gl.CULL_FACE);

    gl.depthMask(false);
    gl.enable(gl.BLEND);
    gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.ZERO, gl.ONE);
    drawWater();

    gl.depthMask(true);
    gl.disable(gl.DEPTH_TEST);
    gl.disable(gl.BLEND);
}

function drawNormalDepth() {
    let attributes = normalDepthProgramAttributes;
    let uniforms = normalDepthProgramUniforms;

    gl.useProgram(normalDepthProgram);

    gl.bindBuffer(gl.ARRAY_BUFFER, arrayBuffers.angleBuffer);

    gl.vertexAttribPointer(attributes.a_angle, 2, gl.BYTE, false, 0, 0);
    gl.enableVertexAttribArray(attributes.a_angle);

    gl.uniform1f(uniforms.u_depth, water.depth);

    for (let i = 0; i < W; i++) {
        let u_wave = uniforms.u_waves[i];
        let wave = waves[i];

        gl.uniform1i(u_wave.state, wave.state);
        gl.uniform2fv(u_wave.center, wave.center.elements);
        gl.uniform1f(u_wave.amplitude, wave.amplitude);
        gl.uniform1f(u_wave.speed, wave.speed);
        gl.uniform1f(u_wave.length, wave.length);
        gl.uniform1f(u_wave.size, wave.size);
        gl.uniform1f(u_wave.travel, wave.travel);
    }

    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
}

function drawCaustic() {
    let attributes = causticProgramAttributes;
    let uniforms = causticProgramUniforms;

    gl.useProgram(causticProgram);

    gl.bindBuffer(gl.ARRAY_BUFFER, arrayBuffers.vertexBuffer);

    gl.vertexAttribPointer(attributes.a_vertex, 2, gl.UNSIGNED_SHORT, false, 0, 0);
    gl.enableVertexAttribArray(attributes.a_vertex);

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, elementArrayBuffers.indexBuffer);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, normalDepthTexture);

    gl.uniform1i(uniforms.u_positionTexture, 0);

    gl.uniform3fv(uniforms.u_light, light.direction.elements);

    gl.drawElements(gl.TRIANGLES, water.indices.length, gl.UNSIGNED_SHORT, 0);
}

function drawBottom() {
    let attributes = bottomProgramAttributes;
    let uniforms = bottomProgramUniforms;

    gl.useProgram(bottomProgram);

    gl.bindBuffer(gl.ARRAY_BUFFER, arrayBuffers.bottomPositionBuffer);

    gl.vertexAttribPointer(attributes.a_position, 2, gl.BYTE, false, 0, 0);
    gl.enableVertexAttribArray(attributes.a_position);

    gl.bindBuffer(gl.ARRAY_BUFFER, arrayBuffers.bottomCoordinateBuffer);

    gl.vertexAttribPointer(attributes.a_coordinates, 2, gl.UNSIGNED_BYTE, false, 0, 0);
    gl.enableVertexAttribArray(attributes.a_coordinates);

    gl.uniformMatrix4fv(uniforms.u_matrix, false, matrix.elements);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, bottomTexture);

    gl.uniform1i(uniforms.u_bottomTexture, 0);

    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, causticTexture);

    gl.uniform1i(uniforms.u_causticTexture, 1);

    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
}

function drawWater() {
    let attributes = waterProgramAttributes;
    let uniforms = waterProgramUniforms;

    gl.useProgram(waterProgram);

    gl.bindBuffer(gl.ARRAY_BUFFER, arrayBuffers.vertexBuffer);

    gl.vertexAttribPointer(attributes.a_vertex, 2, gl.UNSIGNED_SHORT, false, 0, 0);
    gl.enableVertexAttribArray(attributes.a_vertex);

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, elementArrayBuffers.indexBuffer);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, normalDepthTexture);

    gl.uniform1i(uniforms.u_positionTexture, 0);

    gl.uniform3fv(uniforms.u_light, light.direction.elements);

    gl.uniformMatrix4fv(uniforms.u_matrix, false, matrix.elements);

    gl.drawElements(gl.TRIANGLES, water.indices.length, gl.UNSIGNED_SHORT, 0);
}
