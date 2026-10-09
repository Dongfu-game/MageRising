"""Package existing assets. No image generation and no network requests."""
from pathlib import Path
import base64, json, hashlib, zipfile, re
root = Path(__file__).resolve().parent
manifest = json.loads((root/'assets/skins/manifest.json').read_text())
embedded = {}
for asset in manifest['assets']:
    data = (root/asset['path']).read_bytes()
    if hashlib.sha256(data).hexdigest() != asset['sha256']:
        raise SystemExit('Asset changed; review/update manifest intentionally: '+asset['path'])
    # Legacy images remain in archive for fallback; START uses remaster sheets.
    # Avoid embedding obsolete portraits a second time.
effect_embedded = {}
for asset in (json.loads((root/'assets/effects/manifest.json').read_text())['assets'] if (root/'assets/effects/manifest.json').exists() else []):
    data=(root/asset['path']).read_bytes()
    assert hashlib.sha256(data).hexdigest()==asset['sha256'], 'Effect source changed'
    effect_embedded[asset['id']]='data:image/png;base64,'+base64.b64encode(data).decode('ascii')
class_embedded={}
for asset in json.loads((root/'assets/class-skins/manifest.json').read_text())['assets']:
    data=(root/asset['path']).read_bytes()
    assert hashlib.sha256(data).hexdigest()==asset['sha256']
    class_embedded[asset['id']]='data:image/svg+xml;base64,'+base64.b64encode(data).decode('ascii')
remaster_embedded={}
for asset in json.loads((root/'assets/remaster/manifest.json').read_text())['assets']:
    data=(root/asset['path']).read_bytes()
    assert hashlib.sha256(data).hexdigest()==asset['sha256']
    remaster_embedded[asset['id']]='data:image/png;base64,'+base64.b64encode(data).decode('ascii')
html = (root/'index.html').read_text()
html=html.replace('<head>','<head><script>window.MAGE_SUMMONER_EMBEDDED='+json.dumps('data:image/png;base64,'+base64.b64encode((root/'assets/summoner/animated-allies.png').read_bytes()).decode())+';</script>')
combat_embedded={k:'data:image/png;base64,'+base64.b64encode((root/v['path']).read_bytes()).decode() for k,v in json.loads((root/'assets/combat-art/manifest.json').read_text()).items()}
html=html.replace('<head>','<head><script>window.MAGE_COMBAT_ART_EMBEDDED='+json.dumps(combat_embedded)+';</script>')
html = html.replace('<head>','<head><script>window.MAGE_PROJECTILE_EMBEDDED='+json.dumps('data:image/png;base64,'+base64.b64encode((root/'assets/projectiles/arrow.png').read_bytes()).decode())+';</script>')
html = html.replace('<head>','<head><script>window.MAGE_REMASTER_EMBEDDED='+json.dumps(remaster_embedded)+';</script>')
html = html.replace('<head>','<head><script>window.MAGE_CLASS_SKIN_EMBEDDED='+json.dumps(class_embedded)+';</script>')
html = html.replace('<head>', '<head><script>window.MAGE_EFFECT_EMBEDDED='+json.dumps(effect_embedded,separators=(',',':'))+';</script>')
html = re.sub(r'<link[^>]*href="style.css"[^>]*>', lambda _: '<style>\n'+(root/'style.css').read_text()+'\n</style>', html)
html = re.sub(r'\?v=(?:0701?|071|072|073|074|075|076|077|078|079|080|081|082|083|084|085|090|091)(?=\")','',html)
html = re.sub(r'<link[^>]*href="cards.css"[^>]*>', lambda _: '<style>\n'+(root/'cards.css').read_text()+'\n</style>', html)
html = re.sub(r'<link[^>]*href="auto-gear.css"[^>]*>', lambda _: '<style>\n'+(root/'auto-gear.css').read_text()+'\n</style>', html)
html = re.sub(r'<link[^>]*href="landscape.css"[^>]*>', lambda _: '<style>\n'+(root/'landscape.css').read_text()+'\n</style>', html)
html = html.replace('<script src="js/config.js"></script>', '<script>window.MAGE_SKIN_EMBEDDED='+json.dumps(embedded,separators=(',',':'))+';</script>\n<script src="js/config.js"></script>')
for name in ['class-data','config','items','skills','class-art','remaster','combat-art','summoner-art','warrior-fx','cards','auto-gear','game','polish','orientation','firebase-config','rank']:
    html = html.replace('<script src="js/'+name+'.js"></script>','<script>\n'+(root/('js/'+name+'.js')).read_text()+'\n</script>')
for card_art in ['battle-series','casual-series']:
    html=html.replace('assets/cards/'+card_art+'.png','data:image/png;base64,'+base64.b64encode((root/('assets/cards/'+card_art+'.png')).read_bytes()).decode())
(root/'START.html').write_text(html)
version='0.9.1'
out=root.parent/('MageRising_v'+version+'.zip')
temporary=out.with_suffix('.zip.tmp')
with zipfile.ZipFile(temporary,'w',zipfile.ZIP_DEFLATED) as archive:
    for path in sorted(root.rglob('*')):
        if path.is_file() and '__pycache__' not in path.parts and '.git' not in path.parts and (path.parent!=root/'js' or path.suffix=='.js'):
            archive.write(path,Path('MageRising')/path.relative_to(root))
with zipfile.ZipFile(temporary) as archive:
    assert archive.testzip() is None
temporary.replace(out)
print(out)
print('Existing image bytes reused; '+str(out.stat().st_size)+' bytes')
