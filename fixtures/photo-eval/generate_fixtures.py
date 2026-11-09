#!/usr/bin/env python3
"""Generate the 40 synthetic Munch S3 photo-eval fixtures + expectations + manifest.

Stylised top-down food illustrations rendered with Pillow. Every item named in
expectations.json is drawn as a distinct shape/colour region in its photo, so a
human reviewer can verify the item set against the image. Packaged fixtures draw
a readable descriptive label (that is the point of that category). No text is
drawn on non-packaged food.
"""
import json, math, random
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

OUT = Path.home() / "workspace/munch-t5/fixtures/photo-eval"
PHOTOS = OUT / "photos"
PHOTOS.mkdir(parents=True, exist_ok=True)
W, H = 800, 600

def font(sz):
    for p in ("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
              "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"):
        try: return ImageFont.truetype(p, sz)
        except Exception: pass
    return ImageFont.load_default()

TABLE=(196,164,124); TABLE_D=(172,138,100)
def base(table=TABLE):
    img=Image.new("RGB",(W,H),table); d=ImageDraw.Draw(img,"RGBA")
    rnd=random.Random(7)
    for _ in range(900):
        x,y=rnd.randrange(W),rnd.randrange(H)
        d.point((x,y),fill=(0,0,0,14) if rnd.random()<.5 else (255,255,255,12))
    return img,d

def plate(d,cx,cy,rx,ry,fill=(245,243,238)):
    d.ellipse([cx-rx,cy-ry,cx+rx,cy+ry],fill=(210,205,196))
    d.ellipse([cx-rx+10,cy-ry+8,cx+rx-10,cy+ry-8],fill=fill)
    d.ellipse([cx-rx*.72,cy-ry*.68,cx+rx*.72,cy+ry*.68],outline=(222,218,210),width=3)

def bowl(d,cx,cy,rx,ry,soup=(232,164,52)):
    d.ellipse([cx-rx,cy-ry,cx+rx,cy+ry],fill=(90,90,96))
    d.ellipse([cx-rx+8,cy-ry+6,cx+rx-8,cy+ry-6],fill=(235,233,228))
    d.ellipse([cx-rx*.8,cy-ry*.72,cx+rx*.8,cy+ry*.72],fill=soup)

# ---- item painters: fn(d, cx, cy, s) s ~= radius px ----
def p_banana(d,x,y,s):
    d.arc([x-s,y-s*.55,x+s,y+s*.75],start=15,end=165,fill=(243,197,36),width=int(s*.5))
    d.ellipse([x+s*.82,y-s*.18,x+s*1.0,y+s*.02],fill=(110,80,40))
def p_apple(d,x,y,s):
    d.ellipse([x-s,y-s*.85,x+s,y+s*.9],fill=(204,42,44))
    d.ellipse([x-s*.45,y-s*.6,x-s*.05,y-s*.15],fill=(255,255,255,90))
    d.line([x,y-s*.8,x+s*.12,y-s*1.25],fill=(110,72,36),width=max(3,int(s*.12)))
    d.ellipse([x+s*.1,y-s*1.3,x+s*.75,y-s*.95],fill=(64,142,54))
def p_orange(d,x,y,s):
    d.ellipse([x-s,y-s,x+s,y+s],fill=(242,140,24))
    rnd=random.Random(3)
    for _ in range(26): d.point((x+rnd.uniform(-s*.7,s*.7),y+rnd.uniform(-s*.7,s*.7)),fill=(214,110,10))
    d.ellipse([x-s*.12,y-s*1.05,x+s*.12,y-s*.85],fill=(84,140,52))
def p_eggs_fried(d,x,y,s):
    for dx,dy in ((-s*.42,0),(s*.42,s*.08)):
        d.ellipse([x+dx-s*.5,y+dy-s*.42,x+dx+s*.5,y+dy+s*.42],fill=(250,248,240))
        d.ellipse([x+dx-s*.2,y+dy-s*.2,x+dx+s*.2,y+dy+s*.2],fill=(247,181,36))
def p_eggs_boiled(d,x,y,s):
    for dx in (-s*.45,s*.45):
        d.ellipse([x+dx-s*.42,y-s*.55,x+dx+s*.42,y+s*.55],fill=(250,246,236))
        d.ellipse([x+dx-s*.16,y-s*.2,x+dx+s*.16,y+s*.2],fill=(250,190,60))
def p_avocado(d,x,y,s):
    d.ellipse([x-s*.62,y-s,x+s*.62,y+s],fill=(46,94,44))
    d.ellipse([x-s*.48,y-s*.85,x+s*.48,y+s*.85],fill=(196,220,120))
    d.ellipse([x-s*.24,y+s*.05,x+s*.24,y+s*.55],fill=(128,84,44))
