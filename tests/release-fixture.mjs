import {readFileSync} from 'node:fs';
export const currentRelease=JSON.parse(readFileSync(new URL('../docs/release/CURRENT_RELEASE_CONTRACT.json',import.meta.url),'utf8')).release;
export const currentQuery=currentRelease.version.split('-')[0].replaceAll('.','');
