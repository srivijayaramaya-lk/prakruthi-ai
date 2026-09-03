# KARMA_CODE
# purpose: වැඩ කරන අතරේ විටින් විට මෛත්‍රී සිහියක් (break reminder)
# benefit: දිගු sessions වල ඇස්/හිසරදය අඩු කරලා සිහිය යාවත්කාලීන කරනවා
# constraints: කිසිදු data එකක් එකතු නොකරයි; network call එකක් නෑ
"""metta_clock.py — APPAMADA break reminder. Usage: python karma_code/metta_clock.py [minutes]"""
import sys, time

DEFAULT_MINUTES = 30
MESSAGE = "🪷 පොඩි නිවාඩුවක් — ඇස් වැසුවා, හුස්ම තුනක්. සුබ පැතුම්."

def main():
    minutes = int(sys.argv[1]) if len(sys.argv) > 1 else DEFAULT_MINUTES
    print(f"metta_clock: {minutes} minutes. Ctrl+C to stop.")
    try:
        while True:
            time.sleep(minutes * 60)
            print(MESSAGE)
    except KeyboardInterrupt:
        print("🪷 ස්තූතියි.")

if __name__ == "__main__":
    main()