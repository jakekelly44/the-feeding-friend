import { jsPDF } from 'jspdf';
import { getFoodsBySpecies, getTreatsBySpecies, calculatePortionSize, calculateDailyCost } from '@/data/food-recommendations';

interface PetData {
  petName: string;
  species: 'dog' | 'cat';
  breed: string | null;
  weight: number;
  weightUnit: 'lb' | 'kg';
  dailyCalories: number;
  breakdown: Record<string, { label: string; value: number }> | null;
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
  
  // ===== PAGE 2: Food Recommendations =====
  doc.addPage();
  
  // Header
  doc.setFillColor(...deepTeal);
  doc.rect(0, 0, pageWidth, 30, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('Recommended Foods', pageWidth / 2, 15, { align: 'center' });
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('Curated selections based on quality, nutrition, and value', pageWidth / 2, 24, { align: 'center' });
  
  const foods = getFoodsBySpecies(species);
  yPos = 45;
  
  const categories = [
    { key: 'budget', label: 'Budget-Friendly', desc: 'Great nutrition at a lower cost' },
    { key: 'balanced', label: 'Balanced Choice', desc: 'Optimal balance of quality and price' },
    { key: 'sensitive', label: 'Sensitive Stomach', desc: 'Gentle formulas for digestive health' },
    { key: 'premium', label: 'Premium Pick', desc: 'Top-tier ingredients and nutrition' },
  ];
  
  categories.forEach((cat) => {
    const catFoods = foods.filter(f => f.category === cat.key);
    if (catFoods.length === 0) return;
    
    // Check page break
    if (yPos > pageHeight - 60) {
      doc.addPage();
      yPos = 20;
    }
    
    // Category header
    doc.setTextColor(...charcoal);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text(cat.label, margin, yPos);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 100, 100);
    doc.text(cat.desc, margin, yPos + 6);
    yPos += 14;
    
    catFoods.forEach((food) => {
      if (yPos > pageHeight - 40) {
        doc.addPage();
        yPos = 20;
      }
      
      const portion = calculatePortionSize(dailyCalories, food);
      const dailyCost = calculateDailyCost(dailyCalories, food);
      
      // Food card background
      doc.setFillColor(...lightGray);
      doc.roundedRect(margin, yPos, pageWidth - 2 * margin, 22, 2, 2, 'F');
      
      doc.setTextColor(...charcoal);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text(food.brand, margin + 5, yPos + 8);
      
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 100, 100);
      doc.text(food.sku_name.substring(0, 45) + (food.sku_name.length > 45 ? '...' : ''), margin + 5, yPos + 15);
      
      // Right side - portion and cost
      doc.setTextColor(...deepTeal);
      doc.setFont('helvetica', 'bold');
      doc.text(`${portion.cups} cups/day`, pageWidth - margin - 5, yPos + 8, { align: 'right' });
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 100, 100);
      doc.text(`~$${dailyCost.toFixed(2)}/day`, pageWidth - margin - 5, yPos + 15, { align: 'right' });
      
      yPos += 28;
    });
    
    yPos += 5;
  });
  
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
  
  // Save
  doc.save(`${petName}_Feeding_Plan.pdf`);
}
