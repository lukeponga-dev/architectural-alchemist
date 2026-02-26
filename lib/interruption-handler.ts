/**
 * Interruption Handler for Architectural Alchemist
 * Manages real-time interruption of AI agent processing
 */

import { ADKStateManager, AgentState, AgentEvent } from "./adk-state-manager";

export interface InterruptionConfig {
  enableVoiceInterruption: boolean;
  enableGestureInterruption: boolean;
  interruptionKeywords: string[];
  gestureThreshold: number;
  maxInterruptions: number;
  interruptionTimeout: number;
}

export interface InterruptionEvent {
  type: "voice" | "gesture" | "manual";
  timestamp: number;
  confidence: number;
  data?: any;
}

export interface ConversationContext {
  lastUserCommand: string;
  currentAgentResponse: string;
  interruptedSegment: string;
  pendingActions: string[];
}

export class InterruptionHandler {
  private stateManager: ADKStateManager;
  private config: InterruptionConfig;
  private interruptionCount: number = 0;
  private lastInterruptionTime: number = 0;
  private isListening: boolean = true;
  private conversationContext: ConversationContext = {
    lastUserCommand: "",
    currentAgentResponse: "",
    interruptedSegment: "",
    pendingActions: [],
  };

  constructor(stateManager: ADKStateManager, config: InterruptionConfig) {
    this.stateManager = stateManager;
    this.config = config;
    this.initializeEventListeners();
  }

  /**
   * Initialize event listeners for interruption detection
   */
  private initializeEventListeners(): void {
    // Listen for state changes to update context
    this.stateManager.addListener((state, context) => {
      this.updateConversationContext(state, context);
    });
  }

  /**
   * Update conversation context based on state changes
   */
  private updateConversationContext(state: AgentState, context: any): void {
    switch (state) {
      case AgentState.LISTENING:
        this.conversationContext.currentAgentResponse = "";
        break;
      case AgentState.ANALYZING_SPACE:
        this.conversationContext.interruptedSegment = "Analyzing space";
        break;
      case AgentState.GENERATING_PREVIEW:
        this.conversationContext.interruptedSegment = "Generating preview";
        break;
      case AgentState.PROCESSING_TRANSFORMATION:
        this.conversationContext.interruptedSegment =
          "Processing transformation";
        break;
    }

    if (context.userCommand) {
      this.conversationContext.lastUserCommand = context.userCommand;
    }
  }

  /**
   * Handle voice interruption
   */
  async handleVoiceInterruption(
    audioData: ArrayBuffer,
    confidence: number,
  ): Promise<boolean> {
    if (!this.config.enableVoiceInterruption || !this.canInterruption()) {
      return false;
    }

    try {
      // Process audio to detect interruption keywords
      const transcription = await this.transcribeAudio(audioData);
      const isInterruption = this.detectInterruptionKeywords(transcription);

      if (isInterruption && confidence > 0.7) {
        return await this.executeInterruption({
          type: "voice",
          timestamp: Date.now(),
          confidence,
          data: { transcription, audioData },
        });
      }

      return false;
    } catch (error) {
      console.error("Error handling voice interruption:", error);
      return false;
    }
  }

  /**
   * Handle gesture interruption
   */
  async handleGestureInterruption(
    gestureData: any,
    confidence: number,
  ): Promise<boolean> {
    if (!this.config.enableGestureInterruption || !this.canInterruption()) {
      return false;
    }

    try {
      // Detect interruption gestures (e.g., hand wave, stop gesture)
      const isInterruptionGesture = this.detectInterruptionGesture(gestureData);

      if (isInterruptionGesture && confidence > this.config.gestureThreshold) {
        return await this.executeInterruption({
          type: "gesture",
          timestamp: Date.now(),
          confidence,
          data: gestureData,
        });
      }

      return false;
    } catch (error) {
      console.error("Error handling gesture interruption:", error);
      return false;
    }
  }

  /**
   * Handle manual interruption (e.g., button click)
   */
  async handleManualInterruption(): Promise<boolean> {
    if (!this.canInterruption()) {
      return false;
    }

    return await this.executeInterruption({
      type: "manual",
      timestamp: Date.now(),
      confidence: 1.0,
    });
  }

  /**
   * Execute the interruption
   */
  private async executeInterruption(
    event: InterruptionEvent,
  ): Promise<boolean> {
    console.log(
      `🛑 Interruption detected: ${event.type} (confidence: ${event.confidence})`,
    );

    // Update interruption tracking
    this.interruptionCount++;
    this.lastInterruptionTime = event.timestamp;

    // Save current state context
    const currentState = this.stateManager.state;
    const context = this.stateManager.contextData;

    // Process interruption based on current state
    const success = await this.stateManager.processEvent(
      AgentEvent.INTERRUPTION,
      {
        interruptionEvent: event,
        savedContext: context,
      },
    );

    if (success) {
      // Handle post-interruption logic
      await this.handlePostInterruption(event, currentState, context);
    }

    return success;
  }

