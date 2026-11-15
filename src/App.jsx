import React from "react";
import MarketingApp from "./marketing/MarketingApp";

// Public marketing website. Legacy tracking screens/data remain in source/storage
// but are not mounted or queried here. The native app is a separate project.
export default function App() { return <MarketingApp />; }
