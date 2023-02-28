const int N=_N_;

const float STEP=2./float(N-1);

const float PIXEL_SIZE=1./float(N);
const float HALF_PIXEL_SIZE=PIXEL_SIZE/2.;

attribute vec2 a_vertex;

uniform sampler2D u_normalDepthTexture;
uniform vec3 u_light;
uniform mat4 u_matrix;

varying vec4 v_color;

void main(){
    vec2 coordinates=HALF_PIXEL_SIZE+a_vertex*PIXEL_SIZE;
    
    vec4 normalDepth=texture2D(u_normalDepthTexture,coordinates);
    
    vec3 normal=normalDepth.xyz;
    float depth=normalDepth.w;
    
    vec4 position=vec4(-1.+a_vertex.x*STEP,depth,-1.+a_vertex.y*STEP,1.);
    
    float lighting=max(-dot(normal,u_light),0.);
    
    v_color=vec4(pow(lighting,2.)*vec3(0.6078, 0.9059, 0.9804),.4);
    
    gl_Position=u_matrix*position;
}
