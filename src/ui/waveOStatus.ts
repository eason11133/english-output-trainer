import {uiCapabilityStatesV1,uiWaveSummaryV1}from'./capabilities';
export const waveOUIStatusV1=Object.freeze({wave:'O',subsystem:'UI / Interaction Design System',status:'READY_FOR_AUDIT' as const,capabilities:uiCapabilityStatesV1,summary:uiWaveSummaryV1(),deviceUnknowns:Object.freeze(['screen-reader behavior','dynamic text scaling','physical keyboard/IME layout','motion acceptance'])});
