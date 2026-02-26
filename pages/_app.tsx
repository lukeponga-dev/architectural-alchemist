import '../styles/globals.css';
import type { AppProps } from 'next/app';
import Head from 'next/head';

export default function App({ Component, pageProps }: AppProps) {
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
