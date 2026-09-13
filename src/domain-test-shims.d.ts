declare module '@react-native-async-storage/async-storage' {
  const AsyncStorage: {
    getItem(key:string):Promise<string|null>;
    setItem(key:string,value:string):Promise<void>;
    removeItem(key:string):Promise<void>;
  };
  export default AsyncStorage;
}
declare module 'expo-crypto' {
  export enum CryptoDigestAlgorithm { SHA256 = 'SHA-256' }
  export function digestStringAsync(algorithm: CryptoDigestAlgorithm | string, data: string): Promise<string>;
  export function randomUUID(): string;
}
