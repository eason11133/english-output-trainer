import { CapabilityFacet, EnglishDomainObject, EnglishFacet, Relevance } from './EnglishDomain';

export type EnglishDomainNodeKind=
  |'LEXEME'
  |'SENSE'
  |'WORD_FORM'
  |'MORPHOLOGICAL_PATTERN'
  |'CHUNK'
  |'COLLOCATION'
  |'PHRASE_FRAME'
  |'GRAMMAR_CONSTRUCTION'
  |'MEANING_INTENT'
  |'DISCOURSE_MOVE'
  |'WRITING_CAPABILITY'
  |'TRANSLATION_CAPABILITY'
  |'READING_CAPABILITY';

export type EnglishDomainArea='LEXICAL'|'FORMULAIC'|'GRAMMAR'|'MEANING_ENCODING'|'WRITING'|'TRANSLATION'|'READING'|'DISCOURSE';

export type EnglishDomainRelationType=
  |'HAS_SENSE'
  |'HAS_FORM'
  |'USES_MORPHOLOGY'
  |'PART_OF'
  |'PREREQUISITE_FOR'
  |'REALIZES_MEANING'
  |'ALTERNATIVE_REALIZATION'
  |'CONTRASTS_WITH'
  |'COMMONLY_COMBINES_WITH'
  |'REGISTER_VARIANT'
  |'ENABLES'
  |'REUSES';

export type DomainSourceKind='CURATED_SYSTEM'|'TRUSTED_IMPORTED'|'LEARNER_SOURCE'|'TEACHER_SOURCE'|'GENERATED_VALIDATED';
export interface EnglishDomainProvenanceV2{sourceKind:DomainSourceKind;sourceId:string;version:string;validated:boolean;reviewedAt?:string}
export type EnglishContentBindingV1=
  |{kind:'LEXEME_IDENTITY';lemma:string}
  |{kind:'SENSE_IDENTITY';lemma:string;sourceId:string;sourceRecordId:string}
  |{kind:'WORD_FORM_IDENTITY';lemma:string;form:string;requiredFeatures:readonly string[]}
  |{kind:'MORPHOLOGY_PATTERN';pattern:'REGULAR_VERB_ED_S';probeLemma:string};

export interface EnglishDomainNodeV2{
  id:string;
  kind:EnglishDomainNodeKind;
  area:EnglishDomainArea;
  label:string;
  description?:string;
  aliases:readonly string[];
  facets:readonly CapabilityFacet[];
  registerConstraints:readonly string[];
  genreConstraints:readonly string[];
  writingRelevance:Relevance;
  translationRelevance:Relevance;
  readingRelevance:Relevance;
  provenance:EnglishDomainProvenanceV2;
  contentBindings?:readonly EnglishContentBindingV1[];
}

export interface EnglishDomainEdgeV2{
  id:string;
  fromId:string;
  toId:string;
  relation:EnglishDomainRelationType;
  provenance:EnglishDomainProvenanceV2;
  confidence:'LOW'|'MEDIUM'|'HIGH';
}

export interface EnglishDomainGraphV2{nodes:readonly EnglishDomainNodeV2[];edges:readonly EnglishDomainEdgeV2[];version:string}

export interface EnglishCapabilityConditionV2{
  support:'UNKNOWN'|'NONE'|'LIGHT'|'MEDIUM'|'EXPLICIT'|'MODEL';
  contextNovelty:'SOURCE'|'SAME_CONTEXT'|'CHANGED_CONTEXT'|'DELAYED_CONTEXT'|'UNKNOWN';
  taskLoad:'LOW'|'MEDIUM'|'HIGH'|'UNKNOWN';
  recurrence:'FIRST_OBSERVATION'|'OCCASIONAL'|'RECURRING'|'UNKNOWN';
  register?:string;
  genre?:string;
}

export const DEFAULT_CAPABILITY_CONDITION_V2:EnglishCapabilityConditionV2={support:'UNKNOWN',contextNovelty:'UNKNOWN',taskLoad:'UNKNOWN',recurrence:'UNKNOWN'};

const facetForLegacyType=(value:EnglishDomainObject):readonly CapabilityFacet[]=>value.facets;