def p_salmon(d,x,y,s):
    d.polygon([(x-s,y-s*.35),(x+s*.6,y-s*.6),(x+s,y+s*.1),(x+s*.4,y+s*.55),(x-s*.6,y+s*.5)],fill=(244,146,110))
    for i in range(3):
        xx=x-s*.5+i*s*.45; d.line([xx,y-s*.28,xx+s*.22,y+s*.35],fill=(255,214,190),width=max(2,int(s*.09)))
def p_pancakes(d,x,y,s):
    for i,dy in enumerate((s*.32,s*.05,-s*.22)):
        d.ellipse([x-s,y+dy-s*.3,x+s,y+dy+s*.3],fill=(222,172,96) if i<2 else (232,186,110))
    d.rectangle([x-s*.22,y-s*.62,x+s*.22,y-s*.3],fill=(250,224,120))
    d.ellipse([x-s*.5,y-s*.45,x+s*.55,y-s*.05],fill=(146,84,32,120))
def p_chicken_breast(d,x,y,s):
    d.rounded_rectangle([x-s,y-s*.55,x+s,y+s*.55],radius=int(s*.5),fill=(216,164,102))
    for i in range(3):
        xx=x-s*.55+i*s*.5; d.line([xx,y-s*.45,xx+s*.25,y+s*.45],fill=(146,96,44),width=max(3,int(s*.1)))
def p_rice(d,x,y,s):
    d.ellipse([x-s,y-s*.62,x+s,y+s*.62],fill=(250,248,242))
    rnd=random.Random(11)
    for _ in range(60):
        gx,gy=x+rnd.uniform(-s*.8,s*.8),y+rnd.uniform(-s*.45,s*.45)
        d.ellipse([gx-4,gy-2,gx+4,gy+2],fill=(228,224,212))
def p_broccoli(d,x,y,s):
    for dx,dy,r in ((-s*.45,s*.25,s*.42),(s*.4,s*.3,s*.45),(0,-s*.3,s*.55),(-s*.1,s*.05,s*.4)):
        d.ellipse([x+dx-r,y+dy-r,x+dx+r,y+dy+r],fill=(58,140,62))
    d.rectangle([x-s*.09,y+s*.3,x+s*.09,y+s*.75],fill=(120,180,110))
def p_bacon(d,x,y,s):
    for i in range(3):
        yy=y-s*.5+i*s*.5; pts=[]
        for t in range(21): pts.append((x-s+t*s/10, yy+math.sin(t/3.1)*s*.1))
        d.line(pts,fill=(168,74,52),width=max(4,int(s*.26)))
        d.line([(px,py-3) for px,py in pts],fill=(232,170,140),width=max(2,int(s*.07)))
def p_toast(d,x,y,s):
    d.rounded_rectangle([x-s,y-s*.8,x+s,y+s*.85],radius=int(s*.45),fill=(186,128,66))
    d.rounded_rectangle([x-s*.82,y-s*.62,x+s*.82,y+s*.68],radius=int(s*.36),fill=(238,206,150))
def p_burger(d,x,y,s):
    d.pieslice([x-s,y-s*.95,x+s,y+s*.35],180,360,fill=(232,178,102))
    d.rectangle([x-s,y-s*.05,x+s,y+s*.18],fill=(96,58,32))
    for i in range(7):
        xx=x-s+ i*(2*s/6); d.line([xx,y+s*.12,xx+s*.08,y+s*.42],fill=(96,178,80),width=max(3,int(s*.1)))
    d.rectangle([x-s*.95,y+s*.38,x+s*.95,y+s*.62],fill=(240,196,116))
    for dx,dy in ((-s*.4,-s*.55),(s*.2,-s*.68),(s*.55,-s*.4)):
        d.ellipse([x+dx-4,y+dy-3,x+dx+4,y+dy+3],fill=(255,244,214))
def p_fries(d,x,y,s):
    d.polygon([(x-s*.8,y-s*.2),(x+s*.8,y-s*.2),(x+s*.55,y+s*.8),(x-s*.55,y+s*.8)],fill=(198,44,44))
    rnd=random.Random(5)
    for _ in range(11):
        fx=x+rnd.uniform(-s*.65,s*.5); fh=rnd.uniform(s*.5,s*1.05)
        d.rectangle([fx,y-fh,fx+s*.16,y],fill=(248,204,92),outline=(222,168,60))
def p_salad_greens(d,x,y,s):
    rnd=random.Random(9)
    cols=[(84,168,74),(64,148,60),(110,190,92)]
    for _ in range(16):
        gx,gy=x+rnd.uniform(-s*.8,s*.8),y+rnd.uniform(-s*.55,s*.55); r=rnd.uniform(s*.2,s*.38)
        d.ellipse([gx-r,gy-r*.6,gx+r,gy+r*.6],fill=rnd.choice(cols))
