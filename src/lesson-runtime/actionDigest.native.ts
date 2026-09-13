import * as Crypto from 'expo-crypto';

export function sha256HexV1(value:string):Promise<string>{return Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256,value)}
