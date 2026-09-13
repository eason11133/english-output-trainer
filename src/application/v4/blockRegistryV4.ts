import { CapabilityFacet, EnglishFacet } from '../../domain/english/EnglishDomain';
import { LearningBlockDefinitionV4, PedagogicalRoleV4, TeacherBlockDecisionV4 } from '../../domain/v4/LearningBlockV4';

type Spec = {
  id: string; label: string; family: LearningBlockDefinitionV4['family'];
  interaction: LearningBlockDefinitionV4['interaction']; facet: CapabilityFacet;
  role: PedagogicalRoleV4; action: string; mechanism?: string; teaches?: boolean;
  exposes?: boolean; ceiling?: LearningBlockDefinitionV4['evidenceCeiling'];
  disposition?: LearningBlockDefinitionV4['auditDisposition']; objectiveBound?:boolean;
  context?:LearningBlockDefinitionV4['contextAffordance'];
};

const originalSpecs: Spec[] = [
  {id:'meaning-match',label:'Meaning Match',family:'MEANING_LEXICAL',interaction:'MATCH',facet:'FORM_TO_MEANING',role:'PRACTICE',action:'match forms to meanings',ceiling:'ASSISTED'},
  {id:'context-meaning-choice',label:'Context Meaning Choice',family:'MEANING_LEXICAL',interaction:'SELECT',facet:'SENSE_DISCRIMINATION',role:'ASSESS',action:'select a meaning from context',ceiling:'CONTROLLED'},
  {id:'meaning-word-retrieval',label:'Meaning-to-Word Retrieval',family:'MEANING_LEXICAL',interaction:'TYPE',facet:'MEANING_TO_RETRIEVAL',role:'ASSESS',action:'retrieve a word from meaning',ceiling:'INDEPENDENT'},
  {id:'word-meaning-check',label:'Word-to-Meaning Check',family:'MEANING_LEXICAL',interaction:'SELECT',facet:'FORM_TO_MEANING',role:'ASSESS',action:'recognize a word meaning',ceiling:'CONTROLLED'},
  {id:'sense-contrast',label:'Sense Contrast Practice',family:'MEANING_LEXICAL',interaction:'COMPARE',facet:'SENSE_DISCRIMINATION',role:'PRACTICE',action:'compare senses with guidance',ceiling:'ASSISTED',disposition:'RENAME'},
  {id:'collocation-match',label:'Collocation Match',family:'CHUNK_COLLOCATION',interaction:'MATCH',facet:'COLLOCATION',role:'PRACTICE',action:'match compatible collocates',ceiling:'ASSISTED'},
  {id:'chunk-builder',label:'Guided Chunk Builder',family:'CHUNK_COLLOCATION',interaction:'ORDER',facet:'COLLOCATION',role:'PRACTICE',action:'assemble a chunk from visible parts',exposes:true,ceiling:'ASSISTED',disposition:'RENAME'},
  {id:'chunk-completion',label:'Chunk Completion',family:'CHUNK_COLLOCATION',interaction:'TYPE',facet:'MEANING_TO_RETRIEVAL',role:'PRACTICE',action:'complete a partially visible chunk',exposes:true,ceiling:'ASSISTED'},
  {id:'naturalness-contrast',label:'Naturalness Recognition',family:'CHUNK_COLLOCATION',interaction:'COMPARE',facet:'CONTEXTUAL_APPROPRIACY',role:'ASSESS',action:'recognize the more natural expression',ceiling:'CONTROLLED',disposition:'RENAME'},
  {id:'phrase-reconstruction',label:'Phrase Reconstruction',family:'CHUNK_COLLOCATION',interaction:'RECONSTRUCT',facet:'CONTROLLED_PRODUCTION',role:'PRACTICE',action:'reconstruct a visible phrase',exposes:true,ceiling:'ASSISTED'},
  {id:'form-contrast',label:'Form–Meaning Mapping',family:'GRAMMAR_CONSTRUCTION',interaction:'COMPARE',facet:'FORM_MEANING_MAPPING',role:'TEACH',action:'step through form and meaning contrasts',teaches:true,exposes:true,ceiling:'EXPOSURE_ONLY',mechanism:'explicit interpretation of how form changes meaning',disposition:'RENAME'},
  {id:'role-builder',label:'Guided Role Builder',family:'GRAMMAR_CONSTRUCTION',interaction:'MOVE',facet:'CONSTRUCTION',role:'PRACTICE',action:'place visible parts into semantic roles',exposes:true,ceiling:'ASSISTED',disposition:'RENAME'},
  {id:'sentence-builder',label:'Guided Sentence Builder',family:'GRAMMAR_CONSTRUCTION',interaction:'ORDER',facet:'CONSTRUCTION',role:'PRACTICE',action:'reconstruct a sentence from visible pieces',exposes:true,ceiling:'ASSISTED',disposition:'RENAME'},
  {id:'slot-completion',label:'Slot Completion',family:'GRAMMAR_CONSTRUCTION',interaction:'TYPE',facet:'CONTROLLED_PRODUCTION',role:'PRACTICE',action:'fill a constrained construction slot',ceiling:'ASSISTED'},
  {id:'sentence-reorder',label:'Sentence Reorder',family:'GRAMMAR_CONSTRUCTION',interaction:'ORDER',facet:'CONSTRUCTION',role:'PRACTICE',action:'reorder visible sentence parts',exposes:true,ceiling:'ASSISTED'},
  {id:'construction-reconstruction',label:'Construction Reconstruction',family:'GRAMMAR_CONSTRUCTION',interaction:'RECONSTRUCT',facet:'CONTROLLED_PRODUCTION',role:'PRACTICE',action:'reconstruct a target construction',exposes:true,ceiling:'ASSISTED'},
  {id:'spelling-reconstruction',label:'Supported Spelling Reconstruction',family:'SPELLING_MORPHOLOGY',interaction:'RECONSTRUCT',facet:'ORTHOGRAPHIC_PRODUCTION',role:'PRACTICE',action:'rebuild spelling from visible letters',exposes:true,ceiling:'ASSISTED',disposition:'RENAME'},
  {id:'partial-letter-recall',label:'Partial Letter Recall',family:'SPELLING_MORPHOLOGY',interaction:'TYPE',facet:'ORTHOGRAPHIC_PRODUCTION',role:'PRACTICE',action:'recall missing letters with a frame',exposes:true,ceiling:'ASSISTED'},
  {id:'full-spelling-recall',label:'Unaided Spelling Recall',family:'SPELLING_MORPHOLOGY',interaction:'TYPE',facet:'ORTHOGRAPHIC_PRODUCTION',role:'ASSESS',action:'spell without visible answer material',ceiling:'INDEPENDENT',disposition:'RENAME'},
  {id:'word-family-builder',label:'Word Family Builder',family:'SPELLING_MORPHOLOGY',interaction:'MOVE',facet:'MORPHOLOGY',role:'PRACTICE',action:'build related forms from supplied morphemes',exposes:true,ceiling:'ASSISTED'},
  {id:'morphology-decomposition',label:'Morphology Decomposition Map',family:'SPELLING_MORPHOLOGY',interaction:'ORDER',facet:'MORPHOLOGY',role:'TEACH',action:'reveal meaningful word parts and relationships',teaches:true,exposes:true,ceiling:'EXPOSURE_ONLY',mechanism:'visual decomposition of form into meaningful morphemes',disposition:'RENAME'},
  {id:'clause-builder',label:'Guided Clause Builder',family:'WRITING_COMPOSITION',interaction:'ORDER',facet:'FREE_PRODUCTION',role:'PRACTICE',action:'assemble a clause from supplied meaning units',exposes:true,ceiling:'ASSISTED',disposition:'RENAME'},
  {id:'clause-connector',label:'Clause Relation Practice',family:'WRITING_COMPOSITION',interaction:'SELECT',facet:'CONSTRUCTION',role:'PRACTICE',action:'select language for a stated clause relation',ceiling:'ASSISTED',disposition:'RENAME'},
  {id:'sentence-expansion',label:'Supported Sentence Expansion',family:'WRITING_COMPOSITION',interaction:'TYPE',facet:'FREE_PRODUCTION',role:'PRACTICE',action:'expand a sentence with a scaffold',ceiling:'ASSISTED',disposition:'RENAME'},
  {id:'sentence-combining',label:'Guided Sentence Combining',family:'WRITING_COMPOSITION',interaction:'REWRITE',facet:'FREE_PRODUCTION',role:'PRACTICE',action:'combine sentences with guidance',ceiling:'ASSISTED',disposition:'RENAME'},
  {id:'rewrite-surface',label:'Guided Rewrite Surface',family:'WRITING_COMPOSITION',interaction:'REWRITE',facet:'FREE_PRODUCTION',role:'PRACTICE',action:'repair a local surface issue with support',ceiling:'ASSISTED',disposition:'RENAME'},
  {id:'local-revision',label:'Independent Local Revision',family:'WRITING_COMPOSITION',interaction:'REWRITE',facet:'FREE_PRODUCTION',role:'ASSESS',action:'revise a localized issue without answer leakage',ceiling:'INDEPENDENT',disposition:'RENAME'},
  {id:'cohesion-repair',label:'Guided Cohesion Repair',family:'WRITING_COMPOSITION',interaction:'REWRITE',facet:'FREE_PRODUCTION',role:'PRACTICE',action:'repair cohesion with relation cues',ceiling:'ASSISTED',disposition:'RENAME'},
  {id:'idea-ordering',label:'Idea Ordering Practice',family:'WRITING_COMPOSITION',interaction:'ORDER',facet:'FREE_PRODUCTION',role:'PRACTICE',action:'order supplied ideas into a coherent sequence',exposes:true,ceiling:'ASSISTED',disposition:'RENAME'},
  {id:'meaning-segmentation',label:'Meaning Segmentation Map',family:'TRANSLATION',interaction:'MOVE',facet:'FORM_MEANING_MAPPING',role:'TEACH',action:'reveal source meaning units before translation',teaches:true,exposes:true,ceiling:'EXPOSURE_ONLY',mechanism:'visual segmentation from source meaning to clause-sized units',disposition:'RENAME'},
  {id:'translation-chunk-builder',label:'Guided Translation Builder',family:'TRANSLATION',interaction:'ORDER',facet:'CONTROLLED_PRODUCTION',role:'PRACTICE',action:'assemble a translation from supplied chunks',exposes:true,ceiling:'ASSISTED',disposition:'RENAME'},
  {id:'alternative-translation-compare',label:'Reformulation Comparison',family:'TRANSLATION',interaction:'COMPARE',facet:'FORM_MEANING_MAPPING',role:'TEACH',action:'compare valid translations and their framing',teaches:true,exposes:true,ceiling:'EXPOSURE_ONLY',mechanism:'annotated comparison of meaning-preserving reformulations',disposition:'RENAME'},
  {id:'meaning-preservation-check',label:'Meaning Preservation Check',family:'TRANSLATION',interaction:'SELECT',facet:'FORM_MEANING_MAPPING',role:'ASSESS',action:'recognize whether source meaning is preserved',ceiling:'CONTROLLED'},
  {id:'independent-translation',label:'Independent Translation',family:'TRANSLATION',interaction:'TYPE',facet:'FREE_PRODUCTION',role:'ASSESS',action:'translate without supplied target wording',ceiling:'INDEPENDENT'},
  {id:'faded-recall',label:'Delayed Unaided Recall',family:'RETRIEVAL_TRANSFER',interaction:'TYPE',facet:'MEANING_TO_RETRIEVAL',role:'ASSESS',action:'retrieve after delay without target leakage',ceiling:'INDEPENDENT',disposition:'RENAME',objectiveBound:true,context:'DELAYED_CONTEXT'},
  {id:'contextual-production',label:'Independent Contextual Production',family:'RETRIEVAL_TRANSFER',interaction:'TYPE',facet:'CONTEXTUAL_APPROPRIACY',role:'ASSESS',action:'produce independently in the current context',ceiling:'INDEPENDENT',disposition:'RENAME'},
  {id:'changed-context-production',label:'Changed-Context Production',family:'RETRIEVAL_TRANSFER',interaction:'TYPE',facet:'CONSTRUCTION',role:'TRANSFER',action:'produce in a meaningfully changed context',ceiling:'TRANSFER',objectiveBound:true,context:'CHANGED_CONTEXT'},
  {id:'return-original-writing',label:'Return to Original Writing',family:'SYSTEM_ACTION',interaction:'SOURCE_RETURN',facet:'CONSTRUCTION',role:'TRANSFER',action:'revise the original learner writing',ceiling:'INDEPENDENT',objectiveBound:true,context:'SOURCE'},
  {id:'return-original-translation',label:'Return to Original Translation',family:'SYSTEM_ACTION',interaction:'SOURCE_RETURN',facet:'FREE_PRODUCTION',role:'TRANSFER',action:'revise the original learner translation',ceiling:'INDEPENDENT',objectiveBound:true,context:'SOURCE'},
  {id:'continue-source',label:'Continue Source Work',family:'SYSTEM_ACTION',interaction:'SYSTEM',facet:'CONSTRUCTION',role:'SYSTEM',action:'continue without intervention',ceiling:'NONE',context:'NOT_APPLICABLE'},
  {id:'clarify-context',label:'Clarify Context',family:'SYSTEM_ACTION',interaction:'SYSTEM',facet:'CONSTRUCTION',role:'SYSTEM',action:'resolve task or transcript context',ceiling:'NONE',context:'NOT_APPLICABLE'},
];

