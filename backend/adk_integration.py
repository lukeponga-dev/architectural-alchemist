"""Agent Development Kit (ADK) Integration for enhanced agent capabilities."""

import asyncio
import json
import logging
from typing import Dict, Any, Optional
from dataclasses import dataclass
from google.adk import Agent, Tool, FunctionTool
from google.adk.agents import LlmAgent
from google.adk.tools import ToolContext

from config import settings
from services.gcp_clients import gcp_clients
from services.privacy_shield import PrivacyShield

logger = logging.getLogger(__name__)


@dataclass
class AgentState:
    """Manages agent state and context."""
    current_room_analysis: Optional[Dict[str, Any]] = None
    conversation_history: list = None
    user_preferences: Dict[str, Any] = None
    
    def __post_init__(self):
        if self.conversation_history is None:
            self.conversation_history = []
        if self.user_preferences is None:
            self.user_preferences = {}


class ArchitecturalAnalysisTool(FunctionTool):
    """Tool for analyzing architectural elements in real-time."""
    
    def __init__(self):
        super().__init__(
            name="analyze_architectural_element",
            description="Analyze architectural elements like walls, floors, ceilings in real-time video feed",
            parameters={
                "coordinates": {
                    "type": "object",
                    "properties": {
                        "x": {"type": "number"},
                        "y": {"type": "number"},
                        "width": {"type": "number"},
                        "height": {"type": "number"}
                    },
                    "required": ["x", "y"]
                },
                "analysis_type": {
                    "type": "string",
                    "enum": ["identify_surface", "analyze_room"],
                    "description": "Type of architectural analysis to perform"
                }
            }
        )
    
    async def call(self, tool_context: ToolContext, coordinates: dict, analysis_type: str) -> Dict[str, Any]:
        """Execute architectural analysis using Gemini Vision."""
        try:
            # Get current frame from tool context
            current_frame = tool_context.get("current_frame")
            if not current_frame:
                return {"error": "No video frame available for analysis"}
            
            # Prepare analysis request
            analysis_request = {
                "image": current_frame,
                "type": analysis_type,
                **coordinates
            }
            
            # Use spatial analysis service
            result = await self._perform_spatial_analysis(analysis_request)
            return result
            
        except Exception as e:
            logger.error(f"Architectural analysis failed: {e}")
            return {"error": str(e)}
    
    async def _perform_spatial_analysis(self, request: Dict[str, Any]) -> Dict[str, Any]:
        """Delegate to spatial analysis service."""
        # This would integrate with your existing spatial analysis endpoint
        # For now, return mock response
        return {
            "surface": {
                "type": "wall",
                "material": "drywall",
                "color": "white",
                "boundingBox": [100, 200, 400, 600]
            },
            "confidence": 0.85,
            "reasoning": "Based on texture and position analysis"
        }


class PrivacyShieldTool(FunctionTool):
    """Tool for privacy protection and content filtering."""
    
    def __init__(self, privacy_shield: PrivacyShield):
        super().__init__(
            name="privacy_check",
            description="Check video frame for privacy concerns and apply protection",
            parameters={
                "frame_data": {
                    "type": "string",
                    "description": "Base64 encoded video frame"
                },
                "strict_mode": {
                    "type": "boolean",
                    "default": True,
                    "description": "Enable strict privacy filtering"
                }
            }
        )
        self.privacy_shield = privacy_shield
    
    async def call(self, tool_context: ToolContext, frame_data: str, strict_mode: bool = True) -> Dict[str, Any]:
        """Perform privacy check on video frame."""
        try:
            result = await self.privacy_shield.process_frame_for_frontend(frame_data)
            
            # Add privacy decision logic
            if strict_mode and result["face_count"] > settings.MAX_FACE_COUNT:
                return {
                    "allowed": False,
                    "reason": f"Too many faces detected ({result['face_count']})",
                    "blur_applied": True
                }
            
            return {
                "allowed": True,
                "blur_applied": result["blur_applied"],
                "face_count": result["face_count"],
                "processed_frame": result["processed_image"] if result["blur_applied"] else None
            }
            
        except Exception as e:
            logger.error(f"Privacy check failed: {e}")
            return {"error": str(e), "allowed": False}


