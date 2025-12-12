"""
Organize New Weapon Icons
Identifies and organizes grenades, pistols, and drone controller
"""

import os
import shutil

source = r'C:\git\sht\MVP\public\assets\images\weapon_icons'

# Create destination folders
dest_grenades = r'C:\git\sht\MVP\public\assets\items\grenades'
dest_pistols = r'C:\git\sht\MVP\public\assets\items\pistols'
dest_gadgets = r'C:\git\sht\MVP\public\assets\items\gadgets'

os.makedirs(dest_grenades, exist_ok=True)
os.makedirs(dest_pistols, exist_ok=True)
os.makedirs(dest_gadgets, exist_ok=True)

# Item identification and mapping
items_to_organize = {
    # GRENADES (additional types)
    'download.png': ('grenades', 'grenade_emp.png', 'EMP Grenade - blue with electric'),
    'download (1).png': ('grenades', 'grenade_plasma.png', 'Plasma Grenade - purple/pink glow'),
    'download (2).png': ('grenades', 'grenade_cryo.png', 'Cryo Grenade - icy blue'),
    
    # PISTOLS
    'download (3).png': ('pistols', 'pistol_standard.png', 'Standard Pistol - basic handgun'),
    'download (4).png': ('pistols', 'pistol_heavy.png', 'Heavy Pistol - larger frame'),
    'download (5).png': ('pistols', 'pistol_futuristic.png', 'Futuristic/Energy Pistol - unique design'),
    'download (6).png': ('pistols', 'pistol_revolver.png', 'Revolver - wheel gun'),
    
    # GADGET (Drone Controller)
    'download (7).png': ('gadgets', 'drone_controller.png', 'Drone Controller - handheld device'),
}

print("🎨 Organizing New Items...\n")
print("=" * 70)

organized = {'grenades': [], 'pistols': [], 'gadgets': []}

for old_name, (category, new_name, description) in items_to_organize.items():
    old_path = os.path.join(source, old_name)
    
    # Determine destination
    if category == 'grenades':
        dest_folder = dest_grenades
    elif category == 'pistols':
        dest_folder = dest_pistols
    else:  # gadgets
        dest_folder = dest_gadgets
    
    new_path = os.path.join(dest_folder, new_name)
    
    if os.path.exists(old_path):
        # Copy file
        shutil.copy2(old_path, new_path)
        organized[category].append((new_name, description))
        print(f"✅ {old_name:20} → {category:10} / {new_name}")
        print(f"   {description}")
        print()
    else:
        print(f"❌ {old_name:20} NOT FOUND")
        print()

print("=" * 70)
print("\n📊 ORGANIZATION SUMMARY:\n")

print(f"💣 GRENADES ({len(organized['grenades'])} new):")
for name, desc in organized['grenades']:
    print(f"   • {name:25} - {desc}")

print(f"\n🔫 PISTOLS ({len(organized['pistols'])} new):")
for name, desc in organized['pistols']:
    print(f"   • {name:25} - {desc}")

print(f"\n🎮 GADGETS ({len(organized['gadgets'])} new):")
for name, desc in organized['gadgets']:
    print(f"   • {name:25} - {desc}")

print("\n" + "=" * 70)
print("\n📁 FILES SAVED TO:")
print(f"   Grenades: {dest_grenades}")
print(f"   Pistols:  {dest_pistols}")
print(f"   Gadgets:  {dest_gadgets}")

print("\n✨ All items organized and ready for inventory system!")
