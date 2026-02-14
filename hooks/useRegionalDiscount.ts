import { useState, useEffect } from 'react';

export const useRegionalDiscount = () => {
    const [discount, setDiscount] = useState<{
        isEligible: boolean;
        code: string;
        region: string;
        link: string;
        price: string;
    }>({ 
        isEligible: false, 
        code: '', 
        region: '',
        link: '/api/checkout?products=98df164f-7f50-4df1-bba7-0a24d340f60c', // Standard Product ID
        price: '$5' 
    });

    useEffect(() => {
        try {
            const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
            // Check for Indian Timezones
            // TEMPORARILY DISABLED
            /*
            if (timeZone === 'Asia/Calcutta' || timeZone === 'Asia/Kolkata') {
                setDiscount({
                    isEligible: true,
                    code: 'PPP50',
                    region: 'India',
                    link: 'https://buy.stripe.com/test_...', // PPP link
                    price: '$14'
                });
            }
            */
        } catch (e) {
            console.error("Failed to detect region", e);
        }
    }, []);

    return discount;
};
