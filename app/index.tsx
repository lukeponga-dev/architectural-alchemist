"use client";
import type { NextPage } from 'next';
import { useEffect, useState } from 'react';
import VideoFeed from '../components/VideoFeed';

const Home: NextPage = () => {
    const [safeFrame, setSafeFrame] = useState(true);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (window.self !== window.top) {
            setSafeFrame(false);
        }
    });

    async function checkFrame(frame: HTMLVideoElement) {
        setSafeFrame(true);
        setIsLoading(false);
    }

    return (
        <div className="flex flex-col items-center justify-center min-h-[80vh] gap-8">
            <div className="text-center space-y-4">
                <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-cyan-400 to-purple-500 bg-clip-text text-transparent">
                    Architectural Alchemist
                </h1>
                <p className="text-slate-400 text-lg max-w-xl">
                    AI-powered video filtering with Vertex AI real-time content safety detection
                </p>
            </div>

            <div className="w-full max-w-3xl bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-2xl overflow-hidden shadow-2xl">
                <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 bg-slate-800/80 border-b border-slate-700 gap-3">
                    <div className="flex items-center gap-3">
                        <span className="font-semibold text-slate-200">Live Video Feed</span>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${safeFrame ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'
                        }`}>
                        {safeFrame ? 'Safe Content' : 'Person Detected'}
                    </span>
                </div>

                <div className="p-4 sm:p-6">
                    <div className="relative aspect-video bg-slate-900 rounded-xl overflow-hidden">
                        <VideoFeed onFrame={checkFrame} />
                        {isLoading && (
                            <div className="absolute inset-0 flex items-center justify-center bg-slate-900/80">
                                <span className="text-slate-400">Initializing camera...</span>
                            </div>
                        )}
                    </div>
                </div>

                {!safeFrame && (
                    <div className="px-4 sm:px-6 py-3 sm:py-4 bg-red-500/10 border-t border-red-500/20">
                        <p className="text-red-400">Person detected - video processing paused for safety.</p>
                    </div>
                )}
            </div>

            <div className="text-center text-slate-500 text-sm">
                Powered by Google Vertex AI Vision - Firebase - WebRTC
            </div>
        </div>
    );
};

export default Home;
