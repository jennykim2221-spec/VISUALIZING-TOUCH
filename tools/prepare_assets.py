import sys,pathlib,json,re,shutil,random
sys.path.insert(0,str(pathlib.Path('.tools/pylibs').resolve()))
import pymupdf as fitz
from PIL import Image
root=pathlib.Path('public/assets');root.mkdir(parents=True,exist_ok=True)
ids=[]
for p in sorted(pathlib.Path('소재').glob('*.png')):
 id=p.stem[3:];ids.append(id);dest=root/'materials'/id;dest.mkdir(parents=True,exist_ok=True)
 shutil.copy2(p,dest/(id+'_cutout_front_v01.png'))
 micro=next(pathlib.Path('현미경-확대').glob('*'+id+'-micro.png'));shutil.copy2(micro,dest/(id+'_micro_concept_v01.png'))
 im=Image.open(p).convert('RGBA');im.getchannel('A').save(dest/(id+'_particle-mask_v01.png'))
 # Sampling the supplied surface supplies a reconstructed texture, not a measured back.
 crops={'shell-composite':(370,400,700,730),'algae-foam':(350,430,650,730),'citrus-paper':(600,500,810,710),'wheatgrass-fiber':(390,580,690,730),'mycelium-leather':(650,500,820,670),'magnetic-iron':(520,580,700,760),'bacterial-cellulose':(600,470,850,720),'mycelium-cushion':(240,390,380,600)}
 im.crop(crops[id]).convert('RGB').resize((768,768)).save(dest/(id+'_basecolor_v01.jpg'),quality=90)
def svg_draw(ds,path):
 if not ds:return
 rect=fitz.Rect(ds[0]['rect'])
 for d in ds:rect|=d['rect']
 parts=[]
 for d in ds:
  cmd=[];last=None
  for item in d['items']:
   if item[0]=='l':
    a,b=item[1:];
    if last!=a:cmd.append(f'M{a.x},{a.y}')
    cmd.append(f'L{b.x},{b.y}');last=b
   elif item[0]=='c':
    a,b,c,e=item[1:]
    if last!=a:cmd.append(f'M{a.x},{a.y}')
    cmd.append(f'C{b.x},{b.y} {c.x},{c.y} {e.x},{e.y}');last=e
   elif item[0]=='re':
    r=item[1];cmd.append(f'M{r.x0},{r.y0}H{r.x1}V{r.y1}H{r.x0}Z');last=None
   elif item[0]=='qu':
    q=item[1];cmd.append(f'M{q.ul.x},{q.ul.y}L{q.ur.x},{q.ur.y}L{q.lr.x},{q.lr.y}L{q.ll.x},{q.ll.y}Z');last=None
  if d.get('closePath'):cmd.append('Z')
  parts.append('<path d="'+' '.join(cmd)+'" fill="white" fill-rule="'+('evenodd' if d.get('even_odd') else 'nonzero')+'"/>')
 path.parent.mkdir(parents=True,exist_ok=True);path.write_text(f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{rect.x0} {rect.y0} {rect.width} {rect.height}">'+''.join(parts)+'</svg>')
 print(path,len(ds),rect)
page=fitz.open('Frame 2.pdf')[0]; shapes=[d for d in page.get_drawings() if d['fill'] and .2<d['fill'][0]<.5 and d['rect'].x0>700]
shapes.sort(key=lambda d:d['rect'].y0)
for id,d in zip(['plastics','naturals','glass-ceramics','metals','fabric','recycle','newmaterials'],shapes):svg_draw([d],root/'shapes'/(id+'_symbol_v01.svg'))
for n,name,box in [(2,'visualizing-touch',(0,250,1280,460)),(4,'metals',(300,290,950,480)),(5,'newmaterials',(20,40,760,180)),(7,'favorites',(20,40,550,180))]:
 page=fitz.open(f'기본디자인/Android Expanded - {n}.pdf')[0];r=fitz.Rect(box)
 ds=[d for d in page.get_drawings() if d['fill'] and min(d['fill'])>.9 and r.intersects(d['rect']) and d['rect'].width<1280 and d['rect'].height<220]
 svg_draw(ds,root/'branding'/(name+'_outline_v01.svg'))
font=root/'fonts';font.mkdir(exist_ok=True);shutil.copy2('C:/Windows/Fonts/NotoSansKR-VF.ttf',font/'noto-sans-kr.ttf')
# The handwritten Type3 glyphs have empty SVG glyph definitions in MuPDF.
# Trace the white raster glyph silhouette into vector scanline contours instead.
page=fitz.open('기본디자인/Android Expanded - 2.pdf')[0]
pix=page.get_pixmap(matrix=fitz.Matrix(1.5,1.5),clip=fitz.Rect(0,250,1280,455))
im=Image.frombytes('RGB',[pix.width,pix.height],pix.samples);px=im.load();runs=[]
for y in range(im.height):
 x=0
 while x<im.width:
  if min(px[x,y])>215:
   x0=x
   while x<im.width and min(px[x,y])>215:x+=1
   runs.append(f'M{x0} {y}h{x-x0}v1h{x0-x}z')
  x+=1
(root/'branding'/'visualizing-touch_outline_v01.svg').write_text(f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {im.width} {im.height}"><path fill="white" d="'+''.join(runs)+'"/></svg>')
p=fitz.open('기본디자인/Android Expanded - 5.pdf')[0]
ds=[d for d in p.get_drawings() if d['fill'] and min(d['fill'])>.8]
svg_draw([d for d in ds if d['rect'].y1<25 and d['rect'].x1<135],root/'branding'/'visualizing-touch_outline_v01.svg')
for id,cy in zip(ids,[539,717,195,363,731,584,640,508]):
 svg_draw([d for d in ds if abs((d['rect'].y0+d['rect'].y1)/2-cy)<2 and 5<d['rect'].height<20],root/'branding'/(id+'_outline_v01.svg'))
manifest={'version':1,'cutouts':'Provided PNGs, unchanged copies','micro':'Provided AI conceptual visualizations, not measured micrographs','symbols':'Vector paths extracted from Frame 2.pdf','branding':'White outline paths extracted from design PDFs','font':'Noto Sans KR local font. Seramonde not supplied: extracted titles, Georgia fallback for live copy.','models':{'kind':'procedural','generator':'MaterialModelFactory','version':1,'limitation':'Approximate reconstructed backs, thickness and silhouettes; not scans. Front-view photographic presentation blends to volumetric geometry during observation.'},'audio':{'kind':'procedural','generator':'AudioManager','version':1,'limitation':'Synthesized sound, not field recordings'},'materials':ids}
pathlib.Path('src/data').mkdir(parents=True,exist_ok=True);pathlib.Path('src/data/asset-manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2),encoding='utf8')