class ConversationManager:
    """Manages conversation state and interruption handling."""
    
    def __init__(self):
        self.state = AgentState()
        self.is_speaking = False
        self.interrupt_buffer = []
    
    async def handle_user_input(self, input_text: str, audio_data: Optional[bytes] = None) -> Dict[str, Any]:
        """Handle user input with interruption support."""
        if self.is_speaking:
            # Queue interruption
            self.interrupt_buffer.append({
                "type": "user_interrupt",
                "text": input_text,
                "audio": audio_data,
                "timestamp": asyncio.get_event_loop().time()
            })
            return {"status": "interrupted", "message": "Agent will pause and respond"}
        
        # Process normal input
        response = await self._generate_response(input_text)
        return response
    
    async def _generate_response(self, user_input: str) -> Dict[str, Any]:
        """Generate contextual response based on current state."""
        # Add to conversation history
        self.state.conversation_history.append({
            "role": "user",
            "content": user_input,
            "timestamp": asyncio.get_event_loop().time()
        })
        
        # Generate contextual response considering room analysis
        context_prompt = self._build_context_prompt(user_input)
        
        # Use Gemini for response generation
        model = gcp_clients.get_spatial_model()
        response = model.generate_content(context_prompt)
        
        # Add to history
        self.state.conversation_history.append({
            "role": "assistant", 
            "content": response.text,
            "timestamp": asyncio.get_event_loop().time()
        })
        
        return {
            "response": response.text,
            "context": self.state.current_room_analysis,
            "status": "completed"
        }
    
    def _build_context_prompt(self, user_input: str) -> str:
        """Build context-aware prompt including room analysis."""
        base_prompt = f"""You are an architectural AI assistant helping users transform their living spaces. 
        
Current context: {json.dumps(self.state.current_room_analysis or {}, indent=2)}

User input: {user_input}

Recent conversation:
{self._get_recent_history()}

Provide a helpful, contextual response about architectural transformation possibilities. 
Consider the current room layout and materials in your suggestions."""
        
        return base_prompt
    
    def _get_recent_history(self, limit: int = 5) -> str:
        """Get recent conversation history."""
        recent = self.state.conversation_history[-limit:]
        return "\n".join([f"{msg['role']}: {msg['content']}" for msg in recent])


class ArchitecturalAlchemistAgent:
    """Main ADK-powered agent for architectural transformation."""
    
    def __init__(self):
        self.privacy_shield = PrivacyShield()
        self.conversation_manager = ConversationManager()
        
        # Initialize ADK agent with tools
        self.agent = LlmAgent(
            name="Architectural Alchemist",
            model="gemini-1.5-pro",
            instructions="""You are an AI architectural assistant that helps users transform their living spaces.
            
Key capabilities:
- Analyze architectural elements in real-time video
- Provide design suggestions based on room layout
- Maintain privacy by detecting and blurring faces
- Handle interruptions gracefully
- Remember conversation context

Always be helpful, creative, and prioritize user privacy.""",
            tools=[
                ArchitecturalAnalysisTool(),
                PrivacyShieldTool(self.privacy_shield)
            ]
        )
    
    async def process_video_frame(self, frame_data: str, user_input: Optional[str] = None) -> Dict[str, Any]:
        """Process video frame with ADK agent."""
        # Set frame in tool context
        tool_context = {"current_frame": frame_data}
        
        # Privacy check first
        privacy_result = await self.privacy_shield.process_frame_for_frontend(frame_data)
        
        if not privacy_result["allowed"]:
            return {
                "status": "blocked",
                "reason": "Privacy protection activated",
                "privacy_result": privacy_result
            }
        
        # Process with agent if user input provided
        if user_input:
            response = await self.conversation_manager.handle_user_input(user_input)
            return {
                "status": "success",
                "agent_response": response,
                "privacy_result": privacy_result
            }
        
        return {
            "status": "frame_processed",
            "privacy_result": privacy_result
        }
    
    async def handle_interruption(self, interrupt_data: Dict[str, Any]) -> Dict[str, Any]:
        """Handle user interruption gracefully."""
        return await self.conversation_manager.handle_user_input(
            interrupt_data.get("text", ""),
            interrupt_data.get("audio")
        )


# Global agent instance
architectural_agent = ArchitecturalAlchemistAgent()
