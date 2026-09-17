import * as THREE from 'three';
export type Scene='intro'|'narrative'|'categories'|'arrival'|'explorer'|'detail'|'favorites';
export type View={scene:Scene;id:string|null;zoom:number;mode:'observe'|'deform';rotation:number[];camera:number[];order:string[];phase:number;activeId:string|null;seed:number};
export const initialView=():View=>({scene:'intro',id:null,zoom:100,mode:'observe',rotation:[0,0,0,1],camera:[0,0,0,1],order:[],phase:0,activeId:null,seed:0});
export const runtime={view:initialView(),lastInput:performance.now(),pointer:new THREE.Vector2(-9,-9),gesture:false,deformation:0,drag:new THREE.Vector2(),contact:new THREE.Vector2(),solidUntil:0,transition:performance.now(),returning:false,category:0,favMoving:false,loaded:false};
export const clamp=(x:number,a:number,b:number)=>Math.max(a,Math.min(b,x));
export const smooth=(x:number)=>{x=clamp(x,0,1);return x*x*(3-2*x)};
export class ScrollDirector {
 sentence=0; revealed=0; buffered=0; gateUntil=0; gates=new Set<number>();
 advance(delta:number,now:number,texts:string[]){
  const text=texts[this.sentence];
  if(delta<0){this.revealed=Math.max(0,this.revealed-4);this.buffered=this.revealed;for(const x of this.gates)if(x>this.revealed)this.gates.delete(x);if(!this.revealed&&this.sentence>0){this.sentence--;this.revealed=texts[this.sentence].length;this.buffered=this.revealed;this.gates.clear()}return false}
  this.buffered=Math.min(text.length+8,this.buffered+Math.max(1,Math.min(8,delta/28)));
  if(now<this.gateUntil)return false;
  const target=Math.floor(this.buffered);
  for(let i=this.revealed;i<Math.min(target,text.length);i++)if(text[i]===','&&!this.gates.has(i+1)){this.revealed=i+1;this.gates.add(i+1);this.gateUntil=now+1500;return false}
  this.revealed=Math.min(target,text.length);
  if(target>text.length+3){if(this.sentence===2)return true;this.sentence++;this.revealed=0;this.buffered=0;this.gates.clear()}
  return false;
 }
}
