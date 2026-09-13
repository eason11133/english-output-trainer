import * as Crypto from 'expo-crypto';
import { canonicalJsonV1 } from './canonicalJson';

export { canonicalJsonV1 } from './canonicalJson';
export async function fingerprintV1(value:unknown){return Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256,canonicalJsonV1(value))}
export function createOperationalIdV1(prefix:string){return `${prefix}_${Crypto.randomUUID()}`}