def p_tomatoes(d,x,y,s):
    for dx,dy in ((-s*.4,-s*.2),(s*.35,s*.1),(-s*.05,s*.45)):
        d.ellipse([x+dx-s*.26,y+dy-s*.26,x+dx+s*.26,y+dy+s*.26],fill=(216,48,40))
        d.ellipse([x+dx-s*.1,y+dy-s*.14,x+dx+s*.02,y+dy-s*.02],fill=(255,255,255,80))
def p_cucumber(d,x,y,s):
    for dx,dy in ((-s*.35,0),(s*.3,-s*.25),(s*.05,s*.35)):
        d.ellipse([x+dx-s*.3,y+dy-s*.3,x+dx+s*.3,y+dy+s*.3],fill=(52,128,58))
        d.ellipse([x+dx-s*.22,y+dy-s*.22,x+dx+s*.22,y+dy+s*.22],fill=(196,228,168))
def p_steak(d,x,y,s):
    d.ellipse([x-s,y-s*.6,x+s,y+s*.6],fill=(146,74,52))
    d.ellipse([x-s*.7,y-s*.4,x+s*.7,y+s*.4],fill=(178,102,74))
    for i in range(3):
        xx=x-s*.5+i*s*.45; d.line([xx,y-s*.35,xx+s*.2,y+s*.35],fill=(104,50,32),width=max(3,int(s*.09)))
def p_mashed_potato(d,x,y,s):
    d.ellipse([x-s*.85,y-s*.5,x+s*.85,y+s*.55],fill=(246,238,220))
    d.ellipse([x-s*.3,y-s*.28,x+s*.35,y+s*.2],fill=(252,246,232))
    d.rectangle([x-s*.14,y-s*.3,x+s*.14,y-s*.08],fill=(250,224,120))
def p_green_beans(d,x,y,s):
    rnd=random.Random(4)
    for _ in range(9):
        gx,gy=x+rnd.uniform(-s*.6,s*.4),y+rnd.uniform(-s*.5,s*.5)
        d.line([gx,gy,gx+s*.55,gy+s*.14],fill=(58,146,66),width=max(4,int(s*.13)))
def p_asparagus(d,x,y,s):
    for i in range(4):
        xx=x-s*.6+i*s*.38
        d.line([xx,y-s*.7,xx+s*.1,y+s*.6],fill=(74,150,70),width=max(4,int(s*.14)))
        d.ellipse([xx-s*.11,y-s*.85,xx+s*.2,y-s*.5],fill=(104,110,58))
def p_pasta(d,x,y,s):
    rnd=random.Random(6)
    for _ in range(26):
        gx,gy=x+rnd.uniform(-s*.75,s*.75),y+rnd.uniform(-s*.5,s*.5)
        d.arc([gx-s*.22,gy-s*.14,gx+s*.22,gy+s*.14],rnd.randrange(360),rnd.randrange(360)+160,fill=(244,206,110),width=max(3,int(s*.09)))
def p_meatballs(d,x,y,s):
    for dx,dy in ((-s*.4,-s*.15),(s*.35,s*.2),(s*.05,-s*.5)):
        d.ellipse([x+dx-s*.3,y+dy-s*.3,x+dx+s*.3,y+dy+s*.3],fill=(128,76,50))
def p_garlic_bread(d,x,y,s):
    d.ellipse([x-s,y-s*.45,x+s,y+s*.45],fill=(226,178,104))
    d.ellipse([x-s*.8,y-s*.32,x+s*.8,y+s*.32],fill=(240,204,136))
    for i in range(6): d.point((x-s*.5+i*s*.2,y-s*.1+((i%3)-1)*6),fill=(84,140,60))
def p_curry(d,x,y,s):
    d.ellipse([x-s,y-s*.7,x+s,y+s*.7],fill=(214,128,32))
    for dx,dy in ((-s*.4,-s*.2),(s*.3,s*.15),(-s*.05,s*.4),(s*.55,-s*.35)):
        d.rounded_rectangle([int(x+dx-s*.22),int(y+dy-s*.16),int(x+dx+s*.22),int(y+dy+s*.16)],radius=6,fill=(196,140,84))
    d.ellipse([x-s*.2,y-s*.5,x+s*.1,y-s*.25],fill=(96,168,72))
def p_chili(d,x,y,s):
    d.ellipse([x-s,y-s*.7,x+s,y+s*.7],fill=(158,52,34))
    rnd=random.Random(8)
    for _ in range(14):
        gx,gy=x+rnd.uniform(-s*.7,s*.7),y+rnd.uniform(-s*.45,s*.45)
        d.ellipse([gx-7,gy-5,gx+7,gy+5],fill=(112,66,44) if rnd.random()<.6 else (214,120,60))
