import {useEffect,useRef,useState,type PointerEvent as RP} from 'react';
import * as T from 'three';
import {materials,byId,categories} from './data/materials';
import {initialView,runtime,clamp,type View,type Scene} from './state';
import {ScrollDirector,mainStops} from './main-flow';
import {useFavicon} from './favicon';
import {MaterialScene} from './scene';
import {audio} from './audio';
import {Background,Type,Outline,Wave,Narrative} from './components';
export default function App(){
 useFavicon();
 const [view,setView]=useState<View>(initialView),[favorites,setFavorites]=useState<Set<string>>(new Set()),[category,setCategory]=useState(0),[entry,setEntry]=useState(0),[returning,setReturning]=useState(false),[ready,setReady]=useState(false),[sound,setSound]=useState(true),[volume,setVolume]=useState(.13),[info,setInfo]=useState(true),[solid,setSolid]=useState(false);
 const canvas=useRef<HTMLCanvasElement>(null),engine=useRef<MaterialScene|null>(null),history=useRef<View[]>([]),state=useRef(view),favs=useRef(favorites),scroll=useRef(new ScrollDirector()),locked=useRef(0),targetPhase=useRef(0),settleAt=useRef(0),zoomEnd=useRef(0),solidTimer=useRef(0),favInfoTimer=useRef(0),lastStep=useRef(0),assemblyTimer=useRef(0),down=useRef<{x:number;y:number;px:number;py:number;id:string;drag:boolean}|null>(null);
 state.current=view;runtime.view=view;favs.current=favorites;
 function update(p:Partial<View>){setView(v=>{const n={...v,...p};state.current=n;runtime.view=n;return n})}
 function cancelGesture(){down.current=null;runtime.gesture=false;runtime.drag.set(0,0);audio.stop()}
 function navigate(scene:Scene,id:string|null=null,back=false,mainPosition?:number){
  if(performance.now()<locked.current)return;const previous=state.current.scene;cancelGesture();clearTimeout(assemblyTimer.current);scroll.current.reset();clearTimeout(solidTimer.current);runtime.solidUntil=0;setSolid(false);clearTimeout(favInfoTimer.current);settleAt.current=0;runtime.favMoving=false;let next:View;
  if(back){const old=history.current.pop();if(!old)return;next=structuredClone(old);next.order=next.order.filter(x=>favs.current.has(x));if(!next.order.includes(next.activeId||''))next.activeId=next.order[Math.round(next.phase)%Math.max(1,next.order.length)]||null;next.phase=next.activeId?next.order.indexOf(next.activeId):0;targetPhase.current=next.phase;}
  else{if(['detail','favorites'].includes(scene))history.current.push(structuredClone(state.current));next={...structuredClone(state.current),scene,id,zoom:100,mode:'observe',rotation:[0,0,0,1]};if(scene==='favorites'){next.seed=Math.random();next.order=[...favs.current].sort(()=>Math.random()-.5);next.phase=0;next.activeId=next.order[0]||null;targetPhase.current=0}}
  if(mainPosition!==undefined)next.mainPosition=mainPosition;
  const continuous=['arrival','explorer'].includes(previous)&&['arrival','explorer'].includes(next.scene);
  const now=performance.now();locked.current=now+900;runtime.transition=now;
  if(!continuous)runtime.materialTransition=now;
  if(next.scene==='arrival'&&!continuous){runtime.arrivalStarted=now;next.camera=[0,0,0,1]}
  if(next.scene==='categories'){const c=clamp(next.mainPosition-2,0,6);setCategory(c);runtime.category=c}
  runtime.returning=back;setReturning(back);setEntry(n=>n+1);state.current=next;runtime.view=next;setView(next);setInfo(true);
  if(back)audio.cue(next.scene==='favorites'?'favorites-return':'detail-return');
  else if(next.scene==='favorites'||next.scene==='detail')audio.cue(next.scene==='favorites'?'favorites-enter':'detail-enter');
  else if(next.scene==='arrival'&&!continuous)audio.cue('arrival');
  if(!back&&!continuous)assemblyTimer.current=window.setTimeout(()=>audio.cue('assemble'),350);
 }
 const nav=useRef(navigate);nav.current=navigate;
 function changeZoom(z:number){update({zoom:clamp(Math.round(z),40,300)});if(!audio.loop)audio.start(byId(state.current.id!).kind,'zoom');clearTimeout(zoomEnd.current);zoomEnd.current=window.setTimeout(()=>audio.stop(),180)}
 const zoomFn=useRef(changeZoom);zoomFn.current=changeZoom;
 useEffect(()=>{const e=engine.current=new MaterialScene(canvas.current!);e.onReady=()=>{setReady(true);runtime.transition=runtime.materialTransition=performance.now()};e.onProject=positions=>{
   if(!['explorer','favorites'].includes(state.current.scene))return;const rects:{x:number;y:number;w:number;h:number}[]=[];const w=innerWidth,h=innerHeight;const scale=Math.min(w/1280,h/800);if(state.current.scene==='favorites')rects.push({x:w*.50,y:h*.52,w:w*.5,h:h*.48});
   for(const p of positions){const el=document.querySelector<HTMLButtonElement>(`[data-label="${p.id}"]`);const line=document.querySelector<SVGPathElement>(`[data-leader="${p.id}"]`);if(!el||!line)continue;const m=byId(p.id);const bw=el.offsetWidth,bh=el.offsetHeight;let x=state.current.scene==='explorer'?m.label[0]*w/1280+(p.x-(640+m.pos[0])*w/1280)*.35:p.x-bw/2;let y=state.current.scene==='explorer'?m.label[1]*h/800+(p.y-(400-m.pos[1])*h/800)*.3:p.y+155*scale;
    x=clamp(x,26,state.current.scene==='favorites'?w*.48-bw:w-bw-28);y=clamp(y,185*scale,h-bh-75*scale);if(x>w-310*scale&&y>h-190*scale)y=h-210*scale;
    for(let i=0;i<24;i++){const hit=rects.find(r=>x<r.x+r.w+12&&x+bw+12>r.x&&y<r.y+r.h+12&&y+bh+12>r.y);if(!hit)break;y=hit.y+hit.h+16;if(y>h-bh-80){y=180*scale;x=clamp(x-150*scale,26,w-bw-28)}}
    rects.push({x,y,w:bw,h:bh});el.style.transform=`translate(${x}px,${y}px)`;const ax=clamp(p.x,0,w),ay=clamp(p.y,0,h);const ex=x+bw*.4,ey=y+bh+4;line.setAttribute('d',`M${ax},${ay} L${ex+25},${ey+22} L${ex},${ey}`);
   }
  };return()=>e.dispose()},[]);
 useEffect(()=>{const activity=()=>{runtime.lastInput=performance.now()};const unlock=()=>{void audio.unlock()};window.addEventListener('pointerdown',unlock);window.addEventListener('keydown',unlock);window.addEventListener('wheel',unlock,{passive:true});for(const ev of ['pointermove','pointerdown','wheel','keydown'])window.addEventListener(ev,activity,{passive:true});
  const wheel=(e:WheelEvent)=>{if((e.target as HTMLElement).closest('input[type=range]'))return;e.preventDefault();if(!runtime.loaded)return;const now=performance.now(),v=state.current;if(now<locked.current)return;
   if(mainStops.includes(v.scene)){
    const position=scroll.current.advance(e.deltaY,v.mainPosition,now);if(position===null)return;
    const scene=mainStops[position];
    if(scene==='categories'&&v.scene==='categories'){
     const c=position-2;setCategory(c);runtime.category=c;update({mainPosition:position});locked.current=now+160;audio.cue(e.deltaY>0?'category-expand':'category-return');
    }else nav.current(scene,null,false,position);
    return;
   }
   if(v.scene==='detail'){zoomFn.current(v.zoom-e.deltaY*.13);return}
   if(v.scene==='favorites'&&v.order.length>1){setInfo(false);clearTimeout(favInfoTimer.current);settleAt.current=0;if(now-lastStep.current>130){targetPhase.current+=Math.sign(e.deltaY);lastStep.current=now;audio.cue('favorites-step')}runtime.favMoving=true;}
  };window.addEventListener('wheel',wheel,{passive:false});
  const key=(e:KeyboardEvent)=>{if((e.target as HTMLElement).matches('input,button,a'))return;if(e.key==='Escape'&&history.current.length)nav.current(state.current.scene,null,true);else if(['ArrowDown','PageDown','ArrowUp','PageUp',' '].includes(e.key)){e.preventDefault();wheel(new WheelEvent('wheel',{deltaY:e.key==='ArrowUp'||e.key==='PageUp'?-210:210}))}};window.addEventListener('keydown',key);
  const blur=()=>{cancelGesture();runtime.solidUntil=0;clearTimeout(solidTimer.current);setSolid(false);audio.suspend()};window.addEventListener('blur',blur);const vis=()=>{if(document.hidden)blur()};document.addEventListener('visibilitychange',vis);
  let frame=0,last=performance.now();const tick=(now:number)=>{const dt=Math.min(.5,(now-last)/1000);last=now;const v=state.current;if(v.scene==='favorites'&&runtime.favMoving){const diff=targetPhase.current-v.phase;v.phase+=diff*(1-Math.exp(-dt*6));if(Math.abs(diff)<.002){v.phase=targetPhase.current;runtime.favMoving=false;settleAt.current=now;const n=v.order.length;const id=v.order[((Math.round(v.phase)%n)+n)%n];update({phase:v.phase,activeId:id});favInfoTimer.current=window.setTimeout(()=>{if(state.current.scene==='favorites'&&!runtime.favMoving){setInfo(true)}},3000)}}frame=requestAnimationFrame(tick)};frame=requestAnimationFrame(tick);
  return()=>{clearTimeout(assemblyTimer.current);clearTimeout(favInfoTimer.current);clearTimeout(solidTimer.current);clearTimeout(zoomEnd.current);cancelAnimationFrame(frame);window.removeEventListener('wheel',wheel);window.removeEventListener('keydown',key);window.removeEventListener('blur',blur);document.removeEventListener('visibilitychange',vis);window.removeEventListener('pointerdown',unlock);window.removeEventListener('keydown',unlock);window.removeEventListener('wheel',unlock);for(const ev of ['pointermove','pointerdown','wheel','keydown'])window.removeEventListener(ev,activity)};
 },[]);
 function pointerDown(e:RP<HTMLCanvasElement>){if(performance.now()<locked.current)return;const hit=engine.current?.hit(e.clientX,e.clientY);if(!hit)return;const v=state.current;down.current={x:e.clientX,y:e.clientY,px:e.clientX,py:e.clientY,id:hit.id,drag:false};e.currentTarget.setPointerCapture(e.pointerId);runtime.contact.copy(hit.uv);if(v.scene==='detail'){runtime.gesture=v.mode==='deform';audio.start(byId(hit.id).kind,v.mode==='observe'?'rotate':'deform')}}
 function pointerMove(e:RP<HTMLCanvasElement>){runtime.pointer.set(e.clientX/innerWidth*2-1,1-e.clientY/innerHeight*2);const v=state.current;const d=down.current;if(d){const dx=e.clientX-d.px,dy=e.clientY-d.py;d.px=e.clientX;d.py=e.clientY;if(Math.hypot(e.clientX-d.x,e.clientY-d.y)>6)d.drag=true;if(v.scene==='detail'&&v.mode==='observe'){const q=new T.Quaternion().setFromEuler(new T.Euler(dy*.009,dx*.009,0,'YXZ'));q.multiply(new T.Quaternion().fromArray(v.rotation));update({rotation:q.toArray()});}else if(v.scene==='detail'){runtime.drag.set((e.clientX-d.x)/200,-(e.clientY-d.y)/200);if(d.drag&&v.id==='magnetic-iron'&&performance.now()>runtime.solidUntil)runtime.contact.set(clamp(.5+(e.clientX-d.x)/600,0,1),clamp(.5-(e.clientY-d.y)/600,0,1));}return}
  if(v.scene==='explorer'&&e.buttons===0){const nx=e.clientX/innerWidth-.5,ny=e.clientY/innerHeight-.5;const dead=.15;const yaw=Math.sign(nx)*Math.max(0,Math.abs(nx)-dead)*Math.PI*2.9;const pitch=Math.sign(ny)*Math.max(0,Math.abs(ny)-dead)*Math.PI*2.9;update({camera:new T.Quaternion().setFromEuler(new T.Euler(pitch,yaw,0,'YXZ')).toArray()})}
  const hit=engine.current?.hit(e.clientX,e.clientY);if(engine.current){engine.current.hoverId=hit?.id||null;engine.current.hoverUv.copy(hit?.uv||new T.Vector2(-9,-9))}e.currentTarget.style.cursor=hit?(v.scene==='detail'?'grab':'pointer'):'default';
 }
 function pointerUp(e:RP<HTMLCanvasElement>){const d=down.current;const v=state.current;if(d&&!d.drag){if(v.scene==='explorer'||v.scene==='favorites')navigate('detail',d.id);else if(v.scene==='detail'&&v.mode==='deform'&&v.id==='magnetic-iron'&&performance.now()>runtime.solidUntil){runtime.solidUntil=performance.now()+2000;setSolid(true);audio.cue('favorite-on','iron');clearTimeout(solidTimer.current);solidTimer.current=window.setTimeout(()=>{runtime.solidUntil=0;setSolid(false);audio.cue('reform','iron')},2000)}}if(e.currentTarget.hasPointerCapture(e.pointerId))e.currentTarget.releasePointerCapture(e.pointerId);if(d)audio.cue('reform',byId(d.id).kind);cancelGesture()}
 function toggleFavorite(){if(!view.id)return;const next=new Set(favorites);next.has(view.id)?next.delete(view.id):next.add(view.id);setFavorites(next);audio.cue(next.has(view.id)?'favorite-on':'favorite-off')}
 const detail=view.scene==='detail',isFav=view.scene==='favorites',explore=view.scene==='explorer',material=detail&&view.id?byId(view.id):isFav&&view.activeId?byId(view.activeId):null;
 const labels=explore?materials:isFav?materials.filter(m=>view.order.includes(m.id)):[];
 const serial=`${entry}-${returning}`;const instant=returning;const active=detail||isFav||explore;
 return <main data-scene={view.scene} data-main-position={view.mainPosition} data-category={category} data-ready={ready} data-mode={view.mode} data-solid={solid} data-info={info} data-active-id={view.activeId||view.id||''} data-favorites={favorites.size}>
  <Background scene={view.scene} category={category}/><canvas className="material-canvas" ref={canvas} onPointerDown={pointerDown} onPointerMove={pointerMove} onPointerUp={pointerUp} onPointerCancel={cancelGesture} aria-label="Interactive material scene"/>
  {!ready&&<div className="loading" role="status">PREPARING MATERIALS<span/></div>}
  {ready&&<div className={`ui ${returning?'returning':''}`} key={serial}>
   {view.scene!=='intro'&&<header className="brand"><Outline name="visualizing-touch" text="VISUALIZING TOUCH" instant={instant}/><Type text="WHERE MATERIALS BECOME EXPERIENCE" instant={instant}/></header>}
   <footer className={`cmf ${view.scene==='intro'?'center':''}`}><strong><Type text="CMF" instant={instant}/></strong><Type text="color, material, finish" instant={instant}/></footer>
   {view.scene==='intro'&&<section className="intro"><h1><Outline name="visualizing-touch" text="VISUALIZING TOUCH"/></h1><p><Type text="WHERE MATERIALS BECOME EXPERIENCE" delay={1550}/></p><span className="scroll-cue" aria-label="Scroll to begin">↓</span></section>}
   {view.scene==='narrative'&&<Narrative/>}
   {view.scene==='categories'&&<section className="category-window"><div className="category-list" style={{transform:`translateY(calc(50vh - ${category*91+45}px * var(--scale)))`}}>{categories.map((c,i)=><div key={c} className={`category ${i===category?'selected':''}`} style={{opacity:i===category?1:Math.max(.1,.4-Math.abs(i-category)*.065),filter:i===category?'none':`blur(${Math.abs(i-category)*1.2}px)`}}>{c}</div>)}</div></section>}
   {(explore||detail||isFav)&&<h1 className={`page-title ${detail?'receded':''}`}><Outline name={isFav?'favorites':'newmaterials'} text={isFav?'FAVORITES':'NEWMATERIALS'} instant={instant}/></h1>}
   {active&&<><Wave/><div className="sound-controls"><button aria-label={sound?'Mute sound':'Enable sound'} onClick={()=>{setSound(!sound);audio.set(!sound)}}><Type text={sound?'ON':'OFF'} instant={instant}/><span className="sound-dot" data-on={sound}/></button><input aria-label="Volume" type="range" min="0" max="100" value={Math.round(volume*100)} onChange={e=>{const n=+e.target.value/100;setVolume(n);audio.set(sound,n)}}/><output>{Math.round(volume*100)}%</output></div></>}
   {(explore||detail)&&<button className="fav-button" onClick={()=>navigate('favorites')} aria-label="Open favorites"><Type text="FAV" instant={instant}/><span>↗</span></button>}
   {(detail||isFav)&&<button className="return-button" onClick={()=>navigate(view.scene,null,true)} aria-label="Return to previous scene"><span>‹</span><Type text="RETURN" instant={instant}/></button>}
   {labels.length>0&&<div className="labels"><svg aria-hidden="true">{labels.map(m=><path key={m.id} data-leader={m.id}/>)}</svg>{labels.map(m=><button data-label={m.id} key={m.id} aria-label={`Explore ${m.name}`} onClick={()=>navigate('detail',m.id)}><Outline name={m.id} text={m.name} instant={instant} delay={1250}/></button>)}</div>}
   {detail&&<><div className="guides"><Type text="SCROLL TO ZOOM IN & OUT" instant={instant}/><Type instantOnChange text={view.mode==='observe'?'DRAG TO EXPLORE IN 360°':'CLICK OR DRAG TO FEEL THE MATERIAL'} instant={instant}/><div className="modes">{(['observe','deform'] as const).map(mode=><button key={mode} aria-pressed={view.mode===mode} onClick={()=>{cancelGesture();runtime.solidUntil=0;clearTimeout(solidTimer.current);setSolid(false);update({mode})}}><Type text={mode.toUpperCase()} instant={instant}/></button>)}</div></div>
    <div className="zoom"><span aria-hidden="true">+</span><div role="slider" tabIndex={0} aria-label="Material zoom" aria-valuemin={40} aria-valuemax={300} aria-valuenow={view.zoom} className="zoom-track" onPointerDown={e=>{e.currentTarget.setPointerCapture(e.pointerId);const r=e.currentTarget.getBoundingClientRect();changeZoom(40+(1-(e.clientY-r.top)/r.height)*260)}} onPointerMove={e=>{if(e.currentTarget.hasPointerCapture(e.pointerId)){const r=e.currentTarget.getBoundingClientRect();changeZoom(40+(1-(e.clientY-r.top)/r.height)*260)}}} onPointerUp={e=>{e.currentTarget.releasePointerCapture(e.pointerId);audio.stop()}} onKeyDown={e=>{if(e.key==='ArrowUp'||e.key==='ArrowDown'){e.preventDefault();changeZoom(view.zoom+(e.key==='ArrowUp'?10:-10))}if(e.key==='Home')changeZoom(40);if(e.key==='End')changeZoom(300)}}><div className="zoom-fill" style={{height:`${(view.zoom-40)/260*100}%`}}/><output style={{bottom:`${(view.zoom-40)/260*100}%`}}>{view.zoom}%</output></div><span aria-hidden="true">−</span></div>
   </>}
   {material&&(detail||(isFav&&info))&&<section className={`material-info ${isFav?'fav-info':''}`} key={`${material.id}-${info}`}><div className="more"><a href={material.url} target="_blank" rel="noopener noreferrer"><Type text="+MORE" instant={instant} delay={isFav&&settleAt.current>0?0:1250}/></a><p><Type text="FOLLOW THE LINK TO LEARN MORE ABOUT THIS MATERIAL" instant={instant} delay={isFav&&settleAt.current>0?0:1250}/></p></div><p className="description"><Type text={material.copy.toUpperCase()} instant={instant} delay={isFav&&settleAt.current>0?0:1250}/></p><h2><Outline name={material.id} text={material.name} instant={instant} delay={isFav&&settleAt.current>0?0:1250}/></h2>{detail&&<><p className="korean"><Type text={material.ko} instant={instant}/></p><button className={`star ${favorites.has(material.id)?'selected':''}`} aria-label={favorites.has(material.id)?'Remove from favorites':'Add to favorites'} aria-pressed={favorites.has(material.id)} onClick={toggleFavorite}><svg viewBox="0 0 32 32"><path d="M16 2 20 11 30 12 22 19 25 29 16 24 7 29 10 19 2 12 12 11Z"/></svg></button></>}</section>}
  </div>}
 </main>
}
