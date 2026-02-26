import { useEffect, useRef } from 'react';

interface VideoFeedProps {
    onFrame: (frame: HTMLVideoElement) => Promise<void>;
}

export default function VideoFeed({ onFrame }: VideoFeedProps) {
    const videoRef = useRef<HTMLVideoElement>(null);

    useEffect(() => {
        async function startStream() {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                    videoRef.current.onloadeddata = () => {
                        if (videoRef.current) onFrame(videoRef.current);
                    };
                }
            } catch (error) {
                console.error('Error accessing media devices:', error);
            }
        }
        startStream();
    }, [onFrame]);

    return (
        <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
        />
    );
}