const readingTeachingSpecs: Spec[] = [
  {id:'inference-evidence-bridge',label:'Inference Evidence Bridge',family:'RETRIEVAL_TRANSFER',interaction:'SELECT',facet:'SELECTION',role:'TEACH',action:'learner marks premises and constructs the inference bridge without answer reveal',teaches:true,ceiling:'EXPOSURE_ONLY'},
  {id:'reference-chain',label:'Reference Chain',family:'RETRIEVAL_TRANSFER',interaction:'SELECT',facet:'FORM_TO_MEANING',role:'TEACH',action:'learner links references to antecedents',teaches:true,ceiling:'EXPOSURE_ONLY'},
  {id:'text-structure-map',label:'Text Structure Map',family:'RETRIEVAL_TRANSFER',interaction:'SELECT',facet:'SELECTION',role:'TEACH',action:'learner maps section relations',teaches:true,ceiling:'EXPOSURE_ONLY'},
  {id:'paragraph-function-map',label:'Paragraph Function Map',family:'RETRIEVAL_TRANSFER',interaction:'SELECT',facet:'SELECTION',role:'TEACH',action:'learner labels paragraph functions',teaches:true,ceiling:'EXPOSURE_ONLY'},
  {id:'sentence-insertion-continuity',label:'Sentence Insertion Continuity',family:'RETRIEVAL_TRANSFER',interaction:'SELECT',facet:'SELECTION',role:'TEACH',action:'learner checks backward and forward links',teaches:true,ceiling:'EXPOSURE_ONLY'},
  {id:'distractor-evidence-contrast',label:'Distractor Evidence Contrast',family:'RETRIEVAL_TRANSFER',interaction:'COMPARE',facet:'SELECTION',role:'TEACH',action:'learner contrasts options against passage evidence',teaches:true,ceiling:'EXPOSURE_ONLY'},
  {id:'claim-strength-contrast',label:'Claim Strength Contrast',family:'RETRIEVAL_TRANSFER',interaction:'COMPARE',facet:'SELECTION',role:'TEACH',action:'learner compares claim strength with licensed evidence',teaches:true,ceiling:'EXPOSURE_ONLY'},
  {id:'cross-representation-evidence-integration',label:'Cross-representation Evidence Integration',family:'RETRIEVAL_TRANSFER',interaction:'SELECT',facet:'SELECTION',role:'TEACH',action:'learner maps claims across representations',teaches:true,ceiling:'EXPOSURE_ONLY'},
];
const readingContinuationSpecs:Spec[]=[
  {id:'reading-evidence-operation',label:'Guided Reading Evidence Operation',family:'RETRIEVAL_TRANSFER',interaction:'SELECT',facet:'SELECTION',role:'PRACTICE',action:'apply the taught evidence relation to the current promoted Reading item without revealing the answer',ceiling:'ASSISTED',mechanism:'guided claim-to-evidence selection on canonical Reading content'},
  {id:'fresh-reading-check',label:'Fresh Independent Reading Check',family:'RETRIEVAL_TRANSFER',interaction:'SELECT',facet:'SELECTION',role:'ASSESS',action:'answer a materially fresh promoted Reading item using the same target relation without visible support',ceiling:'CONTROLLED',mechanism:'fresh answer-safe Reading verification on a different task identity'},
];

