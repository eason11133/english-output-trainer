import AsyncStorage from'@react-native-async-storage/async-storage';import{randomUUID}from'expo-crypto';
const KEY='eot:private-beta:anonymous-install-id:v1';
export async function anonymousInstallIdV1(){const current=await AsyncStorage.getItem(KEY);if(current)return current;const created=`install_${randomUUID()}`;await AsyncStorage.setItem(KEY,created);return created}
export const ANONYMOUS_INSTALL_TELEMETRY_IDENTITY_V1='OPAQUE_LOCAL_INSTALL_ID' as const;
