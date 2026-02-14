import { MetricResult } from "./ratioCalculator";

export const getAiRecommendations = async (metrics: MetricResult[], frontPhotoUrl: string | null): Promise<string> => {
  try {
    const response = await fetch('/api/generate-recommendations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        metrics,
        frontPhotoUrl,
      }),
    });

    if (!response.ok) {
        const err = await response.json(); 
        throw new Error(err.error || 'Failed to fetch recommendations');
    }

    const data = await response.json();
    return data.analysis;
  } catch (error) {
    console.error("AI Service Error:", error);
    return "Unable to generate AI analysis at this time. Please try again later.";
  }
};
