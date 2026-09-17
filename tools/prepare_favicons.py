"""Derive tab icons from the existing Frame 2 SVG contours, without editing originals."""
import sys,pathlib,xml.etree.ElementTree as ET,io
sys.path.insert(0,str(pathlib.Path('.tools/pylibs').resolve()))
import pymupdf as fitz
from PIL import Image,ImageDraw
out=pathlib.Path('public/assets/favicons');out.mkdir(parents=True,exist_ok=True)
ET.register_namespace('', 'http://www.w3.org/2000/svg')
sheet=Image.new('RGB',(7*110,130),'#161616')
for i,p in enumerate(sorted(pathlib.Path('public/assets/shapes').glob('*_symbol_v01.svg'))):
 root=ET.fromstring(p.read_text(encoding='utf8'));x,y,w,h=map(float,root.attrib['viewBox'].split());side=max(w,h)/.76
 root.set('viewBox',f'{x+w/2-side/2} {y+h/2-side/2} {side} {side}');root.set('width','48');root.set('height','48')
 for el in root.iter():
  if el.get('fill')=='white':el.set('fill','#929292')
 svg=ET.tostring(root,encoding='utf8');id=p.name.replace('_symbol_v01.svg','');(out/f'{id}.svg').write_bytes(svg)
 doc=fitz.open(stream=svg,filetype='svg');page=doc[0]
 for size in [32,48]:
  pix=page.get_pixmap(matrix=fitz.Matrix(size/48,size/48),alpha=True);pix.save(str(out/f'{id}_{size}.png'))
 im=Image.open(out/f'{id}_48.png').convert('RGBA');sheet.paste(im,(i*110+30,20),im);ImageDraw.Draw(sheet).text((i*110+2,85),id,fill='#aaaaaa')
 if id=='plastics':im.save('public/favicon.ico',sizes=[(16,16),(32,32),(48,48)])
pathlib.Path('tmp/qa').mkdir(parents=True,exist_ok=True);sheet.save('tmp/qa/v3-favicons.png')
print('Generated 7 SVG, 14 PNG, and static favicon.ico from existing Frame 2 contours.')
