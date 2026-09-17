import {useEffect,useRef,useState,type CSSProperties} from 'react';
import {audio} from './audio';
import {runtime,smooth,type Scene} from './state';
import {shapeIds,narrative} from './data/materials';
import {narrativeFrame} from './main-flow';
export function Type({text,delay=1250,instant=false,instantOnChange=false,className='',style}:{text:string;delay?:number;instant?:boolean;instantOnChange?:boolean;className?:string;style?:CSSProperties}){
 const previous=useRef(text),changed=useRef(false);if(previous.current!==text){changed.current=true;previous.current=text}instant=instant||(instantOnChange&&changed.current);
 const [count,setCount]=useState(instant?text.length:0);
 useEffect(()=>{if(instant){setCount(text.length);return}setCount(0);let frame=0,last=0;const start=performance.now()+delay;const tick=(now:number)=>{const n=Math.min(text.length,Math.max(0,Math.floor((now-start)/25)));if(n!==last){setCount(n);if(Math.floor(n/3)!==Math.floor(last/3))audio.cue('typing');last=n}if(n<text.length)frame=requestAnimationFrame(tick)};frame=requestAnimationFrame(tick);return()=>cancelAnimationFrame(frame)},[text,delay,instant]);
 return <span className={`typed ${className}`} style={style} aria-label={text}><span aria-hidden="true" className="type-space">{text}</span><span aria-hidden="true" className="type-ink">{instant?text:text.slice(0,count)}</span></span>
}
export function Narrative(){
 const [current,setCurrent]=useState(()=>narrativeFrame(narrative,0));
 useEffect(()=>{const start=performance.now();let frame=0,previousCount=0;const tick=(now:number)=>{const next=narrativeFrame(narrative,now-start);setCurrent(next);if(next.phase==='typing'&&Math.floor(next.count/3)!==Math.floor(previousCount/3))audio.cue('typing');previousCount=next.count;if(next.phase!=='complete')frame=requestAnimationFrame(tick)};frame=requestAnimationFrame(tick);return()=>cancelAnimationFrame(frame)},[]);
 return <section className="narrative" data-sentence={current.index} data-phase={current.phase} aria-label={narrative[current.index]}><p style={{opacity:current.opacity}}>{current.text}<span className="story-cursor"/></p></section>
}
export function Outline({name,text,instant=false,delay=1250,className=''}:{name:string;text:string;instant?:boolean;delay?:number;className?:string}){
 const [count,setCount]=useState(instant?text.length:0);useEffect(()=>{setCount(instant?text.length:0);if(instant)return;let frame=0;const start=performance.now()+delay;const tick=(now:number)=>{const n=Math.min(text.length,Math.max(0,Math.floor((now-start)/45)));setCount(n);if(n<text.length)frame=requestAnimationFrame(tick)};frame=requestAnimationFrame(tick);return()=>cancelAnimationFrame(frame)},[name,text,instant,delay]);
 return <span className={`outline ${className}`} role="img" aria-label={text}><img src={`/assets/branding/${name}_outline_v01.svg`} alt="" style={{clipPath:`inset(0 ${(1-count/text.length)*100}% 0 0)`}}/></span>
}
export function Wave(){const ref=useRef<HTMLCanvasElement>(null);useEffect(()=>{let frame=0;const a=new Uint8Array(512);const draw=()=>{const c=ref.current!,ctx=c.getContext('2d')!;ctx.clearRect(0,0,c.width,c.height);if(audio.analyser)audio.analyser.getByteTimeDomainData(a);else a.fill(128);ctx.strokeStyle='#323232';ctx.lineWidth=1.3;ctx.beginPath();for(let i=0;i<a.length;i++){const x=i/a.length*c.width,y=c.height/2+(a[i]-128)*3.2;i?ctx.lineTo(x,y):ctx.moveTo(x,y)}ctx.stroke();frame=requestAnimationFrame(draw)};draw();return()=>cancelAnimationFrame(frame)},[]);return <canvas ref={ref} className="wave" width={420} height={230} aria-label="Live audio output waveform"/>}
export function Background({scene,category}:{scene:Scene;category:number}){
 const ref=useRef<HTMLCanvasElement>(null),state=useRef({scene,category});state.current={scene,category};
 useEffect(()=>{
  let frame=0;const images=shapeIds.map(id=>{const image=new Image();image.src=`/assets/shapes/${id}_symbol_v01.svg`;return image});const canvas=ref.current!,ctx=canvas.getContext('2d')!;
  const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
  let current={scene,category},old:{scene:Scene;category:number}|null=null,lastSwitch=performance.now();
  const visible=(s:Scene)=>['intro','narrative','categories'].includes(s);
  const seed=(i:number)=>{const r=Math.sin(i*12.13)*42342;return r-Math.floor(r)};
  const draw=(now:number)=>{
   if(state.current.scene!==current.scene||state.current.category!==current.category){old=current;current={...state.current};lastSwitch=now}
   const w=innerWidth,h=innerHeight;if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h}ctx.clearRect(0,0,w,h);
   const age=Math.min(1,(now-lastSwitch)/(reduced?180:900));
   const spots=[[.02,.12,440,0],[.7,.04,270,3],[.15,.77,340,1],[.91,.89,330,4]];
   const layer=(view:{scene:Scene;category:number},opacity:number,assembly:boolean)=>{
    if(!visible(view.scene)||opacity<=0)return;
    spots.forEach(([x,y,size,k],idx)=>{
     const img=images[view.scene==='categories'?view.category:k];if(!img.complete||!img.naturalWidth)return;
     const px=x*w+(reduced?0:Math.sin(now*.00012)*22),py=y*h+(reduced?0:Math.cos(now*.00016+idx)*12),sz=size*h/800;
     ctx.save();ctx.globalAlpha=.13*opacity;ctx.filter='blur(7px)';ctx.translate(px,py);ctx.rotate(idx*.35);ctx.drawImage(img,-sz/2,-sz/2,sz,sz);ctx.restore();
     if(assembly&&age<1&&!reduced&&!runtime.returning){ctx.fillStyle='#afa396';ctx.globalAlpha=(1-age)*.22;for(let j=0;j<130;j++){const tx=px+(seed(j+idx*30)-.5)*sz,ty=py+(seed(j+9)-.5)*sz;const t=1-age;ctx.fillRect(tx+(seed(j+7)-.5)*w*t,ty+(seed(j+16)-.5)*h*t,1.2,1.2)}}
    });
   };
   if(old)layer(old,1-smooth(age),false);layer(current,smooth(age),true);
   ctx.globalAlpha=1;frame=requestAnimationFrame(draw);
  };
  frame=requestAnimationFrame(draw);return()=>cancelAnimationFrame(frame);
 },[]);
 return <><div className="ambient-light"/><canvas className="background-shapes" ref={ref} aria-hidden="true"/></>
}
