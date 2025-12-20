
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Sparkles, Loader2, Leaf, Edit, Save, X, Trash2, ArrowLeft } from 'lucide-react';
import BottomNav from '@/components/BottomNav';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

const EFFECTS = [
  { key: 'effectEnergy', label: 'Energy', icon: '⚡', color: 'bg-yellow-500' },
  { key: 'effectFocus', label: 'Focus', icon: '🎯', color: 'bg-blue-500' },
  { key: 'effectRelaxation', label: 'Relaxation', icon: '😌', color: 'bg-green-500' },
  { key: 'effectCreativity', label: 'Creativity', icon: '🎨', color: 'bg-purple-500' },
  { key: 'effectSleep', label: 'Sleepiness', icon: '😴', color: 'bg-indigo-500' },
  { key: 'effectAnxiety', label: 'Anxiety Relief', icon: '🧘', color: 'bg-teal-500' },
  { key: 'effectPainRelief', label: 'Pain Relief', icon: '💊', color: 'bg-red-500' },
  { key: 'effectEuphoria', label: 'Euphoria', icon: '✨', color: 'bg-pink-500' }
];

export default function MyStrains() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [strains, setStrains] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingStrain, setEditingStrain] = useState(null);
  const [editForm, setEditForm] = useState({}); // Initialize as an empty object
  const [saving, setSaving] = useState(false);
  const [strainToDelete, setStrainToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);

      // REMOVED: Premium check - now accessible to all users
      // if (!currentUser?.isPremium) {
      //   navigate(createPageUrl('Premium'));
      //   return;
      // }

      // FIXED: Don't include created_by in filter - RLS handles it automatically
      const userStrains = await base44.entities.StrainProfile.filter(
        {},
        '-lastUsed',
        100
      );

      setStrains(userStrains);
    } catch (error) {
      console.error('Error loading strains:', error);
      toast.error('Failed to load strains');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (strain) => {
    setEditingStrain(strain.id);
    setEditForm({
      thcPercent: strain.thcPercent || '',
      cbdPercent: strain.cbdPercent || '',
      notes: strain.notes || ''
    });
  };

  const handleSave = async (strainId) => {
    setSaving(true);
    try {
      // Parse numeric values and handle empty strings
      const updateData = {
        thcPercent: editForm.thcPercent ? parseFloat(editForm.thcPercent) : null,
        cbdPercent: editForm.cbdPercent ? parseFloat(editForm.cbdPercent) : null,
        notes: editForm.notes || ''
      };
      
      await base44.entities.StrainProfile.update(strainId, updateData);
      toast.success('Strain updated!');
      setEditingStrain(null);
      loadData();
    } catch (error) {
      console.error('Error updating strain:', error);
      toast.error('Failed to update strain');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setEditingStrain(null);
    setEditForm({});
  };

  const handleDelete = async () => {
    if (!strainToDelete) return;
    
    setDeleting(true);
    try {
      await base44.entities.StrainProfile.delete(strainToDelete.id);
      toast.success('Strain deleted');
      setStrainToDelete(null);
      loadData();
    } catch (error) {
      console.error('Error deleting strain:', error);
      toast.error('Failed to delete strain');
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A0A0B] pb-24 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#25A55F] animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0A0B] pb-24">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -left-1/4 w-96 h-96 bg-[#25A55F]/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 -right-1/4 w-96 h-96 bg-[#25A55F]/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      <div className="relative z-10 max-w-lg mx-auto px-6 py-8">
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(createPageUrl('Settings'))}
            className="text-gray-400 hover:text-white hover:bg-gray-800 flex-shrink-0"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-3 flex-1">
            <div className="p-2 rounded-xl bg-[#25A55F]/10">
              <Leaf className="w-6 h-6 text-[#25A55F]" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">My Strains</h1>
              <p className="text-gray-400 text-sm">{strains.length} strain{strains.length !== 1 ? 's' : ''} tracked</p>
            </div>
          </div>
        </div>

        {strains.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-20 h-20 bg-[#141416] rounded-full flex items-center justify-center mx-auto mb-4">
              <Leaf className="w-10 h-10 text-gray-600" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">No strains yet</h3>
            <p className="text-gray-400 mb-6">Start logging sessions to build your strain library</p>
            <Button
              onClick={() => navigate(createPageUrl('LogDose'))}
              className="bg-[#25A55F] hover:bg-[#1e8a4c]"
            >
              Log Your First Dose
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {strains.map((strain, idx) => (
              <motion.div
                key={strain.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="bg-[#141416] border border-gray-800 rounded-2xl p-6 soft-shadow"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-white font-semibold text-lg mb-1">{strain.strainName}</h3>
                    <div className="flex items-center gap-3 text-sm text-gray-400">
                      {strain.thcPercent && (
                        <span className="text-[#25A55F]">{strain.thcPercent}% THC</span>
                      )}
                      {strain.cbdPercent && (
                        <span>• {strain.cbdPercent}% CBD</span>
                      )}
                      {strain.totalSessions > 0 && (
                        <span>• {strain.totalSessions} session{strain.totalSessions !== 1 ? 's' : ''}</span>
                      )}
                    </div>
                  </div>
                  {editingStrain !== strain.id && (
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleEdit(strain)}
                        className="text-gray-400 hover:text-white hover:bg-gray-800"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setStrainToDelete(strain)}
                        className="text-red-400 hover:text-red-300 hover:bg-red-950/20"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                </div>

                {editingStrain === strain.id ? (
                  <div className="space-y-4 mt-4">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs text-gray-400">THC %</label>
                        <Input
                          type="number"
                          value={editForm.thcPercent}
                          onChange={(e) => setEditForm({...editForm, thcPercent: e.target.value})}
                          className="bg-[#0A0A0B] border-gray-700 text-white"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-gray-400">CBD %</label>
                        <Input
                          type="number"
                          value={editForm.cbdPercent}
                          onChange={(e) => setEditForm({...editForm, cbdPercent: e.target.value})}
                          className="bg-[#0A0A0B] border-gray-700 text-white"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-xs text-gray-400">Notes</label>
                      <Textarea
                        value={editForm.notes}
                        onChange={(e) => setEditForm({...editForm, notes: e.target.value})}
                        placeholder="Add personal notes about this strain..."
                        className="bg-[#0A0A0B] border-gray-700 text-white"
                        rows={3}
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={handleCancel}
                        variant="outline"
                        size="sm"
                        className="flex-1 border-gray-700 bg-[#0A0A0B] text-gray-300 hover:text-white hover:bg-gray-800"
                      >
                        <X className="w-4 h-4 mr-1" />
                        Cancel
                      </Button>
                      <Button
                        onClick={() => handleSave(strain.id)}
                        disabled={saving}
                        size="sm"
                        className="flex-1 bg-[#25A55F] hover:bg-[#1e8a4c] text-white"
                      >
                        {saving ? (
                          <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                        ) : (
                          <Save className="w-4 h-4 mr-1" />
                        )}
                        Save
                      </Button>
                    </div>
                  </div>
                ) : (
                  <>
                    {strain.notes && (
                      <p className="text-gray-400 text-sm mt-3 italic">"{strain.notes}"</p>
                    )}

                    {strain.totalRatings > 0 && (
                      <div className="mt-4 pt-4 border-t border-gray-800">
                        <div className="flex items-center gap-2 mb-3">
                          <Sparkles className="w-4 h-4 text-[#25A55F]" />
                          <span className="text-sm text-gray-400">
                            Effect Profile ({strain.totalRatings} rating{strain.totalRatings !== 1 ? 's' : ''})
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          {EFFECTS.map(effect => {
                            const value = strain[effect.key];
                            if (!value || value === 0) return null;
                            return (
                              <div key={effect.key} className="flex items-center gap-2">
                                <span className="text-lg">{effect.icon}</span>
                                <div className="flex-1">
                                  <div className="text-xs text-gray-400">{effect.label}</div>
                                  <div className="flex items-center gap-1 mt-1">
                                    {[...Array(5)].map((_, i) => (
                                      <div
                                        key={i}
                                        className={`w-2 h-2 rounded-full ${
                                          i < Math.round(value) ? effect.color : 'bg-gray-700'
                                        }`}
                                      />
                                    ))}
                                    <span className="text-xs text-gray-500 ml-1">{value.toFixed(1)}</span>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </div>

      <BottomNav />

      <AlertDialog open={!!strainToDelete} onOpenChange={() => setStrainToDelete(null)}>
        <AlertDialogContent className="bg-[#141416] border-gray-800">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Delete {strainToDelete?.strainName}?</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-400">
              This will permanently delete this strain profile. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-gray-800 text-white border-gray-700 hover:bg-gray-700">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {deleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
