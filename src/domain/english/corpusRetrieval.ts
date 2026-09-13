import type {CorpusDataQueryV1,CorpusDataResultV1,CorpusExampleV1,CorpusLemmaLookupV1,CorpusMorphologyV1,CorpusSentencePairV1,CorpusUsageContext} from '../../persistence/dataCorpusTypes';

/** Source-independent read boundary. Implementations may use SQLite locally or a server DB. */
export interface EnglishCorpusRetrievalPortV1 {
  query<T=CorpusLemmaLookupV1|CorpusMorphologyV1|CorpusSentencePairV1|CorpusExampleV1>(query:CorpusDataQueryV1):Promise<CorpusDataResultV1<T>>;
  lookupLemma(lemma:string,context:CorpusUsageContext):Promise<CorpusLemmaLookupV1>;
  lookupMorphology(form:string,context:CorpusUsageContext):Promise<readonly CorpusMorphologyV1[]>;
  lookupSentencePairs(query:string,context:CorpusUsageContext,limit?:number):Promise<readonly CorpusSentencePairV1[]>;
}
