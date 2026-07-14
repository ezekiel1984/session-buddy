/**
 * pages.config.js - Page routing configuration
 * 
 * This file is AUTO-GENERATED. Do not add imports or modify PAGES manually.
 * Pages are auto-registered when you create files in the ./pages/ folder.
 * 
 * THE ONLY EDITABLE VALUE: mainPage
 * This controls which page is the landing page (shown when users visit the app).
 * 
 * Example file structure:
 * 
 *   import HomePage from './pages/HomePage';
 *   import Dashboard from './pages/Dashboard';
 *   import Settings from './pages/Settings';
 *   
 *   export const PAGES = {
 *       "HomePage": HomePage,
 *       "Dashboard": Dashboard,
 *       "Settings": Settings,
 *   }
 *   
 *   export const pagesConfig = {
 *       mainPage: "HomePage",
 *       Pages: PAGES,
 *   };
 * 
 * Example with Layout (wraps all pages):
 *
 *   import Home from './pages/Home';
 *   import Settings from './pages/Settings';
 *   import __Layout from './Layout.jsx';
 *
 *   export const PAGES = {
 *       "Home": Home,
 *       "Settings": Settings,
 *   }
 *
 *   export const pagesConfig = {
 *       mainPage: "Home",
 *       Pages: PAGES,
 *       Layout: __Layout,
 *   };
 *
 * To change the main page from HomePage to Dashboard, use find_replace:
 *   Old: mainPage: "HomePage",
 *   New: mainPage: "Dashboard",
 *
 * The mainPage value must match a key in the PAGES object exactly.
 */
import AIChatView from './pages/AIChatView';
import AICompanion from './pages/AICompanion';
import Badges from './pages/Badges';
import BuzzResult from './pages/BuzzResult';
import Help from './pages/Help';
import History from './pages/History';
import Home from './pages/Home';
import Insights from './pages/Insights';
import Landing from './pages/Landing';
import LogDose from './pages/LogDose';
import MyStrains from './pages/MyStrains';
import Predictor from './pages/Predictor';
import Premium from './pages/Premium';
import PrivacyPolicy from './pages/PrivacyPolicy';
import SafetyInfo from './pages/SafetyInfo';
import Settings from './pages/Settings';
import ShareView from './pages/ShareView';
import TermsOfUse from './pages/TermsOfUse';
import TestTools from './pages/TestTools';
import ToleranceCoach from './pages/ToleranceCoach';
import Welcome from './pages/Welcome';
import __Layout from './Layout.jsx';


export const PAGES = {
    "AIChatView": AIChatView,
    "AICompanion": AICompanion,
    "Badges": Badges,
    "BuzzResult": BuzzResult,
    "Help": Help,
    "History": History,
    "Home": Home,
    "Insights": Insights,
    "Landing": Landing,
    "LogDose": LogDose,
    "MyStrains": MyStrains,
    "Predictor": Predictor,
    "Premium": Premium,
    "PrivacyPolicy": PrivacyPolicy,
    "SafetyInfo": SafetyInfo,
    "Settings": Settings,
    "ShareView": ShareView,
    "TermsOfUse": TermsOfUse,
    "TestTools": TestTools,
    "ToleranceCoach": ToleranceCoach,
    "Welcome": Welcome,
}

export const pagesConfig = {
    mainPage: "Landing",
    Pages: PAGES,
    Layout: __Layout,
};