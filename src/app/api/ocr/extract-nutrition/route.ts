import { NextRequest, NextResponse } from 'next/server';
import vision from '@google-cloud/vision';

// Initialize Vision API client
const getVisionClient = () => {
  const credentials = JSON.parse(process.env.GOOGLE_VISION_CREDENTIALS || '{}');
  
  if (!credentials.private_key) {
    throw new Error('Google Vision credentials not configured');
  }

  return new vision.ImageAnnotatorClient({
    credentials,
  });
};

// Parse nutrition facts from text
function parseNutritionFacts(text: string) {
  const lines = text.split('\n').map(line => line.trim()).filter(Boolean);
  
  const nutrition: {
    calories?: number;
    protein?: number;
    fat?: number;
    fiber?: number;
    moisture?: number;
    servingSize?: string;
    servingUnit?: string;
  } = {};

  // Common patterns for nutrition facts
  const caloriesPattern = /(?:calories|calorie|kcal|energy)[\s:]*(\d+)/i;
  const proteinPattern = /protein[\s:]*(\d+(?:\.\d+)?)\s*%?/i;
  const fatPattern = /(?:fat|crude fat)[\s:]*(\d+(?:\.\d+)?)\s*%?/i;
  const fiberPattern = /fiber[\s:]*(\d+(?:\.\d+)?)\s*%?/i;
  const moisturePattern = /moisture[\s:]*(\d+(?:\.\d+)?)\s*%?/i;
  const servingSizePattern = /(?:serving size|serving)[\s:]*(\d+(?:\.\d+)?)\s*(cup|can|oz|g|kg|lb|piece)/i;

  const fullText = lines.join(' ');

  // Extract calories
  const caloriesMatch = fullText.match(caloriesPattern);
  if (caloriesMatch) {
    nutrition.calories = parseInt(caloriesMatch[1]);
  }

  // Extract protein
  const proteinMatch = fullText.match(proteinPattern);
  if (proteinMatch) {
    nutrition.protein = parseFloat(proteinMatch[1]);
  }

  // Extract fat
  const fatMatch = fullText.match(fatPattern);
  if (fatMatch) {
    nutrition.fat = parseFloat(fatMatch[1]);
  }

  // Extract fiber
  const fiberMatch = fullText.match(fiberPattern);
  if (fiberMatch) {
    nutrition.fiber = parseFloat(fiberMatch[1]);
  }

  // Extract moisture
  const moistureMatch = fullText.match(moisturePattern);
  if (moistureMatch) {
    nutrition.moisture = parseFloat(moistureMatch[1]);
  }

  // Extract serving size
  const servingMatch = fullText.match(servingSizePattern);
  if (servingMatch) {
    nutrition.servingSize = servingMatch[1];
    nutrition.servingUnit = servingMatch[2].toLowerCase();
  }

  // Try to find brand and product name from first few lines
  let brand = '';
  let productName = '';
  
  if (lines.length > 0) {
    // Usually brand is in first 1-2 lines
    brand = lines[0];
    if (lines.length > 1) {
      productName = lines[1];
    }
  }

  return {
    ...nutrition,
    brand,
    productName,
    rawText: text,
    confidence: Object.keys(nutrition).length > 2 ? 'high' : 'low',
  };
}

export async function POST(request: NextRequest) {
  try {
    const { image } = await request.json();

    if (!image) {
      return NextResponse.json(
        { error: 'No image provided' },
        { status: 400 }
      );
    }

    // Remove data URL prefix if present
    const base64Image = image.replace(/^data:image\/\w+;base64,/, '');

    // Initialize Vision client
    const client = getVisionClient();

    // Perform text detection
    const [result] = await client.textDetection({
      image: { content: base64Image },
    });

    const detections = result.textAnnotations;
    
    if (!detections || detections.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'No text found in image',
      });
    }

    // First annotation contains all detected text
    const fullText = detections[0]?.description || '';

    // Parse nutrition facts
    const nutritionData = parseNutritionFacts(fullText);

    return NextResponse.json({
      success: true,
      data: nutritionData,
    });

  } catch (error) {
    console.error('OCR Error:', error);
    
    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : 'OCR processing failed' 
      },
      { status: 500 }
    );
  }
}
