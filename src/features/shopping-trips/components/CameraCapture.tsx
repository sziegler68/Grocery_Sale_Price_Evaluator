/**
 * Camera Capture Component
 * 
 * Mobile-optimized camera interface for capturing price tag photos.
 * Supports live preview, autofocus, and image compression.
 */

import React, { useRef, useState, useEffect } from 'react';
import { Camera, X, RotateCw } from 'lucide-react';
import { toast } from 'react-toastify';

interface CameraCaptureProps {
    isOpen: boolean;
    onClose: () => void;
    onCapture: (imageBlob: Blob) => void;
}

export const CameraCapture: React.FC<CameraCaptureProps> = ({
    isOpen,
    onClose,
    onCapture,
}) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const streamRef = useRef<MediaStream | null>(null);

    const [hasPermission, setHasPermission] = useState<boolean | null>(null);
    const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
    const [isCapturing, setIsCapturing] = useState(false);

    // Start camera when modal opens
    useEffect(() => {
        if (isOpen) {
            startCamera();
        } else {
            stopCamera();
        }

        return () => {
            stopCamera();
        };
    }, [isOpen, facingMode]);

    const startCamera = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    facingMode,
                    width: { ideal: 1920 },
                    height: { ideal: 1080 },
                    // @ts-ignore - Advanced camera constraints for autofocus
                    focusMode: 'continuous',
                    advanced: [{ focusMode: 'continuous' }]
                },
            });

            streamRef.current = stream;
            setHasPermission(true);

            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                videoRef.current.play();
            }
        } catch (error: any) {
            console.error('[CameraCapture] Failed to start camera:', error);
            setHasPermission(false);

            if (error.name === 'NotAllowedError') {
                toast.error('Camera permission denied');
            } else if (error.name === 'NotFoundError') {
                toast.error('No camera found');
            } else {
                toast.error('Failed to access camera');
            }
        }
    };

    const stopCamera = () => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
    };

    const handleCapture = async () => {
        if (!videoRef.current || !canvasRef.current) return;

        setIsCapturing(true);

        try {
            const video = videoRef.current;
            const canvas = canvasRef.current;
            const context = canvas.getContext('2d');

            if (!context) {
                throw new Error('Failed to get canvas context');
            }

            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            context.drawImage(video, 0, 0, canvas.width, canvas.height);

            canvas.toBlob(
                (blob) => {
                    if (blob) {
                        onCapture(blob);
                        stopCamera();
                        onClose();
                    } else {
                        toast.error('Failed to capture image');
                    }
                    setIsCapturing(false);
                },
                'image/jpeg',
                0.85
            );
        } catch (error) {
            console.error('[CameraCapture] Capture failed:', error);
            toast.error('Failed to capture image');
            setIsCapturing(false);
        }
    };

    const toggleCamera = () => {
        setFacingMode(prev => prev === 'user' ? 'environment' : 'user');
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 bg-black">
            <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between p-4 bg-gradient-to-b from-black/80 to-transparent">
                <button
                    onClick={onClose}
                    className="p-2 rounded-full bg-black/50 hover:bg-black/70 transition-colors"
                >
                    <X className="h-6 w-6 text-white" />
                </button>

                <button
                    onClick={toggleCamera}
                    className="p-2 rounded-full bg-black/50 hover:bg-black/70 transition-colors"
                >
                    <RotateCw className="h-6 w-6 text-white" />
                </button>
            </div>

            <div className="relative w-full h-full flex items-center justify-center">
                {hasPermission === false ? (
                    <div className="text-center text-white p-6">
                        <Camera className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                        <h3 className="text-xl font-semibold mb-2">Camera Access Required</h3>
                        <p className="text-gray-300 mb-4">
                            Please enable camera access to scan price tags.
                        </p>
                        <button
                            onClick={onClose}
                            className="px-6 py-3 bg-purple-600 hover:bg-purple-700 rounded-lg font-medium"
                        >
                            Close
                        </button>
                    </div>
                ) : (
                    <>
                        <video
                            ref={videoRef}
                            className="w-full h-full object-cover"
                            playsInline
                            autoPlay
                            muted
                        />

                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            <div className="border-2 border-white/50 rounded-lg w-4/5 h-2/3 shadow-lg">
                                <div className="absolute -top-8 left-1/2 -translate-x-1/2 text-white text-sm bg-black/50 px-3 py-1 rounded-full">
                                    Align price tag within frame
                                </div>
                            </div>
                        </div>
                    </>
                )}
            </div>

            {hasPermission && (
                <div className="absolute bottom-0 left-0 right-0 pb-8 flex justify-center bg-gradient-to-t from-black/80 to-transparent">
                    <button
                        onClick={handleCapture}
                        disabled={isCapturing}
                        className="w-20 h-20 rounded-full bg-white border-4 border-purple-600 hover:bg-purple-50 active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center"
                    >
                        {isCapturing ? (
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600" />
                        ) : (
                            <div className="w-16 h-16 rounded-full bg-purple-600" />
                        )}
                    </button>
                </div>
            )}

            <canvas ref={canvasRef} className="hidden" />
        </div>
    );
};
