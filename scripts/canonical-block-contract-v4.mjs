import {readFileSync} from 'node:fs';
const path=new URL('../shared/block-contract-v4.generated.json',import.meta.url);
export const registeredBlockContractV4=Object.freeze(JSON.parse(readFileSync(path,'utf8')));