def p_lasagna(d,x,y,s):
    d.rectangle([x-s,y-s*.7,x+s,y+s*.7],fill=(226,164,84))
    d.rectangle([x-s*.92,y-s*.62,x+s*.92,y+s*.62],fill=(240,196,110))
    for i in range(3): d.rectangle([x-s*.92,y-s*.4+i*s*.4,x+s*.92,y-s*.28+i*s*.4],fill=(186,70,44))
    d.ellipse([x-s*.4,y-s*.3,x+s*.3,y+s*.05],fill=(250,232,170))
def p_alfredo(d,x,y,s):
    rnd=random.Random(6)
    for _ in range(26):
        gx,gy=x+rnd.uniform(-s*.75,s*.75),y+rnd.uniform(-s*.5,s*.5)
        d.arc([gx-s*.22,gy-s*.14,gx+s*.22,gy+s*.14],rnd.randrange(360),rnd.randrange(360)+160,fill=(246,232,196),width=max(3,int(s*.1)))
    for dx,dy in ((-s*.35,0),(s*.3,s*.25)):
        d.rounded_rectangle([int(x+dx-s*.2),int(y+dy-s*.14),int(x+dx+s*.2),int(y+dy+s*.14)],radius=5,fill=(206,160,100))
def p_stirfry_veg(d,x,y,s):
    cols=[(230,90,40),(240,160,40),(84,168,74),(200,60,50)]
    rnd=random.Random(12)
    for _ in range(14):
        gx,gy=x+rnd.uniform(-s*.7,s*.7),y+rnd.uniform(-s*.45,s*.45)
        d.rounded_rectangle([int(gx-12),int(gy-5),int(gx+12),int(gy+5)],radius=4,fill=rnd.choice(cols))
def p_noodles(d,x,y,s):
    rnd=random.Random(13)
    for _ in range(22):
        gx,gy=x+rnd.uniform(-s*.7,s*.7),y+rnd.uniform(-s*.45,s*.45)
        d.line([gx-16,gy,gx+16,gy+rnd.uniform(-6,6)],fill=(240,214,130),width=max(3,int(s*.08)))
def p_pizza(d,x,y,s):  # s = plate radius; draws 2 slices + rest of pie outline
    d.ellipse([x-s,y-s,x+s,y+s],fill=(226,178,104))
    d.ellipse([x-s*.88,y-s*.88,x+s*.88,y+s*.88],fill=(238,120,52))
    rnd=random.Random(2)
    for _ in range(12):
        gx,gy=x+rnd.uniform(-s*.6,s*.6),y+rnd.uniform(-s*.6,s*.6)
        d.ellipse([gx-11,gy-11,gx+11,gy+11],fill=(176,44,38))
    d.line([x,y,x-s*.85,y-s*.5],fill=(250,240,220),width=5)
    d.line([x,y,x+s*.2,y+s*.9],fill=(250,240,220),width=5)
def p_sandwich(d,x,y,s):
    for dx,flip in ((-s*.45,1),(s*.45,-1)):
        d.polygon([(x+dx-s*.55,y+s*.5),(x+dx+s*.55,y+s*.5),(x+dx,y-s*.55)],fill=(232,186,110))
        d.polygon([(x+dx-s*.42,y+s*.38),(x+dx+s*.42,y+s*.38),(x+dx,y-s*.32)],fill=(246,220,160))
        d.line([x+dx-s*.4,y+s*.3,x+dx+s*.4,y+s*.3],fill=(96,178,80),width=max(3,int(s*.09)))
def p_tacos(d,x,y,s):
    for dx in (-s*.62,0,s*.62):
        d.pieslice([x+dx-s*.42,y-s*.5,x+dx+s*.42,y+s*.55],0,180,fill=(238,200,120))
        for gx in (-.2,0,.2):
            d.ellipse([x+dx+gx*s*.4-6,y-s*.12,x+dx+gx*s*.4+6,y],fill=(96,178,80) if gx else (216,48,40))
def p_sushi(d,x,y,s):
    cols=[(250,150,110),(240,240,238),(230,110,90)]
    pos=[(-s*.55,-s*.3),(0,-s*.4),(s*.55,-s*.3),(-s*.55,s*.3),(0,s*.4),(s*.55,s*.3),(-s*.28,0),(s*.28,0)]
    for i,(dx,dy) in enumerate(pos):
        d.ellipse([x+dx-s*.24,y+dy-s*.24,x+dx+s*.24,y+dy+s*.24],fill=(38,38,42))
        d.ellipse([x+dx-s*.17,y+dy-s*.17,x+dx+s*.17,y+dy+s*.17],fill=(250,248,244))
        d.ellipse([x+dx-s*.09,y+dy-s*.09,x+dx+s*.09,y+dy+s*.09],fill=cols[i%3])
