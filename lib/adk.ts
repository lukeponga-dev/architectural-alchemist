/**
 * Represents the possible states of an agent in the ADK system
 */
export type AgentState =
  | "IDLE"
  | "LISTENING"
  | "ANALYZING_SPACE"
  | "GENERATING_PREVIEW";

/**
 * ADK (Agent Development Kit) class that manages agent state transitions
 */
export class ADK {
  // Current state of the agent, initialized to 'IDLE'
  state: AgentState = "IDLE";

  /**
   * Transition the agent to a new state
   * @param newState - The state to transition to
   */
  transition(newState: AgentState) {
    console.log(`Transitioning from ${this.state} → ${newState}`);
    this.state = newState;
  }

  /**
   * Handle user input when the agent is in LISTENING state
   * @param input - The user input to process
   */
  handleUserInput(input: string) {
    if (this.state === "LISTENING") {
      this.transition("ANALYZING_SPACE");
    }
  }
}
