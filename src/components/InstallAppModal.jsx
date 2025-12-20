import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Share, MoreVertical, Plus, Chrome, Smartphone } from 'lucide-react';

export default function InstallAppModal({ isOpen, onClose }) {
  const [platform, setPlatform] = React.useState('unknown');

  React.useEffect(() => {
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
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-[#141416] border-gray-800 text-white max-w-lg max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 text-xl">
            <Smartphone className="w-6 h-6 text-[#25A55F]" />
            Install Session Buddy
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Benefits */}
          <div className="bg-[#0A0A0B] rounded-xl p-4">
            <h3 className="font-semibold mb-3 text-sm">Why Install?</h3>
            <div className="space-y-2 text-xs text-gray-400">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-[#25A55F]" />
                <span>Quick access from home screen</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-[#25A55F]" />
                <span>Full-screen app experience</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-[#25A55F]" />
                <span>Works offline once loaded</span>
              </div>
            </div>
          </div>

          {/* Platform-specific instructions */}
          {platform === 'ios' && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <Share className="w-4 h-4 text-blue-400" />
                <span>iPhone/iPad Instructions</span>
              </div>
              
              <ol className="space-y-3 text-sm text-gray-300">
                <li className="flex gap-2">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-[#25A55F] text-black font-bold flex items-center justify-center text-xs">1</span>
                  <span>Open this page in <strong>Safari</strong></span>
                </li>
                <li className="flex gap-2">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-[#25A55F] text-black font-bold flex items-center justify-center text-xs">2</span>
                  <span>Tap the <Share className="inline w-4 h-4 mx-1" /> Share button (bottom of screen)</span>
                </li>
                <li className="flex gap-2">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-[#25A55F] text-black font-bold flex items-center justify-center text-xs">3</span>
                  <span>Scroll down and tap "Add to Home Screen"</span>
                </li>
                <li className="flex gap-2">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-[#25A55F] text-black font-bold flex items-center justify-center text-xs">4</span>
                  <span>Tap "Add" in the top right</span>
                </li>
              </ol>
            </div>
          )}

          {platform === 'android' && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <Chrome className="w-4 h-4 text-blue-400" />
                <span>Android Instructions</span>
              </div>
              
              <ol className="space-y-3 text-sm text-gray-300">
                <li className="flex gap-2">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-[#25A55F] text-black font-bold flex items-center justify-center text-xs">1</span>
                  <span>Open this page in <strong>Chrome</strong></span>
                </li>
                <li className="flex gap-2">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-[#25A55F] text-black font-bold flex items-center justify-center text-xs">2</span>
                  <span>Tap the <MoreVertical className="inline w-4 h-4 mx-1" /> menu (top right)</span>
                </li>
                <li className="flex gap-2">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-[#25A55F] text-black font-bold flex items-center justify-center text-xs">3</span>
                  <span>Tap "Add to Home screen" or "Install app"</span>
                </li>
                <li className="flex gap-2">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-[#25A55F] text-black font-bold flex items-center justify-center text-xs">4</span>
                  <span>Tap "Add" or "Install"</span>
                </li>
              </ol>
            </div>
          )}

          {platform === 'desktop' && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <Chrome className="w-4 h-4 text-blue-400" />
                <span>Desktop Instructions</span>
              </div>
              
              <ol className="space-y-3 text-sm text-gray-300">
                <li className="flex gap-2">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-[#25A55F] text-black font-bold flex items-center justify-center text-xs">1</span>
                  <span>Look for an install icon <Plus className="inline w-4 h-4 mx-1" /> in your browser's address bar</span>
                </li>
                <li className="flex gap-2">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-[#25A55F] text-black font-bold flex items-center justify-center text-xs">2</span>
                  <span>Click it and select "Install"</span>
                </li>
                <li className="flex gap-2">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-[#25A55F] text-black font-bold flex items-center justify-center text-xs">3</span>
                  <span>Or open browser menu → "Install Session Buddy"</span>
                </li>
              </ol>
              
              <p className="text-xs text-gray-500 italic">
                Session Buddy works best on mobile devices. Consider opening this link on your phone for the optimal experience.
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}