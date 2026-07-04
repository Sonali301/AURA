import os
import re

files_to_update = [
    r"backend\.env",
    r"backend\check_db.py",
    r"backend\check_incidents.py",
    r"backend\config\settings.py",
    r"backend\database\mongodb.py",
    r"backend\main.py",
    r"backend\test_sim.py",
    r"frontend\src\layouts\Sidebar.jsx",
    r"frontend\src\pages\LandingPage.jsx"
]

base_dir = r"e:\log analysis\sriis-platform"

for rel_path in files_to_update:
    filepath = os.path.join(base_dir, rel_path)
    if os.path.exists(filepath):
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Replacements
        content = content.replace("SRIIS Autonomous Systems", "Aura Autonomous Systems")
        content = content.replace("SRIIS Agentic", "Aura Agentic")
        content = content.replace("SRIIS (Self-Reasoning", "Aura (Autonomous")
        content = content.replace("SRIIS", "AURA")
        content = content.replace("sriis", "aura")
        
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"Updated {rel_path}")
    else:
        print(f"File not found: {filepath}")
