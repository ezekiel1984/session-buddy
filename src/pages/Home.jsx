import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import LoadingScreen from '@/components/LoadingScreen';

export default function Home() {
  const navigate = useNavigate();

  useEffect(() => {
    // Immediately redirect to Landing page
    navigate(createPageUrl('Landing'), { replace: true });
  }, [navigate]);

  // Show loading screen during redirect
  return <LoadingScreen />;
}