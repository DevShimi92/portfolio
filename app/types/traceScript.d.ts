export interface TraceScript {
  scriptId:        string;
  activeTraceIds:  string[];
  startupDelays?: Record<string, { delay: number; startDistance?: number }>;
  animationConfig?: Partial<TraceAnimationConfig>;
  traceOverrides?: Record<string, Partial<TraceAnimationConfig>>;
  glowColor?: number;   // hex ex: 0xfc2803
}
