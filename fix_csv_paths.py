import csv
from pathlib import Path

csv_file = 'data/projects.csv'

# Manual mapping of CSV titles to Projects_WebPrepped folders
mapping = {
    'MorrisGroup AC30': 'Projects_WebPrepped/CreativePipeline/P1087_MorrisGroup_AC30',
    'Promo Animation': 'Projects_WebPrepped/CreativePipeline/P1231_MGAThermal_PromoAnim',
    'Bradken DigitalSolsAnim': 'Projects_WebPrepped/CreativePipeline/P1251_Bradken_DigitalSolsAnim',
    'Pumpable Crib Bag Animation': 'Projects_WebPrepped/CreativePipeline/P1260_Sandvik_PumpableCribBag',
    'Avalon Air Show VR': 'Projects_WebPrepped/CreativePipeline/P1267_SiNAB_AvalonAirshowAnimVR',
    'AUH Liddell360VR': 'Projects_WebPrepped/CreativePipeline/P1274_AUH_Liddell360VR',
    'CFP CalipersAnims': 'Projects_WebPrepped/CreativePipeline/P1300_CFP_CalipersAnims',
    'Electrical Metering Training': 'Projects_WebPrepped/CreativePipeline/P1307_IAC_MeteringVRTraining',
    'TNSW HexhamStraightWidening': 'Projects_WebPrepped/CreativePipeline/P1315_TNSW_HexhamStraightWidening',
    'Proxicam Promo Animation': 'Projects_WebPrepped/CreativePipeline/P1366_FleetSafe_ProxicamPromoAnim',
    'FibreBoats Promo': 'Projects_WebPrepped/CreativePipeline/P1368_FibreBoats_Promo',
    'RavnAerospace Promos': 'Projects_WebPrepped/CreativePipeline/P1370_RavnAerospace_Promos',
    'RME MRMShowVR': 'Projects_WebPrepped/CreativePipeline/P1384_RME_MRMShowVR',
    'Hunter River Bridge Animation': 'Projects_WebPrepped/CreativePipeline/P1388_HunterRiverBridgeAnim',
    'EGA ForkliftVRTraining': 'Projects_WebPrepped/CreativePipeline/P1463_EGA_ForkliftVRTraining',
    'Sandvik RobotWeldingAnim': 'Projects_WebPrepped/CreativePipeline/P1466_Sandvik_RobotWeldingAnim',
    'What is AIS?': 'Projects_WebPrepped/CreativePipeline/P1467_Pitcrew_Vid1-A_MineWhatIsAIS',
    '360 Stills VR Update': 'Projects_WebPrepped/CreativePipeline/P1505_RME_Update360StillsVR',
    'Bradken ChilcaVR': 'Projects_WebPrepped/CreativePipeline/P1507_Bradken_ChilcaVR',
    'EGA BCM-EeLTraining': 'Projects_WebPrepped/CreativePipeline/P1519_EGA_BCM-EeLTraining',
    'RTT LRDS Promo': 'Projects_WebPrepped/CreativePipeline/P1536_RTT_LRDS_Promo',
    'SiNAB PheonixPodAnim': 'Projects_WebPrepped/CreativePipeline/P1540_SiNAB_PheonixPodAnim',
}

# Read CSV
rows = []
with open(csv_file, 'r', encoding='utf-8-sig') as f:
    reader = csv.DictReader(f)
    rows = list(reader)

# Update rows
updated = 0
for row in rows:
    title = row.get('title', '').strip()
    if title in mapping:
        proj_path = mapping[title]
        row['thumbnail_path'] = f"{proj_path}/ProjectThumb/"
        row['gallery_path'] = f"{proj_path}/Gallery/"
        row['video_link'] = f"{proj_path}/Video/"
        updated += 1
        print("OK %s" % title[:40])

# Write CSV
with open(csv_file, 'w', encoding='utf-8', newline='') as f:
    fieldnames = list(rows[0].keys())
    writer = csv.DictWriter(f, fieldnames=fieldnames)
    writer.writeheader()
    writer.writerows(rows)

print("\nUpdated %d projects" % updated)
