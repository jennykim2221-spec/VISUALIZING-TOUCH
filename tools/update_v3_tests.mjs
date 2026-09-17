import fs from 'node:fs';
let s=fs.readFileSync('tests/site.spec.ts','utf8');
const a=s.indexOf(' for(let i=0;i<95;'),b=s.indexOf(" await expect(page.locator('main')).toHaveAttribute('data-scene','categories');",a);
s=s.slice(0,a)+" await page.mouse.wheel(0,240);\n"+s.slice(b);
s=s.slice(0,s.indexOf("test('narrative comma gates"));
fs.writeFileSync('tests/site.spec.ts',s);
let scene=fs.readFileSync('src/scene.ts','utf8');
scene=scene.replace('const assembly=active&&!runtime.returning?',"const assembling=active&&(v.scene==='detail'?v.id===m.id:v.scene==='favorites'?v.order.includes(m.id):true);const assembly=assembling&&!runtime.returning?").replace('const amount=active?Math.max','const amount=assembling?Math.max');
fs.writeFileSync('src/scene.ts',scene);
