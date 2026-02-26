/**
 * Dynamic Color Palette Engine
 * Extracts dominant colors from room photos and generates complementary Tailwind CSS
 */

import { brandColors } from "../styles/brand-system";

export interface ExtractedColor {
  hex: string;
  rgb: { r: number; g: number; b: number };
  hsl: { h: number; s: number; l: number };
  percentage: number;
  name?: string;
}

export interface ColorPalette {
  primary: ExtractedColor;
  secondary: ExtractedColor;
  accent: ExtractedColor;
  neutral: ExtractedColor;
  tailwindConfig: Record<string, string>;
}

export class ColorPaletteEngine {
  private canvas: HTMLCanvasElement | undefined;
  private ctx: CanvasRenderingContext2D | undefined;

  constructor() {
    if (typeof window !== "undefined") {
      this.canvas = document.createElement("canvas");
      this.ctx = this.canvas.getContext("2d")!;
    }
  }

  /**
   * Extract dominant colors from an image
   */
  async extractColors(imageUrl: string): Promise<ExtractedColor[]> {
    return new Promise((resolve, reject) => {
      if (!this.canvas || !this.ctx) {
        reject(new Error("Canvas not available in SSR environment"));
        return;
      }

      const img = new Image();
      img.crossOrigin = "anonymous";

      img.onload = () => {
        try {
          this.canvas!.width = img.width;
          this.canvas!.height = img.height;
          this.ctx!.drawImage(img, 0, 0);

          const imageData = this.ctx!.getImageData(0, 0, img.width, img.height);
          const colors = this.analyzePixels(imageData.data);

          resolve(this.groupSimilarColors(colors));
        } catch (error) {
          reject(error);
        }
      };

      img.onerror = reject;
      img.src = imageUrl;
    });
  }

  /**
   * Analyze pixels to get color frequency
   */
  private analyzePixels(
    pixels: Uint8ClampedArray,
  ): Map<string, { count: number; rgb: { r: number; g: number; b: number } }> {
    const colorMap = new Map();
    const step = 4; // Sample every 4th pixel for performance

    for (let i = 0; i < pixels.length; i += 4 * step) {
      const r = pixels[i];
      const g = pixels[i + 1];
      const b = pixels[i + 2];
      const a = pixels[i + 3];

      // Skip transparent or very light/dark pixels
      if (
        a < 128 ||
        (r > 240 && g > 240 && b > 240) ||
        (r < 15 && g < 15 && b < 15)
      ) {
        continue;
      }

      // Quantize colors to reduce variations
      const quantizedR = Math.round(r / 32) * 32;
      const quantizedG = Math.round(g / 32) * 32;
      const quantizedB = Math.round(b / 32) * 32;

      const key = `${quantizedR},${quantizedG},${quantizedB}`;
      const existing = colorMap.get(key);

      if (existing) {
        existing.count++;
      } else {
        colorMap.set(key, {
          count: 1,
          rgb: { r: quantizedR, g: quantizedG, b: quantizedB },
        });
      }
    }

    return colorMap;
  }

  /**
   * Group similar colors and sort by frequency
   */
  private groupSimilarColors(colorMap: Map<string, any>): ExtractedColor[] {
    const colors: ExtractedColor[] = [];
    const totalPixels = Array.from(colorMap.values()).reduce(
      (sum, color) => sum + color.count,
      0,
    );

    for (const [key, data] of colorMap) {
      const hex = this.rgbToHex(data.rgb.r, data.rgb.g, data.rgb.b);
      const hsl = this.rgbToHsl(data.rgb.r, data.rgb.g, data.rgb.b);

      colors.push({
        hex,
        rgb: data.rgb,
        hsl,
        percentage: (data.count / totalPixels) * 100,
        name: this.getColorName(hsl),
      });
    }

    // Sort by percentage and return top colors
    return colors.sort((a, b) => b.percentage - a.percentage).slice(0, 10);
  }

  /**
   * Generate a complementary color palette
   */
  generatePalette(extractedColors: ExtractedColor[]): ColorPalette {
    if (extractedColors.length < 4) {
      throw new Error("Not enough colors to generate a complete palette");
    }

    // Select colors based on visual properties
    const primary = this.selectPrimaryColor(extractedColors);
    const secondary = this.selectSecondaryColor(extractedColors, primary);
    const accent = this.selectAccentColor(extractedColors, primary, secondary);
    const neutral = this.selectNeutralColor(extractedColors);

    const tailwindConfig = this.generateTailwindConfig({
      primary,
      secondary,
      accent,
      neutral,
    });

    return {
      primary,
      secondary,
      accent,
      neutral,
      tailwindConfig,
    };
  }

  /**
   * Select primary color (most saturated, prominent color)
   */
  private selectPrimaryColor(colors: ExtractedColor[]): ExtractedColor {
    return (
      colors
        .filter(
          (color) => color.hsl.s > 20 && color.hsl.l > 20 && color.hsl.l < 80,
        )
        .sort((a, b) => b.hsl.s * b.percentage - a.hsl.s * a.percentage)[0] ||
      colors[0]
    );
  }

