import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import LoadingScreen from '@/components/LoadingScreen';
import toast from 'react-hot-toast'; // Using react-hot-toast here, consider unifying with sonner later if needed

export default function PortalReturn() {
  const navigate = useNavigate();

  useEffect(() => {
    const handleReturnFromPortal = async () => {
      try {
        // Force a refresh of the user session after returning from Stripe Portal
        // This helps re-establish authentication if it was lost during redirect.
        await base44.auth.me(); // This will refresh the internal user state and token.
        
        toast.success('Subscription status updated!', { duration: 3000 });
        navigate(createPageUrl('Settings'), { replace: true });
      } catch (error) {
        console.error('Error handling return from Stripe portal:', error);
        toast.error('Failed to update subscription status. Please log in again.', { duration: 5000 });
        // Redirect to login or landing if session is truly lost
        await base44.auth.redirectToLogin(window.location.origin + createPageUrl('Settings'));
      }
    };

    handleReturnFromPortal();
  }, [navigate]);

  return <LoadingScreen />;
}