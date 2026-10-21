"""Original provisional, code-drawn Tahap20 pixel art. Pillow + stdlib only.

Run from any directory: python src/games/SeranganFajar/tools/generate_visual_assets.py
All coordinates are integral at drawing time; no source images, tracing, filtering,
antialiasing, baked combat FX, labels, or backgrounds enter runtime sheets.
"""
from __future__ import annotations

import hashlib
import json
import math
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[1]
WOWO = [('idle', 6, 8), ('walk', 8, 12), ('run', 8, 16),
        ('attack', 6, 18), ('skillQ', 6, 16), ('skillE', 6, 16),
        ('skillR', 8, 16), ('hurt', 4, 16), ('death', 8, 12)]
NAGA = [('idle', 6, 8), ('move', 8, 12), ('windup', 6, 12),
        ('breath', 6, 12), ('slash', 6, 14), ('spread', 6, 14),
        ('summon', 6, 10), ('hurt', 4, 16), ('phase', 8, 12), ('death', 8, 10)]
P = dict(out='#302a31', skin='#dfa573', skinlight='#f5c994', skinshade='#ac6f50',
         khaki='#c3b477', light='#e2d398', shade='#918453', deep='#665b3c',
         hat='#6d6643', hatlight='#a19760', boot='#704936', bootlight='#a56c42',
         sole='#403735', hair='#493730', gold='#e4b654', white='#fff0ce')
D = dict(out='#422637', shadow='#754456', red='#b93643', redlight='#e55b4c',
         darkred='#7e273d', white='#f8edd3', ivory='#d9d7bf', shade='#a7b3a9',
         gold='#d4a345', light='#ffe29a', mouth='#592a3a', eye='#ffbf42')


def pt(x, y):
    return round(x), round(y)


class Pen:
    def __init__(self, image, palette, transform=lambda x, y: (x, y)):
        self.draw = ImageDraw.Draw(image)
        self.palette = palette
        self.transform = transform

    def points(self, points):
        return [pt(*self.transform(x, y)) for x, y in points]

    def poly(self, points, color, outline=None):
        self.draw.polygon(self.points(points), fill=self.palette.get(color, color),
                          outline=self.palette.get(outline, outline) if outline else None)

    def line(self, points, color, width=1):
        self.draw.line(self.points(points), fill=self.palette.get(color, color), width=width)

    def box(self, x, y, w, h, color):
        self.poly([(x, y), (x+w-1, y), (x+w-1, y+h-1), (x, y+h-1)], color)

    def joint(self, a, b, width, color, highlight=None):
        dx, dy = b[0]-a[0], b[1]-a[1]
        length = math.hypot(dx, dy) or 1
        nx, ny = -dy/length*width/2, dx/length*width/2
        self.poly([(a[0]+nx, a[1]+ny), (b[0]+nx, b[1]+ny),
                   (b[0]-nx, b[1]-ny), (a[0]-nx, a[1]-ny)], color, 'out')
        if highlight:
            self.line([(a[0]-nx/2, a[1]-ny/2), (b[0]-nx/2, b[1]-ny/2)], highlight, 2)


