/**
 * Agent Development Kit (ADK) State Manager
 * Manages the "Designer State Machine" for the Architectural Alchemist
 */

export enum AgentState {
  IDLE = "IDLE",
  LISTENING = "LISTENING",
  ANALYZING_SPACE = "ANALYZING_SPACE",
  GENERATING_PREVIEW = "GENERATING_PREVIEW",
  PROCESSING_TRANSFORMATION = "PROCESSING_TRANSFORMATION",
  ERROR = "ERROR",
}

export enum AgentEvent {
  START_LISTENING = "START_LISTENING",
  SPEECH_DETECTED = "SPEECH_DETECTED",
  SPEECH_COMPLETE = "SPEECH_COMPLETE",
  COMMAND_UNDERSTOOD = "COMMAND_UNDERSTOOD",
  SPACE_ANALYZED = "SPACE_ANALYZED",
  PREVIEW_GENERATED = "PREVIEW_GENERATED",
  TRANSFORMATION_COMPLETE = "TRANSFORMATION_COMPLETE",
  INTERRUPTION = "INTERRUPTION",
  ERROR_OCCURRED = "ERROR_OCCURRED",
  RESET = "RESET",
}

export interface AgentContext {
  userCommand?: string;
  spatialData?: SpatialData;
  previewData?: PreviewData;
  transformationData?: TransformationData;
  error?: Error;
  metadata?: Record<string, any>;
}

export interface SpatialData {
  wallCoordinates: Array<{
    x: number;
    y: number;
    width: number;
    height: number;
    surface: "wall" | "floor" | "ceiling";
  }>;
  roomDimensions: {
    width: number;
    height: number;
    depth: number;
  };
  lightingConditions: {
    brightness: number;
    direction: string;
    quality: "natural" | "artificial" | "mixed";
  };
}

export interface PreviewData {
  style: string;
  materials: string[];
  colors: string[];
  mood: string;
  description: string;
  thumbnailUrl?: string;
}

export interface TransformationData {
  beforeImage: string;
  afterImage: string;
  transformationType: string;
  processingTime: number;
  confidence: number;
}

export interface StateTransition {
  from: AgentState;
  to: AgentState;
  event: AgentEvent;
  action?: () => Promise<void>;
}

export class ADKStateManager {
  private currentState: AgentState = AgentState.IDLE;
  private context: AgentContext = {};
  private stateHistory: Array<{
    state: AgentState;
    timestamp: number;
    context: AgentContext;
  }> = [];
  private listeners: Array<(state: AgentState, context: AgentContext) => void> =
    [];
  private transitions: Map<string, StateTransition> = new Map();

  constructor() {
    this.initializeTransitions();
  }

  /**
   * Initialize state transition rules
   */
  private initializeTransitions(): void {
    const transitions: StateTransition[] = [
      // IDLE transitions
      {
        from: AgentState.IDLE,
        to: AgentState.LISTENING,
        event: AgentEvent.START_LISTENING,
        action: async () => this.startListening(),
      },

      // LISTENING transitions
      {
        from: AgentState.LISTENING,
        to: AgentState.ANALYZING_SPACE,
        event: AgentEvent.SPEECH_COMPLETE,
        action: async () => this.analyzeSpace(),
      },
      {
        from: AgentState.LISTENING,
        to: AgentState.IDLE,
        event: AgentEvent.INTERRUPTION,
        action: async () => this.handleInterruption(),
      },

      // ANALYZING_SPACE transitions
      {
        from: AgentState.ANALYZING_SPACE,
        to: AgentState.GENERATING_PREVIEW,
        event: AgentEvent.SPACE_ANALYZED,
        action: async () => this.generatePreview(),
      },
      {
        from: AgentState.ANALYZING_SPACE,
        to: AgentState.LISTENING,
        event: AgentEvent.INTERRUPTION,
        action: async () => this.handleInterruption(),
      },

      // GENERATING_PREVIEW transitions
      {
        from: AgentState.GENERATING_PREVIEW,
        to: AgentState.PROCESSING_TRANSFORMATION,
        event: AgentEvent.PREVIEW_GENERATED,
        action: async () => this.processTransformation(),
      },
      {
        from: AgentState.GENERATING_PREVIEW,
        to: AgentState.LISTENING,
        event: AgentEvent.INTERRUPTION,
        action: async () => this.handleInterruption(),
      },

      // PROCESSING_TRANSFORMATION transitions
      {
        from: AgentState.PROCESSING_TRANSFORMATION,
        to: AgentState.IDLE,
        event: AgentEvent.TRANSFORMATION_COMPLETE,
        action: async () => this.completeTransformation(),
      },
      {
        from: AgentState.PROCESSING_TRANSFORMATION,
        to: AgentState.LISTENING,
        event: AgentEvent.INTERRUPTION,
        action: async () => this.handleInterruption(),
      },

      // ERROR transitions
      {
        from: AgentState.ERROR,
        to: AgentState.IDLE,
        event: AgentEvent.RESET,
        action: async () => this.reset(),
      },

      // Global error handling
      {
        from: AgentState.IDLE,
        to: AgentState.ERROR,
        event: AgentEvent.ERROR_OCCURRED,
        action: async () => this.handleError(),
      },
      {
        from: AgentState.LISTENING,
        to: AgentState.ERROR,
        event: AgentEvent.ERROR_OCCURRED,
        action: async () => this.handleError(),
      },
      {
        from: AgentState.ANALYZING_SPACE,
        to: AgentState.ERROR,
        event: AgentEvent.ERROR_OCCURRED,
        action: async () => this.handleError(),
      },
      {
        from: AgentState.GENERATING_PREVIEW,
        to: AgentState.ERROR,
        event: AgentEvent.ERROR_OCCURRED,
        action: async () => this.handleError(),
      },
      {
        from: AgentState.PROCESSING_TRANSFORMATION,
        to: AgentState.ERROR,
        event: AgentEvent.ERROR_OCCURRED,
        action: async () => this.handleError(),
      },
    ];

    transitions.forEach((transition) => {
      const key = `${transition.from}-${transition.event}`;
      this.transitions.set(key, transition);
    });
  }

