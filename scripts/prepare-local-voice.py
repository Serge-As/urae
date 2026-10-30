"""Reproducible optional voice assets; never called by a user's browser.

Pinned upstream bytes are checked before packaging. Downloaded source archives
stay outside public/. No executable extraction or user data is involved.
"""
from pathlib import Path
import base64, gzip, hashlib, io, json, os, re, subprocess, sys, tarfile, urllib.request, zipfile

root=Path(__file__).resolve().parents[1]
lock=json.loads((root/'apps/web/voice-engine.lock.json').read_text(encoding='utf-8'))
vendor=root/'apps/web/vendor/voice'; vendor.mkdir(parents=True,exist_ok=True)
cache=root/'.cache/optional-voice'; cache.mkdir(parents=True,exist_ok=True)
digest=lambda b:hashlib.sha256(b).hexdigest()
ready=vendor/'manifest.json'
if ready.exists():
 manifest=json.loads(ready.read_text(encoding='utf-8'))
 if manifest.get('packagingVersion')==5 and manifest.get('sourceSha256')==lock['model']['sha256'] and (vendor/'LICENSE.txt').exists() and all((vendor/a['path']).exists() and digest((vendor/a['path']).read_bytes())==a['sha256'] for a in manifest['assets']):
  print('Optional local voice assets verified:',len(manifest['assets']),flush=True);sys.exit(0)

def source(spec,file,override=None):
 for p in [Path(override) if override else cache/file,cache/file]:
  if p.exists():
   b=p.read_bytes()
   if len(b)==spec['bytes'] and digest(b)==spec['sha256']:return b
 errors=[]
 for url in [spec['source'],spec.get('mirror')]:
  if not url:continue
  try:
   print('Fetching pinned optional voice asset:',spec.get('name'),flush=True)
   temporary=cache/(file+'.download')
   if os.name=='nt':
    subprocess.run(['curl.exe','--ssl-revoke-best-effort','--fail','--silent','--show-error','--location','--max-time','600',url,'--output',str(temporary)],check=True,timeout=610)
    b=temporary.read_bytes()
   else:
    with urllib.request.urlopen(url,timeout=120)as response:b=response.read()
   if len(b)!=spec['bytes'] or digest(b)!=spec['sha256']:raise RuntimeError('VOICE_ASSET_INTEGRITY_MISMATCH')
   (cache/file).write_bytes(b);return b
  except Exception as e:errors.append(str(e))
 raise RuntimeError('OPTIONAL_VOICE_BUILD_UNAVAILABLE: '+str(errors))

engine=source(lock['engine'],'vosk.js',os.getenv('ECO_VOICE_ENGINE_SOURCE'))
text=engine.decode('utf-8');match=re.search(r'createBase64WorkerFactory\(\s*[\'"]([A-Za-z0-9+/=]{1000,})',text)
if not match:raise RuntimeError('VOSK_WORKER_ANCHOR_MISSING')
worker=base64.b64decode(match[1]).decode('utf-8')
old='const storagePath = "/vosk";'
if worker.count(old)!=1:raise RuntimeError('VOSK_STORAGE_ANCHOR_MISSING')
worker=worker.replace(old,'const storagePath = "'+lock['storage']['database']+'";')
old='const modelPath = storagePath + "/" + modelUrl.replace(/[\\W]/g, "_");'
if worker.count(old)!=1:raise RuntimeError('VOSK_MODEL_DIRECTORY_ANCHOR_MISSING')
worker=worker.replace(old,'const modelPath = storagePath + "/'+lock['storage']['modelDirectory']+'";')
# Tag only the explicit flush response. Earlier queued result events must not
# truncate the last sentence when the user presses Stop.
start=worker.index('retrieveFinalResult(recognizerId) {')
end=worker.index('removeRecognizer(recognizerId) {',start)
segment=worker[start:end]
if segment.count('event: "result",')!=1:raise RuntimeError('VOSK_FINAL_RESULT_ANCHOR_MISSING')
worker=worker[:start]+segment.replace('event: "result",','event: "result", final: true,')+worker[end:]
# The Emscripten bindings use dynamic JavaScript internally. Serve this isolated
# worker with its own narrow CSP instead of weakening the document's CSP, which
# a blob worker would inherit. The engine no longer duplicates its worker bytes.
factory='return new Worker(url, options);'
if text.count(factory)!=1:raise RuntimeError('VOSK_WORKER_FACTORY_ANCHOR_MISSING')
patched=(text[:match.start(1)]+text[match.end(1):]).replace(factory,'return new Worker("/vendor/voice/worker.js", options);').encode('utf-8')
(vendor/'worker.js').write_bytes(worker.encode('utf-8'))
(vendor/'vosk.js').write_bytes(patched)
model=source(lock['model'],'model-fr.zip',os.getenv('ECO_VOICE_MODEL_SOURCE'))
archive=io.BytesIO()
with gzip.GzipFile(fileobj=archive,mode='wb',filename='',mtime=0,compresslevel=6)as gz:
 with tarfile.open(fileobj=gz,mode='w|',format=tarfile.USTAR_FORMAT)as tar:
  with zipfile.ZipFile(io.BytesIO(model))as z:
   for name in sorted(z.namelist()):
    if not name.startswith(lock['model']['name']+'/') or '..' in name.split('/') or name.startswith('/'):raise RuntimeError('UNEXPECTED_VOICE_MODEL_PATH')
    info=tarfile.TarInfo(name);info.mtime=0
    if name.endswith('/'):
     # libarchive otherwise synthesizes inaccessible 0644 parent directories.
     # Explicit traversable directories are required by IDBFS reconciliation.
     info.type=tarfile.DIRTYPE;info.mode=0o755;tar.addfile(info)
    else:
     b=z.read(name);info.size=len(b);info.mode=0o644;tar.addfile(info,io.BytesIO(b))
packed=archive.getvalue();assets=[{'path':'vosk.js','bytes':len(patched),'sha256':digest(patched)},{'path':'worker.js','bytes':len(worker.encode('utf-8')),'sha256':digest(worker.encode('utf-8'))}]
for i,start in enumerate(range(0,len(packed),8*1024*1024)):
 b=packed[start:start+8*1024*1024];name='model-fr-part-'+str(i).zfill(2)+'.bin';(vendor/name).write_bytes(b);assets.append({'path':name,'bytes':len(b),'sha256':digest(b)})
manifest={'packagingVersion':5,'protocol':lock['protocol'],'sourceSha256':lock['model']['sha256'],'engineVersion':lock['engine']['version'],'model':lock['model']['name'],'language':'fr-FR','archiveBytes':len(packed),'archiveSha256':digest(packed),'assets':assets,'onDemandOnly':True,'audioTransfer':False,'storage':lock['storage'],'physicalBenchmark':'NOT_ACCEPTED'}
ready.write_text(json.dumps(manifest,indent=2)+'\n',encoding='utf-8')
(vendor/'NOTICE.txt').write_text('Vosk API / vosk-browser 0.0.8 and vosk-model-small-fr-0.22. Apache-2.0.\nhttps://github.com/ccoreilly/vosk-browser\nhttps://alphacephei.com/vosk/models\nEco patches: separate model-only IndexedDB mount, stable directory, explicit final-result tag, and separate worker asset with a scoped CSP.\nUpstream model and acoustic recognition unchanged. No audio leaves the device.\n',encoding='utf-8')
(vendor/'LICENSE.txt').write_bytes((root/'docs/licenses/Apache-2.0.txt').read_bytes())
print('Optional local voice packaged:',len(assets),'assets;',len(packed),'model bytes',flush=True)