def wowo(action, i, count):
    im = Image.new('RGBA', (64, 64))
    t = i / max(1, count-1)
    cycle = i * math.tau / count
    sway, bob, lean = 0, 0, 0
    stride, lift, reach, bend = 0, 0, 0, 0
    angle, grip = 82, (43, 40)
    offhand = (23, 44)
    headtilt = 0
    if action == 'idle':
        bob = [0, -1, -1, 0, 1, 0][i]
        grip = [(43, 40), (44, 39), (44, 40), (43, 41), (42, 41), (42, 40)][i]
        angle = [83, 80, 78, 80, 84, 86][i]
    elif action in ('walk', 'run'):
        fast = action == 'run'
        stride = math.sin(cycle) * (10 if fast else 7)
        lift = abs(math.cos(cycle)) * (3 if fast else 1)
        bob = [0, -1, -2, -1, 0, -1, -2, -1][i] * (1.5 if fast else 1)
        lean = 3 if fast else 1
        grip = (43-stride*.45, 39+stride*.2)
        offhand = (23+stride*.65, 42-stride*.25)
        angle = 72 + math.sin(cycle)*16
    elif action == 'attack':
        lean = [-2, -3, 1, 5, 3, 0][i]
        bob = [0, -2, -1, 2, 1, 0][i]
        grip = [(35, 33), (30, 27), (44, 25), (48, 36), (46, 41), (43, 42)][i]
        angle = [-155, -130, -45, 8, 40, 70][i]
        offhand = [(22, 42), (20, 39), (23, 36), (28, 39), (26, 43), (24, 44)][i]
        stride = [0, -2, -3, -5, -3, 0][i]
    elif action == 'skillQ':
        lean = [-2, -2, 0, 4, 3, 1][i]
        grip = [(40, 37), (37, 30), (40, 26), (48, 30), (49, 34), (44, 39)][i]
        angle = [-130, -100, -75, -15, 4, 55][i]
        offhand = [(23, 42), (23, 38), (29, 35), (40, 33), (42, 36), (28, 43)][i]
        bob = [1, 0, -2, -1, 0, 1][i]
    elif action == 'skillE':
        grip = [(42, 40), (42, 34), (41, 25), (40, 22), (42, 30), (43, 38)][i]
        angle = [78, -75, -88, -96, -85, 65][i]
        offhand = [(24, 43), (19, 39), (15, 32), (14, 29), (18, 35), (23, 41)][i]
        bob = [2, 0, -2, -3, -1, 0][i]
        headtilt = [0, -1, -2, -2, -1, 0][i]
    elif action == 'skillR':
        bob = [2, 3, 0, -5, -7, -3, 2, 0][i]
        lean = [-1, -2, -2, 0, 2, 4, 3, 0][i]
        grip = [(42, 42), (37, 39), (39, 28), (41, 23), (43, 22), (47, 30), (49, 43), (44, 42)][i]
        angle = [90, 120, -120, -100, -70, -25, 25, 78][i]
        offhand = [(24, 43), (26, 42), (21, 33), (17, 25), (15, 23), (21, 32), (29, 43), (24, 44)][i]
        stride = [0, 2, 3, 5, 7, 5, 3, 0][i]
    elif action == 'hurt':
        lean = [-5, -4, -2, 0][i]
        bob = [0, 2, 1, 0][i]
        grip = [(38, 38), (37, 42), (40, 43), (42, 41)][i]
        offhand = [(29, 34), (30, 35), (27, 38), (25, 42)][i]
        angle = [115, 110, 96, 84][i]
        headtilt = -2+i
    elif action == 'death':
        bend = t
        grip = [(42, 40), (41, 42), (39, 45), (38, 46), (40, 44), (43, 42), (45, 41), (47, 40)][i]
        offhand = (24+5*t, 44+3*t)
        angle = 82-52*t
        headtilt = -2*t
    if action == 'death' and i >= 4:
        # Grounded hand-drawn fall keys: hips settle, knees fold, head rests on brim.
        p = Pen(im, P)
        settle = i-4
        yy = 48+settle
        p.poly([(16,53),(24,49),(33,49),(38,53),(34,58),(22,58)], 'khaki','out')
        p.poly([(17,53),(13,50-settle),(8,52),(10,57),(20,59)],'shade','out')
        p.poly([(17,56),(13,58),(6,57),(5,60),(16,61),(23,57)],'boot','out')
        p.line([(7,59),(14,60)],'bootlight')
        p.poly([(29,yy),(40,yy-1),(47,yy+3),(45,yy+8),(35,yy+8),(30,yy+5)],'khaki','out')
        p.poly([(38,yy),(46,yy-1),(51,yy+2),(51,yy+7),(46,yy+9),(40,yy+6)],'skin','out')
        p.line([(46,yy+3),(48,yy+4)],'hair')
        p.poly([(48,yy+5),(50,yy+4),(52,yy+6),(49,yy+7)],'hair')
        p.poly([(44,yy-3),(51,yy-4),(55,yy-1),(55,yy+5),(52,yy+8),
                (50,yy+1),(44,yy)],'hat','out')
        p.line([(46,yy-2),(52,yy-2)],'hatlight')
        p.joint((34,yy+3),(30,56),6,'khaki','light')
        p.joint((30,56),(40+settle,58),4,'skin','skinlight')
        p.box(30,yy+1,4,3,'shade')
        p.box(30,yy+1,4,1,'light')
        p.line([(24,51),(25,57)],'boot',3)
        p.box(24,53,2,2,'gold')
        p.line([(28,61),(57,59)],'out',3)
        p.line([(28,61),(57,59)],'bootlight')
        p.line([(28,61),(25,59),(27,57)],'gold')
        return im
    # Fixed ground anchor; no bounding-box recentering.
    def transform(x, y):
        if action == 'run':
            return x+(59-y)*.13, y
        if action != 'death':
            return x, y
        a = bend * 1.43
        dx, dy = x-32, (y-59)*(1-.46*bend)
        return (32 + dx*math.cos(a)-dy*math.sin(a)*.86,
                59 + dx*math.sin(a)*.6+dy*math.cos(a)*(.96-.6*bend)-20*bend)
    p = Pen(im, P, transform)
    ox, oy = lean, bob
    hip1, hip2 = (28+ox, 43+oy), (36+ox, 43+oy)
    ankle1 = (27+stride, 56-lift if stride > 0 else 57)
    ankle2 = (37-stride, 56-lift if stride < 0 else 57)
    if action in ('walk', 'run'):
        stepheight = 5 if action == 'run' else 3
        ankle1 = (ankle1[0], 57-max(0, math.cos(cycle))*stepheight)
        ankle2 = (ankle2[0], 57-max(0, -math.cos(cycle))*stepheight)
    if action == 'skillR' and i in (3, 4, 5):
        ankle1 = (24-stride*.3, 55+oy)
        ankle2 = (38+stride*.3, 55+oy)
    # Far leg before torso, near leg after; bent knees produce actual gait.
    for hip, ankle, front in [(hip1, ankle1, False), (hip2, ankle2, True)]:
        knee = ((hip[0]+ankle[0])*.5+stride*(.15 if front else -.15), 50+oy*.4)
        p.joint(hip, knee, 7, 'shade' if not front else 'khaki', 'light' if front else None)
        p.joint(knee, ankle, 6, 'deep' if not front else 'shade')
        x, y = ankle
        p.poly([(x-3,y-3),(x+2,y-3),(x+3,y),(x+6,y+1),(x+6,y+3),(x-3,y+3)], 'boot', 'out')
        p.line([(x-1,y-1),(x+1,y),(x+4,y+1)], 'bootlight')
        p.line([(x-2,y+3),(x+5,y+3)], 'sole')
    # Far arm visibly separate from collar and hip.
    shoulder = (25+ox, 29+oy)
    far = (offhand[0]+ox*.3, offhand[1]+oy)
    elbow = ((shoulder[0]+far[0])/2-2, (shoulder[1]+far[1])/2+2)
    p.joint(shoulder, elbow, 7, 'shade')
    p.joint(elbow, far, 5, 'skin', 'skinlight')
    p.box(far[0]-2,far[1]-1,4,4,'skin')
    # Fitted safari shirt: collar, sleeve seams, two flap pockets, buttons, belt.
    p.poly([(25+ox,27+oy),(36+ox,27+oy),(41+ox,32+oy),(40+ox,43+oy),
            (25+ox,44+oy),(22+ox,35+oy)], 'khaki','out')
    p.poly([(25+ox,29+oy),(28+ox,30+oy),(28+ox,40+oy),(25+ox,40+oy)],'light')
    p.poly([(28+ox,27+oy),(32+ox,30+oy),(30+ox,33+oy),(26+ox,29+oy)],'light')
    p.poly([(33+ox,28+oy),(36+ox,28+oy),(35+ox,32+oy),(32+ox,30+oy)],'shade')
    p.line([(32+ox,32+oy),(32+ox,41+oy)],'shade')
    for x in (26, 35):
        p.box(x+ox,34+oy,5,5,'shade')
        p.box(x+ox,34+oy,5,2,'light')
        p.box(x+2+ox,36+oy,1,1,'deep')
    for y in (32, 38, 40):
        p.box(32+ox,y+oy,1,1,'white')
    p.poly([(25+ox,41+oy),(40+ox,41+oy),(40+ox,44+oy),(25+ox,44+oy)],'boot','out')
    p.box(32+ox,42+oy,4,2,'gold')
    p.box(33+ox,42+oy,2,1,'deep')
    # Face in three-quarter view, right-hand nose, two eyes, thick moustache.
    hx, hy = ox+headtilt, oy
    p.poly([(26+hx,15+hy),(37+hx,15+hy),(40+hx,19+hy),(40+hx,22+hy),
            (42+hx,23+hy),(40+hx,25+hy),(38+hx,28+hy),(30+hx,28+hy),
            (26+hx,24+hy)],'skin','out')
    p.box(25+hx,20+hy,3,5,'skinshade')
    p.box(26+hx,20+hy,2,3,'skinlight')
    p.poly([(29+hx,18+hy),(37+hx,18+hy),(38+hx,21+hy),(35+hx,21+hy),
            (35+hx,24+hy),(30+hx,23+hy)],'skinlight')
    p.line([(29+hx,20+hy),(32+hx,20+hy)],'hair')
    p.line([(36+hx,20+hy),(38+hx,20+hy)],'hair')
    if action in ('hurt','death'):
        p.line([(30+hx,22+hy),(32+hx,22+hy)],'out')
        p.line([(36+hx,22+hy),(38+hx,22+hy)],'out')
    else:
        p.box(31+hx,21+hy,2,2,'out')
        p.box(37+hx,21+hy,2,2,'out')
        p.box(32+hx,21+hy,1,1,'white')
    p.box(39+hx,22+hy,2,2,'skinlight')
    p.poly([(32+hx,24+hy),(35+hx,23+hy),(37+hx,24+hy),(40+hx,24+hy),
            (39+hx,26+hy),(36+hx,25+hy),(33+hx,26+hy),(31+hx,25+hy)],'hair')
    p.line([(34+hx,27+hy),(37+hx,27+hy)],'skinshade')
    # Crown, dark hat band and broad stepped brim.
    p.poly([(25+hx,15+hy),(25+hx,11+hy),(28+hx,8+hy),(36+hx,8+hy),
            (39+hx,11+hy),(40+hx,16+hy)],'hat','out')
    p.poly([(28+hx,9+hy),(35+hx,9+hy),(37+hx,11+hy),(28+hx,11+hy)],'hatlight')
    p.box(26+hx,14+hy,13,2,'boot')
    p.box(35+hx,14+hy,2,2,'gold')
    p.poly([(21+hx,16+hy),(26+hx,15+hy),(39+hx,15+hy),(44+hx,17+hy),
            (43+hx,19+hy),(25+hx,19+hy),(21+hx,18+hy)],'hat','out')
    p.line([(23+hx,17+hy),(39+hx,17+hy)],'hatlight')
    # Cane is physical prop, with crooked handle, not a baked attack trail.
    gx, gy = grip[0]+ox*.25, grip[1]+oy
    a = math.radians(angle)
    direction = (math.cos(a), math.sin(a))
    # Foreshorten prop toward viewer during frontal thrust; never crop its tip.
    length = 20
    for coord, component in zip((gx, gy), direction):
        if component > .001:
            length = min(length, (60-coord)/component)
        elif component < -.001:
            length = min(length, (3-coord)/component)
    tip = (gx+direction[0]*length, gy+direction[1]*length)
    back = (gx-direction[0]*4, gy-direction[1]*4)
    p.line([back, tip], 'out', 3)
    p.line([back, tip], 'bootlight', 1)
    normal = (-direction[1], direction[0])
    hook = [(back[0]+normal[0]*3,back[1]+normal[1]*3),
            (back[0]-direction[0]*2+normal[0]*3,back[1]-direction[1]*2+normal[1]*3),
            (back[0]-direction[0]*3,back[1]-direction[1]*3),back]
    p.line(hook,'out',3)
    p.line(hook,'gold',1)
    p.line([(tip[0]-direction[0]*2,tip[1]-direction[1]*2),tip],'gold',2)
    near = (38+ox,31+oy)
    elbow = ((near[0]+gx)/2+2, (near[1]+gy)/2+3)
    p.joint(near,elbow,7,'khaki','light')
    p.line([(elbow[0]-2,elbow[1]-1),(elbow[0]+2,elbow[1]+1)],'shade',2)
    p.joint(elbow,(gx,gy),5,'skin','skinlight')
    p.poly([(gx-2,gy-1),(gx+1,gy-2),(gx+3,gy),(gx+1,gy+3),(gx-2,gy+2)],'skin','out')
    p.line([(gx,gy-1),(gx+1,gy)],'skinlight')
    return im


