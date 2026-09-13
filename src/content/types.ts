import type { CapabilityFacet } from '../domain/english/EnglishDomain';

export interface WritingTaskSourceViewV1{
  sourceRef:string;
  promptText:string;
  audience:string;
  genre:string;
}
export interface WritingTaskGenerationNeedV1{
  targetRef:string;
  facet:CapabilityFacet;
  writingFunction:string;
  purpose:'FRESH_CHECK'|'CHANGED_CONTEXT_TRANSFER'|'ACTIVE_PRACTICE';
  audience:string;
  genre:string;
  desiredContextDistance:'SAME_FUNCTION_NEW_CONTENT'|'CHANGED_AUDIENCE'|'CHANGED_TOPIC'|'CHANGED_DISCOURSE_POSITION';
  targetNameVisible:boolean;
  functionCueVisible:boolean;
  planningSupportAllowed:boolean;
  recentModelPrimeAllowed:boolean;
  responseScope:'SENTENCE'|'PARAGRAPH'|'SHORT_TEXT';
  validAlternatives:'ACCEPT';
  semanticRequirements:readonly string[];
  forbiddenReuse:readonly string[];
  observationWanted:string;
}
export interface WritingDeliveredTaskV1{
  taskId:string;
  promptText:string;
  targetRef:string;
  facet:CapabilityFacet;
  purpose:'FRESH_CHECK'|'CHANGED_CONTEXT_TRANSFER';
  desiredContextDistance:WritingTaskGenerationNeedV1['desiredContextDistance'];
  contextNovelty:'SAME_CONTEXT'|'CHANGED_CONTEXT';
  contextKey:string;
  generationRef:string;
  semanticRequirements:readonly string[];
  deliveredAt:string;
  consumedAt?:string;
  validated:true;
  validatorRefs:readonly string[];
  load:GeneratedTaskLoadV1;
}
export type GeneratedContentProvenanceV1='CURATED_PACK'|'TEMPLATE'|'AI_PROPOSAL';
export type GeneratedTaskValidationStatusV1='PENDING'|'VALIDATED'|'REJECTED';
export interface GeneratedTaskLoadV1{length:'LOW'|'MEDIUM'|'HIGH';reasoning:'LOW'|'MEDIUM'|'HIGH';ideaGeneration:'LOW'|'MEDIUM'|'HIGH';contentSupport:'NONE'|'LIGHT'|'STRONG';clauses:number}
export interface GeneratedWritingTaskCandidateV1{
  taskId:string;promptText:string;targetRef:string;facet:CapabilityFacet;purpose:WritingTaskGenerationNeedV1['purpose'];desiredContextDistance:WritingTaskGenerationNeedV1['desiredContextDistance'];contextNovelty:'SAME_CONTEXT'|'CHANGED_CONTEXT';contextKey:string;responseScope:WritingTaskGenerationNeedV1['responseScope'];validAlternatives:'ACCEPT';semanticRequirements:readonly string[];forbiddenReuse:readonly string[];targetNameVisible:boolean;functionCueVisible:boolean;planningSupportAllowed:boolean;recentModelPrimeAllowed:boolean;load:GeneratedTaskLoadV1;provenance:GeneratedContentProvenanceV1;contentRef:string;validationStatus:GeneratedTaskValidationStatusV1;validatorRefs:readonly string[];
}
export interface GeneratedTaskValidationResultV1{deliveryAllowed:boolean;errors:readonly string[];warnings:readonly string[];candidate:GeneratedWritingTaskCandidateV1}
export interface ValidatedWritingTaskV1{candidate:GeneratedWritingTaskCandidateV1;delivery:WritingDeliveredTaskV1;validation:GeneratedTaskValidationResultV1}


