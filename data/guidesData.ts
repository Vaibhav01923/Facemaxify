export interface GuideStep {
  title: string;
  image?: string;
  content: string;
}

export interface GuideSection {
  title: string;
  steps: GuideStep[];
}

export interface Guide {
  id: string;
  title: string;
  description: string;
  category: string;
  readTime: string;
  thumbnail: string;
  sections: GuideSection[];
}

export const guides: Guide[] = [
  {
    id: "model-tier-skin",
    title: "How to Achieve Model-Tier Skin",
    description: "A comprehensive routine for flawless, glowing skin using scientifically backed steps and products.",
    category: "Skincare",
    readTime: "8 min read",
    thumbnail: "/guides/skin/cleanser.jpg",
    sections: [
      {
        title: "Skincare Essentials",
        steps: [
          {
            title: "Facial Cleanser",
            image: "/guides/skin/cleanser.jpg",
            content: "Start the routine by rubbing a cleanser on your face in the morning and before bed to clear your skin's pores from dirt and oils that accumulate during the day. Avoid products containing alcohol, as they can excessively dry out your skin."
          },
          {
            title: "Moisturizer",
            image: "/guides/skin/moisturizer.jpg",
            content: "After cleaning your skin, apply a moisturizing lotion to keep it hydrated throughout the day. High-quality products from brands like CeraVe and Neutrogena are excellent for maintaining a healthy skin barrier."
          },
          {
            title: "SPF Cream",
            image: "/guides/skin/spf.jpg",
            content: "Always use sun protection cream before leaving your house. Even the darkest skin only has a natural SPF of around 15, which isn't enough to prevent long-term damage. Use at least SPF 30, and consider higher factors for your face. A moisturizer with built-in SPF is a smart, time-saving option."
          },
          {
            title: "Tretinoin (The Gold Standard)",
            image: "/guides/skin/tretinoin.jpg",
            content: "Retinoids like Tretinoin (Retin-A) do wonders for acne, skin tightness, wrinkle prevention, and collagen production. Start with the lowest strength (0.01% or 0.025%) and apply a pea-sized amount evenly before bed. It increases sun sensitivity, so daily SPF is non-negotiable."
          },
          {
            title: "Lip Care (Chapstick)",
            image: "/guides/skin/chapstick.jpg",
            content: "Dry, chapped lips can significantly detract from your aesthetic. Use a hydrating chapstick in the morning and before bed to keep your lips glowing and healthy."
          },
          {
            title: "Exfoliating",
            image: "/guides/skin/exfoliator.jpg",
            content: "Once or twice a week, exfoliate after cleansing to remove dead skin cells and reveal a fresh glow. Gently rub the exfoliating cream on your skin and wash thoroughly with water."
          },
          {
            title: "Red Light Therapy",
            image: "/guides/skin/red-light.jpg",
            content: "Use a red light lamp (approx. 670nm wavelength) once or twice a week for 15 minutes at a distance of 60-70cm. It increases blood flow, helps with elasticity, and improves overall mitochondrial function. Ensure you use protective eyewear."
          },
          {
            title: "Final Solution: Accutane",
            content: "If you suffer with very bad acne, Fu'k it and use Accutane, but if possible do it under the supervision of a dermatologist."
          }
        ]
      },
      {
        title: "Nutritional Foundation",
        steps: [
          {
            title: "Protein: The Building Block",
            image: "https://images.unsplash.com/photo-1558163351-db3a0a38e8ec?auto=format&fit=crop&q=80&w=800",
            content: "Eat enough protein to fuel your body as it literally creates everything from breaking the protein down into thousands of different amino acids, then rebuilding it to make your skin renew itself constantly. Aim for at least 2g / lean body mass kg (1 g / lbs) of animal-based protein per day."
          },
          {
            title: "Essential Animal Fats",
            image: "https://images.unsplash.com/photo-1514324263304-4c60011409f8?auto=format&fit=crop&q=80&w=800",
            content: "Animal fats are essential for keeping your skin healthy and strong. Don't hesitate to eat plenty of saturated fat and cholesterol. Omega 3 and Omega 6 fatty acids are essential nutrients the body can't produce itself; they are the building blocks of cell membranes. Focus on keeping the omega 3:6 ratio between 1:1 and 1:4."
          },
          {
            title: "Collagen Support",
            image: "https://images.unsplash.com/photo-1594041154568-1200df18d530?auto=format&fit=crop&q=80&w=800",
            content: "Aid your body's natural collagen production by making bone broth or supplementing through hydrolyzed animal collagen peptides (Beef, Fish, or Pork). Consuming around 20g of hydrolyzed beef collagen peptides daily can significantly improve skin elasticity."
          },
          {
            title: "Hyaluronic Acid",
            content: "Helps increase skin moisture and reduce dryness. You should aim for around 100-200mg daily from high-quality supplements."
          },
          {
            title: "Vitamin A: Nature's Superfood",
            image: "https://images.unsplash.com/photo-1543339308-43e59d6b73a6?auto=format&fit=crop&q=80&w=800",
            content: "Promotes skin health by providing protection from sunburn and fighting free radicals. Liver is the best natural source; just 100g of pork liver contains 700% of the RDA of vitamin A."
          },
          {
            title: "Vitamin C & Glucose Competition",
            image: "https://images.unsplash.com/photo-1512290923902-8a9f81dc2069?auto=format&fit=crop&q=80&w=800",
            content: "Ascorbic acid is essential for tissue repair and collagen formation. Crucially, glucose (sugar) competes with Vitamin C for absorption. If you eat many carbs, you need significantly more Vitamin C (aim for 2-3g per day). If you follow a carnivore-style diet, the natural ascorbic acid in liver (~40mg/100g) may suffice."
          },
          {
            title: "Vitamin D: Rejuvenation",
            image: "https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&q=80&w=800",
            content: "Helps protect skin from premature aging. Those with darker skin living in northern climates should definitely supplement exogenously. Oily fish like mackerel and herring are excellent natural sources."
          },
          {
            title: "Vitamin E: UV Defense",
            content: "A powerful antioxidant that reduces UV damage from the sun and fights inflammation. Fish and seafood are great animal sources."
          },
          {
            title: "Vitamin K2: Healing",
            content: "Helps heal wounds, bruises, and stretch marks, while also brightening dark circles under eyes. Stick to the K2 variant found in animal sources for optimal absorption."
          },
          {
            title: "Zinc: Anti-Inflammatory",
            content: "Effective against acne due to its powerful anti-inflammatory effects. Found in abundance in red meat."
          },
          {
            title: "Hydration Mastery",
            image: "https://images.unsplash.com/photo-1548839140-29a749e1cf4d?auto=format&fit=crop&q=80&w=800",
            content: "Consume at least 4-5 liters of water per day to help keep your skin moisturized from the inside out."
          }
        ]
      }
    ]
  }
];
