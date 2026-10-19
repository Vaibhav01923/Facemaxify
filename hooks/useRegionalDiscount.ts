import { useState, useEffect } from 'react';
import { FIRST_PRICE_LABEL } from '../i18n/offer';

export const useRegionalDiscount = () => {
    const [discount, setDiscount] = useState<{
        isEligible: boolean;
        code: string;
        region: string;
        link: string;
        /** Price shown inside a buy button, e.g. "$0.99". */
        price: string;
        /** Short terms under every buy button: the monthly price after the first payment, cancel anytime. */
        terms: string;
    }>({
        isEligible: false,
        code: '',
        region: '',
        // No discount code here: the checkout is fixed on the server (api/checkout.js).
        link: '/api/checkout',
        price: FIRST_PRICE_LABEL,
        terms: '', // billing terms are shown on Dodo's checkout page
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
