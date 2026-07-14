import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { PenSquare, Zap, Crown, History, MessageCircle, FlaskConical, BarChart3, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const [isPremium, setIsPremium] = useState(null);
  
  useEffect(() => {
    const checkPremium = async () => {
      try {
        const user = await base44.auth.me();
        setIsPremium(user?.isPremium || false);
      } catch (error) {
        setIsPremium(false);
      }
    };
    checkPremium();
  }, []);
  
  const navItems = React.useMemo(() => {
    const baseItems = [
      { name: 'Dose', icon: PenSquare, page: 'LogDose' },
      { name: 'Buzz', icon: Zap, page: 'BuzzResult' },
      { name: 'History', icon: History, page: 'History' },
      { name: 'AI', icon: MessageCircle, page: 'AICompanion', premium: true },
      { name: 'Predictor', icon: FlaskConical, page: 'Predictor', premium: true },
      { name: 'Insights', icon: BarChart3, page: 'Insights', premium: true },
      { name: 'Tolerance', icon: Sparkles, page: 'ToleranceCoach', premium: true }
    ];
    
    return baseItems;
  }, []);

  const tabRoutes = React.useMemo(() => ({
    Dose: [createPageUrl('LogDose')],
    Buzz: [createPageUrl('BuzzResult')],
    History: [createPageUrl('History')],
    AI: [createPageUrl('AICompanion'), createPageUrl('AIChatView')],
    Predictor: [createPageUrl('Predictor')],
    Insights: [createPageUrl('Insights')],
    Tolerance: [createPageUrl('ToleranceCoach')]
  }), []);

  useEffect(() => {
    const currentPath = location.pathname;
    const owningTab = Object.keys(tabRoutes).find(tab => (tabRoutes[tab] || []).includes(currentPath));
    if (owningTab) {
      try { localStorage.setItem('tab:lastPath:' + owningTab, currentPath); } catch {}
    }
  }, [location.pathname, tabRoutes]);

  // Reset-to-root: tapping an already-active tab clears saved path and navigates to base route
  const handleTabClick = (e, item) => {
    const routes = tabRoutes[item.name] || [createPageUrl(item.page)];
    const isActive = routes.includes(location.pathname);
    if (isActive) {
      e.preventDefault();
      try { localStorage.removeItem('tab:lastPath:' + item.name); } catch {}
      navigate(routes[0]);
    }
  };

  if (isPremium === null) {
    return (
      <nav className="fixed bottom-0 left-0 right-0 bg-[#0A0A0B]/95 backdrop-blur-xl border-t border-gray-800 z-50 no-select pb-[env(safe-area-inset-bottom)]" style={{ backgroundColor: '#0A0A0B' }}>
            <div className="max-w-lg mx-auto px-4">
              <div className="flex justify-around items-center h-20" />
            </div>
          </nav>
    );
  }
  
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-[#0A0A0B]/95 backdrop-blur-xl border-t border-gray-800 z-50 no-select pb-[env(safe-area-inset-bottom)]" style={{ backgroundColor: '#0A0A0B' }}>
      <div className="max-w-lg mx-auto px-2">
        <div className="flex justify-around items-center h-20">
          {navItems.map((item) => {
            const Icon = item.icon;
            const routes = tabRoutes[item.name] || [createPageUrl(item.page)];
            const isActive = routes.includes(location.pathname);
            const targetTo = (() => {
              try { return localStorage.getItem('tab:lastPath:' + item.name) || routes[0]; } catch { return routes[0]; }
            })();
            const showLock = item.premium && !isPremium;
            
            return (
              <Link
                key={item.name}
                to={targetTo}
                onClick={(e) => handleTabClick(e, item)}
                className={cn(
                  "flex flex-col items-center gap-1 transition-all duration-200 relative group no-select"
                )}
              >
                <div className={cn(
                  "w-11 h-11 inline-flex items-center justify-center rounded-xl transition-all duration-300 relative",
                  isActive ? "bg-[#25A55F]/20" : "hover:bg-gray-800"
                )}>
                  <Icon 
                    className={cn(
                      "w-5 h-5 transition-colors",
                      isActive ? "text-[#25A55F]" : "text-gray-400 group-hover:text-gray-200"
                    )} 
                    strokeWidth={isActive ? 2.5 : 2}
                  />
                  {showLock && (
                    <Crown className="w-3 h-3 text-purple-400 absolute -top-1 -right-1" />
                  )}
                </div>
                <span className={cn(
                  "text-xs font-medium transition-colors",
                  isActive ? "text-[#25A55F]" : "text-gray-500 group-hover:text-gray-300"
                )}>
                  {item.name}
                </span>
                {isActive && (
                  <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-[#25A55F] shadow-[0_0_8px_rgba(37,165,95,0.6)]" />
                )}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}