// Real-world impact comparisons for CO2 emissions

export interface ImpactComparison {
  category: string;
  description: string;
  emoji: string;
}

export const getImpactComparison = (co2Grams: number): ImpactComparison => {
  const co2Kg = co2Grams / 1000;

  // Driving comparisons (assuming 120g CO2 per km for average car)
  if (co2Kg >= 0.12) {
    const km = (co2Kg / 0.12).toFixed(2);
    return {
      category: "Transportation",
      description: `Driving a car for ${km} km`,
      emoji: "🚗"
    };
  }

  // Phone charging (18g CO2 per charge)
  if (co2Kg >= 0.018) {
    const charges = Math.round(co2Kg / 0.018);
    return {
      category: "Energy",
      description: `Charging a phone ${charges} time${charges > 1 ? 's' : ''}`,
      emoji: "🔋"
    };
  }

  // Light bulb (60W bulb = 36g CO2 per hour)
  if (co2Kg >= 0.036) {
    const hours = (co2Kg / 0.036).toFixed(1);
    return {
      category: "Energy",
      description: `Powering a bulb for ${hours} hour${parseFloat(hours) > 1 ? 's' : ''}`,
      emoji: "💡"
    };
  }

  // Boiling water (7g CO2 per kettle)
  if (co2Kg >= 0.007) {
    const kettles = Math.round(co2Kg / 0.007);
    return {
      category: "Daily Life",
      description: `Boiling a kettle ${kettles} time${kettles > 1 ? 's' : ''}`,
      emoji: "☕"
    };
  }

  // Very small amounts - compare to breathing
  if (co2Kg < 0.007) {
    return {
      category: "Natural",
      description: "Less than a breath of CO2",
      emoji: "🌬️"
    };
  }

  return {
    category: "Environmental",
    description: `${co2Kg.toFixed(3)} kg of CO2`,
    emoji: "🌍"
  };
};

export const getSavingsComparison = (co2SavedGrams: number): ImpactComparison => {
  const co2Kg = co2SavedGrams / 1000;

  // Tree absorption (21kg CO2 per tree per year = 0.0575 kg per day)
  if (co2Kg >= 0.0575) {
    const days = (co2Kg / 0.0575).toFixed(1);
    return {
      category: "Environmental",
      description: `A tree's daily CO2 absorption for ${days} day${parseFloat(days) > 1 ? 's' : ''}`,
      emoji: "🌳"
    };
  }

  // Planting seeds comparison
  if (co2Kg >= 0.005) {
    const seedlings = Math.round(co2Kg / 0.005);
    return {
      category: "Environmental",
      description: `Planting ${seedlings} seedling${seedlings > 1 ? 's' : ''}`,
      emoji: "🌱"
    };
  }

  return {
    category: "Environmental",
    description: `Saved ${co2Kg.toFixed(3)} kg of CO2`,
    emoji: "✨"
  };
};

export const getWeeklyImpactMessage = (weeklyGrams: number): string => {
  const comparison = getImpactComparison(weeklyGrams);
  return `This week's emissions = ${comparison.emoji} ${comparison.description}`;
};
