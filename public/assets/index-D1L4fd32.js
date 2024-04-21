var L=Object.defineProperty;var T=(l,t,e)=>t in l?L(l,t,{enumerable:!0,configurable:!0,writable:!0,value:e}):l[t]=e;var a=(l,t,e)=>(T(l,typeof t!="symbol"?t+"":t,e),e);(function(){const t=document.createElement("link").relList;if(t&&t.supports&&t.supports("modulepreload"))return;for(const r of document.querySelectorAll('link[rel="modulepreload"]'))o(r);new MutationObserver(r=>{for(const s of r)if(s.type==="childList")for(const i of s.addedNodes)i.tagName==="LINK"&&i.rel==="modulepreload"&&o(i)}).observe(document,{childList:!0,subtree:!0});function e(r){const s={};return r.integrity&&(s.integrity=r.integrity),r.referrerPolicy&&(s.referrerPolicy=r.referrerPolicy),r.crossOrigin==="use-credentials"?s.credentials="include":r.crossOrigin==="anonymous"?s.credentials="omit":s.credentials="same-origin",s}function o(r){if(r.ep)return;r.ep=!0;const s=e(r);fetch(r.href,s)}})();const A=3,k=`
uvec3 pcg3d(uvec3 v) {
  // Citation: Mark Jarzynski and Marc Olano, Hash Functions for GPU Rendering,
  // Journal of Computer Graphics Techniques (JCGT), vol. 9, no. 3, 21-38, 2020
  // Available online http://jcgt.org/published/0009/03/02/

  v = v * 1664525u + 1013904223u;
  v.x += v.y*v.z; v.y += v.z*v.x; v.z += v.x*v.y;
  v ^= v >> 16u;
  v.x += v.y*v.z; v.y += v.z*v.x; v.z += v.x*v.y;
  return v;
}

void split(inout uvec3 key, out uvec3 sub_key) {
  sub_key = pcg3d(key);
  key = pcg3d(sub_key);
}
`,N=`
// recovered from de-compiled JAX
float random_uniform(uvec3 seed, float low, float high) {
  float a = uintBitsToFloat(seed.x >> 9u | 1065353216u) - 1.0;
  float diff = high - low;
  float w = diff * a;
  float u = w + low;
  return max(low, u);
}
`,U=`
// recovered from de-compiled JAX
float logpdf_uniform(float v, float low, float high) {
  bool d = v != v;
  bool e = v < low;
  bool f = v > high;
  // g = e, h = f
  bool i = e || f;
  float j = high - low;
  float k = 1.0 / j;
  float l = i ? 0.0 : k;
  float q = d ? v : l;
  return log(q);
}
`,M=`
bool flip(uvec3 seed, float prob) {
  if (prob >= 1.0) return true;
  float a = random_uniform(seed, 0.0, 1.0);
  return a < prob;
}
`,P=`
// From Press NR 3ed.
// A lower-order Chebyshev approximation produces a very concise routine, though with only about single precision accuracy:
// Returns the complementary error function with fractional error everywhere less than 1.2e-7.
float erfc(float x) {
  float t,z=abs(x),ans;
  t=2./(2.+z); ans=t*exp(-z*z-1.26551223+t*(1.00002368+t*(0.37409196+t*(0.09678418+
    t*(-0.18628806+t*(0.27886807+t*(-1.13520398+t*(1.48851587+
    t*(-0.82215223+t*0.17087277)))))))));
  return (x >= 0.0 ? ans : 2.0-ans);
}
`,D=`
// The following two functions are from
// http://www.mimirgames.com/articles/programming/approximations-of-the-inverse-error-function/
float inv_erfc(float x) {
  float pp, t, r, er;

  if(x < 1.0) {
    pp = x;
  } else {
    pp = 2.0 - x;
  }
  t = sqrt(-2.0 * log(pp/2.0));
  r = -0.70711 * ((2.30753 + t * 0.27061)/(1.0 + t * (0.99229 + t * 0.04481)) - t);
  er = erfc(r) - pp;
  r += er/(1.12837916709551257 * exp(-r * r) - r * er);
  //Comment the next two lines if you only wish to do a single refinement
  //err = erfc(r) - pp;
  //r += err/(1.12837916709551257 * exp(-r * r) - r * er);
  if(x > 1.0) {
    r = -r;
  }
  return r;
}
`,O=`
float inv_erf(float x){
  return inv_erfc(1.0-x);
}
`,I=`
float random_normal(uvec3 seed, float loc, float scale) {
  float u = sqrt(2.0) * inv_erf(random_uniform(seed, -1.0, 1.0));
  return loc + scale * u;
}
`,C=`
// De-compiled from JAX genjax.normal.logpdf
float logpdf_normal(float v, float loc, float scale) {
  float d = v / scale;
  float e = loc / scale;
  float f = d - e;
  float g = pow(f, 2.0);
  float h = -0.5 * g;
  float i = log(scale);
  float k = 0.9189385175704956 + i;
  return h - k;
}
`,q=`#version 300 es
  ${k}
  ${N}
  ${U}
  ${M}
  ${P}
  ${D}
  ${O}
  ${I}
  ${C}

  #define N_POINTS 10
  #define N_POLY 3
  #define N_SAMPLES 50

  uniform vec2 points[N_POINTS];
  uniform vec3 alpha_loc;
  uniform vec3 alpha_scale;

  in uvec3 seed;
  out vec3 model;
  flat out uint outliers;
  out float weight;

  vec3 sample_alpha(uvec3 key) {
    uvec3 sub_key;
    vec3 alpha;
    split(key, sub_key);
    alpha[0] = random_normal(sub_key, alpha_loc[0], alpha_scale[0]);
    split(key, sub_key);
    alpha[1] = random_normal(sub_key, alpha_loc[1], alpha_scale[1]);
    split(key, sub_key);
    alpha[2] = random_normal(sub_key, alpha_loc[2], alpha_scale[2]);
    return alpha;
  }

  float evaluate_poly(vec3 coefficients, float x) {
    return coefficients[0] + x * coefficients[1] + x * x * coefficients[2];
  }

  struct result {
    uint outliers;
    vec3 model;
    float weight;
  };

  result curve_fit_importance(uvec3 key) {
    // Find the importance of the model generated from
    // coefficients. The "choice map" in this case is one
    // that sets the ys to the observed values. The model
    // has an outlier probability, two normal ranges for
    // inlier and outlier, and a fixed set of xs. We generate
    // the y values from the polynomial, and compute the
    // logpdf of these given the expected values and the
    // outlier choices. Sum all that up and it's the score of
    // the model.
    float w = 0.0;
    uint outliers = 0u;
    uvec3 sub_key;
    split(key, sub_key);
    vec3 coefficients = sample_alpha(sub_key);
    for (int i = 0; i < N_POINTS; ++i) {
      split(key, sub_key);
      bool outlier = flip(sub_key, 0.1);
      outliers = outliers | (uint(outlier) << i);
      float y_model = evaluate_poly(coefficients, points[i].x);
      float y_observed = points[i].y;
      w += logpdf_normal(y_observed, y_model, outlier ? 3.0 : 0.3);
    }
    return result(outliers, coefficients, w);
  }


  void main() {
    uvec3 key = pcg3d(seed), sub_key;
    split(key, sub_key);
    result r = curve_fit_importance(sub_key);
    outliers = r.outliers;
    weight = r.weight;
    model = r.model;
  }
`;class F{constructor(t){a(this,"gl");a(this,"canvas");const e=t.getContext("webgl2");if(!e)throw new Error("Unable to create WebGL2 context");this.canvas=t,this.gl=e}getUniformLocation(t,e){const o=this.gl.getUniformLocation(t,e);if(!o)throw new Error(`unable to getUniformLocation(${e})`);return o}createVertexArray(){const t=this.gl.createVertexArray();if(!t)throw new Error("unable to createVertexArray()");return t}createTransformFeedback(){const t=this.gl.createTransformFeedback();if(!t)throw new Error("unable to createTransformFeedback()");return t}createShader(t,e){const o=this.gl,r=o.createShader(t);if(r){if(o.shaderSource(r,e),o.compileShader(r),o.getShaderParameter(r,o.COMPILE_STATUS))return r;{const s=o.getShaderInfoLog(r);throw o.deleteShader(r),new Error(s||"unknown shader creation error")}}else throw new Error("unable to create shader")}createProgram(t,e,o){const r=this.createShader(this.gl.VERTEX_SHADER,t),s=this.createShader(this.gl.FRAGMENT_SHADER,e),i=this.gl.createProgram();if(i){if(this.gl.attachShader(i,r),this.gl.attachShader(i,s),o&&this.gl.transformFeedbackVaryings(i,o,this.gl.SEPARATE_ATTRIBS),this.gl.linkProgram(i),this.gl.getProgramParameter(i,this.gl.LINK_STATUS))return this.gl.deleteShader(r),this.gl.deleteShader(s),i;{const m=this.gl.getProgramInfoLog(i);throw this.gl.deleteProgram(i),new Error(m||"unknown WebGL2 program creation error")}}else throw new Error("unable to create program")}makeBuffer(t){const e=this.gl.createBuffer();if(!e)throw new Error("unable to createBuffer()");return this.gl.bindBuffer(this.gl.ARRAY_BUFFER,e),typeof t=="number"?this.gl.bufferData(this.gl.ARRAY_BUFFER,t,this.gl.STATIC_DRAW):this.gl.bufferData(this.gl.ARRAY_BUFFER,t,this.gl.STATIC_DRAW),e}uploadUints(t,e){this.gl.bindBuffer(this.gl.ARRAY_BUFFER,t),this.gl.getBufferSubData(this.gl.ARRAY_BUFFER,0,e)}uploadFloats(t,e){this.gl.bindBuffer(this.gl.ARRAY_BUFFER,t),this.gl.getBufferSubData(this.gl.ARRAY_BUFFER,0,e)}}const b=class b{constructor(t){a(this,"wgl");a(this,"gl");a(this,"program");a(this,"pointsLoc");a(this,"alphaLocLoc");a(this,"alphaScaleLoc");a(this,"vao");a(this,"modelBuffer");a(this,"outliersBuffer");a(this,"weightBuffer");a(this,"seedLoc");a(this,"seedBuf");a(this,"tf");a(this,"max_trials");a(this,"seeds");a(this,"modelArray");a(this,"outliersArray");a(this,"weightArray");const r=document.createElement("canvas");r.width=2,r.height=10;const s=new F(r),i=s.gl,m=`#version 300 es
      precision highp float;
      void main() {
      }
    `;this.vao=s.createVertexArray();const h=s.createProgram(q,m,["model","outliers","weight"]);this.seedLoc=i.getAttribLocation(h,"seed"),i.bindVertexArray(this.vao);const d=(_,u)=>{const v=s.makeBuffer(_);if(!v)throw new Error("unable to create buffer");return i.enableVertexAttribArray(u),i.vertexAttribIPointer(u,b.UINTS_PER_SEED,i.UNSIGNED_INT,0,0),v};this.max_trials=t,this.seeds=new Uint32Array(t*b.UINTS_PER_SEED),this.seedBuf=d(this.seeds,this.seedLoc),this.tf=s.createTransformFeedback(),i.bindTransformFeedback(i.TRANSFORM_FEEDBACK,this.tf),this.modelBuffer=s.makeBuffer(t*A*Float32Array.BYTES_PER_ELEMENT),this.outliersBuffer=s.makeBuffer(t*Uint32Array.BYTES_PER_ELEMENT),this.weightBuffer=s.makeBuffer(t*Float32Array.BYTES_PER_ELEMENT),i.bindBufferBase(i.TRANSFORM_FEEDBACK_BUFFER,0,this.modelBuffer),i.bindBufferBase(i.TRANSFORM_FEEDBACK_BUFFER,1,this.outliersBuffer),i.bindBufferBase(i.TRANSFORM_FEEDBACK_BUFFER,2,this.weightBuffer),i.bindTransformFeedback(i.TRANSFORM_FEEDBACK,null),i.bindBuffer(i.ARRAY_BUFFER,null),this.pointsLoc=s.getUniformLocation(h,"points"),this.alphaLocLoc=s.getUniformLocation(h,"alpha_loc"),this.alphaScaleLoc=s.getUniformLocation(h,"alpha_scale"),this.wgl=s,this.gl=i,this.program=h,this.modelArray=new Float32Array(this.max_trials*A),this.outliersArray=new Uint32Array(this.max_trials),this.weightArray=new Float32Array(this.max_trials)}compute(t){const e=this.gl;e.useProgram(this.program);const o=Math.round(Math.random()*4294967295);for(let r=0;r<this.max_trials*b.UINTS_PER_SEED;++r)this.seeds[r]=o+r;return e.bindBuffer(e.ARRAY_BUFFER,this.seedBuf),e.bufferSubData(e.ARRAY_BUFFER,0,this.seeds),e.uniform2fv(this.pointsLoc,t.points.flat()),e.uniform3f(this.alphaLocLoc,t.alpha[0].mu,t.alpha[1].mu,t.alpha[2].mu),e.uniform3f(this.alphaScaleLoc,t.alpha[0].sigma,t.alpha[1].sigma,t.alpha[2].sigma),e.bindVertexArray(this.vao),e.enable(e.RASTERIZER_DISCARD),e.bindTransformFeedback(e.TRANSFORM_FEEDBACK,this.tf),e.beginTransformFeedback(e.POINTS),e.drawArrays(e.POINTS,0,this.max_trials),e.endTransformFeedback(),e.bindTransformFeedback(e.TRANSFORM_FEEDBACK,null),e.disable(e.RASTERIZER_DISCARD),this.wgl.uploadFloats(this.modelBuffer,this.modelArray),this.wgl.uploadUints(this.outliersBuffer,this.outliersArray),this.wgl.uploadFloats(this.weightBuffer,this.weightArray),{model:this.modelArray,outliers:this.outliersArray,weight:this.weightArray}}logsumexp(t){let e=0;for(let o=0;o<t.length;++o)e+=Math.exp(t[o]);return Math.log(e)}logit_to_probability(t){const e=this.logsumexp(t);for(let o=0;o<t.length;++o)t[o]=Math.exp(t[o]-e)}inference(t,e){let o=0,r=new Array(t);const s=performance.now();for(let m=0;m<t;++m){const h=this.compute(e),d=h.weight;this.logit_to_probability(d);const _=Math.random();let u=0,v=0;for(;u<d.length&&(v+=d[u],!(v>=_));++u);u>=d.length&&(u=d.length-1),r[m]={model:h.model.slice(u*A,u*A+A),outliers:h.outliers[u],weight:h.weight[u]}}o+=performance.now()-s;const i=t*this.max_trials/(o/1e3);return{selected_models:r,ips:i}}cleanup(){this.gl.deleteBuffer(this.seedBuf),this.gl.deleteBuffer(this.modelBuffer),this.gl.deleteBuffer(this.outliersBuffer),this.gl.deleteBuffer(this.weightBuffer)}};a(b,"UINTS_PER_SEED",3);let E=b;class z{constructor(){a(this,"positionLoc");a(this,"pointsLoc");a(this,"canvasSizeLoc");a(this,"nModelsLoc");a(this,"polysLoc");a(this,"outliersLoc");a(this,"gl");a(this,"program");a(this,"canvas");this.canvas=document.querySelector("#c"),this.canvas.width=400,this.canvas.height=400;const t=new F(this.canvas),e=t.gl,r=t.createProgram(`#version 300 es
    in vec4 a_position;
    void main() {
      gl_Position = a_position;
    }`,Y);this.positionLoc=e.getAttribLocation(r,"a_position"),this.pointsLoc=t.getUniformLocation(r,"points"),this.canvasSizeLoc=t.getUniformLocation(r,"canvas_size"),this.nModelsLoc=t.getUniformLocation(r,"n_models"),this.polysLoc=t.getUniformLocation(r,"polys"),this.outliersLoc=t.getUniformLocation(r,"outliers");const s=e.createBuffer();e.bindBuffer(e.ARRAY_BUFFER,s),e.bufferData(e.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]),e.STATIC_DRAW);const i=e.createVertexArray();e.bindVertexArray(i),e.enableVertexAttribArray(this.positionLoc),e.vertexAttribPointer(this.positionLoc,2,e.FLOAT,!1,0,0),this.gl=e,this.program=r}render(t,e){const o=this.gl;o.viewport(0,0,o.canvas.width,o.canvas.height),o.useProgram(this.program),o.uniform2f(this.canvasSizeLoc,o.canvas.width,o.canvas.height),o.uniform2fv(this.pointsLoc,t.flat(),0,2*t.length),o.uniform1ui(this.nModelsLoc,e.length),o.uniform3fv(this.polysLoc,e.map(r=>Array.from(r.model)).flat()),o.uniform1uiv(this.outliersLoc,e.map(r=>r.outliers)),o.clearColor(.5,.5,.5,1),o.clear(o.COLOR_BUFFER_BIT),o.drawArrays(o.TRIANGLES,0,6)}}const Y=`#version 300 es
precision highp float;
#define N_POINTS 10
#define MAX_N_MODELS 100
uniform vec2 canvas_size;
uniform uint n_models;
uniform vec2 points[N_POINTS];
uniform vec3 polys[MAX_N_MODELS];
uniform uint outliers[MAX_N_MODELS];

out vec4 out_color;
//uniform vec3 models[];

void main() {
  // Map pixel coordinates [0,w) x [0,h) to the unit square [-1, 1) x [-1, 1)
  vec2 xy = gl_FragCoord.xy / canvas_size.xy * 2.0 + vec2(-1.0,-1.0);

  for (int i = 0; i < N_POINTS; ++i) {
    float d = distance(points[i], xy);
    // might need a smoothstep in here to antialias
    if (d < 0.02) {
      // find out how many times this one is considered an outlier
      int outlier_count = 0;
      for (uint j = 0u; j < n_models; ++j) {
        if ((outliers[j] & (1u << i)) != 0u) {
          ++outlier_count;
        }
      }
      float outlier_frac = float(outlier_count) / float(n_models);
      out_color = outlier_frac * vec4(1.0,0.0,0.0,1.0) + (1.0-outlier_frac) * vec4(0.0,0.6,1.0,1.0);
      return;
    }
  }

  uint curve_count = 0u;
  for (uint i = 0u; i < n_models; ++i) {
    vec3 poly = polys[i];
    vec2 p;
    p.x = xy.x;
    p.y = poly[0] + p.x * poly[1] + p.x * p.x * poly[2];
    float d = distance(p, xy);
    if (d < 0.01) {
      curve_count += 1u;
    }
  }
  if (curve_count > 0u) {
    float base = 0.7;
    float g = base * pow(0.8, float(curve_count));
    out_color = vec4(g,g,g,1.0);
  } else if (abs(xy.x) < 0.006 || abs(xy.y) < 0.006) {
    out_color = (vec4(1.0,1.0,1.0,1.0));
  } else if (mod(xy.x, 0.1) < 0.01 || mod(xy.y, 0.1) < 0.01) {
    out_color = vec4(0.9,0.9,1.0,1.0);
  } else {
    out_color = vec4(0.85,0.85,0.85,1.0);
  }
}
`,w=3,y=[-.5,-.4,-.3,-.2,-.1,0,.1,.2,.3,.4].map(l=>[l,.7*l-.2+.2*l*l]);y[2][1]=.9;function B(l,t){var r;l=="error"?console.error(t):console.info(t);const e=document.createElement("div");e.className="log-"+l;const o=document.createTextNode(t.toString());e.appendChild(o),(r=document.querySelector("#app"))==null||r.appendChild(e)}class ${constructor(){a(this,"count");a(this,"mean");a(this,"m2");this.count=0,this.mean=0,this.m2=0}observe(t){this.count+=1;const e=t-this.mean;this.mean+=e/this.count;const o=t-this.mean;this.m2+=e*o}summarize(){return{mu:this.mean,sigma:Math.sqrt(this.m2/(this.count-1))}}reset(){this.count=0,this.mean=0,this.m2=0}}const R=()=>[{mu:0,sigma:2},{mu:0,sigma:2},{mu:0,sigma:2}];function V(){var v,S;let l=1e4,t=20;const e=Array.from({length:w},()=>new $);let o=R();function r(n,f){const g=document.querySelector(n),c=document.querySelector(n+"-value");return g&&(g.addEventListener("input",p=>{const x=p.target;f(x.valueAsNumber),c&&(c.innerText=x.value)}),c&&(c.innerText=g.valueAsNumber.toFixed(2))),g}r("#a0_mu",n=>{o[0].mu=n}),r("#a0_sigma",n=>{o[0].sigma=n}),r("#a1_mu",n=>{o[1].mu=n}),r("#a1_sigma",n=>{o[1].sigma=n}),r("#a2_mu",n=>{o[2].mu=n}),r("#a2_sigma",n=>{o[2].sigma=n});const s=new E(l),i=new z;let m=0;i.canvas.addEventListener("click",n=>{const f=n.target,g=f.getBoundingClientRect(),c=(n.clientX-g.left)/f.width*2-1,p=(n.clientY-g.top)/f.height*-2+1;y[m][0]=c,y[m][1]=p,++m>=y.length&&(m=0)});function h(n){for(let f=0;f<w;++f){for(let g of["mu","sigma"]){const c=document.querySelector(`#a${f}_${g}`);c.value=n[f][g].toFixed(2).toString(),c.dispatchEvent(new CustomEvent("input"))}e[f].reset()}}(v=document.querySelector("#sir"))==null||v.addEventListener("click",()=>{h(e.map(n=>n.summarize(),[e.keys()]))}),(S=document.querySelector("#reset-priors"))==null||S.addEventListener("click",()=>{o=R(),h(o)});let d=0,_=0;function u(n){const{selected_models:f,ips:g}=s.inference(t,{points:y,alpha:o});for(const c of f)for(let p=0;p<w;++p)e[p].observe(c.model[p]);if(_==0&&(_=n),++d,d%200==0){const c=Math.trunc(d/((n-_)/1e3));document.querySelector("#fps").innerText=c.toString(),document.querySelector("#ips").innerText=`${(g/1e6).toFixed(1)} M`,d=0,_=0}if(d%50==0)for(let c=0;c<w;++c){const p=e[c].summarize();document.querySelector(`#a${c}_mu-posterior`).innerText=p.mu.toFixed(2).toString(),document.querySelector(`#a${c}_sigma-posterior`).innerText=p.sigma.toFixed(2).toString()}i.render(y,f),requestAnimationFrame(u)}try{requestAnimationFrame(u)}catch(n){B("error",n)}}try{V()}catch(l){B("error",l)}
