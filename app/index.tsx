"use client";
import type { NextPage } from "next";
import { useEffect, useState, useCallback } from "react";
import VideoFeed from "../components/Agent/VideoFeed";
import AgentPanel from "../components/Agent/AgentPanel";
import { WebRTCManager, ShowcaseItem } from "../lib";
import PublicGallery from "../components/Gallery/PublicGallery";
import DesignDetailModal from "../components/Gallery/DesignDetailModal";

const BACKEND_URL =
    process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

const Home: NextPage = () => {
    const [safeFrame, setSafeFrame] = useState(true);
    const [isLoading, setIsLoading] = useState(true);
    const [isAgentConnected, setIsAgentConnected] = useState(false);
    const [processedImage, setProcessedImage] = useState<string | null>(null);
    const [webrtc, setWebrtc] = useState<WebRTCManager | null>(null);
    const [audioStream, setAudioStream] = useState<MediaStream | null>(null);
    const [showGallery, setShowGallery] = useState(false);
    const [selectedDesign, setSelectedDesign] = useState<ShowcaseItem | null>(
        null,
    );

    useEffect(() => {
        if (window.self !== window.top) {
            setSafeFrame(false);
        }
    }, []);

    // Effect to handle Gemini's voice output
    useEffect(() => {
        if (audioStream) {
            const audio = new Audio();
            audio.srcObject = audioStream;
            audio.play().catch((e) => console.error("Audio playback error:", e));
        }
    }, [audioStream]);

    const connectAgent = async (stream: MediaStream) => {
        try {
            const manager = new WebRTCManager(BACKEND_URL, (remoteStream) => {
                setAudioStream(remoteStream);
            });
            await manager.connect(stream);
            setWebrtc(manager);
            setIsAgentConnected(true);
        } catch (error) {
            console.error("Agent connection failed:", error);
        }
    };

    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [selectedSurface, setSelectedSurface] = useState<any>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [lastCapturedImage, setLastCapturedImage] = useState<string | null>(
        null,
    );

    const handleVideoClick = async (e: React.MouseEvent<HTMLDivElement>) => {
        if (!safeFrame || isAnalyzing) return;

        const video = document.querySelector("video");
        if (!video) return;

        const rect = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        // Capture current frame at full resolution for analysis
        setIsAnalyzing(true);
        const canvas = document.createElement("canvas");
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        ctx.drawImage(video, 0, 0);
        const imageData = canvas.toDataURL("image/jpeg", 0.9);
        setLastCapturedImage(imageData);

        try {
            const response = await fetch(`${BACKEND_URL}/spatial`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    image: imageData,
                    x: (x / rect.width) * video.videoWidth,
                    y: (y / rect.height) * video.videoHeight,
                    width: video.videoWidth,
                    height: video.videoHeight,
                    type: "identify_surface",
                }),
            });

            if (response.ok) {
                const result = await response.json();
                if (result.surface) {
                    setSelectedSurface(result.surface);
                }
            }
        } catch (error) {
            console.error("Spatial analysis failed:", error);
        } finally {
            setIsAnalyzing(false);
        }
    };

    const handleSaveToGallery = async () => {
        if (!selectedSurface || !lastCapturedImage || isSaving) return;

        setIsSaving(true);
        try {
            const { ensureAuth, db, FirestoreManager } = await import("../lib");

            await ensureAuth();
            const manager = new FirestoreManager(db, "architectural-alchemist");

            await manager.saveDesignSnapshot({
                userId: "", // Handled by manager
                appId: "architectural-alchemist",
                name: `Spatial Analysis: ${selectedSurface.type}`,
                description: `Architectural analysis of a ${selectedSurface.material} ${selectedSurface.type}.`,
                beforeImage: lastCapturedImage,
                afterImage: lastCapturedImage, // Placeholder for future transformation
                thumbnail: lastCapturedImage,
                metadata: {
                    roomType: "General",
                    style: "Original",
                    transformationType: "Analysis",
                    coordinates: {
                        x: selectedSurface.boundingBox[1],
                        y: selectedSurface.boundingBox[0],
                        width:
                            selectedSurface.boundingBox[3] - selectedSurface.boundingBox[1],
                        height:
                            selectedSurface.boundingBox[2] - selectedSurface.boundingBox[0],
                    },
                    processingTime: 0,
                    cost: 0,
                    materials: [selectedSurface.material],
                    colors: [selectedSurface.color],
                },
                isPublic: true,
                tags: ["ai-analysis", selectedSurface.type, selectedSurface.material],
                likes: 0,
                views: 0,
            });

            alert("Saved to Gallery!");
            setSelectedSurface(null);
        } catch (error) {
            console.error("Failed to save to gallery:", error);
            alert("Save failed. Please check your connection.");
        } finally {
            setIsSaving(false);
        }
    };

    const checkFrame = useCallback(async (frame: HTMLVideoElement) => {
        if (!frame || (frame as any)._isCapturing) return;
        (frame as any)._isCapturing = true;

        setIsLoading(false);

        const captureFrame = async () => {
            if (!frame.videoWidth) {
                setTimeout(captureFrame, 100);
                return;
            }

            const canvas = document.createElement("canvas");
            canvas.width = frame.videoWidth;
            canvas.height = frame.videoHeight;
            const ctx = canvas.getContext("2d");
            if (!ctx) return;

            ctx.drawImage(frame, 0, 0, canvas.width, canvas.height);
            const imageData = canvas.toDataURL("image/jpeg", 0.8);

            try {
                // Strip the data URL prefix for the API
                const base64Data = imageData.split(",")[1];

                const response = await fetch(`${BACKEND_URL}/process-frame`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        image_data: base64Data,
                        frame_id: Date.now().toString(),
                        timestamp: Date.now() / 1000,
                    }),
                });

                if (response.ok) {
                    const result = await response.json();
                    if (result.blur_applied) {
                        setSafeFrame(false);
                        // Add prefix back for display
                        setProcessedImage(
                            `data:image/jpeg;base64,${result.processed_image}`,
                        );
                    } else {
                        setSafeFrame(true);
                        setProcessedImage(null);
                    }
                }
            } catch (error) {
                console.error("Frame analysis failed:", error);
            }

            setTimeout(captureFrame, 1000);
        };

        captureFrame();
    }, []);

    return (
        <div className="flex flex-col items-center justify-center min-h-[80vh] gap-8">
            <div className="text-center space-y-4">
                <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold bg-gradient-to-r from-cyan-400 to-purple-500 bg-clip-text text-transparent">
                    Architectural Alchemist
                </h1>
                <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-4 mt-2">
                    <button
                        onClick={() => setShowGallery(false)}
                        className={`px-3 py-1.5 sm:px-4 rounded-full text-xs sm:text-sm font-bold transition-all ${!showGallery ? "bg-cyan-500 text-slate-950 shadow-lg shadow-cyan-500/20" : "text-slate-400 hover:text-white"}`}
                    >
                        Live Engine
                    </button>
                    <button
                        onClick={() => setShowGallery(true)}
                        className={`px-3 py-1.5 sm:px-4 rounded-full text-xs sm:text-sm font-bold transition-all ${showGallery ? "bg-purple-500 text-white shadow-lg shadow-purple-500/20" : "text-slate-400 hover:text-white"}`}
                    >
                        Community Gallery
                    </button>
                </div>
            </div>

            {!showGallery ? (
                <div className="w-full max-w-6xl space-y-6 lg:space-y-8">
                    {/* Main Video Feed */}
                    <div className="w-full max-w-3xl mx-auto bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-2xl overflow-hidden shadow-2xl">
                        <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 bg-slate-800/80 border-b border-slate-700 gap-3">
                            <div className="flex items-center gap-3">
                                <div
                                    className={`w-2 h-2 rounded-full ${isAgentConnected ? "bg-emerald-500 animate-pulse" : "bg-slate-600"}`}
                                />
                                <span className="font-semibold text-slate-200 text-sm sm:text-base">
                                    {isAgentConnected ? "Agent Online" : "Agent Ready"}
                                </span>
                            </div>
                            <div className="flex items-center gap-2">
                                {safeFrame && !isAgentConnected && (
                                    <button
                                        onClick={() => {
                                            const video = document.querySelector("video");
                                            if (video && video.srcObject) {
                                                connectAgent(video.srcObject as MediaStream);
                                            }
                                        }}
                                        className="px-3 py-1.5 sm:px-4 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded-lg transition-colors text-xs sm:text-sm"
                                    >
                                        Connect Agent
                                    </button>
                                )}
                                <span
                                    className={`px-2 py-1 sm:px-3 rounded-full text-xs sm:text-sm font-medium ${safeFrame
                                        ? "bg-emerald-500/20 text-emerald-400"
                                        : "bg-red-500/20 text-red-400"
                                        }`}
                                >
                                    {safeFrame ? "Safe Feed" : "Privacy Mode Active"}
                                </span>
                            </div>
                        </div>

                    <div className="p-4 sm:p-6">
                        <div
                            className={`relative aspect-video bg-slate-900 rounded-xl overflow-hidden cursor-crosshair group transition-all duration-300 ${isAnalyzing ? "opacity-70 grayscale" : ""}`}
                            onClick={handleVideoClick}
                        >
                            <VideoFeed onFrame={checkFrame} />

                            {/* Inspection Layer */}
                            {safeFrame && (
                                <div className="absolute inset-0 pointer-events-none">
                                    <div className="absolute inset-0 bg-cyan-500/5 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                        <span className="bg-slate-900/80 text-cyan-400 px-3 py-1.5 rounded-full text-sm font-medium border border-cyan-500/30">
                                            Click to Inspect Surface
                                        </span>
                                    </div>
                                </div>
                            )}

                            {/* Spatial Overlay */}
                            {selectedSurface && selectedSurface.boundingBox && (
                                <svg className="absolute inset-0 pointer-events-none z-20 w-full h-full">
                                    {(() => {
                                        const bbox = selectedSurface.boundingBox;
                                        // Gemini [ymin, xmin, ymax, xmax] normalized 0-1000
                                        const ymin = (bbox[0] / 1000) * 100;
                                        const xmin = (bbox[1] / 1000) * 100;
                                        const ymax = (bbox[2] / 1000) * 100;
                                        const xmax = (bbox[3] / 1000) * 100;

                                        return (
                                            <g>
                                                <rect
                                                    x={`${xmin}%`}
                                                    y={`${ymin}%`}
                                                    width={`${xmax - xmin}%`}
                                                    height={`${ymax - ymin}%`}
                                                    fill="transparent"
                                                    stroke="#22d3ee"
                                                    strokeWidth="2"
                                                    className="animate-pulse"
                                                />
                                                <circle
                                                    cx={`${xmin}%`}
                                                    cy={`${ymin}%`}
                                                    r="4"
                                                    fill="#22d3ee"
                                                />
                                            </g>
                                        );
                                    })()}
                                </svg>
                            )}

                            {isAnalyzing && (
                                <div className="absolute inset-0 flex items-center justify-center bg-slate-900/40 z-30 backdrop-blur-sm">
                                    <div className="flex flex-col items-center gap-4">
                                        <div className="w-10 h-10 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin" />
                                        <span className="text-cyan-400 font-medium">
                                            Analyzing Spatial Structure...
                                        </span>
                                    </div>
                                </div>
                            )}

                            {processedImage && !safeFrame && (
                                <div className="absolute inset-0 z-40">
                                    <img
                                        src={processedImage}
                                        className="w-full h-full object-cover backdrop-blur-3xl"
                                        alt="Blurred feed"
                                    />
                                    <div className="absolute inset-0 flex items-center justify-center bg-red-500/10">
                                        <p className="text-white font-bold bg-red-500 px-4 py-2 rounded-full shadow-lg">
                                            PRIVACY SHIELD ENGAGED
                                        </p>
                                    </div>
                                </div>
                            )}
                            {isLoading && (
                                <div className="absolute inset-0 flex items-center justify-center bg-slate-900/80 z-20">
                                    <span className="text-slate-400">Initializing camera...</span>
                                </div>
                            )}
                        </div>

                        {/* Surface Info Detail Board */}
                        {selectedSurface && (
                            <div className="mt-6 p-4 bg-slate-900/80 border border-slate-700/50 rounded-xl animate-in slide-in-from-bottom-4 duration-500">
                                <div className="flex items-center justify-between mb-3">
                                    <h3 className="text-cyan-400 font-bold flex items-center gap-2">
                                        <span className="w-2 h-2 rounded-full bg-cyan-400" />
                                        Identified:{" "}
                                        {selectedSurface.type || "Architectural Surface"}
                                    </h3>
                                    <div className="flex items-center gap-3">
                                        <button
                                            onClick={handleSaveToGallery}
                                            disabled={isSaving}
                                            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-colors ${isSaving ? "bg-slate-700 text-slate-500" : "bg-cyan-500 hover:bg-cyan-400 text-slate-950"}`}
                                        >
                                            {isSaving ? "Saving..." : "Save to Gallery"}
                                        </button>
                                        <button
                                            onClick={() => setSelectedSurface(null)}
                                            className="text-slate-500 hover:text-white transition-colors text-xs uppercase tracking-widest font-bold"
                                        >
                                            Clear
                                        </button>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div className="space-y-1">
                                        <p className="text-slate-500 text-xs">
                                            Material Composition
                                        </p>
                                        <p className="text-slate-200 font-medium">
                                            {selectedSurface.material || "N/A"}
                                        </p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-slate-500 text-xs">Base Color</p>
                                        <p className="text-slate-200 font-medium">
                                            {selectedSurface.color || "N/A"}
                                        </p>
                                    </div>
                                    <div className="col-span-2 mt-2 pt-2 border-t border-slate-800">
                                        <p className="text-slate-500 text-xs mb-1">
                                            AI Interpretation
                                        </p>
                                        <p className="text-slate-300 italic text-xs leading-relaxed">
                                            {selectedSurface.reasoning ||
                                                "A high-confidence structural element identified as a potential canvas for your next transformation."}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {!safeFrame && (
                        <div className="px-4 sm:px-6 py-3 sm:py-4 bg-red-500/10 border-t border-red-500/20">
                            <p className="text-red-400 text-sm">
                                Person detected. Video feed to AI is paused to protect privacy.
                            </p>
                        </div>
                    )}
                </div>
                
                {/* AI Design Assistant Panel */}
                <div className="w-full max-w-3xl mx-auto">
                    <AgentPanel message="AI Design Assistant Ready" />
                </div>
            </div>
            ) : (
                <div className="w-full max-w-6xl animate-in fade-in zoom-in-95 duration-500">
                    <PublicGallery onDesignSelect={setSelectedDesign} />
                </div>
            )}

            <DesignDetailModal
                design={selectedDesign}
                onClose={() => setSelectedDesign(null)}
            />

            <div className="text-center text-slate-500 text-sm mt-12 pb-8">
                <p className="mb-2">
                    Showcase Your World • Built for Gemini Live Agent Devpost
                </p>
                Powered by Google Gemini Live - Vision - Firebase
            </div>
        </div>
    );
};

export default Home;
