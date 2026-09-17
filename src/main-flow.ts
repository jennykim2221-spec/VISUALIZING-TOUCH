import type {Scene} from './state';

// Category stops are part of the main scroll position, never the click history.
export const mainStops:Scene[]=['intro','narrative',...Array<Scene>(7).fill('categories'),'arrival','explorer'];
export class ScrollDirector {
 private buffered=0;
 private last=0;
 private direction=0;
 reset(){this.buffered=0;this.direction=0}
 advance(delta:number,position:number,now:number):number|null{
  if(!delta)return null;
  const direction=Math.sign(delta);
  if(direction!==this.direction||now-this.last>350)this.buffered=0;
  this.direction=direction;this.last=now;this.buffered+=delta;
  if(Math.abs(this.buffered)<180)return null;
  this.buffered=0;
  const next=Math.max(0,Math.min(mainStops.length-1,position+direction));
  return next===position?null:next;
 }
}

export const graphemes=(text:string)=>Array.from(new Intl.Segmenter('en',{granularity:'grapheme'}).segment(text),s=>s.segment);
export const narrativeDuration=(text:string)=>600+graphemes(text).length*45+Math.max(2500,text.trim().split(/\s+/).length/3*1000)+600;
export function narrativeFrame(texts:string[],elapsed:number){
 for(let index=0;index<texts.length;index++){
  const letters=graphemes(texts[index]),typing=letters.length*45,hold=Math.max(2500,texts[index].trim().split(/\s+/).length/3*1000);
  const duration=600+typing+hold+600;
  if(elapsed<duration){
   const count=Math.min(letters.length,Math.max(0,Math.floor((elapsed-600)/45)));
   const phase=elapsed<600?'fade-in':elapsed<600+typing?'typing':elapsed<600+typing+hold?'hold':'fade-out';
   const opacity=phase==='fade-in'?elapsed/600:phase==='fade-out'?1-(elapsed-600-typing-hold)/600:1;
   return {index,text:letters.slice(0,count).join(''),count,phase,opacity};
  }
  elapsed-=duration;
 }
 return {index:texts.length-1,text:'',count:0,phase:'complete',opacity:0};
}
