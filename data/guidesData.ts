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
            title: "Professional Consultations",
            content: "If you struggle with severe acne, scarring, or blackheads, consider monthly professional cleanings. For serious conditions, always seek a dermatologist's help before resorting to unverified online advice or strong medications like Accutane."
          }
        ]
      },
      {
        title: "Nutritional Foundation",
        steps: [
          {
            title: "Coming Soon",
            content: "The nutritional section of this guide is currently being curated by our specialists. Stay tuned for scientifically-backed dietary protocols for skin health."
          }
        ]
      }
    ]
  }
];
