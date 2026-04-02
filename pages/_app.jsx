import '../src/styles/globals.css';
import { ThemeProvider } from "next-themes";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";

// For pages/_app.jsx, we wrap the entire app with generic providers that are standard.
// If the Vite App.tsx already provides these, we can just load globals.css here.
// Actually, let's keep it simple and just inject globals.css. The App.tsx likely has query providers.

export default function MyApp({ Component, pageProps }) {
  return <Component {...pageProps} />;
}
