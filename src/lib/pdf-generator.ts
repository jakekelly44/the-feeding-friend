import { jsPDF } from 'jspdf';
import { getFoodsBySpecies, getTreatsBySpecies, calculatePortionSize, calculateDailyCost } from '@/data/food-recommendations';
import { getSectionInfo, calculateDailyCost as calcCost } from '@/lib/food-recommendations';

interface PetData {
  petName: string;
  species: 'dog' | 'cat';
  breed: string | null;
  weight: number;
  weightUnit: 'lb' | 'kg';
  dailyCalories: number;
  breakdown: Record<string, { label: string; value: number }> | null;
  priority: 'weight_control' | 'digestive_health' | 'ingredient_quality' | 'budget';
  recommendations?: any;
}

export function generateFeedingPlanPDF(data: PetData): void {
  const { petName, species, breed, weight, weightUnit, dailyCalories, breakdown } = data;
  
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  
  // Colors
  const deepTeal = [45, 125, 123] as const;
  const charcoal = [45, 52, 54] as const;
  const lightGray = [248, 249, 250] as const;
  
  // ===== PAGE 1: Cover & Summary =====
  
  // Header background
  doc.setFillColor(...deepTeal);
  doc.rect(0, 0, pageWidth, 40, 'F');
  
  // Title
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text('The Feeding Friend', pageWidth / 2, 18, { align: 'center' });
  
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text("Your Pet's Perfect Meal, Every Day", pageWidth / 2, 30, { align: 'center' });
  
  // Pet Name
  doc.setTextColor(...charcoal);
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text(`${petName}'s Personalized Feeding Plan`, pageWidth / 2, 60, { align: 'center' });
  
  // Date
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 100, 100);
  const dateStr = new Date().toLocaleDateString('en-US', { 
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' 
  });
  doc.text(`Generated: ${dateStr}`, pageWidth / 2, 70, { align: 'center' });
  
  // Pet Profile Box
  doc.setFillColor(...lightGray);
  doc.roundedRect(margin, 80, pageWidth - 2 * margin, 40, 3, 3, 'F');
  
  doc.setTextColor(...charcoal);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Pet Profile', margin + 10, 93);
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  const breedName = breed?.replace(/-/g, ' ') || 'Mixed/Unknown';
  doc.text(`Species: ${species === 'dog' ? 'Dog' : 'Cat'}`, margin + 10, 105);
  doc.text(`Weight: ${weight} ${weightUnit}`, margin + 10, 113);
  doc.text(`Breed: ${breedName}`, pageWidth / 2 + 10, 105);
  doc.text(`Daily Calories: ${dailyCalories} kcal`, pageWidth / 2 + 10, 113);
  
  // Main Result Box
  doc.setFillColor(...deepTeal);
  doc.roundedRect(margin, 130, pageWidth - 2 * margin, 50, 3, 3, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(10);
  doc.text('RECOMMENDED DAILY INTAKE', pageWidth / 2, 145, { align: 'center' });
  
  doc.setFontSize(36);
  doc.setFont('helvetica', 'bold');
  doc.text(`${dailyCalories}`, pageWidth / 2, 165, { align: 'center' });
  
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text('kcal per day', pageWidth / 2, 175, { align: 'center' });
  
  // Calculation Breakdown
  doc.setTextColor(...charcoal);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Calculation Breakdown', margin, 200);
  
  let yPos = 210;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  
  if (breakdown) {
    Object.entries(breakdown).forEach(([_, detail]) => {
      if (detail && detail.label && detail.value !== undefined) {
        doc.setTextColor(80, 80, 80);
        doc.text(detail.label, margin + 10, yPos);
        doc.setTextColor(...deepTeal);
        doc.setFont('helvetica', 'bold');
        doc.text(detail.value.toFixed(2), pageWidth - margin - 10, yPos, { align: 'right' });
        doc.setFont('helvetica', 'normal');
        yPos += 8;
      }
    });
  }
  
  // Footer
  doc.setFontSize(8);
  doc.setTextColor(150, 150, 150);
  doc.text('This is a general guideline. Always consult your veterinarian for specific dietary advice.', pageWidth / 2, pageHeight - 20, { align: 'center' });
  doc.text('The Feeding Friend | thefeedingfriend.com', pageWidth / 2, pageHeight - 12, { align: 'center' });
  
  // ===== PAGE 2: Food Recommendations (from database) =====
  doc.addPage();
  
  // Header
  doc.setFillColor(...deepTeal);
  doc.rect(0, 0, pageWidth, 25, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('Recommended Foods', pageWidth / 2, 16, { align: 'center' });
  
  yPos = 35;
  
  doc.setTextColor(...charcoal);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'italic');
  doc.text('Curated selections based on quality, nutrition, and value', pageWidth / 2, yPos, { align: 'center' });
  
  yPos += 15;
  
  // Render each category from database
  const categories: Array<'budget' | 'balanced' | 'premium' | 'sensitive'> = ['budget', 'balanced', 'premium', 'sensitive'];
  
  for (const category of categories) {
    const foods = data.recommendations?.[category] || [];
    if (foods.length === 0) continue;
    
    const sectionInfo = getSectionInfo(category);
    
    // Check if need new page
    if (yPos > pageHeight - 60) {
      doc.addPage();
      yPos = 20;
    }
    
    // Category header
    doc.setFillColor(...lightGray);
    doc.rect(margin, yPos, pageWidth - 2 * margin, 12, 'F');
    
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...deepTeal);
    doc.text(sectionInfo.title, margin + 5, yPos + 8);
    
    yPos += 14;
    
    doc.setFontSize(9);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(100, 100, 100);
    doc.text(sectionInfo.description, margin + 5, yPos);
    
    yPos += 10;
    
    // Show top 2 foods
    const topFoods = foods.slice(0, 2);
    
    for (const food of topFoods) {
      if (yPos > pageHeight - 40) {
        doc.addPage();
        yPos = 20;
      }
      
      // Food box
      doc.setDrawColor(200, 200, 200);
      doc.rect(margin, yPos, pageWidth - 2 * margin, 28, 'S');
      
      // Brand
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...charcoal);
      doc.text(food.brand || '', margin + 5, yPos + 8);
      
      // Product name with link
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      
      if (food.amazon_url) {
        doc.setTextColor(0, 102, 204);
        doc.textWithLink(food.name || '', margin + 5, yPos + 15, { url: food.amazon_url });
      } else {
        doc.setTextColor(...charcoal);
        doc.text(food.name || '', margin + 5, yPos + 15);
      }
      
      // Cost info
      if (food.calories_per_cup && food.price_per_bag && food.bag_size_cups) {
        const costInfo = calcCost(food, dailyCalories);
        doc.setFontSize(8);
        doc.setTextColor(100, 100, 100);
        doc.text(`$${costInfo.costPerDay.toFixed(2)}/day`, margin + 5, yPos + 21);
        doc.text(`${costInfo.cupsPerDay.toFixed(2)} ${food.style || 'cups'}/day`, margin + 60, yPos + 21);
      }
      
      // Amazon link
      if (food.amazon_url) {
        doc.setFontSize(8);
        doc.setTextColor(0, 102, 204);
        doc.textWithLink('View on Amazon', pageWidth - margin - 35, yPos + 21, { url: food.amazon_url });
      }
      
      yPos += 32;
    }
    
    yPos += 8;
  }
  
  // ===== PAGE 3: Feeding Tips =====
  doc.addPage();
  
  // Header
  doc.setFillColor(...deepTeal);
  doc.rect(0, 0, pageWidth, 30, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('Feeding Guidelines', pageWidth / 2, 15, { align: 'center' });
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Customized tips for ${petName}`, pageWidth / 2, 24, { align: 'center' });
  
  yPos = 45;
  
  const tips = [
    {
      title: 'Meal Frequency',
      content: species === 'dog' 
        ? 'Adult dogs typically do well with 2 meals per day. Puppies may need 3-4 smaller meals. Split the daily calories evenly between meals.'
        : 'Cats often prefer multiple small meals throughout the day. Consider leaving dry food out for grazing, or feed 2-4 measured meals.',
    },
    {
      title: 'Hydration',
      content: 'Fresh, clean water should always be available. Wet food provides additional hydration. Monitor water intake, especially with dry food diets.',
    },
    {
      title: 'Treat Allowance',
      content: `Treats should make up no more than 10% of daily calories. For ${petName}, that's about ${Math.round(dailyCalories * 0.1)} kcal in treats per day.`,
    },
    {
      title: 'Monitoring Weight',
      content: 'Weigh your pet every 2-4 weeks during the first few months. Adjust portions by 10% if weight changes unexpectedly.',
    },
    {
      title: 'Transitioning Foods',
      content: 'When switching foods, transition gradually over 7-10 days. Start with 25% new food, increasing by 25% every 2-3 days.',
    },
  ];
  
  tips.forEach((tip) => {
    doc.setTextColor(...charcoal);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text(tip.title, margin, yPos);
    
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(80, 80, 80);
    const lines = doc.splitTextToSize(tip.content, pageWidth - 2 * margin);
    doc.text(lines, margin, yPos + 7);
    
    yPos += 10 + (lines.length * 5) + 8;
  });
  
  // Treats section
  const treats = getTreatsBySpecies(species);
  if (treats.length > 0 && yPos < pageHeight - 60) {
    yPos += 10;
    doc.setTextColor(...charcoal);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Recommended Treats', margin, yPos);
    yPos += 10;
    
    treats.slice(0, 3).forEach((treat) => {
      doc.setFillColor(...lightGray);
      doc.roundedRect(margin, yPos, pageWidth - 2 * margin, 15, 2, 2, 'F');
      
      doc.setTextColor(...charcoal);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.text(treat.brand, margin + 5, yPos + 7);
      
      doc.setFont('helvetica', 'normal');
      doc.text(treat.sku_name.substring(0, 40), margin + 5, yPos + 12);
      
      doc.setTextColor(...deepTeal);
      doc.setFont('helvetica', 'bold');
      doc.text(`${treat.calories_per_treat} kcal each`, pageWidth - margin - 5, yPos + 9, { align: 'right' });
      
      yPos += 20;
    });
  }
  
  // Footer
  doc.setFontSize(8);
  doc.setTextColor(150, 150, 150);
  doc.text('Disclaimer: Individual needs may vary. Always consult with your veterinarian.', pageWidth / 2, pageHeight - 10, { align: 'center' });
  
  // ===== FINAL PAGE: Pet Food Guide CTA =====
  doc.addPage();
  
  let ctaY = 20;
  
  // Title
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...charcoal);
  doc.text("Want Confidence in What You're Feeding?", pageWidth / 2, ctaY, { align: 'center' });
  
  ctaY += 15;
  
  // Body paragraphs
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(80, 80, 80);
  
  const paragraphs = [
    "You've already built a feeding plan — that answers how much to feed.",
    "",
    "The Pet Food Guide helps with the harder question: what food actually",
    "deserves to be in the bowl.",
    "",
    "Instead of marketing claims or brand rankings, the guide breaks down:",
  ];
  
  paragraphs.forEach(para => {
    doc.text(para, pageWidth / 2, ctaY, { align: 'center' });
    ctaY += 5;
  });
  
  ctaY += 3;
  
  // Bullets
  const bullets = [
    "• how to read pet food labels without the hype",
    "• what terms like 'human-grade,' 'fresh,' and 'complete' really mean",
    "• which brands prioritize ingredient quality, transparency, and safety"
  ];
  
  bullets.forEach(bullet => {
    doc.text(bullet, margin + 10, ctaY);
    ctaY += 6;
  });
  
  ctaY += 6;
  
  doc.text("It's built to reduce decision fatigue — not create more choices.", pageWidth / 2, ctaY, { align: 'center' });
  ctaY += 10;
  
  // "Inside" section
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text("Inside the Pet Food Guide you'll find:", pageWidth / 2, ctaY, { align: 'center' });
  ctaY += 8;
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  
  const insideBullets = [
    "• 50+ carefully curated food options across dry, cooked, raw, and freeze-dried",
    "• Clear explanations, not paid endorsements",
    "• Pros and tradeoffs for each category of food",
    "• Guidance you can reuse every time you shop — not just once"
  ];
  
  insideBullets.forEach(bullet => {
    doc.text(bullet, margin + 10, ctaY);
    ctaY += 6;
  });
  
  ctaY += 8;
  
  doc.setFont('helvetica', 'italic');
  doc.text("No ads. No sponsored placements. No pressure to buy anything specific.", pageWidth / 2, ctaY, { align: 'center' });
  ctaY += 10;
  
  doc.setFont('helvetica', 'normal');
  const finalText = [
    "If you want to feel confident that the food you're choosing actually aligns",
    "with the plan you just built, the Pet Food Guide was made for you."
  ];
  
  finalText.forEach(line => {
    doc.text(line, pageWidth / 2, ctaY, { align: 'center' });
    ctaY += 5;
  });
  
  ctaY += 10;
  
  // CTA Button
  doc.setFillColor(...deepTeal);
  doc.roundedRect(pageWidth / 2 - 40, ctaY, 80, 12, 3, 3, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('Get the Pet Food Guide', pageWidth / 2, ctaY + 8, { align: 'center' });
  
  // Make it clickable
  doc.link(pageWidth / 2 - 40, ctaY, 80, 12, { url: 'https://the-remote-roadmap.kit.com/products/pet-food-guide' });
  
  ctaY += 20;
  
  // Disclaimer
  doc.setFontSize(7);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(120, 120, 120);
  const disclaimer = "This plan is informational only and not a substitute for veterinary advice. Always consult your veterinarian for medical concerns or before making significant dietary changes. Individual animals can vary by up to 50% from predicted calorie needs.";
  const disclaimerLines = doc.splitTextToSize(disclaimer, pageWidth - 2 * margin);
  doc.text(disclaimerLines, pageWidth / 2, ctaY, { align: 'center' });
  
  // Save
  doc.save(`${petName}_Feeding_Plan.pdf`);
}
