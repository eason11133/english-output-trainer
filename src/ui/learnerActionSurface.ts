export type LearnerItem={id:string;label:string};
export type LearnerSpan={id:string;text:string};
type Base={id:string;taskId:string;instruction?:string};

export type ChoiceSurface=Base&{kind:'CHOICE';sentence:string;choices:readonly LearnerItem[];selectedAnswer?:string};
export type EvidenceSurface=Base&{kind:'EVIDENCE';passage:string;spans:readonly LearnerSpan[];single:boolean;selectedAnswer?:string};
export type MeaningContrastSurface=Base&{kind:'MEANING_CONTRAST';sentence:string;contrasts:readonly {id:string;word:string;meaning:string;example:string}[];selectedAnswer?:string};
export type SlotSurface=Base&{kind:'SLOT';sentence:string;blankId:string;candidates:readonly LearnerItem[];placed?:string};
export type ChunkBuildSurface=Base&{kind:'CHUNK_BUILD';tokens:readonly LearnerItem[]};
export type CollocationSurface=Base&{kind:'COLLOCATION';heads:readonly LearnerItem[];collocates:readonly LearnerItem[]};
export type WordBuildSurface=Base&{kind:'WORD_BUILD';original:string;pieces:readonly LearnerItem[]};
export type ReferenceTraceSurface=Base&{kind:'REFERENCE_TRACE';passage:string;reference:string;antecedents:readonly LearnerSpan[]};
export type InsertionSurface=Base&{kind:'INSERTION';passage:string;candidate:string;points:readonly LearnerItem[];placed?:string};
export type OrderSurface=Base&{kind:'ORDER';items:readonly LearnerItem[]};
export type SourceTraceSurface=Base&{kind:'SOURCE_TRACE';source:string;regions:readonly LearnerSpan[]};
export type SourceTransformSurface=Base&{kind:'SOURCE_TRANSFORM';source:string;selectedSource?:string;goal:string};
export type RecallSurface=Base&{kind:'RECALL';context:string;clues:readonly LearnerItem[]};
export type SpanRepairSurface=Base&{kind:'SPAN_REPAIR';authoredText:string;targetSpan:string;goal:string};
export type TranslationEditorSurface=Base&{kind:'TRANSLATION_EDITOR';sourceZh:string;authoredText:string;targetSpan?:string};
export type WritingEditorSurface=Base&{kind:'WRITING_EDITOR';prompt:string;authoredText:string;targetSpan?:string};
export type WritingDevelopmentSurface=Base&{kind:'WRITING_DEVELOPMENT';authoredText:string;targetSpan:string;missing:'REASON'|'EXAMPLE'|'SPECIFIC_DETAIL'};

export type LearnerActionSurface=ChoiceSurface|EvidenceSurface|MeaningContrastSurface|SlotSurface|ChunkBuildSurface|CollocationSurface|WordBuildSurface|ReferenceTraceSurface|InsertionSurface|OrderSurface|SourceTraceSurface|SourceTransformSurface|RecallSurface|SpanRepairSurface|TranslationEditorSurface|WritingEditorSurface|WritingDevelopmentSurface;
export type LearnerActionEvent={surfaceId:string;kind:'CHOICE'|'EVIDENCE'|'PLACEMENT'|'BUILD'|'MATCH'|'REFERENCE'|'ORDER'|'TRANSFORM'|'RECALL'|'REPAIR'|'DEVELOP';value:unknown};
