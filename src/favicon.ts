import {useEffect} from 'react';
import {shapeIds} from './data/materials';

export class ShapeBag {
 private bag:string[]=[];
 private previous='';
 next(){
  if(!this.bag.length){
   this.bag=[...shapeIds];
   for(let i=this.bag.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[this.bag[i],this.bag[j]]=[this.bag[j],this.bag[i]]}
   if(this.bag[0]===this.previous)[this.bag[0],this.bag[1]]=[this.bag[1],this.bag[0]];
  }
  return this.previous=this.bag.shift()!;
 }
}
export function useFavicon(){
 useEffect(()=>{
  const link=document.querySelector<HTMLLinkElement>('link[rel="icon"]')!;
  const bag=new ShapeBag();
  const show=()=>{const id=bag.next();link.href=`/assets/favicons/${id}_32.png`;link.dataset.category=id};
  show();const timer=window.setInterval(show,3000);
  return()=>clearInterval(timer);
 },[]);
}
