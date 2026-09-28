import AsyncStorage from'@react-native-async-storage/async-storage';import*as ExpoCrypto from'expo-crypto';
const KEY='eot:private-beta:anonymous-install-id:v1';
async function opaqueId(){const browserCrypto=globalThis.crypto as Crypto|undefined;if(typeof browserCrypto?.randomUUID==='function')return browserCrypto.randomUUID();const bytes=await ExpoCrypto.getRandomBytesAsync(16);return[...bytes].map(value=>value.toString(16).padStart(2,'0')).join('')}
export async function anonymousInstallIdV1(){const current=await AsyncStorage.getItem(KEY);if(current)return current;const created=`install_${await opaqueId()}`;await AsyncStorage.setItem(KEY,created);return created}
export const ANONYMOUS_INSTALL_TELEMETRY_IDENTITY_V1='OPAQUE_LOCAL_INSTALL_ID' as const;
