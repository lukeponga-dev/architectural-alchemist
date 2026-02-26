import { NextApiRequest, NextApiResponse } from 'next';
import vision from '@google-cloud/vision';

// Initialize the Google Cloud Vision client
const client = new vision.ImageAnnotatorClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method Not Allowed' });
    }

    try {
        const { imageBase64 } = req.body;

        if (!imageBase64) {
            return res.status(400).json({ message: 'Image data is required' });
        }

        // Call the Vision API
        const [result] = await client.imageProperties(Buffer.from(imageBase64, 'base64'));
        const colors = result.imagePropertiesAnnotation?.dominantColors?.colors || [];

        // Map to rgb format
        const extractedColors = colors.slice(0, 5).map(c => {
            const { red = 0, green = 0, blue = 0 } = c.color || {};
            return `rgb(${red}, ${green}, ${blue})`;
        });

        res.status(200).json({ colors: extractedColors });
    } catch (error) {
        console.error('Error extracting colors:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
}
