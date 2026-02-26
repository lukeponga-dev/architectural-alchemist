/**
 * Spatial Reasoning Tools for Architectural Alchemist
 * Identifies surfaces and coordinates for wall transformation
 */

import { GoogleGenerativeAI } from "@google/generative-ai";

export interface Point {
  x: number;
  y: number;
}

export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Surface {
  id: string;
  type: "wall" | "floor" | "ceiling" | "window" | "door";
  boundingBox: BoundingBox;
  confidence: number;
  normal: Point; // Surface normal vector
  material?: string;
  color?: string;
}

export interface SpatialAnalysis {
  surfaces: Surface[];
  roomDimensions: {
    width: number;
    height: number;
    depth: number;
  };
  cameraPosition: {
    x: number;
    y: number;
    z: number;
    rotation: number;
  };
  lightingConditions: {
    brightness: number;
    direction: string;
    quality: "natural" | "artificial" | "mixed";
  };
}

export interface IdentifySurfaceRequest {
  coordinates: Point;
  surfaceType?: "wall" | "floor" | "ceiling";
  imageWidth: number;
  imageHeight: number;
  imageData: string;
}

export interface IdentifySurfaceResponse {
  surface: Surface | null;
  alternativeSurfaces: Surface[];
  confidence: number;
  reasoning: string;
}

export class SpatialReasoningEngine {
  private genAI: GoogleGenerativeAI;
  private model: any;

  constructor(apiKey: string) {
    this.genAI = new GoogleGenerativeAI(apiKey);
    this.model = this.genAI.getGenerativeModel({ model: "gemini-1.5-pro" });
  }

  /**
   * Analyze entire room space and identify structural elements
   */
  async analyzeRoom(imageData: string): Promise<SpatialAnalysis> {
    try {
      const prompt = `
        Analyze this room image for architectural transformation.
        Identify the following structural elements:
        1. Walls (main structural surfaces)
        2. Floor and ceiling
        3. Windows and doors
        
        For each element, provide:
        - Bounding box in [ymin, xmin, ymax, xmax] format (normalized 0-1000)
        - Surface type
        - Material (e.g., concrete, wood, plaster)
        - Estimated confidence (0-1)
        
        Also estimate:
        - Room dimensions (width, height, depth in meters)
        - Camera position relative to the center of the room
        - Lighting quality (natural, artificial)
        
        Return ONLY a JSON object.
      `;

      const imagePart = {
        inlineData: {
          data: imageData,
          mimeType: "image/jpeg",
        },
      };

      const result = await this.model.generateContent([prompt, imagePart]);
      const response = await result.response;
      const text = response.text();

      return this.parseSpatialAnalysis(text);
    } catch (error) {
      console.error("Room analysis failed:", error);
      throw error;
    }
  }

  /**
   * Identify specific surface at specific pixel coordinates
   */
  async identifySurface(
    request: IdentifySurfaceRequest,
  ): Promise<IdentifySurfaceResponse> {
    try {
      // Convert pixel coordinates to normalized 0-1000 for Gemini
      const normX = Math.round(
        (request.coordinates.x / request.imageWidth) * 1000,
      );
      const normY = Math.round(
        (request.coordinates.y / request.imageHeight) * 1000,
      );

      const prompt = `
        Identify the architectural surface at normalized coordinate [${normY}, ${normX}].
        The image represents a room. Is this a wall, floor, ceiling, window, or door?
        
        Provide:
        1. The exact bounding box of the entire surface I am pointing at in [ymin, xmin, ymax, xmax] format.
        2. Its material and color.
        3. Why you believe this is the surface at that point.
        
        Return ONLY a JSON object with keys: "surface" (object), "confidence" (number), "reasoning" (string).
      `;

      const imagePart = {
        inlineData: {
          data: request.imageData,
          mimeType: "image/jpeg",
        },
      };

      const result = await this.model.generateContent([prompt, imagePart]);
      const response = await result.response;
      return this.parseSurfaceIdentification(response.text());
    } catch (error) {
      console.error("Surface identification failed:", error);
      throw error;
    }
  }

  /**
   * Calculate optimal transformation parameters
   */
  async calculateTransformation(
    surface: Surface,
    transformationType: string,
    style: string,
  ): Promise<{
    dimensions: BoundingBox;
    perspective: Point;
    lighting: any;
    materials: string[];
  }> {
    try {
      const prompt = `
        Given this surface information:
        - Type: ${surface.type}
        - Bounding box: ${JSON.stringify(surface.boundingBox)}
        - Normal vector: ${JSON.stringify(surface.normal)}
        
        For a "${transformationType}" transformation with "${style}" style:
        
        Calculate the optimal:
        1. Output dimensions (maintaining perspective)
        2. Perspective correction points
        3. Lighting adjustments needed
        4. Material recommendations
        
        Consider the surface orientation and room context for realistic results.
        Return as structured JSON.
      `;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      return this.parseTransformationParameters(text);
    } catch (error) {
      console.error("Error calculating transformation:", error);
      throw new Error(`Transformation calculation failed: ${error}`);
    }
  }

