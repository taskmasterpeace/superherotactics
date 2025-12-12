import os

files = [
    r"c:\git\sht\Game_Mechanics_Spec\Weapons_Complete.csv",
    r"c:\git\sht\Game_Mechanics_Spec\Tech_Gadgets_Complete.csv",
    r"c:\git\sht\SuperHero Tactics\SuperHero Tactics World Bible - Cities.csv",
    r"c:\git\sht\LSW_Powers_Complete_Database.csv",
    r"c:\git\sht\MVP\public\data\Skills.csv",
    r"c:\git\sht\MVP\public\data\StatusEffects.csv",
    r"c:\git\sht\Armor_Equipment.csv",
    r"c:\git\sht\Ammunition_System.csv"
]

print("Checking files:")
for f in files:
    exists = os.path.exists(f)
    print(f"- {os.path.basename(f)}: {'FOUND' if exists else 'MISSING'}")
