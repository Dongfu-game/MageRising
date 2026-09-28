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
    embedded[asset['id']] = 'data:image/png;base64,'+base64.b64encode(data).decode('ascii')
effect_embedded = {}
for asset in json.loads((root/'assets/effects/manifest.json').read_text())['assets']:
    data=(root/asset['path']).read_bytes()
    assert hashlib.sha256(data).hexdigest()==asset['sha256'], 'Effect source changed'
    effect_embedded[asset['id']]='data:image/png;base64,'+base64.b64encode(data).decode('ascii')
html = (root/'index.html').read_text()
html = html.replace('<head>', '<head><script>window.MAGE_EFFECT_EMBEDDED='+json.dumps(effect_embedded,separators=(',',':'))+';</script>')
html = re.sub(r'<link[^>]*href="style.css"[^>]*>', lambda _: '<style>\n'+(root/'style.css').read_text()+'\n</style>', html)
html = html.replace('<script src="js/config.js"></script>', '<script>window.MAGE_SKIN_EMBEDDED='+json.dumps(embedded,separators=(',',':'))+';</script>\n<script src="js/config.js"></script>')
for name in ['config','items','skills','game']:
    html = html.replace('<script src="js/'+name+'.js"></script>','<script>\n'+(root/('js/'+name+'.js')).read_text()+'\n</script>')
(root/'START.html').write_text(html)
version='0.4.3'
out=root.parent/('MageRising_v'+version+'.zip')
temporary=out.with_suffix('.zip.tmp')
with zipfile.ZipFile(temporary,'w',zipfile.ZIP_DEFLATED) as archive:
    for path in sorted(root.rglob('*')):
        if path.is_file() and '__pycache__' not in path.parts:
            archive.write(path,Path('MageRising')/path.relative_to(root))
with zipfile.ZipFile(temporary) as archive:
    assert archive.testzip() is None
temporary.replace(out)
print(out)
print('Existing image bytes reused; '+str(out.stat().st_size)+' bytes')
