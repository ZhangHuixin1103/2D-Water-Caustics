export class WebGL {

    /**
     * Create shader
     * @param {WebGLRenderingContext} gl the WebGL context
     * @param {String} source the shader source
     * @param {GLenum} type the shader type
     * @return {WebGLShader} the created shader
     */
    static createShader(gl, source, type) {
        let shader = gl.createShader(type);

        gl.shaderSource(shader, source);

        gl.compileShader(shader);

        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            let log = gl.getShaderInfoLog(shader);
            gl.deleteShader(shader);
            throw `WebGLUtils.createShader: shader compilation completed with errors:\n${log}`;
        }

        return shader;
    }

    /**
     * Create program
     * @param {WebGLRenderingContext} gl the WebGL context
     * @param {WebGLShader} vertex the vertex shader
     * @param {WebGLShader} fragment the fragment shader
     * @return {WebGLProgram} the created program
     */
    static createProgram(gl, vertex, fragment) {
        let program = gl.createProgram();

        gl.attachShader(program, vertex);
        gl.attachShader(program, fragment);

        gl.linkProgram(program);

        if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
            let log = gl.getProgramInfoLog(program);
            gl.deleteProgram(program);
            throw `WebGLUtils.createProgram: program linking completed with errors:\n${log}`;
        }

        return program;
    }

    /**
     * Create buffer
     * @param {WebGLRenderingContext} gl the WebGL context
     * @param {BufferSource} data the buffer data
     * @param {GLenum} target the buffer target
     * @param {GLenum} usage the buffer usage
     * @return {WebGLBuffer} the created buffer
     */
    static createBuffer(gl, data, target, usage) {
        let buffer = gl.createBuffer();

        gl.bindBuffer(target, buffer);
        gl.bufferData(target, data, usage);
        gl.bindBuffer(target, null);

        return buffer;
    }

}
