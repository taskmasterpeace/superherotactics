"""
Generate Placeholder Item Images
Creates simple colored rectangles with text labels for inventory items
"""

from PIL import Image, ImageDraw, ImageFont
import os

# Create output directory
os.makedirs('public/assets/items/placeholders', exist_ok=True)

def create_placeholder(width, height, color, label, ratio_text, filename):
    """Create a placeholder item image"""
    img = Image.new('RGB', (width, height), color=color)
    draw = ImageDraw.Draw(img)
    
    # Try to use a font, fall back to default
    try:
        font_large = ImageFont.truetype("arial.ttf", 20)
        font_small = ImageFont.truetype("arial.ttf", 12)
    except:
        font_large = ImageFont.load_default()
        font_small = ImageFont.load_default()
    
    # Draw border
    draw.rectangle([(0, 0), (width-1, height-1)], outline='black', width=3)
    
    # Draw label (centered)
    bbox = draw.textbbox((0, 0), label, font=font_large)
    text_width = bbox[2] - bbox[0]
    text_height = bbox[3] - bbox[1]
    x = (width - text_width) / 2
    y = (height - text_height) / 2
    draw.text((x, y), label, fill='white', font=font_large, stroke_width=2, stroke_fill='black')
    
    # Draw ratio in bottom-left
    draw.text((5, height - 20), ratio_text, fill='white', font=font_small, stroke_width=1, stroke_fill='black')
    
    # Save
    img.save(f'public/assets/items/placeholders/{filename}')
    print(f"Created: {filename} ({width}x{height})")

# 1x1 Square items (100x100)
create_placeholder(100, 100, '#2563eb', 'GRENADE', '1:1', 'grenade_1x1.png')
create_placeholder(100, 100, '#3b82f6', 'PISTOL', '1:1', 'pistol_1x1.png')
create_placeholder(100, 100, '#facc15', 'AMMO', '1:1', 'ammo_1x1.png')
create_placeholder(100, 100, '#ef4444', 'MED', '1:1', 'med_small_1x1.png')
create_placeholder(100, 100, '#6b7280', 'DRONE', '1:1', 'drone_1x1.png')

# 2x1 Wide items (200x100)
create_placeholder(200, 100, '#a855f7', 'SMG', '16:9', 'smg_2x1.png')
create_placeholder(200, 100, '#dc2626', 'MEDKIT', '16:9', 'medkit_2x1.png')

# 3x1 Long items (300x100)
create_placeholder(300, 100, '#ea580c', 'RIFLE', '16:9', 'rifle_3x1.png')
create_placeholder(300, 100, '#92400e', 'SHOTGUN', '16:9', 'shotgun_3x1.png')
create_placeholder(300, 100, '#15803d', 'AR-15', '16:9', 'ar15_3x1.png')

# 1x2 Tall items (100x200)
create_placeholder(100, 200, '#cbd5e1', 'SWORD', '9:16', 'sword_1x2.png')
create_placeholder(100, 200, '#dc2626', 'KATANA', '9:16', 'katana_1x2.png')
create_placeholder(100, 200, '#78716c', 'SPEAR', '9:16', 'spear_1x2.png')

# 2x2 Large square (200x200)
create_placeholder(200, 200, '#1e40af', 'ARMOR', '1:1', 'armor_2x2.png')
create_placeholder(200, 200, '#78350f', 'BACKPACK', '1:1', 'backpack_2x2.png')

# 3x2 Very large (300x200)
create_placeholder(300, 200, '#1f2937', 'SNIPER', '16:9', 'sniper_3x2.png')
create_placeholder(300, 200, '#57534e', 'RPG', '16:9', 'rpg_3x2.png')
create_placeholder(300, 200, '#422006', 'ROCKET', '16:9', 'rocket_launcher_3x2.png')

# 4x2 Huge (400x200)
create_placeholder(400, 200, '#1c1917', 'MINIGUN', '16:9', 'minigun_4x2.png')

print("\n✅ Created 20 placeholder images in public/assets/items/placeholders/")
print("These are simple colored rectangles showing item names and aspect ratios.")
print("Replace with real artwork later!")
