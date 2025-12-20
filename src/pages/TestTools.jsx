import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Wrench, Loader2, Trash2, TestTube, Cookie } from 'lucide-react';
import { getBuzzAndSoberInfo } from '@/components/utils/buzzCalculator';
import { toast } from 'sonner';
import BottomNav from '@/components/BottomNav';

export default function TestTools() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const currentUser = await base44.auth.me();
        
        // Check if user is admin
        if (currentUser.role !== 'admin') {
          navigate(createPageUrl('Landing'));
          return;
        }
        
        setUser(currentUser);
      } catch (error) {
        navigate(createPageUrl('Landing'));
      } finally {
        setLoading(false);
      }
    };
    loadUser();
  }, [navigate]);

  const createVapeSession = async () => {
    setActionLoading('vape');
    try {
      const now = new Date();
      const startedAt = new Date(now.getTime() - 45 * 60 * 1000).toISOString();
      
      const buzzInfo = getBuzzAndSoberInfo({
        method: 'vape',
        dosageMg: 20,
        strain: 'Test Vape Strain',
        startedAt,
        bodyWeightKg: 70,
        tolerance: 'medium'
      });

      await base44.entities.Session.create({
        uid: user.id,
        method: 'vape',
        dosageMg: 20,
        strain: 'Test Vape Strain',
        startedAt,
        bodyWeightKg: 70,
        tolerance: 'medium',
        buzzScore: buzzInfo.initialBuzzScore,
        soberAt: buzzInfo.soberAt
      });

      toast.success('Vape session created (45 min ago)');
    } catch (error) {
      console.error('Error creating vape session:', error);
      toast.error('Failed to create vape session');
    } finally {
      setActionLoading(null);
    }
  };

  const createEdibleSession = async () => {
    setActionLoading('edible');
    try {
      const now = new Date();
      const startedAt = new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString();
      
      const buzzInfo = getBuzzAndSoberInfo({
        method: 'edible',
        dosageMg: 20,
        strain: 'Test Edible Strain',
        startedAt,
        bodyWeightKg: 70,
        tolerance: 'medium'
      });

      await base44.entities.Session.create({
        uid: user.id,
        method: 'edible',
        dosageMg: 20,
        strain: 'Test Edible Strain',
        startedAt,
        bodyWeightKg: 70,
        tolerance: 'medium',
        buzzScore: buzzInfo.initialBuzzScore,
        soberAt: buzzInfo.soberAt
      });

      toast.success('Edible session created (2 hours ago)');
    } catch (error) {
      console.error('Error creating edible session:', error);
      toast.error('Failed to create edible session');
    } finally {
      setActionLoading(null);
    }
  };

  const clearMySessions = async () => {
    setActionLoading('clear');
    try {
      const sessions = await base44.entities.Session.filter({ uid: user.id });
      
      for (const session of sessions) {
        await base44.entities.Session.delete(session.id);
      }

      toast.success(`Cleared ${sessions.length} session(s)`);
    } catch (error) {
      console.error('Error clearing sessions:', error);
      toast.error('Failed to clear sessions');
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A0A0B] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-2 border-[#25A55F] border-t-transparent" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[#0A0A0B] pb-24">
      <div className="max-w-lg mx-auto px-6 py-8">
        <div className="mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-yellow-500/10 border border-yellow-500/20 mb-4">
            <Wrench className="w-4 h-4 text-yellow-500" />
            <span className="text-xs font-medium text-yellow-500">Admin Only</span>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Test Tools</h1>
          <p className="text-gray-400">Create test data and manage sessions</p>
        </div>

        <div className="space-y-4">
          <div className="bg-[#141416] border border-gray-800 rounded-2xl p-6 soft-shadow">
            <h2 className="text-white font-semibold text-lg mb-4 flex items-center gap-2">
              <TestTube className="w-5 h-5 text-[#25A55F]" />
              Create Test Sessions
            </h2>
            
            <div className="space-y-3">
              <Button
                onClick={createVapeSession}
                disabled={actionLoading === 'vape'}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white h-12 rounded-xl"
              >
                {actionLoading === 'vape' ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    💨 Vape 20mg (45 min ago)
                  </>
                )}
              </Button>

              <Button
                onClick={createEdibleSession}
                disabled={actionLoading === 'edible'}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white h-12 rounded-xl"
              >
                {actionLoading === 'edible' ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Cookie className="mr-2 h-4 w-4" />
                    Edible 20mg (2 hours ago)
                  </>
                )}
              </Button>
            </div>
          </div>

          <div className="bg-[#141416] border border-red-900/50 rounded-2xl p-6 soft-shadow">
            <h2 className="text-white font-semibold text-lg mb-4 flex items-center gap-2">
              <Trash2 className="w-5 h-5 text-red-400" />
              Danger Zone
            </h2>
            
            <Button
              onClick={clearMySessions}
              disabled={actionLoading === 'clear'}
              variant="outline"
              className="w-full border-red-900/50 text-red-400 hover:bg-red-950/20 h-12 rounded-xl"
            >
              {actionLoading === 'clear' ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Clearing...
                </>
              ) : (
                <>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Clear My Sessions
                </>
              )}
            </Button>
          </div>

          <div className="text-center mt-8">
            <Button
              onClick={() => navigate(createPageUrl('History'))}
              variant="ghost"
              className="text-gray-400 hover:text-white"
            >
              ← Back to History
            </Button>
          </div>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}