export interface TranslationTaskSourceViewV1{sourceRef:string;sourceText:string;sourceLanguage:'zh-TW';targetLanguage:'en'}
export interface TranslationTaskGenerationNeedV1{
  targetRef:string;facet:CapabilityFacet;purpose:'FRESH_CHECK'|'CHANGED_CONTEXT_TRANSFER'|'ACTIVE_PRACTICE';desiredContextDistance:'SAME_FUNCTION_NEW_CONTENT'|'CHANGED_TOPIC';targetNameVisible:boolean;functionCueVisible:boolean;recentModelPrimeAllowed:boolean;validAlternatives:'ACCEPT';semanticRequirements:readonly string[];forbiddenReuse:readonly string[];observationWanted:string;
}
export interface TranslationDeliveredTaskV1{taskId:string;sourceText:string;targetRef:string;facet:CapabilityFacet;purpose:'FRESH_CHECK'|'CHANGED_CONTEXT_TRANSFER';desiredContextDistance:TranslationTaskGenerationNeedV1['desiredContextDistance'];contextNovelty:'SAME_CONTEXT'|'CHANGED_CONTEXT';contextKey:string;generationRef:string;semanticRequirements:readonly string[];deliveredAt:string;consumedAt?:string;validated:true;validatorRefs:readonly string[];load:GeneratedTaskLoadV1}
export interface GeneratedTranslationTaskCandidateV1{taskId:string;sourceText:string;targetRef:string;facet:CapabilityFacet;purpose:TranslationTaskGenerationNeedV1['purpose'];desiredContextDistance:TranslationTaskGenerationNeedV1['desiredContextDistance'];contextNovelty:'SAME_CONTEXT'|'CHANGED_CONTEXT';contextKey:string;validAlternatives:'ACCEPT';semanticRequirements:readonly string[];forbiddenReuse:readonly string[];targetNameVisible:boolean;functionCueVisible:boolean;recentModelPrimeAllowed:boolean;load:GeneratedTaskLoadV1;provenance:GeneratedContentProvenanceV1;contentRef:string;validationStatus:GeneratedTaskValidationStatusV1;validatorRefs:readonly string[]}
export interface GeneratedTranslationTaskValidationResultV1{deliveryAllowed:boolean;errors:readonly string[];candidate:GeneratedTranslationTaskCandidateV1}
export interface ValidatedTranslationTaskV1{candidate:GeneratedTranslationTaskCandidateV1;delivery:TranslationDeliveredTaskV1;validation:GeneratedTranslationTaskValidationResultV1}

export type ContentDeliveryUseCaseV1='TEACH'|'GUIDED_PRACTICE'|'ACTIVE_PRACTICE'|'FRESH_CHECK'|'CHANGED_CONTEXT_TRANSFER'|'DELAYED_RETENTION';
export type ContentCoverageStatusV1='VALIDATED_DELIVERY_AVAILABLE'|'DATA_CANDIDATE_ONLY'|'NO_CONTENT'|'PURPOSE_NOT_SUPPORTED';
export type SemanticBindingStatusV1='SEMANTICALLY_BOUND'|'DATA_EXISTS_BUT_UNBOUND'|'NO_RELEVANT_DATA';
export interface SemanticBindingEvidenceV1{kind:'LEXEME_IDENTITY'|'SENSE_IDENTITY'|'WORD_FORM_IDENTITY'|'MORPHOLOGY_PATTERN'|'CURATED_SEMANTIC_REQUIREMENTS';sourceRef:string;explanation:string}
export interface ContentCoverageEntryV1{
  contentRef:string;
  sourceKind:'CURATED_PACK'|'CORPUS';
  targetRef:string;
  facet:CapabilityFacet;
  arena:'WRITING'|'TRANSLATION'|'LANGUAGE';
  supportedUseCases:readonly ContentDeliveryUseCaseV1[];
  context:{identity?:string;noveltyQualification:'VALIDATED_AT_DELIVERY'|'NOT_QUALIFIED'};
  load?:GeneratedTaskLoadV1;
  exposure:{answer:'NONE_IN_CONTENT'|'UNKNOWN';cue:'NEED_BOUND'|'UNKNOWN'};
  semanticRequirements:readonly string[];
  provenanceRefs:readonly string[];
  validatorRefs:readonly string[];
  productionEligibility:'DETERMINISTIC_VALIDATION_REQUIRED'|'DATA_CANDIDATE_ONLY';
  semanticBinding:SemanticBindingEvidenceV1;
  instructionalEligibility:readonly ('TEACH'|'GUIDED_PRACTICE')[];
  measurementEligibility:readonly ('ACTIVE_PRACTICE'|'FRESH_CHECK'|'CHANGED_CONTEXT_TRANSFER'|'DELAYED_RETENTION')[];
}
export interface CorpusSemanticBindingResultV1{status:SemanticBindingStatusV1;targetRef:string;facet:CapabilityFacet;entries:readonly ContentCoverageEntryV1[];evidence:readonly SemanticBindingEvidenceV1[];reasonCodes:readonly string[]}
export interface ContentCoverageQueryV1{targetRef:string;facet:CapabilityFacet;arena:'WRITING'|'TRANSLATION'|'LANGUAGE';useCase:ContentDeliveryUseCaseV1;dataCandidates?:readonly ContentCoverageEntryV1[]}
export interface ContentCoverageResultV1{status:ContentCoverageStatusV1;targetRef:string;facet:CapabilityFacet;arena:ContentCoverageQueryV1['arena'];useCase:ContentDeliveryUseCaseV1;entries:readonly ContentCoverageEntryV1[];reasonCodes:readonly string[]}
