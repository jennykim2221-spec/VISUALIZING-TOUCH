import fs from 'node:fs';
const s=fs.readFileSync('tmp/pdf/Android Expanded - 2.svg','utf8');
const uses=[...s.matchAll(/<use[^>]+data-text[^>]+>/g)].map(x=>x[0]).filter(x=>x.includes('114.28667')).slice(0,16);
const ids=new Set(uses.map(x=>x.match(/href="#([^"]+)/)[1]));
const defs=[...ids].map(id=>s.match(new RegExp('<g id="'+id+'">[\\s\\S]*?</g>'))?.[0]||'').join('');
fs.writeFileSync('public/assets/branding/visualizing-touch_outline_v01.svg',`<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 260 1280 190"><defs>${defs}</defs><g fill="white">${uses.join('')}</g></svg>`);
