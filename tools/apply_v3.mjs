import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
fs.mkdirSync('tmp/v3-before',{recursive:true});
for(const p of ['src/App.tsx','src/state.ts','src/scene.ts','src/components.tsx','src/style.css','tests/site.spec.ts','README.md'])fs.copyFileSync(p,`tmp/v3-before/${p.replaceAll('/','_')}`);
fs.writeFileSync('tmp/v3-before/MASTER_SPEC.md',execFileSync('git',['show','HEAD:MASTER_SPEC.md']));
const edit=(p,fn)=>fs.writeFileSync(p,fn(fs.readFileSync(p,'utf8')));
edit('src/state.ts',s=>s.slice(0,s.indexOf('export class ScrollDirector')).replace('seed:number','seed:number;mainPosition:number').replace('seed:0','seed:0,mainPosition:0').replace('transition:performance.now(),','transition:performance.now(),materialTransition:performance.now(),arrivalStarted:-Infinity,'));
edit('src/App.tsx',s=>{
 s=s.replace('categories,narrative','categories').replace('clamp,ScrollDirector','clamp').replace("import {MaterialScene}","import {ScrollDirector,mainStops} from './main-flow';\nimport {useFavicon} from './favicon';\nimport {MaterialScene}").replace('Background,Type,Outline,Wave','Background,Type,Outline,Wave,Narrative');
 s=s.replace('export default function App(){','export default function App(){\n useFavicon();').replace(",[story,setStory]=useState({index:0,text:''})",'').replace('categoryScroll=useRef(0),','assemblyTimer=useRef(0),');
 s=s.replace('back=false){','back=false,mainPosition?:number){');
 s=s.replace('if(performance.now()<locked.current)return;cancelGesture();','if(performance.now()<locked.current)return;const previous=state.current.scene;cancelGesture();clearTimeout(assemblyTimer.current);scroll.current.reset();');
 s=s.replace("if(scene==='explorer'&&state.current.scene==='arrival')next.camera=[0,0,0,1];",'');
 const start=s.indexOf('  const now=performance.now();locked.current=now+900;');
 const end=s.indexOf('\n }\n const nav=',start);
 s=s.slice(0,start)+`  if(mainPosition!==undefined)next.mainPosition=mainPosition;
  const continuous=['arrival','explorer'].includes(previous)&&['arrival','explorer'].includes(next.scene);
  const now=performance.now();locked.current=now+900;runtime.transition=now;
  if(!continuous)runtime.materialTransition=now;
  if(next.scene==='arrival'&&!continuous){runtime.arrivalStarted=now;next.camera=[0,0,0,1]}
  if(next.scene==='categories'){const c=clamp(next.mainPosition-2,0,6);setCategory(c);runtime.category=c}
  runtime.returning=back;setReturning(back);setEntry(n=>n+1);state.current=next;runtime.view=next;setView(next);setInfo(true);
  if(back)audio.cue(next.scene==='favorites'?'favorites-return':'detail-return');
  else if(next.scene==='favorites'||next.scene==='detail')audio.cue(next.scene==='favorites'?'favorites-enter':'detail-enter');
  else if(next.scene==='arrival'&&!continuous)audio.cue('arrival');
  if(!back&&!continuous)assemblyTimer.current=window.setTimeout(()=>audio.cue('assemble'),350);`+s.slice(end);
 s=s.replace('runtime.transition=performance.now()','runtime.transition=runtime.materialTransition=performance.now()');
 const a=s.indexOf("   if(v.scene==='intro')"),b=s.indexOf("   if(v.scene==='detail')",a);
 s=s.slice(0,a)+`   if(mainStops.includes(v.scene)){
    const position=scroll.current.advance(e.deltaY,v.mainPosition,now);if(position===null)return;
    const scene=mainStops[position];
    if(scene==='categories'&&v.scene==='categories'){
     const c=position-2;setCategory(c);runtime.category=c;update({mainPosition:position});locked.current=now+160;audio.cue(e.deltaY>0?'category-expand':'category-return');
    }else nav.current(scene,null,false,position);
    return;
   }
`+s.slice(b);
 s=s.replace('return()=>{cancelAnimationFrame(frame);window.removeEventListener','return()=>{clearTimeout(assemblyTimer.current);clearTimeout(favInfoTimer.current);clearTimeout(solidTimer.current);clearTimeout(zoomEnd.current);cancelAnimationFrame(frame);window.removeEventListener');
 s=s.replace('data-scene={view.scene}','data-scene={view.scene} data-main-position={view.mainPosition} data-category={category}');
 const n=s.indexOf("   {view.scene==='narrative'"),ne=s.indexOf('\n',n);
 s=s.slice(0,n)+"   {view.scene==='narrative'&&<Narrative/>}"+s.slice(ne);
 s=s.replace("{i===category?(i===3?<Outline key={category} name=\"metals\" text={c} delay={950}/>:<Type key={category} text={c} delay={950}/>):c}",'{c}');
 s=s.replace('<Type key={view.mode} text=','<Type instantOnChange text=');
 return s;
});
edit('src/audio.ts',s=>s.replace("'assemble','dissolve','reform'","'assemble','reform'"));
edit('src/scene.ts',s=>{
 s=s.replace('const elapsed=(now-runtime.transition)/1000;','const elapsed=(now-runtime.materialTransition)/1000;const arrivalElapsed=(now-runtime.arrivalStarted)/1000;');
 s=s.replace("if(v.scene==='arrival'&&!this.reduced){const t=clamp((elapsed-item.arrivalDelay)/1.2,0,1)","if(arrivalElapsed<2&& !this.reduced){const t=clamp((arrivalElapsed-item.arrivalDelay)/1.2,0,1)");
 s=s.replace("if(v.scene==='arrival'&&!this.reduced){const t=Math.max(0,elapsed-item.arrivalDelay)","if(['arrival','explorer'].includes(v.scene)&&arrivalElapsed<3&&!this.reduced){const t=Math.max(0,arrivalElapsed-item.arrivalDelay)");
 s=s.replace("   if((v.scene==='explorer'||v.scene==='arrival')&&this.hoverId===m.id&&!this.reduced)u.hover.value.copy(this.hoverUv);",'');
 s=s.replace("const proximity=this.hoverId===m.id&&(v.scene==='explorer'||v.scene==='arrival');const powder=","const powder=");
 s=s.replace('Math.max(1-assembly,proximity?.55:0,powder*.65)','active?Math.max(1-assembly,powder*.65):0');
 s=s.replace('const local=proximity?Math.exp(-((x+.5-this.hoverUv.x)**2+(y+.5-this.hoverUv.y)**2)*80):1;','const local=1;');
 s=s.replace('float hole=1.-smoothstep(.015,.075,distance(vUv,hover));','').replace('if(hole>.2&&noise<hole*.9)discard;','');
 return s;
});
edit('index.html',s=>s.replace('<title>','<link rel="icon" type="image/png" sizes="32x32" href="/assets/favicons/plastics_32.png"/><title>'));