  /**
   * Handle post-interruption logic
   */
  private async handlePostInterruption(
    event: InterruptionEvent,
    previousState: AgentState,
    context: any,
  ): Promise<void> {
    // Generate interruption acknowledgment
    const acknowledgment = this.generateInterruptionAcknowledgment(
      event,
      previousState,
    );

    // If voice interruption with new command, extract and process it
    if (event.type === "voice" && event.data?.transcription) {
      const newCommand = this.extractNewCommand(event.data.transcription);
      if (newCommand) {
        this.conversationContext.lastUserCommand = newCommand;
        // Restart processing with new command
        setTimeout(() => {
          this.stateManager.processEvent(AgentEvent.START_LISTENING, {
            userCommand: newCommand,
          });
        }, 1000);
      }
    }

    // Add to pending actions for potential resume
    this.conversationContext.pendingActions.push(previousState);
  }

  /**
   * Check if interruption is allowed
   */
  private canInterruption(): boolean {
    const currentTime = Date.now();
    const timeSinceLastInterruption = currentTime - this.lastInterruptionTime;

    // Check timeout
    if (timeSinceLastInterruption < this.config.interruptionTimeout) {
      return false;
    }

    // Check max interruptions
    if (this.interruptionCount >= this.config.maxInterruptions) {
      return false;
    }

    // Check if current state allows interruption
    const currentState = this.stateManager.state;
    const interruptibleStates = [
      AgentState.ANALYZING_SPACE,
      AgentState.GENERATING_PREVIEW,
      AgentState.PROCESSING_TRANSFORMATION,
    ];

    return interruptibleStates.includes(currentState);
  }

  /**
   * Transcribe audio data
   */
  private async transcribeAudio(audioData: ArrayBuffer): Promise<string> {
    // This would integrate with a speech-to-text service
    // For now, return a placeholder
    return "interruption detected";
  }

  /**
   * Detect interruption keywords in transcription
   */
  private detectInterruptionKeywords(transcription: string): boolean {
    const lowerTranscription = transcription.toLowerCase();
    return this.config.interruptionKeywords.some((keyword) =>
      lowerTranscription.includes(keyword.toLowerCase()),
    );
  }

  /**
   * Detect interruption gestures
   */
  private detectInterruptionGesture(gestureData: any): boolean {
    // This would analyze gesture data for interruption patterns
    // For now, return a placeholder
    return gestureData.type === "stop" || gestureData.type === "wave";
  }

  /**
   * Extract new command from interruption transcription
   */
  private extractNewCommand(transcription: string): string | null {
    // Remove interruption keywords and extract the actual command
    const cleaned = transcription
      .toLowerCase()
      .replace(/\b(stop|wait|hold on|no|wait a minute)\b/gi, "")
      .trim();

    if (cleaned.length > 5) {
      return cleaned;
    }

    return null;
  }

  /**
   * Generate interruption acknowledgment
   */
  private generateInterruptionAcknowledgment(
    event: InterruptionEvent,
    previousState: AgentState,
  ): string {
    const acknowledgments = {
      voice: [
        "I hear you. Let me adjust that.",
        "Got it. Changing direction now.",
        "Understood. Let me try a different approach.",
      ],
      gesture: [
        "I see your gesture. Making adjustments.",
        "Noticed your signal. Changing course.",
        "I see you. Let me modify that.",
      ],
      manual: [
        "Making adjustments as requested.",
        "Changing direction now.",
        "Let me modify that for you.",
      ],
    };

    const messages = acknowledgments[event.type] || acknowledgments.manual;
    return messages[Math.floor(Math.random() * messages.length)];
  }

  /**
   * Resume from interruption
   */
  async resume(): Promise<boolean> {
    if (this.conversationContext.pendingActions.length === 0) {
      return false;
    }

    const lastAction = this.conversationContext.pendingActions.pop();

    // Restore context and resume
    return await this.stateManager.processEvent(AgentEvent.START_LISTENING, {
      resumeContext: this.conversationContext,
      previousAction: lastAction,
    });
  }

  /**
   * Reset interruption handler
   */
  reset(): void {
    this.interruptionCount = 0;
    this.lastInterruptionTime = 0;
    this.conversationContext = {
      lastUserCommand: "",
      currentAgentResponse: "",
      interruptedSegment: "",
      pendingActions: [],
    };
  }

  /**
   * Get interruption statistics
   */
  getStats(): {
    interruptionCount: number;
    lastInterruptionTime: number;
    canInterruption: boolean;
    pendingActions: number;
  } {
    return {
      interruptionCount: this.interruptionCount,
      lastInterruptionTime: this.lastInterruptionTime,
      canInterruption: this.canInterruption(),
      pendingActions: this.conversationContext.pendingActions.length,
    };
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<InterruptionConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }
}

export default InterruptionHandler;
