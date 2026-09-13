export interface ExposureEvent{id:string;learnerId:string;targetRef:string;kind:'SEEN'|'TAUGHT'|'LOOKED_UP'|'PRACTICED';occurredAt:string;artifactId?:string;episodeId?:string;immutable:true}