def p_ramen_top(d,x,y,s):
    for dx,dy in ((-s*.35,-s*.15),(s*.3,s*.2)):
        d.ellipse([x+dx-s*.3,y+dy-s*.22,x+dx+s*.3,y+dy+s*.22],fill=(250,246,236))
        d.ellipse([x+dx-s*.13,y+dy-s*.13,x+dx+s*.13,y+dy+s*.13],fill=(250,190,60))
    for dx in (-s*.55,s*.5):
        d.rounded_rectangle([int(x+dx-s*.2),int(y-s*.1),int(x+dx+s*.2),int(y+s*.16)],radius=5,fill=(226,150,110))
    p_noodles(d,x,y+s*.05,s*.8)
def p_cake(d,x,y,s):
    d.polygon([(x-s,y+s*.5),(x+s,y+s*.5),(x+s,y-s*.1),(x,y-s*.55)],fill=(120,72,44))
    d.polygon([(x-s,y+s*.5),(x+s,y+s*.5),(x+s,y-s*.1),(x,y-s*.55)],outline=(90,52,30))
    d.line([x-s,y+s*.18,x+s,y-s*.28],fill=(240,200,210),width=max(4,int(s*.12)))
def p_soup_garnish(d,x,y,s):
    for dx,dy in ((-s*.3,-s*.2),(s*.25,s*.15),(0,s*.45)):
        d.ellipse([x+dx-6,y+dy-4,x+dx+6,y+dy+4],fill=(84,150,60))

PAINTERS={k[2:]:v for k,v in list(globals().items()) if k.startswith("p_")}

def package(d,x,y,w,h,body,label,accent):
    d.rounded_rectangle([x-w/2,y-h/2,x+w/2,y+h/2],radius=14,fill=body,outline=(0,0,0,60),width=3)
    d.rectangle([x-w/2,y-h/2,x+w/2,y-h/2+h*.22],fill=accent)
    d.rounded_rectangle([x-w*.36,y-h*.12,x+w*.36,y+h*.3],radius=8,fill=(252,250,244))
    f1,f2=font(30),font(19)
    lines=label.split("\n")
    d.text((x,y-h*.02),lines[0],font=f1,fill=(30,30,30),anchor="ma")
    if len(lines)>1: d.text((x,y+h*.13),lines[1],font=f2,fill=(80,80,80),anchor="ma")
    for i in range(4):
        yy=y+h*.36+i*13; d.rectangle([x-w*.32,yy,x+w*.32-(i%3)*36,yy+6],fill=(150,150,150))
def glass(d,x,y,w,h,fillc,foam=False):
    d.rounded_rectangle([x-w/2,y-h/2,x+w/2,y+h/2],radius=12,outline=(230,238,242),width=5)
    d.rounded_rectangle([x-w/2+5,y-h/2+16,x+w/2-5,y+h/2-5],radius=9,fill=fillc)
    if foam: d.ellipse([x-w/2,y-h/2-4,x+w/2,y-h/2+22],fill=(250,246,238))
def mug(d,x,y,r,fillc):
    d.ellipse([x-r,y-r*.8,x+r,y+r*.8],fill=(240,240,242))
    d.ellipse([x-r*.8,y-r*.62,x+r*.8,y+r*.62],fill=fillc)
    d.arc([x+r*.7,y-r*.4,x+r*1.45,y+r*.4],-80,80,fill=(240,240,242),width=9)

I=lambda name,mn,mx,unit,prov: {"name":name,"portion":{"min_quantity":mn,"max_quantity":mx,"unit":unit},"expected_provider":prov}
LC,US,OFF,ME="local catalog","USDA","Open Food Facts","model_estimate"

