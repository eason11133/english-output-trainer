import{reliabilityCapabilityStatesV1,reliabilityWaveSummaryV1}from'./capabilities';
export const waveVProductionReliabilityStatusV1=Object.freeze({
  wave:'V',
  subsystem:'Production Reliability',
  status:'READY_FOR_AUDIT' as const,
  capabilities:reliabilityCapabilityStatesV1,
  summary:reliabilityWaveSummaryV1(),
  deviceUnknowns:Object.freeze([
    'physical Android/iOS process-death recovery',
    'keyboard/IME layout and long-composition behavior',
    'safe-area/back-navigation lifecycle',
    'background network interruption behavior',
  ]),
});
