import * as THREE from 'three';
export type Scene='intro'|'narrative'|'categories'|'arrival'|'explorer'|'detail'|'favorites';
export type View={scene:Scene;id:string|null;zoom:number;mode:'observe'|'deform';rotation:number[];camera:number[];order:string[];phase:number;activeId:string|null;seed:number;mainPosition:number};
export const initialView=():View=>({scene:'intro',id:null,zoom:100,mode:'observe',rotation:[0,0,0,1],camera:[0,0,0,1],order:[],phase:0,activeId:null,seed:0,mainPosition:0});
export const runtime={view:initialView(),lastInput:performance.now(),pointer:new THREE.Vector2(-9,-9),gesture:false,deformation:0,drag:new THREE.Vector2(),contact:new THREE.Vector2(),solidUntil:0,transition:performance.now(),materialTransition:performance.now(),arrivalStarted:-Infinity,returning:false,category:0,favMoving:false,loaded:false};
export const clamp=(x:number,a:number,b:number)=>Math.max(a,Math.min(b,x));
export const smooth=(x:number)=>{x=clamp(x,0,1);return x*x*(3-2*x)};
