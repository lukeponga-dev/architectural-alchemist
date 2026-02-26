// Basic ADK Components
export { ADK } from './adk';
export type { AgentState as SimpleAgentState } from './adk';

// Advanced State Management
export { default as ADKStateManager } from './adk-state-manager';
export * from './adk-state-manager';

// Utilities (Client-Safe)
export * from './auth-util';
export { default as ColorPaletteEngine } from './color-palette-engine';
export * from './color-palette-engine';
export * from './colorEngine';
export * from './firebase';
export { default as InterruptionHandler } from './interruption-handler';
export * from './interruption-handler';

// Managers (with default export handling)
export { default as FirestoreManager } from './firestore-manager';
export * from './firestore-manager';

export { default as WebRTCManager } from './webrtc-manager';
export * from './webrtc-manager';

// Note: The following modules are server-side only and should not be exported from this barrel:
// - spatial-reasoning.ts (uses @google/generative-ai, intended for server-side)
// - vertexVision.ts (uses @google-cloud/vision, Node.js only)
// - veo-pipeline.ts (uses @google-cloud/vertexai, Node.js only)
// These can be imported directly when needed in server-side code. 