def spline(points, steps=5):
    """Uniform Catmull-Rom spine; segments share tangents, no detached bead body."""
    out = []
    padded = [points[0]] + points + [points[-1]]
    for k in range(1,len(padded)-2):
        a,b,c,d = padded[k-1:k+3]
        for j in range(steps):
            t=j/steps
            out.append(tuple(.5*((2*b[q])+(-a[q]+c[q])*t+
                                  (2*a[q]-5*b[q]+4*c[q]-d[q])*t*t+
                                  (-a[q]+3*b[q]-3*c[q]+d[q])*t*t*t) for q in (0,1)))
    return out+[points[-1]]


def naga(action, i, count):
    im=Image.new('RGBA',(128,128))
    def anchor_transform(x, y):
        return 64+(x-64)*.9, 108+(y-108)*.88
    p=Pen(im,D,anchor_transform)
    t=i/max(1,count-1)
    phase=i*math.tau/count
    wave=math.sin(phase)
    dx,dy,stretch,jaw,claw,arch=0,0,0,2,0,0
    if action=='idle':
        dx=[0,1,2,1,0,-1][i]
        dy=[0,-1,-2,-1,0,1][i]
        jaw=[2,2,3,4,3,2][i]
    elif action=='move':
        dx=4+3*math.cos(phase)
        dy=-2+3*wave
        stretch=5
        claw=5*wave
    elif action=='windup':
        dx=-i*1.4
        dy=2-i*.7
        stretch=-i*1.2
        jaw=2+i
        claw=-i*1.5
        arch=i
    elif action=='breath':
        dx=[-5,0,5,7,4,1][i]
        dy=[-2,0,4,5,3,1][i]
        jaw=[5,9,12,11,8,5][i]
        stretch=[-3,0,4,5,3,1][i]
        claw=3+i
    elif action=='slash':
        dx=[-3,-5,-2,7,5,1][i]
        dy=[-2,-5,-3,7,5,1][i]
        claw=[-10,-17,-12,19,14,3][i]
        stretch=[-3,-5,-2,7,5,1][i]
        jaw=4+i%3
    elif action=='spread':
        dx=[-5,-3,0,3,5,2][i]
        dy=[2,-2,-5,-3,0,2][i]
        jaw=[4,6,9,10,8,4][i]
        claw=[-3,-6,-9,-7,-4,0][i]
        arch=3
    elif action=='summon':
        dy=[1,-3,-8,-11,-7,-2][i]
        dx=[1,0,-2,-3,-1,1][i]
        claw=[0,-5,-10,-13,-9,-3][i]
        arch=[0,2,5,7,4,1][i]
        jaw=3+i%4
    elif action=='hurt':
        dx=[-8,-5,-2,0][i]
        dy=[5,3,1,0][i]
        stretch=-3+i
        jaw=[8,6,4,3][i]
        claw=[9,6,3,1][i]
    elif action=='phase':
        arch=[0,3,6,9,12,10,7,4][i]
        dy=[1,-2,-5,-8,-10,-9,-6,-3][i]
        dx=[0,-1,-2,0,2,3,2,1][i]
        stretch=[0,1,2,3,4,4,3,2][i]
        claw=[0,-4,-9,-14,-18,-16,-12,-8][i]
        jaw=[3,5,7,9,11,10,8,6][i]
    elif action=='death':
        dx=-12*t
        dy=22*t
        stretch=-10*t
        jaw=6*(1-t)
        claw=3*t
    controls=[(16,88),(20,103),(44,105),(70,97),(85,82),(78,69),
              (57,67),(39,70),(29,56),(37,41),(56,40),(69,46),(77,39)]
    adjusted=[]
    for k,(x,y) in enumerate(controls):
        u=k/(len(controls)-1)
        x+=math.sin(u*math.tau+phase)*2.5*(1-u)+dx*u*u
        x+=(x-55)/35*stretch*(1-u)
        y+=math.sin(u*math.pi*3+phase)*2*(1-u)+dy*u*u
        y-=arch*math.sin(u*math.pi)
        if action=='phase':
            # Coil rises into broad threatening crown; same spine, new silhouette.
            x+=(x-57)*(.3*t)
            y-=math.sin(u*math.pi)*15*t
        if action=='move':
            x+=math.sin(u*math.tau*1.5-phase)*5*(1-u)
            y+=math.cos(u*math.tau-phase)*4*(1-u)
        if action=='death':
            y=108+(y-108)*(1-.64*t)
            x+=math.sin(u*math.pi)*t*7
        adjusted.append((x,y))
    spine=spline(adjusted)
    left,right,normals,widths=[],[],[],[]
    for k,(x,y) in enumerate(spine):
        u=k/(len(spine)-1)
        a=spine[max(0,k-1)]
        b=spine[min(len(spine)-1,k+1)]
        length=math.hypot(b[0]-a[0],b[1]-a[1]) or 1
        nx,ny=-(b[1]-a[1])/length,(b[0]-a[0])/length
        radius=2+7*min(1,u*3)
        widths.append(radius)
        normals.append((nx,ny))
        left.append((x+nx*radius,y+ny*radius))
        right.append((x-nx*radius,y-ny*radius))
    # Back limbs behind continuous body.
    hx,hy=spine[-1]
    rear=(adjusted[4][0]-6,adjusted[4][1]+4)
    elbow=(rear[0]-10,rear[1]+12-claw*.1)
    wrist=(elbow[0]-12,elbow[1]-1)
    p.joint(rear,elbow,6,'red')
    p.joint(elbow,wrist,5,'ivory','white')
    for n in range(3):
        p.poly([(wrist[0]-n*3,wrist[1]-2),(wrist[0]-4-n*3,wrist[1]+4),
                (wrist[0]+1-n*3,wrist[1]+2)],'light','out')
    # Gold dorsal spines follow same continuous tube, never detached particles.
    for k in range(4,len(spine)-2,4):
        x,y=spine[k]
        nx,ny=normals[k]
        r=widths[k]
        a=spine[k-2]
        b=spine[k+1]
        height=3+(k%3)+(arch*.22 if action=='phase' else 0)
        p.poly([(a[0]-nx*(r-1),a[1]-ny*(r-1)),
                (x-nx*(r+height)-2,y-ny*(r+height)-1),
                (b[0]-nx*(r-1),b[1]-ny*(r-1))], 'gold','out')
    p.poly(left+list(reversed(right)),'red','out')
    # Broad ivory flank; dark red dorsal ribbon remains clearly visible.
    belly_left=[]
    belly_right=[]
    for k,(x,y) in enumerate(spine):
        nx,ny=normals[k]
        r=widths[k]
        belly_left.append((x+nx*(r-1),y+ny*(r-1)))
        belly_right.append((x-nx*r*.22,y-ny*r*.22))
    p.poly(belly_left+list(reversed(belly_right)),'ivory')
    p.line(belly_right,'gold')
    for k in range(3,len(spine)-1,3):
        x,y=spine[k]
        nx,ny=normals[k]
        r=widths[k]
        p.line([(x+nx*(r-1),y+ny*(r-1)),(x-nx*r*.15,y-ny*r*.15)],'shade')
        if k%2:
            p.line([(x+nx*(r-3),y+ny*(r-3)),(x+nx*r*.3,y+ny*r*.3)],'white',2)
        p.line([(x-nx*r*.65-1,y-ny*r*.65),(x-nx*r*.65+1,y-ny*r*.65-1)],'redlight')
    # Forward arm, clearly rooted at chest, claw fan opens during slash.
    root=(hx-5,hy+10)
    elbow=(hx+3+claw*.45,hy+33+claw*.35)
    wrist=(hx+22+claw*.3,hy+39+claw*.85)
    if action=='spread':
        elbow=(hx+8,hy+28-i*2)
        wrist=(hx+26,hy+32-i*3)
    if action=='summon':
        elbow=(hx+7,hy+23-i)
        wrist=(hx+24,hy+13-i*2)
    if action=='phase':
        elbow=(hx+3+12*t,hy+28-9*t)
        wrist=(hx+17+8*t,hy+36-25*t)
    if action=='death':
        elbow=(hx-2,hy+24-7*t)
        wrist=(hx+12,hy+27-10*t)
    p.joint(root,elbow,8,'red','redlight')
    p.joint(elbow,wrist,6,'ivory','white')
    p.poly([(wrist[0]-4,wrist[1]-3),(wrist[0]+3,wrist[1]-3),
            (wrist[0]+5,wrist[1]+2),(wrist[0]-2,wrist[1]+4)],'white','out')
    for n in range(3):
        x=wrist[0]+n*3-1
        y=wrist[1]+n*2-2
        p.poly([(x,y),(x+6,y-2-claw*.08),(x+4,y+4),(x+1,y+3)],'light','out')
    # Head is large angular mask, red mane, branching gold antlers, split jaw.
    x,y=hx-1,hy-4
    dying=t if action=='death' else 0
    def head_transform(px,py):
        a=dying*.42
        ux,uy=px-x,py-y
        return anchor_transform(x+ux*math.cos(a)-uy*math.sin(a),y+ux*math.sin(a)+uy*math.cos(a))
    h=Pen(im,D,head_transform)
    mane=arch*.25
    h.poly([(x+3,y-14),(x-8,y-17-mane),(x-5,y-8),(x-17,y-12-mane),
            (x-12,y-3),(x-22,y-4),(x-14,y+4),(x-21,y+10),
            (x-10,y+10),(x-13,y+18),(x-1,y+13),(x+9,y+8)],'darkred','out')
    h.poly([(x-6,y-11),(x-12,y-10),(x-8,y-3),(x-16,y+1),
            (x-9,y+6),(x-13,y+12),(x-3,y+9),(x+4,y+2)],'redlight')
    for ox,oy in [(-4,-10),(6,-12)]:
        h.poly([(x+ox,y+oy+4),(x+ox-4,y+oy-6),
                (x+ox-13,y+oy-13),(x+ox-9,y+oy-5),
                (x+ox-15,y+oy-7),(x+ox-8,y+oy+2),(x+ox-2,y+oy+6)],'gold','out')
        h.line([(x+ox-1,y+oy+1),(x+ox-5,y+oy-5),(x+ox-11,y+oy-10)],'light')
    h.poly([(x-7,y-6),(x+4,y-12),(x+14,y-8),(x+17,y-2),
            (x+29,y+1),(x+31,y+7),(x+27,y+11),(x+9,y+12),
            (x-2,y+8),(x-10,y+1)],'white','out')
    h.poly([(x-7,y-1),(x+1,y-6),(x+4,y+1),(x+11,y+5),
            (x+6,y+10),(x-1,y+7)],'ivory')
    # Dark open mouth and lower jaw are actual geometry, not glow.
    h.poly([(x+9,y+7),(x+28,y+7),(x+26,y+10+jaw),
            (x+10,y+12+jaw),(x+4,y+6)],'mouth','out')
    h.poly([(x+6,y+9+jaw),(x+13,y+11+jaw),(x+27,y+9+jaw),
            (x+27,y+13+jaw),(x+12,y+16+jaw),(x+3,y+12+jaw)],'ivory','out')
    h.line([(x+10,y+13+jaw),(x+23,y+12+jaw)],'white',2)
    for tx in (14,23):
        h.poly([(x+tx,y+7),(x+tx+3,y+7),(x+tx+1,y+12)],'white')
    h.poly([(x+15,y+11+jaw),(x+18,y+6+jaw),(x+20,y+11+jaw)],'white')
    h.poly([(x+3,y-3),(x+11,y-4),(x+15,y),(x+7,y+2),(x+3,y+1)],'out')
    if action=='death':
        h.line([(x+5,y),(x+10,y+1)],'gold')
    else:
        h.box(x+7,y-1,5,2,'eye')
        h.box(x+10,y-1,1,3,'out')
        h.box(x+7,y-1,1,1,'light')
    h.line([(x+1,y-5),(x+11,y-6),(x+15,y-2)],'gold',2)
    h.box(x+26,y+3,3,2,'out')
    h.line([(x+23,y+5),(x+30,y+5)],'ivory')
    # Two physical whiskers, separated from muzzle and claw.
    h.line([(x+23,y+8),(x+31,y+12),(x+33,y+8)],'gold')
    h.line([(x+8,y+9),(x+1,y+18),(x-6,y+20),(x-9,y+17)],'gold')
    h.line([(x-1,y+8),(x-6,y+14),(x-10,y+11)],'white',2)
    return im