# scene: (id, category, vessel, items[(painter,dx,dy,s, expectation)], extra dict)
SCENES=[
 ("single-01-banana","single_item","plate",[("banana",0,0,120,I("banana",0.8,1.2,"piece",LC))],{}),
 ("single-02-apple","single_item","plate",[("apple",0,0,95,I("apple",0.8,1.2,"piece",LC))],{}),
 ("single-03-boiled-eggs","single_item","plate",[("eggs_boiled",0,0,95,I("egg, boiled",1.6,2.4,"piece",LC))],{}),
 ("single-04-avocado","single_item","plate",[("avocado",0,0,95,I("avocado",0.8,1.2,"piece",US))],{}),
 ("single-05-salmon","single_item","plate",[("salmon",0,0,120,I("salmon fillet",120,200,"g",US))],{}),
 ("single-06-pancakes","single_item","plate",[("pancakes",0,0,120,I("pancakes",2.4,3.6,"piece",US))],{}),
 ("mixed-01-chicken-rice-broccoli","mixed_plate","plate",[("chicken_breast",-130,-60,110,I("grilled chicken breast",120,200,"g",LC)),("rice",120,80,110,I("cooked white rice",0.8,1.4,"cup",LC)),("broccoli",130,-90,85,I("broccoli florets",0.7,1.3,"cup",US))],{}),
 ("mixed-02-breakfast-eggs-bacon-toast","mixed_plate","plate",[("eggs_fried",-110,-70,95,I("fried eggs",1.6,2.4,"piece",LC)),("bacon",120,60,85,I("bacon",2.4,3.6,"slice",US)),("toast",-120,90,80,I("toast",0.8,1.2,"slice",LC))],{}),
 ("mixed-03-burger-fries","mixed_plate","plate",[("burger",-110,0,115,I("beef burger",0.8,1.2,"piece",US)),("fries",150,0,95,I("french fries",70,130,"g",US))],{}),
 ("mixed-04-chicken-salad","mixed_plate","bowl_salad",[("salad_greens",0,0,170,None),("tomatoes",-90,-40,55,I("cherry tomatoes",2,5,"piece",US)),("cucumber",95,50,55,I("cucumber slices",0.3,0.7,"cup",US)),("chicken_breast",10,-95,80,I("grilled chicken breast",85,145,"g",LC))],{"extra_items":[I("mixed salad greens",1.6,2.6,"cup",US)]}),
 ("mixed-05-steak-potato-beans","mixed_plate","plate",[("steak",-120,-40,115,I("grilled steak",140,230,"g",US)),("mashed_potato",130,-70,90,I("mashed potatoes",0.7,1.2,"cup",US)),("green_beans",110,95,85,I("green beans",0.7,1.3,"cup",US))],{}),
 ("mixed-06-salmon-rice-asparagus","mixed_plate","plate",[("salmon",-120,-30,110,I("salmon fillet",120,200,"g",US)),("rice",120,80,100,I("cooked white rice",0.8,1.4,"cup",LC)),("asparagus",125,-85,80,I("asparagus spears",4,7,"piece",US))],{}),
 ("mixed-07-pasta-meatballs-bread","mixed_plate","plate",[("pasta",-90,-30,130,I("cooked spaghetti",1.2,2.0,"cup",LC)),("meatballs",-90,-30,95,I("beef meatballs",2.4,3.6,"piece",US)),("garlic_bread",165,60,80,I("garlic bread",0.8,1.2,"slice",US))],{}),
 ("sauced-01-chicken-curry-rice","sauced_hidden","plate",[("curry",-120,-40,115,I("chicken curry",0.8,1.4,"cup",ME)),("rice",130,70,105,I("cooked white rice",0.8,1.4,"cup",LC))],{}),
 ("sauced-02-beef-chili","sauced_hidden","bowl_chili",[("chili",0,0,150,I("beef and bean chili",1.2,2.0,"cup",ME))],{}),
 ("sauced-03-lasagna","sauced_hidden","plate",[("lasagna",0,0,150,I("beef lasagna",0.8,1.2,"piece",ME))],{}),
 ("sauced-04-chicken-alfredo","sauced_hidden","plate",[("alfredo",0,0,155,I("chicken alfredo pasta",1.4,2.4,"cup",ME))],{}),
 ("sauced-05-stirfry-noodles","sauced_hidden","plate",[("stirfry_veg",-120,-60,95,I("stir-fried mixed vegetables",0.8,1.4,"cup",US)),("chicken_breast",125,-75,80,I("chicken breast pieces",85,145,"g",LC)),("noodles",0,95,140,I("cooked noodles",1.0,1.8,"cup",LC))],{}),
 ("restaurant-01-burger-fries-large","restaurant","plate",[("burger",-120,-10,135,I("beef burger",0.8,1.2,"piece",US)),("fries",160,0,115,I("french fries",110,190,"g",US))],{}),
 ("restaurant-02-pizza-salad","restaurant","pizza_board",[("pizza",-70,0,165,I("pepperoni pizza",2.4,3.6,"slice",ME)),("salad_greens",215,-60,70,I("side salad greens",0.8,1.4,"cup",US)),("tomatoes",215,45,40,I("cherry tomatoes",2,5,"piece",US))],{}),
 ("restaurant-03-ramen","restaurant","bowl_ramen",[("ramen_top",0,0,160,I("ramen noodles in broth",1.6,2.6,"cup",ME))],{"extra_items":[I("egg, boiled",0.8,1.2,"piece",LC)]}),
 ("restaurant-04-tacos","restaurant","plate",[("tacos",0,0,180,I("beef tacos",2.4,3.6,"piece",ME))],{}),
 ("restaurant-05-sushi","restaurant","board",[("sushi",0,0,170,I("sushi rolls",6.5,9.5,"piece",ME))],{}),
 ("packaged-01-granola-bar","packaged_label","package",[],{"package":((238,196,80),"Granola Bar\nOats & Honey",(198,44,44)),"extra_items":[I("granola bar",0.8,1.2,"bar",OFF)]}),
 ("packaged-02-potato-chips","packaged_label","package",[],{"package":((66,110,200),"Potato Chips\nSea Salt",(240,180,40)),"extra_items":[I("potato chips",22,38,"g",OFF)]}),
 ("packaged-03-mac-cheese-box","packaged_label","package",[],{"package":((240,140,40),"Mac & Cheese\nDinner Box",(66,110,200)),"extra_items":[I("macaroni and cheese, boxed mix",0.8,1.2,"box",OFF)]}),
 ("packaged-04-orange-juice-bottle","packaged_label","package",[],{"package":((250,150,40),"Orange Juice\n1 Litre",(84,168,74)),"extra_items":[I("orange juice",0.8,1.2,"bottle",OFF)]}),
 ("packaged-05-chocolate-bar","packaged_label","package",[],{"package":((110,66,44),"Chocolate Bar\nMilk Chocolate",(216,48,40)),"extra_items":[I("milk chocolate bar",0.8,1.2,"bar",OFF)]}),
 ("drinks-01-black-coffee","drinks","drink_mug",[],{"extra_items":[I("black coffee",200,300,"ml",LC)]}),
 ("drinks-02-orange-juice","drinks","drink_glass_oj",[],{"extra_items":[I("orange juice",200,300,"ml",US)]}),
 ("drinks-03-cola-can","drinks","drink_can",[],{"extra_items":[I("cola",300,380,"ml",OFF)]}),
 ("drinks-04-berry-smoothie","drinks","drink_glass_smoothie",[],{"extra_items":[I("berry smoothie",250,400,"ml",ME)]}),
 ("poorly-lit-01-chicken-rice","poorly_lit","plate",[("chicken_breast",-120,-50,105,I("grilled chicken breast",120,200,"g",LC)),("rice",125,70,105,I("cooked white rice",0.8,1.4,"cup",LC))],{"dark":0.52}),
 ("poorly-lit-02-salad","poorly_lit","bowl_salad",[("salad_greens",0,0,165,None),("tomatoes",-80,-30,50,I("cherry tomatoes",2,5,"piece",US)),("cucumber",90,55,50,I("cucumber slices",0.3,0.7,"cup",US))],{"dark":0.5,"extra_items":[I("mixed salad greens",1.6,2.6,"cup",US)]}),
 ("poorly-lit-03-sandwich","poorly_lit","plate",[("sandwich",0,0,140,I("sandwich",0.8,1.2,"piece",US))],{"dark":0.55}),
 ("poorly-lit-04-tomato-soup","poorly_lit","bowl_soup_red",[("soup_garnish",0,0,120,None)],{"dark":0.52,"extra_items":[I("tomato soup",1.0,1.8,"cup",US)]}),
 ("partial-01-burger-fries-half","partially_eaten","plate",[("burger",-115,0,110,I("beef burger",0.35,0.65,"piece",US)),("fries",150,0,90,I("french fries",35,75,"g",US))],{"bites":[0]}),
 ("partial-02-pizza-remaining","partially_eaten","pizza_board",[("pizza",0,0,175,I("pepperoni pizza",1.2,2.0,"slice",ME))],{"pizza_missing":True}),
 ("partial-03-rice-chicken-half","partially_eaten","plate",[("rice",-120,40,95,I("cooked white rice",0.4,0.8,"cup",LC)),("chicken_breast",125,-50,95,I("grilled chicken breast",60,110,"g",LC))],{"bites":[1]}),
 ("partial-04-chocolate-cake","partially_eaten","plate",[("cake",0,0,120,I("chocolate cake",0.4,0.7,"slice",US))],{"bites":[0]}),
]