  /**
   * Select secondary color (complementary to primary)
   */
  private selectSecondaryColor(
    colors: ExtractedColor[],
    primary: ExtractedColor,
  ): ExtractedColor {
    const complementaryHue = (primary.hsl.h + 180) % 360;

    return (
      colors
        .filter((color) => Math.abs(color.hsl.h - complementaryHue) < 60)
        .sort((a, b) => b.percentage - a.percentage)[0] || colors[1]
    );
  }

  /**
   * Select accent color (triadic to primary)
   */
  private selectAccentColor(
    colors: ExtractedColor[],
    primary: ExtractedColor,
    secondary: ExtractedColor,
  ): ExtractedColor {
    const accentHue = (primary.hsl.h + 120) % 360;

    return (
      colors
        .filter(
          (color) =>
            color !== primary &&
            color !== secondary &&
            Math.abs(color.hsl.h - accentHue) < 45,
        )
        .sort((a, b) => b.hsl.s - a.hsl.s)[0] || colors[2]
    );
  }

  /**
   * Select neutral color (least saturated)
   */
  private selectNeutralColor(colors: ExtractedColor[]): ExtractedColor {
    return (
      colors
        .filter((color) => color.hsl.s < 30)
        .sort((a, b) => b.percentage - a.percentage)[0] || colors[3]
    );
  }

  /**
   * Generate Tailwind CSS configuration
   */
  private generateTailwindConfig(palette: {
    primary: ExtractedColor;
    secondary: ExtractedColor;
    accent: ExtractedColor;
    neutral: ExtractedColor;
  }): Record<string, string> {
    const generateShades = (
      color: ExtractedColor,
      prefix: string,
    ): Record<string, string> => {
      const shades: Record<string, string> = {};

      // Generate different shades using HSL manipulation
      for (let i = 100; i >= 900; i += 100) {
        const factor = i / 1000;
        let lightness = color.hsl.l;

        if (i < 500) {
          // Lighter shades
          lightness = color.hsl.l + (50 - color.hsl.l) * (1 - factor * 2);
        } else {
          // Darker shades
          lightness = color.hsl.l * (2 - factor * 2);
        }

        const hslColor = `hsl(${color.hsl.h}, ${color.hsl.s}%, ${Math.max(0, Math.min(100, lightness))}%)`;
        shades[`${prefix}-${i}`] = hslColor;
      }

      return shades;
    };

    return {
      ...generateShades(palette.primary, "room-primary"),
      ...generateShades(palette.secondary, "room-secondary"),
      ...generateShades(palette.accent, "room-accent"),
      ...generateShades(palette.neutral, "room-neutral"),
    };
  }

  /**
   * Convert RGB to Hex
   */
  private rgbToHex(r: number, g: number, b: number): string {
    return (
      "#" +
      [r, g, b]
        .map((x) => {
          const hex = x.toString(16);
          return hex.length === 1 ? "0" + hex : hex;
        })
        .join("")
    );
  }

  /**
   * Convert RGB to HSL
   */
  private rgbToHsl(
    r: number,
    g: number,
    b: number,
  ): { h: number; s: number; l: number } {
    r /= 255;
    g /= 255;
    b /= 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 0;
    let s = 0;
    const l = (max + min) / 2;

    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

      switch (max) {
        case r:
          h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
          break;
        case g:
          h = ((b - r) / d + 2) / 6;
          break;
        case b:
          h = ((r - g) / d + 4) / 6;
          break;
      }
    }

    return {
      h: Math.round(h * 360),
      s: Math.round(s * 100),
      l: Math.round(l * 100),
    };
  }

  /**
   * Get a descriptive name for a color
   */
  private getColorName(hsl: { h: number; s: number; l: number }): string {
    const hue = hsl.h;
    const saturation = hsl.s;
    const lightness = hsl.l;

    if (saturation < 10) {
      return lightness > 50 ? "White" : "Black";
    }

    if (hue >= 0 && hue < 30) return "Red";
    if (hue >= 30 && hue < 60) return "Orange";
    if (hue >= 60 && hue < 90) return "Yellow";
    if (hue >= 90 && hue < 150) return "Green";
    if (hue >= 150 && hue < 210) return "Cyan";
    if (hue >= 210 && hue < 270) return "Blue";
    if (hue >= 270 && hue < 330) return "Purple";
    if (hue >= 330 && hue < 360) return "Pink";

    return "Unknown";
  }

  /**
   * Complement room colors with brand colors
   */
  complementWithBrand(palette: ColorPalette): ColorPalette {
    // Ensure brand cyan is included as an accent
    const brandCyan: ExtractedColor = {
      hex: brandColors.primary.cyan,
      rgb: { r: 0, g: 243, b: 255 },
      hsl: { h: 182, s: 100, l: 50 },
      percentage: 0,
      name: "Brand Cyan",
    };

    return {
      ...palette,
      tailwindConfig: {
        ...palette.tailwindConfig,
        "brand-cyan": brandColors.primary.cyan,
        "brand-charcoal": brandColors.primary.charcoal,
      },
    };
  }
}

export default ColorPaletteEngine;
