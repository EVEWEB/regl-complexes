const regl = require('regl')()
const canvas = document.getElementsByTagName('canvas')[0];
const camera = require('canvas-orbit-camera')(canvas)
const glslify = require('glslify');
const mat4 = require('gl-mat4');
const cols = 128, rows=128,scale=200;
console.log(cols);

function scaleRow(x){
  return ((x/cols)*scale)-(scale/2);
}
function scaleCol(y)
{
  return ((y/rows)*scale)-(scale/2);
}

const draw = regl({

  frag: glslify(`
    precision highp float;

    uniform vec4 color;
    uniform float time;

    varying vec3 pos;
    varying float height;


    void main(){
      gl_FragColor = vec4(vec3(0.5,0.0,0.5)+vec3(height*0.02),1.0);
    }
  `),
  vert: glslify(`
    precision highp float;

    #pragma glslify: snoise2 = require(glsl-noise/simplex/2d)

    attribute vec2 position;

    uniform float time;
    uniform mat4 model,view,proj;

    varying float height;
    varying vec3 pos;


    void main(){
      pos=vec3((position*2.0)-1.0,0.0);
      height=(snoise2(position.xy*0.1)*3.0)+(snoise2(position.xy*0.03)*11.0);
      gl_Position = proj * view * model * vec4(vec3(pos.x,pos.y,height), 1.0);
    }
  `),

  attributes: {
        position: (new Array(rows*cols).fill(0).map((v,i)=>{
          let xp=i%cols;
          let yp=(i-xp)/cols;

        return [
          [scaleRow(xp),scaleCol(yp)],
          [scaleRow(xp+1),scaleCol(yp)],
          [scaleRow(xp),scaleCol(yp+1)],

          [scaleRow(xp),scaleCol(yp+1)],
          [scaleRow(xp+1),scaleCol(yp)],
          [scaleRow(xp+1),scaleCol(yp+1)],

        ];
      }).reduce((v,i)=>v.concat(i)))
},

  uniforms: {
    color: [1, 1, 0, 1],
    time: regl.prop('time'),
    proj: ({viewportWidth, viewportHeight}) =>
     mat4.perspective([],
       Math.PI / 2,
       viewportWidth / viewportHeight,
       0.01,
       1000),
   model: mat4.identity([]),
   view: () => camera.view()
  },

  count: 6*rows*cols,
  primitive: 'triangles',

});

regl.frame(function({tick}) {
  regl.clear({
    color: [0, 1, 0, 1]
  });
  camera.tick();
  draw({time: tick/10});
  });