const newTeachingSpecs: Spec[] = [
  {id:'meaning-representation',label:'Meaning Representation',family:'MEANING_LEXICAL',interaction:'COMPARE',facet:'SENSE_DISCRIMINATION',role:'TEACH',action:'inspect a contextual semantic map',teaches:true,exposes:true,ceiling:'EXPOSURE_ONLY',mechanism:'core meaning, boundaries, examples, and non-examples'},
  {id:'grammar-role-map',label:'Grammar Role Map',family:'GRAMMAR_CONSTRUCTION',interaction:'MOVE',facet:'CONSTRUCTION',role:'TEACH',action:'map semantic roles onto a construction',teaches:true,exposes:true,ceiling:'EXPOSURE_ONLY',mechanism:'visual WHO–ACTION–RECIPIENT–INFINITIVE role mapping'},
  {id:'l1-collision',label:'L1 Collision',family:'GRAMMAR_CONSTRUCTION',interaction:'COMPARE',facet:'FORM_MEANING_MAPPING',role:'TEACH',action:'compare literal L1 mapping with English organization',teaches:true,exposes:true,ceiling:'EXPOSURE_ONLY',mechanism:'explicit L1-to-English structural collision'},
  {id:'chunk-as-unit',label:'Chunk as a Unit',family:'CHUNK_COLLOCATION',interaction:'MOVE',facet:'COLLOCATION',role:'TEACH',action:'inspect a reusable chunk across authentic frames',teaches:true,exposes:true,ceiling:'EXPOSURE_ONLY',mechanism:'group a multiword expression into one production unit'},
  {id:'collocation-network',label:'Collocation Network',family:'CHUNK_COLLOCATION',interaction:'MATCH',facet:'COLLOCATION',role:'TEACH',action:'explore a word and its compatible collocates',teaches:true,exposes:true,ceiling:'EXPOSURE_ONLY',mechanism:'visual network of natural combinations and incompatible edges'},
  {id:'sentence-anatomy',label:'Sentence Anatomy',family:'WRITING_COMPOSITION',interaction:'MOVE',facet:'CONSTRUCTION',role:'TEACH',action:'inspect learner meaning by clause roles',teaches:true,exposes:true,ceiling:'EXPOSURE_ONLY',mechanism:'visual WHO–DOES WHAT–OBJECT–RELATION segmentation'},
  {id:'reformulation-map',label:'Reformulation Map',family:'WRITING_COMPOSITION',interaction:'COMPARE',facet:'CONTEXTUAL_APPROPRIACY',role:'TEACH',action:'compare related expressions and framing differences',teaches:true,exposes:true,ceiling:'EXPOSURE_ONLY',mechanism:'meaning-preserving reformulation with usage boundaries'},
  {id:'cohesion-relation-map',label:'Cohesion / Relation Map',family:'WRITING_COMPOSITION',interaction:'MATCH',facet:'FORM_MEANING_MAPPING',role:'TEACH',action:'map idea relations before choosing language',teaches:true,exposes:true,ceiling:'EXPOSURE_ONLY',mechanism:'CAUSE–RESULT–CONTRAST–ADDITION discourse visualization'},
  {id:'task-requirement-map',label:'Task Requirement Map',family:'WRITING_COMPOSITION',interaction:'MATCH',facet:'CONTEXTUAL_APPROPRIACY',role:'TEACH',action:'map prompt requirements to the learner own writing and identify the first missing requirement',teaches:true,ceiling:'EXPOSURE_ONLY',mechanism:'requirement-to-response mapping without supplying missing content'},
  {id:'idea-development-ladder',label:'Idea Development Ladder',family:'WRITING_COMPOSITION',interaction:'TYPE',facet:'FREE_PRODUCTION',role:'TEACH',action:'extend one learner-owned claim with the next needed why, mechanism, example, or link-back move',teaches:true,ceiling:'EXPOSURE_ONLY',mechanism:'CLAIM to WHY to EXAMPLE-or-MECHANISM to LINK-BACK as an adaptive scaffold, not a mandatory template'},
  {id:'worked-transformation',label:'Worked Transformation',family:'WRITING_COMPOSITION',interaction:'REWRITE',facet:'CONSTRUCTION',role:'TEACH',action:'step through a learner sentence transformation',teaches:true,exposes:true,ceiling:'EXPOSURE_ONLY',mechanism:'worked stages from learner output to underlying pattern and repair'},
];
const supplementalPhaseSpecs:Spec[]=[
  {id:'independent-sentence-production',label:'Independent Sentence Production',family:'GRAMMAR_CONSTRUCTION',interaction:'TYPE',facet:'CONSTRUCTION',role:'ASSESS',action:'produce a construction from meaning without visible target wording',ceiling:'INDEPENDENT',mechanism:'fresh open production under answer-safe assessment conditions'},
  {id:'return-source-navigation',label:'Return to Source Navigation',family:'SYSTEM_ACTION',interaction:'SYSTEM',facet:'CONSTRUCTION',role:'SYSTEM',action:'navigate back to the immutable original artifact without creating a learning opportunity',ceiling:'NONE',mechanism:'system-owned source navigation with no capability evidence',context:'NOT_APPLICABLE'},
];

