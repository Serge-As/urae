import {spawnSync}from'node:child_process';
const python=process.env.PYTHON||(process.platform==='win32'?'python':'python3');
const result=spawnSync(python,['scripts/prepare-local-voice.py'],{stdio:'inherit',windowsHide:true});
if(result.status!==0)throw Error('OPTIONAL_VOICE_BUILD_FAILED');
