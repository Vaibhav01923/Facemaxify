import { MetricResult } from "./ratioCalculator";
import { getPreferredLanguage } from "./attribution";

// Visitors who came through the Spanish / Japanese pages get the report text in that language
// (the API ignores anything else); English requests are sent exactly as before.
const languageField = () => {
  const language = getPreferredLanguage();
  return language === "en" ? {} : { language };
};

export const getAiRecommendations = async (metrics: MetricResult[], frontPhotoUrl: string | null): Promise<any> => {
  try {
    // Get Clerk session token for authentication
    const token = await (window as any).Clerk?.session?.getToken();
    
    if (!token) {
      throw new Error('Authentication required');
    }

    const response = await fetch('/api/generate-recommendations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`, // Add auth token
      },
      body: JSON.stringify({
        metrics,
        frontPhotoUrl,
        ...languageField(),
      }),
    });

    if (!response.ok) {
        const err = await response.json(); 
        throw new Error(err.error || 'Failed to fetch recommendations');
    }

    const data = await response.json();
    return data.analysis; // This is now a JSON object
  } catch (error) {
    console.error("AI Service Error:", error);
    return null; // Return null on error
  }
};

export const generateHairstyleAnalysis = async (photoUrl: string): Promise<string | null> => {
  try {
    const token = await (window as any).Clerk?.session?.getToken();
    if (!token) throw new Error('Authentication required');

    const response = await fetch('/api/generate-hairstyle-analysis', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ photoUrl, ...languageField() }),
    });

    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error || 'Failed to generate hairstyle analysis');
    }

    const data = await response.json();
    return data.image;
  } catch (error) {
    console.error('Hairstyle Analysis Error:', error);
    return null;
  }
};

export const generateColorAnalysis = async (photoUrl: string): Promise<string | null> => {
  try {
    const token = await (window as any).Clerk?.session?.getToken();
    if (!token) throw new Error('Authentication required');

    const response = await fetch('/api/generate-color-analysis', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ photoUrl, ...languageField() }),
    });

    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error || 'Failed to generate color analysis');
    }

    const data = await response.json();
    return data.image; // base64 data URL
  } catch (error) {
    console.error('Color Analysis Error:', error);
    return null;
  }
};

export const generateSkincareRoutine = async (
    currentPhotoUrl: string,
): Promise<any> => {
  try {
    const token = await (window as any).Clerk?.session?.getToken();

    if (!token) {
      throw new Error('Authentication required');
    }

    const response = await fetch('/api/generate-skincare', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ currentPhotoUrl, ...languageField() }),
    });

    if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Failed to generate skincare routine');
    }

    const data = await response.json();
    return data.result;
  } catch (error) {
    console.error("Skincare AI Error:", error);
    return null;
  }
};
