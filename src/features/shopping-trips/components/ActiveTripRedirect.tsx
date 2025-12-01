import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getActiveTrip } from '../api';
import { getShoppingListByCode } from '../../shopping-lists/api';
import { getStoredShareCodes } from '../../../shared/utils/shoppingListStorage';
import { toast } from 'react-toastify';

export const ActiveTripRedirect: React.FC = () => {
    const navigate = useNavigate();
    const [isChecking, setIsChecking] = useState(true);

    useEffect(() => {
        const checkActiveTrip = async () => {
            try {
                // Get all the user's stored list share codes
                const shareCodes = getStoredShareCodes();

                if (shareCodes.length === 0) {
                    toast.info('No shopping lists found. Create a list first!');
                    navigate('/shopping-lists', { replace: true });
                    setIsChecking(false);
                    return;
                }

                // Check each list for an active trip
                for (const shareCode of shareCodes) {
                    try {
                        const list = await getShoppingListByCode(shareCode);
                        if (list) {
                            const trip = await getActiveTrip(list.id);
                            if (trip) {
                                // Found an active trip for one of the user's lists!
                                navigate(`/shopping-lists/${shareCode}?view=trip`, { replace: true });
                                setIsChecking(false);
                                return;
                            }
                        }
                    } catch (error) {
                        console.warn(`Failed to check list ${shareCode}:`, error);
                        // Continue checking other lists
                    }
                }

                // No active trip found in any of the user's lists
                toast.info('No active shopping trip found');
                navigate('/shopping-lists', { replace: true });
            } catch (error) {
                console.error('Failed to check active trip:', error);
                navigate('/shopping-lists', { replace: true });
            } finally {
                setIsChecking(false);
            }
        };

        checkActiveTrip();
    }, [navigate]);

    if (isChecking) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-secondary">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand"></div>
            </div>
        );
    }

    return null;
};
