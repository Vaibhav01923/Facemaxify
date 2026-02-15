import { MetricResult } from "./ratioCalculator";

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

export const generateSkincareRoutine = async (
    currentPhotoUrl: string, 
    previousPhotoUrl: string | null = null, 
    daysSinceLastScan: number | null = null
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
      body: JSON.stringify({
        currentPhotoUrl,
        previousPhotoUrl,
        daysSinceLastScan
      }),
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
