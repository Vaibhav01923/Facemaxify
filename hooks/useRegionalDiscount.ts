import { useState, useEffect } from 'react';

export const useRegionalDiscount = () => {
    const [discount, setDiscount] = useState<{
        isEligible: boolean;
        code: string;
        region: string;
    }>({ isEligible: false, code: '', region: '' });

    useEffect(() => {
        try {
            const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
            // Check for Indian Timezones
            // Check for Indian Timezones
            // TEMPORARILY DISABLED
            /*
            if (timeZone === 'Asia/Calcutta' || timeZone === 'Asia/Kolkata') {
                setDiscount({
                    isEligible: true,
                    code: 'PPP50',
                    region: 'India'
                });
            }
            */
        } catch (e) {
            console.error("Failed to detect region", e);
        }
    }, []);

    return discount;
};
