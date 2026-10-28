// Anchor eligibility uses the unchanged source eroded-alpha128 core.
// All nonzero bilinear weights must belong to that core; no nearest fallback.
export function coreAnchorClamp(mask,width,height,start,request){
 const inside=p=>{const x=p[0]-.5,y=p[1]-.5,ix=Math.floor(x),iy=Math.floor(y),fx=x-ix,fy=y-iy;return[[ix,iy,(1-fx)*(1-fy)],[ix+1,iy,fx*(1-fy)],[ix,iy+1,(1-fx)*fy],[ix+1,iy+1,fx*fy]].every(([a,b,w])=>w===0||a>=0&&b>=0&&a<width&&b<height&&mask[b*width+a]===1)};
 if(!inside(start))throw Error('GAZE_SOURCE_IRIS_ANCHOR_OUTSIDE_WHITE_CORE');
 const end=t=>[start[0]+request[0]*t,start[1]+request[1]*t],path=t=>{const dest=end(t);if(!inside(dest))return false;const ts=[0,1];for(let k=0;k<2;k++){const d=dest[k]-start[k];if(!d)continue;const lo=Math.min(start[k],dest[k]),hi=Math.max(start[k],dest[k]);for(let n=Math.floor(lo-.5)+1;n+.5<hi;n++){const q=(n+.5-start[k])/d;if(q>0&&q<1)ts.push(q)}}ts.sort((a,b)=>a-b);for(let j=1;j<ts.length;j++){const u=(ts[j]+ts[j-1])/2;if(!inside([start[0]+(dest[0]-start[0])*u,start[1]+(dest[1]-start[1])*u]))return false}return true};
 let fraction=1;if(!path(1)){let lo=0,hi=1;for(let i=0;i<24;i++){const t=(lo+hi)/2;if(path(t))lo=t;else hi=t}fraction=lo}
 const anchor=end(fraction);return{shift:[request[0]*fraction,request[1]*fraction],anchor,fraction,anchorCertified:inside(anchor),wholeRayCertified:path(fraction)};
}
