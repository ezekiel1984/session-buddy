import Landing from './pages/Landing';
import Premium from './pages/Premium';
import AICompanion from './pages/AICompanion';
import BuzzResult from './pages/BuzzResult';
import History from './pages/History';
import Settings from './pages/Settings';
import PaymentSuccess from './pages/PaymentSuccess';
import TestTools from './pages/TestTools';
import PrivacyPolicy from './pages/PrivacyPolicy';
import TermsOfUse from './pages/TermsOfUse';
import InstallApp from './pages/InstallApp';
import Insights from './pages/Insights';
import PortalReturn from './pages/PortalReturn';
import AIChatView from './pages/AIChatView';
import Badges from './pages/Badges';
import ShareView from './pages/ShareView';
import LogDose from './pages/LogDose';
import Predictor from './pages/Predictor';
import ToleranceCoach from './pages/ToleranceCoach';
import Help from './pages/Help';
import MyStrains from './pages/MyStrains';
import Welcome from './pages/Welcome';
import Home from './pages/Home';
import SafetyInfo from './pages/SafetyInfo';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Landing": Landing,
    "Premium": Premium,
    "AICompanion": AICompanion,
    "BuzzResult": BuzzResult,
    "History": History,
    "Settings": Settings,
    "PaymentSuccess": PaymentSuccess,
    "TestTools": TestTools,
    "PrivacyPolicy": PrivacyPolicy,
    "TermsOfUse": TermsOfUse,
    "InstallApp": InstallApp,
    "Insights": Insights,
    "PortalReturn": PortalReturn,
    "AIChatView": AIChatView,
    "Badges": Badges,
    "ShareView": ShareView,
    "LogDose": LogDose,
    "Predictor": Predictor,
    "ToleranceCoach": ToleranceCoach,
    "Help": Help,
    "MyStrains": MyStrains,
    "Welcome": Welcome,
    "Home": Home,
    "SafetyInfo": SafetyInfo,
}

export const pagesConfig = {
    mainPage: "Landing",
    Pages: PAGES,
    Layout: __Layout,
};