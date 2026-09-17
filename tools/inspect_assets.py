import sys,pathlib,json
sys.path.insert(0,str(pathlib.Path('.tools/pylibs').resolve()))
import fitz
from PIL import Image,ImageDraw
out=pathlib.Path('tmp/pdf');out.mkdir(parents=True,exist_ok=True)
files=list(pathlib.Path('기본디자인').glob('*.pdf'))+[pathlib.Path('Frame 1.pdf'),pathlib.Path('Frame 2.pdf')]
for p in files:
 d=fitz.open(p); page=d[0]; scale=min(1.2,1800/page.rect.width)
 page.get_pixmap(matrix=fitz.Matrix(scale,scale)).save(str(out/(p.stem+'.png')))
 (out/(p.stem+'.txt')).write_text(page.get_text(),encoding='utf8')
 (out/(p.stem+'.svg')).write_text(page.get_svg_image(),encoding='utf8')
 print(p,page.rect,'fonts',page.get_fonts())
ims=list(pathlib.Path('현미경-확대').glob('*.png')); sheet=Image.new('RGB',(1200,600),'#222222')
for i,p in enumerate(sorted(ims)):
 im=Image.open(p);im.thumbnail((290,270));x=(i%4)*300;y=(i//4)*300;sheet.paste(im,(x,y));ImageDraw.Draw(sheet).text((x,y+275),p.stem,fill='white')
sheet.save('tmp/pdf/micro-sheet.jpg')
