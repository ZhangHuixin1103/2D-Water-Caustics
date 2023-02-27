const int N=_N_;

const float STEP=2./float(N-1);

const float PIXEL_SIZE=1./float(N);
const float HALF_PIXEL_SIZE=PIXEL_SIZE/2.;

const float ETA=1./1.33;

attribute vec2 a_vertex;

uniform sampler2D u_normalDepthTexture;
uniform vec3 u_light;

varying vec3 v_position;
varying vec3 v_intersection;

void main(){
    vec2 coordinates=HALF_PIXEL_SIZE+a_vertex*PIXEL_SIZE;
    
    vec4 normalDepth=texture2D(u_normalDepthTexture,coordinates);
    
    vec3 normal=normalDepth.xyz;
    float depth=normalDepth.w;
    
    vec3 position=vec3(-1.+a_vertex.x*STEP,depth,-1.+a_vertex.y*STEP);
    
    v_position=position;
    
    vec3 ray=refract(u_light,normal,ETA);
    
    float t=-position.y/ray.y;
    
    vec3 intersection=position+t*ray;
    
    v_intersection=intersection;
    
    gl_Position=vec4(intersection.x,-intersection.z,0.,1.);
}