function definition(spec: Spec): LearningBlockDefinitionV4 {
  const evidenceAllowed = spec.ceiling !== 'NONE' && spec.ceiling !== 'EXPOSURE_ONLY';
  return {
    id:spec.id,label:spec.label,family:spec.family,interaction:spec.interaction,role:spec.role,
    learnerAction:spec.action,genuineTeaching:spec.teaches??false,exposesTargetAnswer:spec.exposes??false,
    version:2,status:'REVIEW',mechanism:spec.mechanism??`${spec.interaction.toLowerCase()} practice for ${spec.facet.toLowerCase()}`,
    selectionBelief:spec.role==='TEACH'?'Teacher has grounded reason to believe the learner lacks the underlying representation':spec.role==='ASSESS'?'the target is ready for a fresh, minimally supported check':spec.role==='TRANSFER'?'source control is ready to verify in authentic or changed context':spec.role==='SYSTEM'?'no learning activity is pedagogically warranted':'instruction exists and the learner needs supported control',
    learnerGain:spec.role==='TEACH'?`a usable representation of ${spec.facet.toLowerCase()}`:`perform ${spec.action}`,
    suitableFacets:[spec.facet],capabilityAffordance:evidenceAllowed?'OBJECTIVE_BOUND':'NONE',contextAffordance:spec.context??(spec.role==='SYSTEM'?'NOT_APPLICABLE':'SAME_CONTEXT'),inappropriateWhen:['target or learner intent is unresolved','task cannot afford the intended evidence'],
    contentBindings:['prompt','targetReference','validated TaskContract content','source context when required'],
    supportLevels:spec.role==='ASSESS'?['LIGHT','NONE']:spec.role==='SYSTEM'?['NONE']:['MODELED','EXPLICIT','GUIDED','CUED','LIGHT','NONE'],
    forbiddenSupport:spec.role==='ASSESS'?['MODELED','EXPLICIT','GUIDED','CUED']:[],
    revealRules:['reveal only through SUPPORT_REVEALED','record everything visible before response'],
    fadeRules:['reduce support one registered level at a time','require a fresh unsupported opportunity for independent evidence'],
    successStates:[spec.role==='TEACH'?'learner completes the instructional progression':'target-valid response under recorded conditions'],failureStates:['target-invalid response','abandonment'],
    retryBehavior:spec.role==='ASSESS'?'exit assessment or route to practice/teaching; do not reveal the answer in-place':'retry with a recorded support or mechanism change',
    exitConditions:['objective satisfied for now','return requested','time box reached'],
    nextBlockIds:spec.role==='TEACH'?['sentence-builder','slot-completion','contextual-production']:spec.role==='PRACTICE'?['contextual-production','local-revision','return-original-writing']:spec.role==='ASSESS'?['return-original-writing','changed-context-production']:[],
    eligibleClaims:[],
    forbiddenClaims:[],
    evidenceCeiling:spec.ceiling??'ASSISTED',taskConditions:spec.role==='ASSESS'?['fresh opportunity','no target answer visible before response','TaskContract permits the exact claim']:['validated content binding'],
    successDoesNotProve:spec.role==='TEACH'?['capability','independent production','transfer']:spec.role==='PRACTICE'?['independent production unless a fresh unsupported opportunity follows']:spec.role==='ASSESS'?['transfer or retention unless those conditions are explicit']:['mastery'],
    sourceImplication:spec.role==='TRANSFER'?'source and changed-context outcomes remain separately identified':'source interaction is local evidence only',
    transferImplication:spec.role==='TRANSFER'?'may afford transfer only when context novelty and TaskContract agree':'does not establish transfer',
    accessibility:['44px minimum targets','screen-reader labels','keyboard operable','do not rely on color alone'],auditDisposition:spec.disposition??'REMAIN',
  };
}

