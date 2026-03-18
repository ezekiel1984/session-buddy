import React from "react";
import { Link } from "react-router-dom";

export default function LegalFooter() {
  return (
    <footer className="mt-8 mb-24 text-center text-xs text-gray-500">
      <div className="max-w-lg mx-auto px-6">
        <div className="flex flex-wrap items-center justify-center gap-4">
          <Link to="/Privacy" className="hover:text-gray-300 underline-offset-2 hover:underline">
            Privacy Policy
          </Link>
          <span className="opacity-30">•</span>
          <Link to="/Terms" className="hover:text-gray-300 underline-offset-2 hover:underline">
            Terms & Conditions
          </Link>
          <span className="opacity-30">•</span>
          <Link to="/Support" className="hover:text-gray-300 underline-offset-2 hover:underline">
            Support
          </Link>
        </div>
        <p className="mt-3 opacity-70">
          Session Buddy is for educational and harm-reduction purposes only. It does not provide medical advice or diagnosis.
        </p>
      </div>
    </footer>
  );
}