def build(name, rows, size, origin, painter, destination):
    sheet=Image.new('RGBA',(size*8,size*len(rows)))
    result=[]
    samples=[]
    for row,(action,count,fps) in enumerate(rows):
        frames=[painter(action,i,count) for i in range(count)]
        signatures={hashlib.sha256(frame.tobytes()).hexdigest() for frame in frames}
        assert len(signatures)==count,(name,action,'duplicate animation frames')
        bounds=[]
        for i,frame in enumerate(frames):
            alpha=frame.getchannel('A')
            assert set(alpha.tobytes()) == {0,255},(name,action,i,'nonbinary alpha')
            box=alpha.getbbox()
            assert box and 0 < box[0] < box[2] < size and 0 < box[1] < box[3] < size, (name,action,i,'clipped',box)
            bounds.append(list(box))
            sheet.paste(frame,(i*size,row*size))
        for i in range(count,8):
            assert sheet.crop((i*size,row*size,(i+1)*size,(row+1)*size)).getbbox() is None
        result.append(dict(name=action,row=row,frames=count,frameCount=count,fps=fps,
                           startFrame=row*8,endFrame=row*8+count-1,
                           frameBounds=bounds,uniqueFrames=len(signatures)))
        samples.append((action,frames))
    path=ROOT/destination
    path.parent.mkdir(parents=True,exist_ok=True)
    sheet.save(path,optimize=True)
    with Image.open(path) as saved:
        assert saved.mode=='RGBA' and saved.size==sheet.size
        assert saved.tobytes()==sheet.tobytes()
    return dict(path=destination,columns=8,rows=result,frameSize=dict(width=size,height=size),
                origin=dict(x=origin[0],y=origin[1],normalizedX=origin[0]/size,
                            normalizedY=origin[1]/size),
                sheetSize=dict(width=sheet.width,height=sheet.height),
                sha256=hashlib.sha256(path.read_bytes()).hexdigest(),
                frameCount=sum(r[1] for r in rows)),samples


