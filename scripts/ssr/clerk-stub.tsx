// Stands in for @clerk/clerk-react during the prerender (see scripts/prerender.mjs), which
// has no browser or publishable key to run Clerk with. Renders the signed-out view, which
// is what crawlers and first-time visitors get.
import React from "react";

type Children = { children?: React.ReactNode };

export const useUser = () => ({ isLoaded: true, isSignedIn: false, user: null });
export const useClerk = () => ({ openSignIn: () => {}, openSignUp: () => {} });

export const ClerkProvider = ({ children }: Children) => <>{children}</>;
export const SignedOut = ({ children }: Children) => <>{children}</>;
export const SignedIn = (_: Children) => null;
export const SignInButton = ({ children }: Children) => <>{children ?? <button>Sign in</button>}</>;
export const SignUpButton = ({ children }: Children) => <>{children ?? <button>Sign up</button>}</>;
export const UserButton = (_: object) => null;
export const RedirectToSignIn = (_: object) => null;