const registry = new Map<string,LearningBlockDefinitionV4>([...originalSpecs,...readingTeachingSpecs,...readingContinuationSpecs,...newTeachingSpecs,...supplementalPhaseSpecs].map(spec=>{const block=definition(spec);return[block.id,block]}));
const intentRole=(intent:TeacherBlockDecisionV4['pedagogicalIntent']):PedagogicalRoleV4=>intent==='RETURN'?'TRANSFER':intent;
export const originalBlockAuditV4=originalSpecs.map(spec=>definition(spec));
export interface ProviderBlockContractEntryV4{
  id:string;role:PedagogicalRoleV4;suitableFacets:readonly EnglishFacet[];capabilityAffordance:LearningBlockDefinitionV4['capabilityAffordance'];contextAffordance:LearningBlockDefinitionV4['contextAffordance'];evidenceCeiling:LearningBlockDefinitionV4['evidenceCeiling'];supportLevels:readonly LearningBlockDefinitionV4['supportLevels'][number][];forbiddenSupport:readonly LearningBlockDefinitionV4['forbiddenSupport'][number][];exposesTargetAnswer:boolean;
}
export interface ProviderBlockContractV4{schemaVersion:1;registryVersion:'4.2.0';fingerprint:string;blocks:readonly ProviderBlockContractEntryV4[]}
const providerEntriesV4=():readonly ProviderBlockContractEntryV4[]=>Object.freeze([...registry.values()].map(block=>Object.freeze({id:block.id,role:block.role,suitableFacets:Object.freeze([...block.suitableFacets]),capabilityAffordance:block.capabilityAffordance,contextAffordance:block.contextAffordance,evidenceCeiling:block.evidenceCeiling,supportLevels:Object.freeze([...block.supportLevels]),forbiddenSupport:Object.freeze([...block.forbiddenSupport]),exposesTargetAnswer:block.exposesTargetAnswer})).sort((a,b)=>a.id.localeCompare(b.id)));
const stableContractFingerprintV4=(entries:readonly ProviderBlockContractEntryV4[])=>{let hash=0x811c9dc5;const text=JSON.stringify(entries);for(let i=0;i<text.length;i++){hash^=text.charCodeAt(i);hash=Math.imul(hash,0x01000193)>>>0}return`fnv1a32:${hash.toString(16).padStart(8,'0')}`};
export const providerBlockContractV4=():ProviderBlockContractV4=>{const blocks=providerEntriesV4();return Object.freeze({schemaVersion:1,registryVersion:'4.2.0',fingerprint:stableContractFingerprintV4(blocks),blocks})};
export const blockRegistryV4={all:()=>[...registry.values()],byRole:(role:PedagogicalRoleV4)=>[...registry.values()].filter(block=>block.role===role),get:(id:string)=>registry.get(id),register:(block:LearningBlockDefinitionV4)=>{if(registry.has(block.id))throw new Error('block id already registered');registry.set(block.id,block)},providerContract:providerBlockContractV4};
export function validateTeacherBlockDecisionV4(decision:TeacherBlockDecisionV4):string[]{const block=registry.get(decision.selectedBlockId),errors:string[]=[];if(!block)errors.push('unknown registered block');if(block&&block.role!==intentRole(decision.pedagogicalIntent))errors.push('pedagogical intent and block role mismatch');if(block&&!block.supportLevels.includes(decision.supportLevel))errors.push('unsupported support level');if(block&&block.forbiddenSupport.includes(decision.supportLevel))errors.push('support forbidden for assessment');if(block&&block.contextAffordance!==decision.contextProvenance)errors.push('block context provenance affordance exceeded');if(block&&block.capabilityAffordance==='NONE'&&decision.evidenceToObserve.length)errors.push('system block cannot emit capability evidence');if(block&&block.capabilityAffordance==='OBJECTIVE_BOUND'&&decision.evidenceToObserve.some(claim=>claim.targetRef!==decision.targetReference||!block.suitableFacets.includes(claim.facet)))errors.push('block evidence affordance exceeded');if(block&&block.exposesTargetAnswer&&decision.evidenceToObserve.length&&block.evidenceCeiling==='EXPOSURE_ONLY')errors.push('answer-exposing teaching cannot generate capability evidence');if(Object.keys(decision.configuration).some(key=>/(^|_)(ui|component|jsx)(_|$)|learnerFacingProse/i.test(key)))errors.push('Teacher cannot configure arbitrary UI or prose');return errors}
export function selectAlternateTeachingBlockV4(failedBlockId:string,facet:EnglishFacet):LearningBlockDefinitionV4|undefined{return blockRegistryV4.byRole('TEACH').find(block=>block.id!==failedBlockId&&block.suitableFacets.includes(facet))}
