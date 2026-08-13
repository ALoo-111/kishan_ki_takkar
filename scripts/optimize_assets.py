from pathlib import Path
from PIL import Image

project = Path('/home/ubuntu/kishan_ki_takkar')
source = Path('/home/ubuntu/webdev-static-assets/kishan-ki-takkar-icon.png')
asset_dir = project / 'assets' / 'images'
image = Image.open(source).convert('RGB')
image.thumbnail((512, 512), Image.Resampling.LANCZOS)
for name in ['icon.png', 'splash-icon.png', 'favicon.png', 'android-icon-foreground.png']:
    image.save(asset_dir / name, format='PNG', optimize=True, compress_level=9)