export function legacyEnglishDomainObjectToNodeV2(value:EnglishDomainObject,provenance:EnglishDomainProvenanceV2):EnglishDomainNodeV2{
  const kind:EnglishDomainNodeKind=value.type==='WORD'||value.type==='WORD_FAMILY'?'LEXEME':
    value.type==='SENSE'?'SENSE':
    value.type==='COLLOCATION'?'COLLOCATION':
    value.type==='CHUNK'||value.type==='IDIOM_PROVERB'||value.type==='FORMULAIC_SEQUENCE'||value.type==='REUSABLE_EXPRESSION'?'CHUNK':
    value.type==='GRAMMAR_CONSTRUCTION'?'GRAMMAR_CONSTRUCTION':
    value.type==='DISCOURSE_MOVE'?'DISCOURSE_MOVE':'WRITING_CAPABILITY';
  const area:EnglishDomainArea=value.type==='WORD'||value.type==='WORD_FAMILY'||value.type==='SENSE'?'LEXICAL':
    value.type==='COLLOCATION'||value.type==='CHUNK'||value.type==='IDIOM_PROVERB'||value.type==='FORMULAIC_SEQUENCE'||value.type==='REUSABLE_EXPRESSION'?'FORMULAIC':
    value.type==='GRAMMAR_CONSTRUCTION'?'GRAMMAR':value.type==='DISCOURSE_MOVE'?'DISCOURSE':'WRITING';
  return{id:value.id,kind,area,label:value.label,description:value.description,aliases:[],facets:facetForLegacyType(value),registerConstraints:value.registerGenreConstraints??[],genreConstraints:[],writingRelevance:value.writingRelevance,translationRelevance:value.translationRelevance,readingRelevance:'MEDIUM',provenance};
}

function pushDuplicateValues(values:readonly string[],label:string,errors:string[]){
  const seen=new Set<string>();
  for(const value of values){if(seen.has(value))errors.push(`duplicate ${label}: ${value}`);seen.add(value)}
}

const relationKey=(edge:EnglishDomainEdgeV2)=>`${edge.fromId}|${edge.relation}|${edge.toId}`;

export function validateEnglishDomainNodeV2(node:EnglishDomainNodeV2):string[]{
  const errors:string[]=[];
  if(!node.id.trim())errors.push('node id required');
  if(!node.label.trim())errors.push(`node label required: ${node.id||'<unknown>'}`);
  if(!node.facets.length)errors.push(`at least one capability facet required: ${node.id}`);
  pushDuplicateValues(node.facets,`facet on ${node.id}`,errors);
  pushDuplicateValues(node.aliases.map(v=>v.trim().toLowerCase()).filter(Boolean),`alias on ${node.id}`,errors);
  if(node.aliases.some(alias=>alias.trim()===node.id))errors.push(`node alias repeats canonical id: ${node.id}`);
  if(!node.provenance.sourceId.trim()||!node.provenance.version.trim())errors.push(`node provenance incomplete: ${node.id}`);
  if(!node.provenance.validated)errors.push(`unvalidated node cannot enter canonical English Domain: ${node.id}`);
  return errors;
}

export function validateEnglishDomainGraphV2(graph:EnglishDomainGraphV2):string[]{
  const errors:string[]=[];
  if(!graph.version.trim())errors.push('graph version required');
  const ids=graph.nodes.map(node=>node.id);
  pushDuplicateValues(ids,'node id',errors);
  for(const node of graph.nodes)errors.push(...validateEnglishDomainNodeV2(node));
  const nodeIds=new Set(ids);
  const aliases=new Map<string,string>();
  for(const node of graph.nodes){
    for(const raw of node.aliases){
      const alias=raw.trim().toLowerCase();
      if(!alias)continue;
      if(nodeIds.has(raw))errors.push(`alias collides with canonical id: ${raw}`);
      const prior=aliases.get(alias);
      if(prior&&prior!==node.id)errors.push(`alias resolves to multiple nodes: ${raw}`);
      aliases.set(alias,node.id);
    }
  }
  pushDuplicateValues(graph.edges.map(edge=>edge.id),'edge id',errors);
  pushDuplicateValues(graph.edges.map(relationKey),'edge relation',errors);
  for(const edge of graph.edges){
    if(!nodeIds.has(edge.fromId))errors.push(`edge source missing: ${edge.id}:${edge.fromId}`);
    if(!nodeIds.has(edge.toId))errors.push(`edge target missing: ${edge.id}:${edge.toId}`);
    if(edge.fromId===edge.toId)errors.push(`self relation forbidden: ${edge.id}`);
    if(!edge.provenance.validated)errors.push(`unvalidated edge cannot enter canonical English Domain: ${edge.id}`);
  }
  const prereqAdj=new Map<string,string[]>();
  for(const edge of graph.edges.filter(edge=>edge.relation==='PREREQUISITE_FOR'))prereqAdj.set(edge.fromId,[...(prereqAdj.get(edge.fromId)??[]),edge.toId]);
  const visiting=new Set<string>(),visited=new Set<string>();
  const visit=(id:string,path:string[])=>{
    if(visiting.has(id)){errors.push(`prerequisite cycle: ${[...path,id].join(' -> ')}`);return}
    if(visited.has(id))return;
    visiting.add(id);
    for(const next of prereqAdj.get(id)??[])visit(next,[...path,id]);
    visiting.delete(id);visited.add(id);
  };
  for(const id of nodeIds)visit(id,[]);
  return [...new Set(errors)];
}