def contact(groups):
    # Only this review artifact contains labels and a checkerboard.
    width=1760
    rowheight=184
    height=65+rowheight*sum(len(samples) for _,samples in groups)
    canvas=Image.new('RGB',(width,height),'#161d2b')
    draw=ImageDraw.Draw(canvas)
    font=ImageFont.load_default(size=15)
    draw.text((18,15),'TAHAP20 / ORIGINAL CODE-DRAWN PROVISIONAL PIXEL ART / nearest-neighbor preview',fill='#f2d69a',font=font)
    y=57
    for actor,samples in groups:
        for action,frames in samples:
            draw.text((14,y+8),actor,fill='#f2d69a',font=font)
            draw.text((14,y+31),action,fill='#e5e8e2',font=font)
            scale=2 if actor=='Wowo' else 1
            # Both actors displayed at 128px; cell spacing retains full margins.
            for i,frame in enumerate(frames):
                x=155+i*198
                tile=Image.new('RGB',(160,152),'#263244')
                td=ImageDraw.Draw(tile)
                for yy in range(0,152,8):
                    for xx in range(0,160,8):
                        if (xx//8+yy//8)%2:
                            td.rectangle((xx,yy,xx+7,yy+7),fill='#303e51')
                preview=frame.resize((frame.width*scale,frame.height*scale),Image.Resampling.NEAREST)
                tile.paste(preview,((160-preview.width)//2,8),preview)
                canvas.paste(tile,(x,y))
                draw.text((x+5,y+155),str(i+1),fill='#95a8be',font=font)
            y+=rowheight
    path=ROOT/'docs/art/visual-contact-sheet.png'
    path.parent.mkdir(parents=True,exist_ok=True)
    canvas.save(path,optimize=True)


def main():
    hero,hs=build('wowo',WOWO,64,(32,60),wowo,'assets/characters/wowo/wowo-action-sheet.png')
    boss,bs=build('nagaFajar',NAGA,128,(64,108),naga,'assets/boss/naga-fajar-action-sheet.png')
    assets=dict(wowo=hero,nagaFajar=boss)
    manifest=dict(version=1,stage='Tahap20',artStatus='original-code-drawn-provisional',
                  provenance='Original integer-coordinate Pillow shapes; concepts inspected, never sampled or cropped.',
                  generator='tools/generate_visual_assets.py',
                  layout='row-major, eight columns; unused row cells fully transparent',
                  transparency='RGBA, alpha values restricted to 0 and 255',
                  filtering='nearest',facing='right, three-quarter',
                  originConvention='Fixed local pixel anchor; do not recenter individual frames.',
                  runtimeContains='Character anatomy and held cane only; no labels, backgrounds or combat FX.',
                  assets=assets)
    output=ROOT/'assets/visual-manifest.json'
    output.write_text(json.dumps(manifest,indent=2)+'\n',encoding='utf-8')
    contact([('Wowo',hs),('Naga Fajar',bs)])
    print(json.dumps({key:dict(path=value['path'],frames=value['frameCount'],
                               sheetSize=value['sheetSize'],sha256=value['sha256'])
                      for key,value in assets.items()},indent=2))
    print('PASS: all active frames unique per row; binary alpha; transparent padding; no edge clipping; PNG read-back exact.')


if __name__=='__main__':
    main()