def render(scene):
    sid,cat,vessel,items,extra=scene
    img,d=base(TABLE_D if extra.get("dark") else TABLE)
    cx,cy=W//2,H//2
    if vessel=="plate": plate(d,cx,cy,320,225)
    elif vessel=="bowl_salad": bowl(d,cx,cy,300,215,soup=(96,168,74))
    elif vessel=="bowl_chili": bowl(d,cx,cy,300,215,soup=(158,52,34))
    elif vessel=="bowl_soup_red": bowl(d,cx,cy,300,215,soup=(196,64,38))
    elif vessel=="bowl_ramen": bowl(d,cx,cy,300,215,soup=(226,178,110))
    elif vessel=="pizza_board":
        d.rounded_rectangle([cx-330,cy-235,cx+330,cy+235],radius=26,fill=(156,106,62))
    elif vessel=="board":
        d.rounded_rectangle([cx-320,cy-220,cx+320,cy+220],radius=20,fill=(74,74,80))
    if vessel=="package":
        body,label,accent=extra["package"]; package(d,cx,cy,430,470,body,label,accent)
    if vessel=="drink_mug": mug(d,cx,cy,130,(52,36,24))
    if vessel=="drink_glass_oj": glass(d,cx,cy,170,320,(246,150,28))
    if vessel=="drink_glass_smoothie": glass(d,cx,cy,180,330,(196,74,120)); d.line([cx+40,cy-190,cx+90,cy-40],fill=(240,240,240),width=14)
    if vessel=="drink_can":
        d.rounded_rectangle([cx-85,cy-170,cx+85,cy+170],radius=18,fill=(198,44,44))
        d.rectangle([cx-85,cy-170,cx+85,cy-138],fill=(206,208,210)); d.rectangle([cx-85,cy+138,cx+85,cy+170],fill=(178,180,182))
        d.text((cx,cy),"COLA",font=font(44),fill=(255,255,255),anchor="mm")
    bites=set(extra.get("bites",[]))
    for idx,(pk,dx,dy,s,exp) in enumerate(items):
        PAINTERS[pk](d,cx+dx,cy+dy,s)
        if idx in bites:  # bite/removal marks in table colour
            bd=ImageDraw.Draw(img,"RGBA")
            for bx,by,br in ((cx+dx+s*.45,cy+dy-s*.3,s*.4),(cx+dx+s*.75,cy+dy+s*.15,s*.32)):
                bd.ellipse([bx-br,by-br,bx+br,by+br],fill=TABLE+(255,))
            d=ImageDraw.Draw(img,"RGBA")
    if extra.get("pizza_missing"):
        d.polygon([(cx,cy),(cx-175,cy-120),(cx-40,cy-175)],fill=(156,106,62))
        d.polygon([(cx,cy),(cx+150,cy+140),(cx-10,cy+178)],fill=(156,106,62))
    if extra.get("dark"):
        overlay=Image.new("RGB",(W,H),(8,8,26)); img=Image.blend(img,overlay,1-extra["dark"])
        d=ImageDraw.Draw(img,"RGBA"); rnd=random.Random(21)
        for _ in range(500): d.point((rnd.randrange(W),rnd.randrange(H)),fill=(0,0,0,30))
    img.save(PHOTOS/f"{sid}.jpg",quality=87)
    exps=[e for (_,_,_,_,e) in items if e]+list(extra.get("extra_items",[]))
    tags=[cat]
    if cat=="mixed_plate" and sid.startswith("mixed-05"): tags+=["restaurant-style portion"]
    return {"id":sid,"file":f"photos/{sid}.jpg","categories":tags,"items":exps,
            "provenance":{"source":"synthetic","license":"Generated for this project (Pillow illustration); no third-party content","note":"Procedurally generated stylised food illustration, generator: generate_fixtures.py"}}

