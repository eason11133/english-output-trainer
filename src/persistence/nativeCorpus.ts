export * from './nativeCorpusCore';
import type { NativeCorpusStateV1 } from './nativeCorpusCore';
export const nativeCorpusServiceV1={async get():Promise<NativeCorpusStateV1>{return{status:'UNAVAILABLE',code:'UNSUPPORTED_PLATFORM',learnerMessage:'查詢內容暫時無法使用。'}}};
