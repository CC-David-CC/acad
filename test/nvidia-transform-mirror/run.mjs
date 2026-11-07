import fs from 'node:fs';
import {pathToFileURL} from 'node:url';
const path=process.argv[2],mode=['extended','mirror','tolerance'].includes(process.argv[3])?process.argv[3]:Number(process.argv[3]);
if(!path||(!['extended','mirror','tolerance'].includes(mode)&&(!Number.isInteger(mode)||mode<0||mode>7)))throw Error('Usage: node run.mjs /absolute/path/probe.mjs mode0to7|extended|mirror|tolerance');
const factory=(await import(pathToFileURL(path).href)).default;
const instance=await factory({wasmBinary:fs.readFileSync(path.replace(/\.mjs$/,'.wasm'))});
process.exitCode=['extended','mirror','tolerance'].includes(mode)?instance._run_extended(mode==='mirror'?1:mode==='tolerance'?2:0):instance._run_probe(mode);