export function createEnglishDomainGraphV2(input:EnglishDomainGraphV2):EnglishDomainGraphV2{
  const graph:EnglishDomainGraphV2={version:input.version,nodes:Object.freeze([...input.nodes]),edges:Object.freeze([...input.edges])};
  const errors=validateEnglishDomainGraphV2(graph);
  if(errors.length)throw new Error(`invalid_english_domain_graph:${errors.join('|')}`);
  return Object.freeze(graph);
}

export interface EnglishDomainPortV2{
  readonly version:string;
  get(idOrAlias:string):EnglishDomainNodeV2|undefined;
  resolveId(idOrAlias:string):string|undefined;
  prerequisites(idOrAlias:string):readonly string[];
  dependents(idOrAlias:string):readonly string[];
  relationsFrom(idOrAlias:string,relation?:EnglishDomainRelationType):readonly EnglishDomainEdgeV2[];
  relationsTo(idOrAlias:string,relation?:EnglishDomainRelationType):readonly EnglishDomainEdgeV2[];
  alternatives(idOrAlias:string):readonly EnglishDomainNodeV2[];
  contrasts(idOrAlias:string):readonly EnglishDomainNodeV2[];
  realizationsForMeaning(idOrAlias:string):readonly EnglishDomainNodeV2[];
  nodesForArea(area:EnglishDomainArea):readonly EnglishDomainNodeV2[];
  supportsFacet(idOrAlias:string,facet:EnglishFacet):boolean;
}

export function createEnglishDomainPortV2(graph:EnglishDomainGraphV2):EnglishDomainPortV2{
  const byId=new Map(graph.nodes.map(node=>[node.id,node]));
  const aliasToId=new Map<string,string>();
  for(const node of graph.nodes)for(const alias of node.aliases)aliasToId.set(alias.trim().toLowerCase(),node.id);
  const resolveId=(value:string)=>byId.has(value)?value:aliasToId.get(value.trim().toLowerCase());
  const get=(value:string)=>{const id=resolveId(value);return id?byId.get(id):undefined};
  const from=(value:string,relation?:EnglishDomainRelationType)=>{const id=resolveId(value);return id?graph.edges.filter(edge=>edge.fromId===id&&(!relation||edge.relation===relation)):[]};
  const to=(value:string,relation?:EnglishDomainRelationType)=>{const id=resolveId(value);return id?graph.edges.filter(edge=>edge.toId===id&&(!relation||edge.relation===relation)):[]};
  const mapNodes=(ids:readonly string[])=>ids.map(id=>byId.get(id)).filter((node):node is EnglishDomainNodeV2=>Boolean(node));
  const symmetric=(value:string,relation:EnglishDomainRelationType)=>{
    const id=resolveId(value);if(!id)return[];
    const ids=graph.edges.filter(edge=>edge.relation===relation&&(edge.fromId===id||edge.toId===id)).map(edge=>edge.fromId===id?edge.toId:edge.fromId);
    return mapNodes([...new Set(ids)]);
  };
  return Object.freeze({
    version:graph.version,
    get,resolveId,
    prerequisites(value:string){const id=resolveId(value);return id?graph.edges.filter(edge=>edge.relation==='PREREQUISITE_FOR'&&edge.toId===id).map(edge=>edge.fromId):[]},
    dependents(value:string){const id=resolveId(value);return id?graph.edges.filter(edge=>edge.relation==='PREREQUISITE_FOR'&&edge.fromId===id).map(edge=>edge.toId):[]},
    relationsFrom:from,relationsTo:to,
    alternatives(value:string){return symmetric(value,'ALTERNATIVE_REALIZATION')},
    contrasts(value:string){return symmetric(value,'CONTRASTS_WITH')},
    realizationsForMeaning(value:string){const id=resolveId(value);return id?mapNodes(graph.edges.filter(edge=>edge.relation==='REALIZES_MEANING'&&edge.toId===id).map(edge=>edge.fromId)):[]},
    nodesForArea(area:EnglishDomainArea){return graph.nodes.filter(node=>node.area===area)},
    supportsFacet(value:string,facet:EnglishFacet){return Boolean(get(value)?.facets.includes(facet as CapabilityFacet))},
  });
}
