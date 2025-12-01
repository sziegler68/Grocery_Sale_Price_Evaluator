import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAnyActiveTrip } from '../api';
import { getShoppingListByCode } from '../../shopping-lists/api';
import { toast } from 'react-toastify';

export const ActiveTripRedirect: React.FC = () => {
    const navigate = useNavigate();
    const [isChecking, setIsChecking] = useState(true);

    useEffect(() => {
        const checkActiveTrip = async () => {
            try {
                const trip = await getAnyActiveTrip();
                if (trip) {
                    // Get the list to find its share code
                    const list = await getShoppingListByCode(trip.list_id);
                    if (list) {
                        navigate(`/shopping-lists/${list.share_code}?view=trip`, { replace: true });
                        return;
                    }
                }

                // No active trip or list not found
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
