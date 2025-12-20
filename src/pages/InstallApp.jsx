import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Smartphone, Share, MoreVertical, Plus, Chrome } from 'lucide-react';

export default function InstallApp() {
  const [platform, setPlatform] = useState('unknown');

  useEffect(() => {
    // Detect platform
    const userAgent = navigator.userAgent || navigator.vendor || window.opera;
    
    if (/iPad|iPhone|iPod/.test(userAgent) && !window.MSStream) {
      setPlatform('ios');
    } else if (/android/i.test(userAgent)) {
      setPlatform('android');
    } else {
      setPlatform('desktop');
    }
  }, []);

  return (
    <div className="min-h-screen bg-[#0A0A0B] text-white pb-24">
      <div className="max-w-lg mx-auto px-6 py-8">
        <Link to={createPageUrl('Settings')}>
          <Button variant="ghost" className="mb-8 text-gray-400 hover:text-white">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Settings
          </Button>
        </Link>

        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-[#25A55F]/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Smartphone className="w-10 h-10 text-[#25A55F]" />
          </div>
          <h1 className="text-3xl font-bold mb-2">Install Session Buddy</h1>
          <p className="text-gray-400">Get the full app experience on your device</p>
        </div>

        {/* Benefits */}
        <div className="bg-[#141416] border border-gray-800 rounded-2xl p-6 mb-8">
          <h2 className="text-lg font-semibold mb-4">Why Install?</h2>
          <div className="space-y-3 text-sm text-gray-300">
            <div className="flex items-start gap-3">
              <div className="w-5 h-5 rounded-full bg-[#25A55F]/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                <div className="w-2 h-2 rounded-full bg-[#25A55F]" />
              </div>
              <span>Quick access from your home screen</span>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-5 h-5 rounded-full bg-[#25A55F]/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                <div className="w-2 h-2 rounded-full bg-[#25A55F]" />
              </div>
              <span>Full-screen app experience</span>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-5 h-5 rounded-full bg-[#25A55F]/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                <div className="w-2 h-2 rounded-full bg-[#25A55F]" />
              </div>
              <span>Faster loading and smoother performance</span>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-5 h-5 rounded-full bg-[#25A55F]/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                <div className="w-2 h-2 rounded-full bg-[#25A55F]" />
              </div>
              <span>Works offline once loaded</span>
            </div>
          </div>
        </div>

        {/* Platform-specific instructions */}
        {platform === 'ios' && (
          <div className="bg-[#141416] border border-gray-800 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-blue-500/10 rounded-xl flex items-center justify-center">
                <Share className="w-5 h-5 text-blue-400" />
              </div>
              <h2 className="text-lg font-semibold">iPhone/iPad Instructions</h2>
            </div>
            
            <ol className="space-y-4 text-sm text-gray-300">
              <li className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-[#25A55F] text-black font-bold flex items-center justify-center text-xs">
                  1
                </span>
                <div>
                  <p className="font-medium text-white mb-1">Open Safari</p>
                  <p className="text-gray-400">Make sure you're viewing this page in Safari browser (not Chrome or other browsers)</p>
                </div>
              </li>
              
              <li className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-[#25A55F] text-black font-bold flex items-center justify-center text-xs">
                  2
                </span>
                <div>
                  <p className="font-medium text-white mb-1">Tap the Share button</p>
                  <p className="text-gray-400">Look for the <Share className="inline w-4 h-4 mx-1" /> icon at the bottom of your screen</p>
                </div>
              </li>
              
              <li className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-[#25A55F] text-black font-bold flex items-center justify-center text-xs">
                  3
                </span>
                <div>
                  <p className="font-medium text-white mb-1">Select "Add to Home Screen"</p>
                  <p className="text-gray-400">Scroll down in the menu and tap "Add to Home Screen"</p>
                </div>
              </li>
              
              <li className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-[#25A55F] text-black font-bold flex items-center justify-center text-xs">
                  4
                </span>
                <div>
                  <p className="font-medium text-white mb-1">Confirm</p>
                  <p className="text-gray-400">Tap "Add" in the top right corner</p>
                </div>
              </li>
            </ol>
          </div>
        )}

        {platform === 'android' && (
          <div className="bg-[#141416] border border-gray-800 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-green-500/10 rounded-xl flex items-center justify-center">
                <Chrome className="w-5 h-5 text-green-400" />
              </div>
              <h2 className="text-lg font-semibold">Android Instructions</h2>
            </div>
            
            <ol className="space-y-4 text-sm text-gray-300">
              <li className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-[#25A55F] text-black font-bold flex items-center justify-center text-xs">
                  1
                </span>
                <div>
                  <p className="font-medium text-white mb-1">Open Chrome</p>
                  <p className="text-gray-400">Make sure you're viewing this page in Chrome browser</p>
                </div>
              </li>
              
              <li className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-[#25A55F] text-black font-bold flex items-center justify-center text-xs">
                  2
                </span>
                <div>
                  <p className="font-medium text-white mb-1">Tap the Menu button</p>
                  <p className="text-gray-400">Look for the <MoreVertical className="inline w-4 h-4 mx-1" /> icon in the top right corner</p>
                </div>
              </li>
              
              <li className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-[#25A55F] text-black font-bold flex items-center justify-center text-xs">
                  3
                </span>
                <div>
                  <p className="font-medium text-white mb-1">Select "Add to Home screen" or "Install app"</p>
                  <p className="text-gray-400">You may see a banner at the bottom prompting you to install</p>
                </div>
              </li>
              
              <li className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-[#25A55F] text-black font-bold flex items-center justify-center text-xs">
                  4
                </span>
                <div>
                  <p className="font-medium text-white mb-1">Confirm</p>
                  <p className="text-gray-400">Tap "Install" or "Add" to complete</p>
                </div>
              </li>
            </ol>
          </div>
        )}

        {platform === 'desktop' && (
          <div className="bg-[#141416] border border-gray-800 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-purple-500/10 rounded-xl flex items-center justify-center">
                <Chrome className="w-5 h-5 text-purple-400" />
              </div>
              <h2 className="text-lg font-semibold">Desktop Instructions</h2>
            </div>
            
            <ol className="space-y-4 text-sm text-gray-300">
              <li className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-[#25A55F] text-black font-bold flex items-center justify-center text-xs">
                  1
                </span>
                <div>
                  <p className="font-medium text-white mb-1">Look for the install icon</p>
                  <p className="text-gray-400">In Chrome, look for a <Plus className="inline w-4 h-4 mx-1" /> or install icon in the address bar</p>
                </div>
              </li>
              
              <li className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-[#25A55F] text-black font-bold flex items-center justify-center text-xs">
                  2
                </span>
                <div>
                  <p className="font-medium text-white mb-1">Click "Install"</p>
                  <p className="text-gray-400">Follow the prompts to install Session Buddy as a desktop app</p>
                </div>
              </li>
            </ol>
            
            <div className="mt-6 pt-6 border-t border-gray-800">
              <p className="text-sm text-gray-400 text-center">
                For the best experience, access Session Buddy from a mobile device
              </p>
            </div>
          </div>
        )}

        {/* Footer note */}
        <div className="mt-8 text-center text-sm text-gray-500">
          <p>Once installed, open Session Buddy from your home screen like any other app</p>
        </div>
      </div>
    </div>
  );
}