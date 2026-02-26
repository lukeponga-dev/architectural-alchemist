import "../styles/globals.css";
import type { AppProps } from "next/app";
import Head from "next/head";
import { useEffect } from "react";

// Declare ethereum property for TypeScript
declare global {
  interface Window {
    ethereum?: any;
  }
}

export default function App({ Component, pageProps }: AppProps) {
  // Handle ethereum property conflicts from browser extensions
  useEffect(() => {
    if (typeof window !== "undefined") {
      // Check for conflicting extensions and prevent redefinition errors
      const originalDefineProperty = Object.defineProperty;

      Object.defineProperty = function (
        obj: any,
        prop: string,
        descriptor: PropertyDescriptor,
      ) {
        if (obj === window && prop === "ethereum" && obj[prop] !== undefined) {
          console.warn(
            "Preventing ethereum property redefinition from browser extension",
          );
          return obj;
        }
        return originalDefineProperty.call(this, obj, prop, descriptor);
      };

      return () => {
        Object.defineProperty = originalDefineProperty;
      };
    }
  }, []);
  return (
    <>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>Architectural Alchemist - AI Video Filter</title>
        <meta
          name="description"
          content="Video feed with Vertex AI pre-filtering for safe content detection"
        />
      </Head>
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white font-sans">
        <main className="container mx-auto px-4 sm:px-6 py-6 sm:py-8">
          <Component {...pageProps} />
        </main>
      </div>
    </>
  );
}
