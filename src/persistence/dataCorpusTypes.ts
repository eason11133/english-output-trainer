export type CorpusUsageScope='PRODUCTION_OK'|'PRODUCTION_OK_WITH_ATTRIBUTION'|'SHAREALIKE_ISOLATED'|'RESEARCH_ONLY'|'USER_PRIVATE'|'DISCOVERY_ONLY'|'QUARANTINED'|'REJECTED'|'UNKNOWN';
export type CorpusLicenseStatus='VERIFIED_PRODUCTION_ALLOWED'|'VERIFIED_INTERNAL_ONLY'|'ATTRIBUTION_REQUIRED'|'REDISTRIBUTION_RESTRICTED'|'LICENSE_UNKNOWN'|'QUARANTINED'|'REJECTED';
export type CorpusUsageContext='INTERNAL_RESEARCH'|'LEARNER_PRODUCTION'|'GENERATION_SEED'|'USER_PRIVATE_SESSION';
export type CorpusSourceKind='OPEN_DATASET'|'WEBSITE'|'GITHUB'|'BOOK'|'SCHOOL_MATERIAL'|'CRAM_SCHOOL'|'USER_UPLOAD'|'RESEARCH_CORPUS'|'OTHER';
export type MaterialRole='ORIGINAL'|'HANDWRITTEN'|'TEACHER_ANNOTATION'|'LEARNER_ANSWER';
export type PrivacyScope='PUBLIC'|'ORGANIZATION_PRIVATE'|'USER_PRIVATE';

export interface CorpusProvenanceV1 {sourceId:string;sourceVersion:string;sourceRecordId:string;licenseName:string;licenseStatus:CorpusLicenseStatus;usageScope:CorpusUsageScope;attributionText:string;attributionRequired:boolean}
export interface CorpusSenseV1 {senseId:string;pos:string;glosses:readonly string[];relations:readonly {type:string;targetId:string}[];provenance:CorpusProvenanceV1}
export interface CorpusMorphologyV1 {lemma:string;form:string;features:readonly string[];provenance:CorpusProvenanceV1}
export type CorpusRecordEligibilityV1='PRODUCTION_ALLOWED'|'ATTRIBUTION_REQUIRED'|'INTERNAL_ONLY'|'QUARANTINED'|'REJECTED'|'UNKNOWN';
export interface CorpusSentenceV1 {id:string;language:'eng'|'cmn'|string;text:string;contributor?:string;recordLicense:string;eligibility:CorpusRecordEligibilityV1;provenance:CorpusProvenanceV1}
export interface CorpusSentencePairV1 {english:CorpusSentenceV1;chinese:CorpusSentenceV1;pairProvenance:CorpusProvenanceV1}
export interface CorpusExampleV1 {exampleId:string;text:string;language:string;lemma:string;pos:string;synsetId:string;targetOccurrence?:{start:number;length:number};learnerDisplayEligible:boolean;provenance:CorpusProvenanceV1}
export type CorpusResourceTypeV1='LEMMA_SENSES'|'MORPHOLOGY'|'SENTENCE_PAIRS'|'EXAMPLES';
export interface CorpusDataQueryV1 {requestedResourceType:CorpusResourceTypeV1;targetRefs?:readonly string[];lemma?:string;surfaceForm?:string;pos?:string;senseId?:string;language?:string;constraints?:Readonly<Record<string,string|number|boolean>>;context?:string;sourcePolicy?:{includeSourceIds?:readonly string[];excludeSourceIds?:readonly string[]};usagePolicy:CorpusUsageContext;limit:number}
export interface CorpusDataResultV1<T> {records:readonly T[];provenance:readonly CorpusProvenanceV1[];sourceVersions:readonly {sourceId:string;version:string}[];licenseStatus:'ALL_ALLOWED'|'ATTRIBUTION_REQUIRED'|'NO_USABLE_RESULTS';qualitySignals:readonly string[];retrievalReason:string}
export interface CorpusLemmaLookupV1 {lemma:string;senses:readonly CorpusSenseV1[];morphology:readonly CorpusMorphologyV1[];frequency:readonly {metric:string;value:number;provenance:CorpusProvenanceV1}[]}
export interface PrivateMaterialSourceV1 {sourceKind:'BOOK'|'SCHOOL_MATERIAL'|'CRAM_SCHOOL'|'USER_UPLOAD';sourceTitle:string;page?:string;ownerPublisher?:string;materialRole:MaterialRole;privacyScope:PrivacyScope;usageScope:'USER_PRIVATE'}

const productionScopes:readonly CorpusUsageScope[]=['PRODUCTION_OK','PRODUCTION_OK_WITH_ATTRIBUTION','SHAREALIKE_ISOLATED'];
export function corpusScopeAllowedV1(scope:CorpusUsageScope,context:CorpusUsageContext){
  if(context==='INTERNAL_RESEARCH')return scope!=='USER_PRIVATE';
  if(context==='USER_PRIVATE_SESSION')return scope==='USER_PRIVATE'||productionScopes.includes(scope);
  return productionScopes.includes(scope);
}
