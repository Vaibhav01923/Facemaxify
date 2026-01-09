import React from "react";
import { SignedIn, SignedOut, UserButton } from "@clerk/clerk-react";
import { LandingPage } from "./components/LandingPage";

// Waitlist-Only Application Wrapper with Clerk Auth

const App: React.FC = () => {
  return (
    <>
      <SignedOut>
        <LandingPage />
      </SignedOut>

      <SignedIn>
        <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 text-center animate-fadeIn relative text-white">
          <div className="absolute top-4 right-4">
            <UserButton />
          </div>

          <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mb-6">
            <span className="text-4xl">🎉</span>
          </div>
          <h2 className="text-3xl font-bold mb-2">You're on the list!</h2>
          <p className="text-slate-400 mb-8">
            We'll notify you as soon as your free premium access is ready.
          </p>
        </div>
      </SignedIn>
    </>
  );
};

export default App;
