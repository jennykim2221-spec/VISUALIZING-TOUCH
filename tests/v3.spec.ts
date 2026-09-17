import {test,expect,type Page} from '@playwright/test';
import {narrativeFrame,narrativeDuration,ScrollDirector} from '../src/main-flow';
import {narrative,shapeIds} from '../src/data/materials';
import {ShapeBag} from '../src/favicon';

async function start(page:Page){await page.goto('/');await expect(page.locator('main')).toHaveAttribute('data-ready','true',{timeout:30000});await page.waitForTimeout(1000)}
async function step(page:Page,delta=240,delay=1000){await page.mouse.wheel(0,delta);await page.waitForTimeout(delay)}
async function arrival(page:Page){await start(page);await step(page);await step(page);for(let i=0;i<7;i++)await step(page,240,200);await expect(page.locator('main')).toHaveAttribute('data-scene','arrival');await page.waitForTimeout(2300)}

test('v3 narrative timing and favicon bag contracts',()=>{
 const comma=narrative[1].indexOf(',');const beginning=narrativeDuration(narrative[0]);
 expect(narrativeFrame(narrative,beginning+600+(comma+1)*45).text).toBe(narrative[1].slice(0,comma+1));
 expect(narrativeFrame(narrative,beginning+600+(comma+2)*45).text).toBe(narrative[1].slice(0,comma+2));
 expect(narrativeFrame(narrative,beginning-650).phase).toBe('hold');
 expect(narrativeFrame(narrative,narrative.reduce((t,s)=>t+narrativeDuration(s),0)+10).phase).toBe('complete');
 const bag=new ShapeBag();let previous='';for(let round=0;round<20;round++){const sequence=shapeIds.map(()=>bag.next());expect(sequence[0]).not.toBe(previous);expect(new Set(sequence).size).toBe(7);previous=sequence.at(-1)!}
 const scroll=new ScrollDirector();expect(scroll.advance(90,0,1000)).toBeNull();expect(scroll.advance(100,0,1050)).toBe(1);expect(scroll.advance(-240,1,1100)).toBe(0);expect(scroll.advance(-240,0,1400)).toBeNull();expect(scroll.advance(240,10,1800)).toBeNull();
});

test('v3 automatic narrative, immediate exit and single rotating favicon',async({page})=>{
 await page.clock.install();await start(page);await page.mouse.wheel(0,240);await expect(page.locator('.narrative')).toBeVisible();await page.waitForTimeout(900);
 const before=await page.locator('.narrative p').innerText();await page.waitForTimeout(500);expect((await page.locator('.narrative p').innerText()).length).toBeGreaterThan(before.length);
 await page.screenshot({path:'tmp/qa/v3-narrative.png'});
 const first=await page.locator('link[rel="icon"]').getAttribute('data-category');const sequence=[first];
 for(let i=0;i<14;i++){await page.clock.fastForward(3000);sequence.push(await page.locator('link[rel="icon"]').getAttribute('data-category'))}
 await expect(page.locator('link[rel="icon"]')).toHaveCount(1);for(let i=1;i<sequence.length;i++)expect(sequence[i]).not.toBe(sequence[i-1]);
 await expect(page.locator('main')).toHaveAttribute('data-scene','narrative');await expect(page.locator('.narrative')).toHaveAttribute('data-phase','complete');
 await page.mouse.wheel(0,240);await expect(page.locator('main')).toHaveAttribute('data-scene','categories');await page.clock.fastForward(1000);await page.mouse.wheel(0,-240);await expect(page.locator('main')).toHaveAttribute('data-scene','narrative');await page.clock.fastForward(1100);await page.mouse.wheel(0,-240);await expect(page.locator('main')).toHaveAttribute('data-scene','intro');await page.clock.fastForward(60000);await expect(page.locator('main')).toHaveAttribute('data-scene','intro');await expect(page.locator('.narrative')).toHaveCount(0);
});

