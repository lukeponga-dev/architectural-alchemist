/**
 * Color Engine for extracting and generating Tailwind config
 * dynamically based on the space's dominant color.
 */

export const extractDominantColors = async (file: File): Promise<string[]> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = async (event) => {
            try {
                const base64String = (event.target?.result as string).split(',')[1];

                // Fetch from API
                const response = await fetch('/api/extract-colors', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ imageBase64: base64String }),
                });

                if (!response.ok) {
                    throw new Error('Failed to extract colors');
                }

                const data = await response.json();
                resolve(data.colors || []);
            } catch (error) {
                reject(error);
            }
        };
        reader.onerror = (error) => reject(error);
        reader.readAsDataURL(file);
    });
};

export const generateTailwindConfig = (dominantColors: string[]) => {
    // Take top color and create a theme config
    const primary = dominantColors[0] || 'rgb(0, 243, 255)'; // Fallback to cyan

    return {
        theme: {
            extend: {
                colors: {
                    charcoal: '#121212',
                    primary: primary,
                    // Generate a semi-transparent version for the glass effect
                    glass: primary.replace('rgb', 'rgba').replace(')', ', 0.15)'),
                }
            }
        }
    };
};
