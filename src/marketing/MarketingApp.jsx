import React, { useEffect, useState } from "react";
import { BrowserRouter, Link, useLocation } from "react-router-dom";
import { ArrowUpRight, ArrowRight, Activity, BookOpen, BarChart3, MessageCircle, Package, Moon, CalendarDays, ShieldCheck, Smartphone, Menu, X, Check, Leaf } from "lucide-react";
import { LOGO_URL, SUPPORT_EMAIL, verifiedStoreUrl } from "./site-config";
import LegalContent from "./LegalContent";
import "./site.css";

function Brand() {
  return <Link to="/" className="site-brand" aria-label="Session Buddy home"><img src={LOGO_URL} width="46" height="46" alt="" /><span>Session Buddy<span className="brand-dot">.</span></span></Link>;
}
function Header() {
  const [expanded, setExpanded] = useState(false);
  const location = useLocation();
  useEffect(() => setExpanded(false), [location]);
  return <header className="site-header"><div className="site-wrap header-inner"><Brand />
    <button className="menu-toggle" aria-label={expanded ? "Close navigation" : "Open navigation"} aria-expanded={expanded} aria-controls="site-navigation" onClick={() => setExpanded(!expanded)}>{expanded ? <X /> : <Menu />}</button>
    <nav id="site-navigation" aria-label="Main navigation" className={expanded ? "site-nav expanded" : "site-nav"} onClick={() => setExpanded(false)}>
      <a href="/#features">The app</a><a href="/#how-it-works">How it works</a><a href="/#questions">FAQs</a><Link to="/support">Support</Link>
      <a className="site-button small" href="/#download">Get Session Buddy <ArrowUpRight size={16} /></a>
    </nav></div></header>;
}
function StoreLinks() {
  return <div className="store-links">{[["apple", "App Store", "iOS"], ["google", "Google Play", "Android"]].map(([platform, label, os]) => {
    const url = verifiedStoreUrl(platform);
    const content = <><Smartphone size={29} aria-hidden="true" /><span><small>{url ? "Download on" : os + " · coming soon"}</small><strong>{label}</strong></span>{url && <ArrowUpRight size={19} aria-hidden="true" />}</>;
    return url ? <a key={platform} href={url} target="_blank" rel="noopener noreferrer" className="store-link" aria-label={"Download Session Buddy from " + label}>{content}</a> : <div key={platform} className="store-link unavailable" aria-label={label + " listing coming soon"}>{content}</div>;
  })}</div>;
}
function Curve({ mini = false }) {
  return <svg className={mini ? "session-curve mini" : "session-curve"} viewBox="0 0 360 145" role="img" aria-label="Illustrative session history graph">
    <defs><linearGradient id={mini ? "mini-fill" : "curve-fill"} x1="0" y1="0" x2="0" y2="1"><stop stopColor="#78e2c3" stopOpacity=".24" /><stop offset="1" stopColor="#78e2c3" stopOpacity="0" /></linearGradient></defs>
    {[25,65,105].map(y => <path key={y} d={"M8 " + y + " H350"} stroke="#ffffff10" />)}
    <path d="M8 113 L28 113 C34 105 35 41 49 39 C79 34 84 80 130 87 L150 89 C160 82 159 29 173 29 C198 29 205 75 251 86 L271 89 C284 83 285 44 299 42 C319 41 331 67 350 72 L350 120 H8Z" fill={mini ? "url(#mini-fill)" : "url(#curve-fill)"} />
    <path d="M8 113 L28 113 C34 105 35 41 49 39 C79 34 84 80 130 87 L150 89 C160 82 159 29 173 29 C198 29 205 75 251 86 L271 89 C284 83 285 44 299 42 C319 41 331 67 350 72" fill="none" stroke="#78e2c3" strokeWidth="3" strokeLinecap="round" />
    <path d="M350 15 V120" stroke="#b7cfc6" strokeDasharray="3 5" /><circle cx="350" cy="72" r="4" fill="#c9ef9e" />
    <g fill="#91a69c" fontSize="10" fontFamily="inherit"><text x="8" y="140">−12h</text><text x="123" y="140">−8h</text><text x="236" y="140">−4h</text><text x="329" y="140">Now</text></g>
  </svg>;
}
function PhonePreview() {
  return <div className="product-stage"><div className="orb orb-one" /><div className="orb orb-two" />
    <div className="floating-label"><span className="live-dot" /> Your session, in perspective.</div>
    <div className="phone-frame"><div className="phone-island" /><div className="phone-screen">
      <div className="phone-brand"><img src={LOGO_URL} alt="" /><b>Session Buddy</b><span className="phone-avatar">K</span></div>
      <div className="phone-heading"><h3>Now</h3><span>Your personal overview</span></div>
      <div className="phone-buzz"><div className="preview-label"><Activity size={15} /> Estimated Buzz<span>App estimate</span></div><div className="buzz-value">3.6<span>/10</span></div><p>A moment in your session.</p></div>
      <div className="phone-graph"><div><strong>Your session, plotted.</strong><span>Last 12 hours</span></div><Curve /></div>
      <div className="phone-actions"><div><Check size={17} /> Log a dose</div><div><MessageCircle size={17} /> Buddy</div></div>
      <div className="phone-tabs">{[[Activity,"Now"],[BookOpen,"Journal"],[BarChart3,"Insights"],[Leaf,"Buddy"]].map(([Icon,label]) => <span key={label}><Icon size={19} />{label}</span>)}</div>
    </div></div>
    <div className="floating-note"><span className="note-icon"><BookOpen size={19} /></span><span><strong>Small check-ins. Bigger picture.</strong><small>Build a journal that feels like you.</small></span></div>
    <p className="preview-caption">Illustrative data · interface may evolve</p>
  </div>;
}
const features = [
  [BookOpen,"A journal that keeps up.","Log products, methods, amounts and how you felt. Keep the details in one place, instead of trying to remember them later."],
  [BarChart3,"Find your own patterns.","Explore your recorded use, check-ins and educational session estimates. See your history from a different angle."],
  [MessageCircle,"Meet your cannabis wingman.","Talk things through with Buddy AI. Choose which saved context to share for a more relevant conversation."],
  [Package,"Know your stash.","Keep track of purchases, estimated stock and spending. See where your products and your budget are going."],
  [Moon,"Make room for wellbeing.","Record sleep, next-day grogginess and before-and-after reflections. Notice associations in your own experience."],
  [CalendarDays,"Plan. Reflect. Repeat.","Explore hypothetical sessions, set personal goals and take mindful breaks. Keep plans separate from what actually happened."],
];
function Home() {
 return <>
  <section className="site-hero site-wrap"><div className="hero-copy"><p className="eyebrow"><span className="live-dot" /> YOUR CANNABIS COMPANION</p><h1>Your sessions.<br /><em>A clearer picture.</em></h1><p className="hero-intro">A private journal, personal insights and a cannabis wingman. Get to know your own patterns — one session at a time.</p><div className="hero-buttons"><a className="site-button" href="#download">Meet Session Buddy <ArrowUpRight size={20} /></a><a className="text-link" href="#features">Take a look around <ArrowRight size={17} /></a></div><p className="hero-platforms"><Smartphone size={15} /> Coming to iOS &amp; Android <span>·</span> For adults 21+</p></div><PhonePreview /></section>
  <div className="site-wrap principle-strip"><span><ShieldCheck /> Your records. Your choices.</span><span><Activity /> Insight, without judgement.</span><span><Leaf /> More mindful downtime.</span></div>
  <section id="features" className="site-section site-wrap"><div className="section-heading"><div><p className="eyebrow">LESS GUESSWORK. MORE PERSPECTIVE.</p><h2>Know your own vibe.</h2></div><p>No two people have the same experience.<br className="desktop-break" /> Keep a record of yours.</p></div><div className="feature-grid">{features.map(([Icon,title,body],i) => <article className="feature" key={title}><span className="feature-number">0{i+1}</span><Icon className="feature-icon" size={26} strokeWidth={1.5} /><h3>{title}</h3><p>{body}</p></article>)}</div></section>
  <section className="story-section"><div className="site-wrap story-layout"><div className="story-art"><div className="sesh-card"><div className="sesh-brand"><img src={LOGO_URL} alt="" /> SESSION BUDDY</div><p className="eyebrow">SESH, PLOTTED.</p><h3>My kind of downtime.</h3><p>A little history. A little perspective.</p><Curve mini /><div className="sesh-footer"><span>session-buddy.app</span><span>✦</span></div></div><span className="art-caption">Illustrative share card</span></div><div className="story-copy"><p className="eyebrow">YOUR SESSION HAS A STORY.</p><h2>Keep the insight.<br />Share the vibe.</h2><p>Turn your session history into a clean, shareable card. Pick a 6- or 12-hour view and preview exactly what will go into your image.</p><p>Keep it to yourself, save it to Photos, or share it with your people. The choice is yours.</p><a className="text-link" href="#download">Make it your own <ArrowUpRight size={18} /></a></div></div></section>
  <section id="how-it-works" className="site-section site-wrap"><div className="section-heading"><div><p className="eyebrow">A SIMPLE LITTLE ROUTINE.</p><h2>From a quick log<br />to a bigger picture.</h2></div><p>Start with what you know.<br />Build the story as you go.</p></div><ol className="steps">{[["Add your products","Save the label strength, your own estimate or an unknown value."],["Log what happened","Record the amount, method and when you finished your session."],["Check in with yourself","Note how you feel, your comfort or the following morning’s sleep."],["See what stands out","Explore your patterns, stash and spending — or talk it through with Buddy."]].map(([title,body],i) => <li key={title}><span className="step-index">0{i+1}</span><h3>{title}</h3><p>{body}</p></li>)}</ol></section>
  <section id="questions" className="site-section faq-section site-wrap"><div><p className="eyebrow">A FEW THINGS TO KNOW.</p><h2>Good questions.</h2><p className="muted">Something else on your mind?<br /><Link className="text-link" to="/support">We’re here to help <ArrowUpRight size={16} /></Link></p></div><div className="faq-list">{[
    ["Where can I download Session Buddy?","We’re preparing the native apps for release. Public App Store and Google Play links will appear here as each listing becomes available. Availability may vary by platform and country."],
    ["What are the Buzz and THC numbers?","They are educational model estimates based on recorded inputs, not measurements. They cannot establish sobriety, driving fitness or a drug-test result."],
    ["Can I choose what Buddy AI can see?","Yes. In-app sharing controls let you choose which saved context is available to Buddy. AI can make mistakes; its replies are not medical advice."],
    ["Who is Session Buddy for?","Session Buddy is for adults aged 21 and over who want to track and reflect on their cannabis use. It does not sell cannabis, prescribe treatment or replace professional advice."],
    ["Will sharing a card expose my whole journal?","The image contains only what is shown in its preview. Your account name, private notes and exact dose clock times are excluded. Once shared, recipients can keep a copy."]
  ].map(([q,a]) => <details key={q}><summary>{q}<span aria-hidden="true">+</span></summary><p>{a}</p></details>)}</div></section>
  <section id="download" className="download-section site-wrap"><div className="download-glow" /><p className="eyebrow">YOUR NEXT SESSION, WITH MORE PERSPECTIVE.</p><img src={LOGO_URL} width="74" height="74" alt="" /><h2>A little more insight.<br /><em>A lot more you.</em></h2><p>Session Buddy is coming to iOS and Android.</p><StoreLinks /><p className="download-note">Store links will go live here as each app is released.</p></section>
 </>;
}
function Support({ deletion = false }) {
 return <main className="site-wrap support-page"><Link className="text-link" to="/">← Back home</Link><p className="eyebrow">SESSION BUDDY SUPPORT</p><h1>{deletion ? "Your account. Your choice." : "Let’s sort it out."}</h1><p>{deletion ? "In the Session Buddy app, open Profile to export your records or start account deletion. If you can’t sign in, email us to request help. We’ll verify ownership before removing account data." : "Need a hand with Session Buddy? Email our team and tell us what happened, your device and app version. A screenshot can help — please leave out sensitive journal or payment information."}</p><a className="site-button" href={"mailto:"+SUPPORT_EMAIL+(deletion?"?subject=Session%20Buddy%20account%20deletion":"")}>{deletion ? "Request deletion help" : "Email support"}<ArrowUpRight size={18} /></a><p className="muted support-email">{SUPPORT_EMAIL}</p><div className="support-note"><h2>Subscription help</h2><p>Manage renewal in your Apple or Google account’s subscription settings. Deleting your Session Buddy account does not cancel store billing. If a purchase is not recognised, contact us before buying again.</p></div></main>;
}
function Footer() {
 return <footer className="site-footer site-wrap"><div className="footer-main"><div><Brand /><p>Your cannabis companion.<br />By Verde Labs Australia.</p></div><nav aria-label="Footer navigation"><Link to="/support">Support</Link><Link to="/privacy">Privacy</Link><Link to="/terms">Terms &amp; safety</Link><Link to="/delete-account">Account deletion</Link></nav></div><div className="footer-bottom"><span>© {new Date().getFullYear()} Verde Labs Australia</span><p>For adults 21+. Educational tracking, not medical advice or driving / test clearance. Session Buddy does not sell cannabis.</p></div></footer>;
}
function Site() {
 const { pathname, hash } = useLocation();
 const path=pathname.toLowerCase();
 useEffect(() => {
  if(hash) requestAnimationFrame(()=>document.getElementById(hash.slice(1))?.scrollIntoView());
  else window.scrollTo(0,0);
  document.title=path.includes("privacy")?"Privacy | Session Buddy":path.includes("terms")?"Terms & safety | Session Buddy":path.includes("support")?"Support | Session Buddy":"Session Buddy — Know your own vibe";
 },[pathname,hash,path]);
 const legal=["/privacy","/privacypolicy","/terms","/termsofuse","/legal"].includes(path);
 return <div className="marketing-app"><a className="skip-link" href="#main-content">Skip to content</a><Header /><div id="main-content">{legal ? <LegalContent /> : ["/support","/help","/delete-account"].includes(path) ? <Support deletion={path==="/delete-account"} /> : <main><Home /></main>}</div><Footer /></div>;
}
export default function MarketingApp(){return <BrowserRouter><Site /></BrowserRouter>;}