  /**
   * Validate surface for transformation
   */
  validateSurface(surface: Surface): {
    valid: boolean;
    issues: string[];
    recommendations: string[];
  } {
    const issues: string[] = [];
    const recommendations: string[] = [];

    // Check surface type
    if (!["wall", "floor", "ceiling"].includes(surface.type)) {
      issues.push(
        `Surface type ${surface.type} may not be suitable for transformation`,
      );
      recommendations.push("Consider focusing on walls, floors, or ceilings");
    }

    // Check confidence
    if (surface.confidence < 0.7) {
      issues.push(`Low confidence score: ${surface.confidence}`);
      recommendations.push(
        "Improve lighting or camera angle for better detection",
      );
    }

    // Check surface size
    const area = surface.boundingBox.width * surface.boundingBox.height;
    if (area < 10000) {
      // Less than 100x100 pixels
      issues.push("Surface area too small for meaningful transformation");
      recommendations.push("Focus on larger surfaces for better results");
    }

    // Check surface orientation
    if (surface.normal.y < 0.5 && surface.type === "floor") {
      issues.push("Floor surface appears to be at an odd angle");
      recommendations.push("Ensure camera is level for floor transformations");
    }

    return {
      valid: issues.length === 0,
      issues,
      recommendations,
    };
  }

  /**
   * Generate surface mask for processing
   */
  generateSurfaceMask(
    surface: Surface,
    imageWidth: number,
    imageHeight: number,
  ): string {
    // Create a mask for the surface region
    const mask = {
      type: "rectangle",
      coordinates: {
        x: surface.boundingBox.x,
        y: surface.boundingBox.y,
        width: surface.boundingBox.width,
        height: surface.boundingBox.height,
      },
      feather: 10, // Soft edges for blending
    };

    return JSON.stringify(mask);
  }

  /**
   * Parse spatial analysis from AI response
   */
  private parseSpatialAnalysis(text: string): SpatialAnalysis {
    try {
      // Extract JSON from response
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error("No JSON found in response");
      }

      const data = JSON.parse(jsonMatch[0]);

      // Validate and normalize the structure
      return {
        surfaces: data.surfaces || [],
        roomDimensions: data.roomDimensions || {
          width: 0,
          height: 0,
          depth: 0,
        },
        cameraPosition: data.cameraPosition || {
          x: 0,
          y: 0,
          z: 0,
          rotation: 0,
        },
        lightingConditions: data.lightingConditions || {
          brightness: 0,
          direction: "unknown",
          quality: "mixed",
        },
      };
    } catch (error) {
      console.error("Error parsing spatial analysis:", error);
      // Return default structure
      return {
        surfaces: [],
        roomDimensions: { width: 0, height: 0, depth: 0 },
        cameraPosition: { x: 0, y: 0, z: 0, rotation: 0 },
        lightingConditions: {
          brightness: 0,
          direction: "unknown",
          quality: "mixed",
        },
      };
    }
  }

  /**
   * Parse surface identification from AI response
   */
  private parseSurfaceIdentification(text: string): IdentifySurfaceResponse {
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error("No JSON found in response");
      }

      const data = JSON.parse(jsonMatch[0]);

      return {
        surface: data.surface || null,
        alternativeSurfaces: data.alternativeSurfaces || [],
        confidence: data.confidence || 0,
        reasoning: data.reasoning || "No reasoning provided",
      };
    } catch (error) {
      console.error("Error parsing surface identification:", error);
      return {
        surface: null,
        alternativeSurfaces: [],
        confidence: 0,
        reasoning: "Failed to parse response",
      };
    }
  }

  /**
   * Parse transformation parameters from AI response
   */
  private parseTransformationParameters(text: string): any {
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error("No JSON found in response");
      }

      return JSON.parse(jsonMatch[0]);
    } catch (error) {
      console.error("Error parsing transformation parameters:", error);
      return {
        dimensions: { width: 0, height: 0 },
        perspective: { x: 0, y: 0 },
        lighting: {},
        materials: [],
      };
    }
  }

  /**
   * Enhance analysis with depth data
   */
  private async enhanceWithDepthData(
    analysis: SpatialAnalysis,
    depthData: string,
  ): Promise<void> {
    // This would process depth data to improve surface detection
    // For now, it's a placeholder for future enhancement
    console.log("Enhancing with depth data...");
  }

  /**
   * Get surface statistics
   */
  getSurfaceStatistics(surfaces: Surface[]): {
    totalSurfaces: number;
    surfaceTypes: Record<string, number>;
    averageConfidence: number;
    largestSurface: Surface | null;
  } {
    const surfaceTypes: Record<string, number> = {};
    let totalConfidence = 0;
    let largestSurface: Surface | null = null;
    let maxArea = 0;

    surfaces.forEach((surface) => {
      // Count surface types
      surfaceTypes[surface.type] = (surfaceTypes[surface.type] || 0) + 1;

      // Sum confidence
      totalConfidence += surface.confidence;

      // Find largest surface
      const area = surface.boundingBox.width * surface.boundingBox.height;
      if (area > maxArea) {
        maxArea = area;
        largestSurface = surface;
      }
    });

    return {
      totalSurfaces: surfaces.length,
      surfaceTypes,
      averageConfidence:
        surfaces.length > 0 ? totalConfidence / surfaces.length : 0,
      largestSurface,
    };
  }
}

export default SpatialReasoningEngine;