  /**
   * Process an event and transition state if valid
   */
  async processEvent(event: AgentEvent, data?: any): Promise<boolean> {
    const key = `${this.currentState}-${event}`;
    const transition = this.transitions.get(key);

    if (!transition) {
      console.warn(
        `No transition found for state ${this.currentState} with event ${event}`,
      );
      return false;
    }

    try {
      // Update context with event data
      if (data) {
        this.context = { ...this.context, ...data };
      }

      // Execute transition action
      if (transition.action) {
        await transition.action();
      }

      // Change state
      const previousState = this.currentState;
      this.currentState = transition.to;

      // Record state change
      this.stateHistory.push({
        state: this.currentState,
        timestamp: Date.now(),
        context: { ...this.context },
      });

      // Notify listeners
      this.notifyListeners();

      console.log(
        `State transition: ${previousState} -> ${this.currentState} (event: ${event})`,
      );
      return true;
    } catch (error) {
      console.error(`Error during state transition: ${error}`);
      this.context.error = error as Error;
      await this.processEvent(AgentEvent.ERROR_OCCURRED);
      return false;
    }
  }

  /**
   * State action implementations
   */
  private async startListening(): Promise<void> {
    console.log("🎤 Starting to listen for user commands...");
    // Initialize speech recognition or other input methods
    this.context.metadata = {
      ...this.context.metadata,
      listeningStartTime: Date.now(),
    };
  }

  private async analyzeSpace(): Promise<void> {
    console.log("🔍 Analyzing space...");
    // Trigger spatial analysis
    // This would integrate with the spatial reasoning tools
    this.context.metadata = {
      ...this.context.metadata,
      analysisStartTime: Date.now(),
    };
  }

  private async generatePreview(): Promise<void> {
    console.log("🎨 Generating preview...");
    // Trigger preview generation
    this.context.metadata = {
      ...this.context.metadata,
      previewStartTime: Date.now(),
    };
  }

  private async processTransformation(): Promise<void> {
    console.log("🔄 Processing transformation...");
    // Trigger final transformation
    this.context.metadata = {
      ...this.context.metadata,
      transformationStartTime: Date.now(),
    };
  }

  private async completeTransformation(): Promise<void> {
    console.log("✅ Transformation complete!");
    // Clean up and prepare for next command
    this.context = {};
  }

  private async handleInterruption(): Promise<void> {
    console.log("⏸️ Handling interruption...");
    // Save current state context for potential resume
    this.context.metadata = {
      ...this.context.metadata,
      interruptedAt: Date.now(),
      previousState: this.currentState,
    };
  }

  private async handleError(): Promise<void> {
    console.error("❌ Error state entered:", this.context.error);
    // Log error and prepare for recovery
  }

  private async reset(): Promise<void> {
    console.log("🔄 Resetting to IDLE state...");
    this.context = {};
    this.context.metadata = { resetTime: Date.now() };
  }

  /**
   * Event emitter methods
   */
  addListener(
    listener: (state: AgentState, context: AgentContext) => void,
  ): void {
    this.listeners.push(listener);
  }

  removeListener(
    listener: (state: AgentState, context: AgentContext) => void,
  ): void {
    const index = this.listeners.indexOf(listener);
    if (index > -1) {
      this.listeners.splice(index, 1);
    }
  }

  private notifyListeners(): void {
    this.listeners.forEach((listener) => {
      try {
        listener(this.currentState, { ...this.context });
      } catch (error) {
        console.error("Error in state listener:", error);
      }
    });
  }

  /**
   * Getters and utilities
   */
  get state(): AgentState {
    return this.currentState;
  }

  get contextData(): AgentContext {
    return { ...this.context };
  }

  get history(): Array<{
    state: AgentState;
    timestamp: number;
    context: AgentContext;
  }> {
    return [...this.stateHistory];
  }

  canProcess(event: AgentEvent): boolean {
    const key = `${this.currentState}-${event}`;
    return this.transitions.has(key);
  }

  getPossibleTransitions(): AgentEvent[] {
    const possibleEvents: AgentEvent[] = [];

    for (const [key, transition] of this.transitions) {
      if (transition.from === this.currentState) {
        possibleEvents.push(transition.event);
      }
    }

    return possibleEvents;
  }

  /**
   * Debug and monitoring
   */
  getStateInfo(): {
    currentState: AgentState;
    possibleEvents: AgentEvent[];
    context: AgentContext;
    historyLength: number;
  } {
    return {
      currentState: this.currentState,
      possibleEvents: this.getPossibleTransitions(),
      context: this.context,
      historyLength: this.stateHistory.length,
    };
  }

  /**
   * Persistence and recovery
   */
  saveState(): string {
    return JSON.stringify({
      currentState: this.currentState,
      context: this.context,
      stateHistory: this.stateHistory.slice(-10), // Keep last 10 states
    });
  }

  loadState(stateJson: string): void {
    try {
      const saved = JSON.parse(stateJson);
      this.currentState = saved.currentState || AgentState.IDLE;
      this.context = saved.context || {};
      this.stateHistory = saved.stateHistory || [];
      this.notifyListeners();
    } catch (error) {
      console.error("Error loading state:", error);
      this.reset();
    }
  }
}

export default ADKStateManager;