test('v3 bidirectional main, continuous arrival, instant mode and wheel isolation',async({page})=>{
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));await arrival(page);
 const canvas=await page.locator('.material-canvas').elementHandle();
 const before=await page.evaluate(async()=>{const {runtime:r}=await import('/src/state.ts');return {arrival:r.arrivalStarted,material:r.materialTransition,camera:r.view.camera}});
 await page.screenshot({path:'tmp/qa/v3-arrival.png'});await step(page);
 await expect(page.locator('main')).toHaveAttribute('data-scene','explorer');
 expect(await page.locator('.material-canvas').evaluate((el,old)=>el===old,canvas)).toBe(true);
 const after=await page.evaluate(async()=>{const {runtime:r}=await import('/src/state.ts');return {arrival:r.arrivalStarted,material:r.materialTransition,camera:r.view.camera}});expect(after).toEqual(before);
 await page.screenshot({path:'tmp/qa/v3-explorer.png'});await step(page,-240);await expect(page.locator('main')).toHaveAttribute('data-scene','arrival');await expect(page.locator('[data-label]')).toHaveCount(0);expect(await page.evaluate(async()=>{const {runtime}=await import('/src/state.ts');return runtime.arrivalStarted})).toBe(before.arrival);await step(page);await expect(page.locator('[data-label]')).toHaveCount(8);
 await page.locator('[data-label="shell-composite"]').click({force:true});await page.waitForTimeout(1100);
 const guide=page.locator('.guides > .typed').nth(1),node=await guide.elementHandle();
 await page.getByRole('button',{name:'DEFORM',exact:true}).click({force:true});await expect(guide.locator('.type-ink')).toHaveText('CLICK OR DRAG TO FEEL THE MATERIAL',{timeout:500});expect(await guide.evaluate((el,old)=>el===old,node)).toBe(true);
 await page.getByRole('button',{name:'OBSERVE',exact:true}).click({force:true});await expect(guide.locator('.type-ink')).toHaveText('DRAG TO EXPLORE IN 360°',{timeout:500});expect(await guide.evaluate((el,old)=>el===old,node)).toBe(true);
 await page.mouse.wheel(0,-10000);await expect(page.getByRole('slider',{name:'Material zoom'})).toHaveAttribute('aria-valuenow','300');await page.mouse.wheel(0,-10000);await expect(page.locator('main')).toHaveAttribute('data-scene','detail');await page.mouse.wheel(0,10000);await page.mouse.wheel(0,10000);await expect(page.getByRole('slider',{name:'Material zoom'})).toHaveAttribute('aria-valuenow','40');await expect(page.locator('main')).toHaveAttribute('data-scene','detail');
 await page.getByRole('button',{name:'Add to favorites',exact:true}).click({force:true});await page.getByRole('button',{name:'Open favorites'}).click({force:true});await page.waitForTimeout(1100);for(const d of [240,-240,10000,-10000])await page.mouse.wheel(0,d);await expect(page.locator('main')).toHaveAttribute('data-scene','favorites');
 await page.locator('[data-label="shell-composite"]').click({force:true});await page.waitForTimeout(1100);await page.getByRole('button',{name:'Return to previous scene'}).click({force:true});await page.waitForTimeout(1100);await expect(page.locator('main')).toHaveAttribute('data-scene','favorites');await page.getByRole('button',{name:'Return to previous scene'}).click({force:true});await page.waitForTimeout(1100);await expect(page.locator('main')).toHaveAttribute('data-scene','detail');await page.getByRole('button',{name:'Return to previous scene'}).click({force:true});await page.waitForTimeout(1100);await expect(page.locator('main')).toHaveAttribute('data-main-position','10');await step(page,-240);await expect(page.locator('main')).toHaveAttribute('data-scene','arrival');await step(page,-240);await expect(page.locator('main')).toHaveAttribute('data-category','6');
 await expect(page.locator('.category .typed,.category .outline')).toHaveCount(0);
 for(let i=5;i>=0;i--){await step(page,-240,200);await expect(page.locator('main')).toHaveAttribute('data-category',String(i));if(i===3)await page.screenshot({path:'tmp/qa/v3-metals.png'})}
 await step(page,-240);await expect(page.locator('main')).toHaveAttribute('data-scene','narrative');await step(page,-240);await expect(page.locator('main')).toHaveAttribute('data-scene','intro');expect(errors).toEqual([]);
});
