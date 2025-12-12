"""
Organize Grenade Icons
Renames and moves grenade icons to proper inventory structure
"""

import os
import shutil

# Source folder
source = r'C:\git\sht\MVP\public\assets\images\weapon_icons'

# Destination folder (create structure for inventory)
dest_grenades = r'C:\git\sht\MVP\public\assets\items\grenades'
os.makedirs(dest_grenades, exist_ok=True)

# Grenade mapping (based on visual inspection, you may need to adjust)
# grenades_02.png through grenades_06.png (5 files)
grenade_mapping = {
    'grenades_02.png': 'grenade_frag.png',        # Frag (pineapple style)
    'grenades_03.png': 'grenade_concussion.png',  # Concussion (smooth)
    'grenades_04.png': 'grenade_flashbang.png',   # Flashbang (cylindrical)
    'grenades_05.png': 'grenade_incendiary.png',  # Incendiary (fire)
    'grenades_06.png': 'grenade_smoke.png',       # Smoke (canister)
}

print("🎨 Organizing Grenade Icons...\n")

for old_name, new_name in grenade_mapping.items():
    old_path = os.path.join(source, old_name)
    new_path = os.path.join(dest_grenades, new_name)
    
    if os.path.exists(old_path):
        # Copy (not move) to preserve originals
        shutil.copy2(old_path, new_path)
        print(f"✅ {old_name:20} → {new_name}")
    else:
        print(f"❌ {old_name:20} NOT FOUND")

print(f"\n📁 Grenades copied to: {dest_grenades}")
print("\n⚠️  IMPORTANT: Check the images and adjust mapping if needed!")
print("   The assignment is based on typical naming, but you may need to swap them.")

# Create a reference file
with open(os.path.join(dest_grenades, 'README.txt'), 'w') as f:
    f.write("""GRENADE ICON MAPPING

Files in this folder:
- grenade_frag.png        (💣 Frag Grenade - standard explosive)
- grenade_concussion.png  (💥 Concussion - high knockback)
- grenade_flashbang.png   (💡 Flashbang - blinds/stuns)
- grenade_incendiary.png  (🔥 Incendiary - creates fire)
- grenade_smoke.png       (💨 Smoke - concealment)

All images are 1x1 grid icons for inventory system.

Original source: public/assets/images/weapon_icons/grenades_0X.png
Renamed for clarity and game system integration.

If the mapping is wrong (e.g., grenade_frag.png looks like a smoke grenade),
simply rename the files to match their actual appearance.
""")

print("\n📝 Created README.txt in grenades folder")
print("\n🎮 Next steps:")
print("   1. Open each grenade image and verify it matches the name")
print("   2. Rename files if mapping is incorrect")
print("   3. Update weaponsWithSounds.ts to use these paths")
print("   4. Test in inventory UI!")