manifest=[render(s) for s in SCENES]
expectations={"version":1,"description":"Golden expectations for the Munch S3 photo-logging eval (brief section 3). Portion ranges are honest estimator-hittable ranges (~±30%). expected_provider is one of: local catalog | USDA | Open Food Facts | model_estimate (resolution order: local catalog first, then USDA + Open Food Facts, then model_estimate fallback).","fixtures":[{"id":m["id"],"file":m["file"],"categories":m["categories"],"items":m["items"]} for m in manifest]}
(OUT/"expectations.json").write_text(json.dumps(expectations,indent=2)+"\n")
prov={"version":1,"generator":"fixtures/photo-eval/generate_fixtures.py (Pillow, synthetic illustrations only; no scraped or stock imagery)","fixtures":[{"id":m["id"],"file":m["file"],**m["provenance"]} for m in manifest]}
(OUT/"manifest.json").write_text(json.dumps(prov,indent=2)+"\n")
total=sum((PHOTOS/f"{m['id']}.jpg").stat().st_size for m in manifest)
from collections import Counter
print("fixtures:",len(manifest)); print(Counter(m["categories"][0] for m in manifest)); print("total bytes:",total)
items=sum(len(m["items"]) for m in manifest); grounded=sum(1 for m in manifest for i in m["items"] if i["expected_provider"]!="model_estimate")
print("items:",items,"grounded:",grounded,f"{grounded/items:.1%}")
