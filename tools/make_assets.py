"""Generate original local demo art; no network or licensed stock assets required."""
from pathlib import Path
import struct, zlib, math

root = Path(__file__).resolve().parents[1]
target = root / 'backend/src/main/resources/static/demo'
target.mkdir(parents=True, exist_ok=True)
palettes = {
    'postcard': ('#d5e2d9', '#8aa88c', '#4b7562', '#d9cfa8', 'THE QUIET / OF FARAWAY', '35° N  /  A LETTER FROM THE MOUNTAINS'),
    'portrait': ('#e9daca', '#ba9b80', '#795a44', '#e1bc7d', 'SLOW / AFTERNOONS', 'LIGHT, SHADOW & A LITTLE TIME'),
    'collage': ('#e9e1c2', '#9da57e', '#64785a', '#c6a568', 'LITTLE / EVERYDAY THINGS', 'COLLECT MOMENTS, KEEP THEM CLOSE'),
    'coast': ('#d7e7e5', '#8db8b8', '#4c898c', '#dcd1ae', 'SOMEWHERE / BY THE SEA', 'LET THE OCEAN SET YOUR PACE'),
}
for name, (sky, middle, dark, sand, title, caption) in palettes.items():
    lines = title.split(' / ')
    svg = f'''<svg xmlns="http://www.w3.org/2000/svg" width="800" height="1000" viewBox="0 0 800 1000">
<defs><linearGradient id="sky" x2="0" y2="1"><stop stop-color="{sky}"/><stop offset="1" stop-color="#f2ecdb"/></linearGradient><pattern id="grain" width="7" height="7" patternUnits="userSpaceOnUse"><circle cx="1" cy="2" r=".5" fill="#fff" opacity=".14"/></pattern></defs>
<rect width="800" height="1000" fill="url(#sky)"/>
<circle cx="580" cy="300" r="92" fill="#fcf4d6" opacity=".9"/>
<path d="M0 620 Q120 410 250 570 Q360 370 490 590 Q650 420 800 560 V1000H0Z" fill="{middle}"/>
<path d="M0 750 Q200 510 430 710 Q640 540 800 650 V1000H0Z" fill="{dark}"/>
<path d="M0 850 Q260 690 470 830 Q640 920 800 740 V1000H0Z" fill="{sand}"/>
<path d="M180 1000 Q340 820 470 830 Q550 830 600 780" fill="none" stroke="#f5edd6" stroke-width="18" opacity=".6"/>
<rect x="40" y="40" width="720" height="920" rx="2" fill="none" stroke="#fff" opacity=".5"/>
<text x="72" y="105" font-family="Arial,sans-serif" font-size="15" letter-spacing="5" fill="#47604e">FRAME / ORIGINAL COLLECTION</text>
<text x="72" y="186" font-family="Georgia,serif" font-size="58" fill="#344b3b">{lines[0]}</text>
<text x="72" y="250" font-family="Georgia,serif" font-size="48" fill="#344b3b">{lines[1]}</text>
<text x="72" y="918" font-family="Arial,sans-serif" font-size="13" letter-spacing="3" fill="#344b3b">{caption.replace('&','&amp;')}</text>
<rect width="800" height="1000" fill="url(#grain)"/>
</svg>'''
    (target / f'{name}.svg').write_text(svg, encoding='utf-8')

# Valid RGB PNGs for exercising uploads. Implemented with stdlib so regeneration is portable.
sample_dir = root / 'samples'
sample_dir.mkdir(exist_ok=True)
def chunk(kind, data):
    return struct.pack('!I', len(data)) + kind + data + struct.pack('!I', zlib.crc32(kind+data)&0xffffffff)
for n in range(1,4):
    w,h=640,480
    rows=bytearray()
    for y in range(h):
        rows.append(0)
        for x in range(w):
            mountain=280+55*math.sin(x/95+n)
            if y>mountain: rgb=(65+n*15,102+n*10,79+n*8)
            elif (x-460)**2+(y-130)**2<45**2: rgb=(248,229,171)
            else: rgb=(180+n*9,int(205-y/25),190+n*6)
            rows.extend(rgb)
    png=b'\x89PNG\r\n\x1a\n'+chunk(b'IHDR',struct.pack('!2I5B',w,h,8,2,0,0,0))+chunk(b'IDAT',zlib.compress(rows))+chunk(b'IEND',b'')
    (sample_dir/f'sample-{n}.png').write_bytes(png)
print('Generated 4 SVG covers and 3 uploadable PNGs.')
