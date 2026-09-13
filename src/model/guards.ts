const authorityKeys=new Set(['mastery','masteryScore','learnerState','learnerModelMutation','canonicalEvidence','evidenceAdmission','schedule','learningNeed','sessionMutation','deleteEvidence','overwriteEvidence']);

export interface ModelProposalGuardResultV1{valid:boolean;errors:readonly string[]}

export function guardModelProposalAuthorityV1(value:unknown):ModelProposalGuardResultV1{
  const errors:string[]=[];
  const visit=(current:unknown,path:string)=>{
    if(!current||typeof current!=='object')return;
    if(Array.isArray(current)){current.forEach((item,index)=>visit(item,`${path}[${index}]`));return;}
    for(const[key,next]of Object.entries(current as Record<string,unknown>)){
      if(authorityKeys.has(key))errors.push(`model_authority_key:${path?`${path}.`:''}${key}`);
      visit(next,path?`${path}.${key}`:key);
    }
  };
  visit(value,'');
  return Object.freeze({valid:errors.length===0,errors:Object.freeze([...new Set(errors)])});
}
