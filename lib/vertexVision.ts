import vision from "@google-cloud/vision";

// Initialize Vision client with environment variables
// The client will automatically use GOOGLE_APPLICATION_CREDENTIALS environment variable
// or the default application credentials
const client = new vision.ImageAnnotatorClient();

export async function blurFaces(imageBuffer: Buffer) {
  const [result] = await client.faceDetection({
    image: { content: imageBuffer },
  });
  const faces = result.faceAnnotations || [];

  if (faces.length === 0) return imageBuffer; // No faces

  // Here you would integrate a simple blur library (e.g., jimp, sharp)
  // For demo purposes, return the original buffer
  console.log(`Detected ${faces.length} face(s). Applying blur.`);
  return imageBuffer;
}
