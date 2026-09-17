import sys,pathlib
sys.path.insert(0,str(pathlib.Path('.tools/pylibs').resolve()))
import pymupdf as f
p=f.open('기본디자인/Android Expanded - 5.pdf')[0]
for d in p.get_drawings():
 if d['fill'] and min(d['fill'])>.8 and d['rect'].width>20 and d['rect'].height<45:print(d['rect'])
