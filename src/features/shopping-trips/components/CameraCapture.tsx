/**
 * Camera Capture Component
 * 
 * Mobile-optimized camera interface for capturing price tag photos.
 * Supports live preview, autofocus, and image compression.
 */

import React, { useRef, useState, useEffect } from 'react';
import { Camera, X, RotateCw, ZoomIn, ZoomOut } from 'lucide-react';
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
    const [zoomLevel, setZoomLevel] = useState(1);
    const [maxZoom, setMaxZoom] = useState(1);
    const [minZoom, setMinZoom] = useState(1);
    const [focusPoint, setFocusPoint] = useState<{ x: number, y: number } | null>(null);

    // Pinch zoom state
    const lastTouchDistance = useRef<number>(0);

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
            // Step 1: Always request permission first with the most permissive constraints
            // This avoids iOS Safari refusing later exact constraints
            try {
                const permissionStream = await navigator.mediaDevices.getUserMedia({ video: true });
                permissionStream.getTracks().forEach(t => t.stop());
            } catch (e) {
                console.warn('[CameraCapture] Could not get initial permission, proceeding anyway');
            }

            // Step 2: Enumerate devices (now we have real labels on both platforms)
            const allDevices = await navigator.mediaDevices.enumerateDevices();
            const videoDevices = allDevices.filter(d => d.kind === 'videoinput');
            
            console.log('[CameraCapture] All video devices:', videoDevices.map(d => ({ label: d.label, id: d.deviceId })));

            // Step 3: Choose the best rear-facing device using a scored priority list
            type Candidate = MediaDeviceInfo & { score: number };
            const candidates: Candidate[] = videoDevices.map(device => {
                const label = device.label.toLowerCase();
                const deviceId = device.deviceId;
                let score = 0;

                // iOS Safari (always uses "environment" facingMode, labels are generic)
                if (/iphone|ipad|ipod/.test(navigator.userAgent.toLowerCase())) {
                    return { ...device, score: label.includes('back') || label.includes('rear') ? 100 : 50 };
                }

                // Android scoring
                // For generic labels like 'camera 0, facing back', prefer camera 0 (main camera)
                if (label.includes('camera 0') && label.includes('back')) score += 200;
                if (label.includes('rear wide') || label.includes('main')) score += 300;  // Highest priority for explicit labels
                if (label.includes('wide') && !label.includes('ultra')) score += 80;
                if (label.includes('back') && !label.includes('ultra')) score += 70;
                // Penalize camera 2 (likely ultra-wide on generic labels)
                if (label.includes('camera 2') && label.includes('back')) score -= 100;
                // Main cam is almost always 0 or 1 on Android
                if (deviceId.endsWith('0') || deviceId.endsWith('1')) score += 60; 
                if (label.includes('ultra') || label.includes('0.5') || label.includes('0.6')) score -= 200;

                return { label: device.label, deviceId: device.deviceId, groupId: device.groupId, kind: device.kind, score, toJSON: device.toJSON };
            });

            // Log all candidates before sorting
            console.log('[CameraCapture] All candidates:', candidates.map(c => ({ label: c.label, score: c.score })));
            
            // Sort by score descending, then pick the winner
            const bestDevice = candidates.sort((a, b) => b.score - a.score)[0];
            
            console.log('[CameraCapture] Best camera candidate:', bestDevice?.label, 'Score:', bestDevice?.score);

            // Step 4: Build final constraints
            const constraints: MediaStreamConstraints = {
                video: {
                    deviceId: bestDevice ? { exact: bestDevice.deviceId } : undefined,
                    facingMode: bestDevice ? undefined : { exact: 'environment' },
                    width: { min: 1280, ideal: 3840, max: 4096 },
                    height: { min: 720, ideal: 2160, max: 4096 },
                    frameRate: { ideal: 30, max: 60 },
                    aspectRatio: { ideal: 16/9 }
                },
                audio: false,
            };

            // Step 5: Get the stream
            const stream = await navigator.mediaDevices.getUserMedia(constraints);
            streamRef.current = stream;
            setHasPermission(true);

            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                videoRef.current.play();
            }

            // Step 6: Force 1x zoom and max resolution on capable devices
            const track = stream.getVideoTracks()[0];
            const capabilities = track.getCapabilities() as any;

            // Apply 1x zoom
            if (capabilities.zoom) {
                // Some devices use ratio (100 = 1x), others use absolute float (1.0 = 1x)
                // If max zoom is small (e.g. 10), it's likely float. If large (e.g. 100), it's likely ratio.
                const zoomValue = capabilities.zoom.max <= 10 ? 1.0 : 100;
                
                try {
                    await track.applyConstraints({
                        // @ts-ignore
                        advanced: [{ zoom: zoomValue }]
                    });
                    console.log('[CameraCapture] Applied 1x zoom:', zoomValue);
                    setZoomLevel(zoomValue);
                } catch (e) {
                    console.warn('[CameraCapture] Could not apply 1x zoom', e);
                }
                
                // Update zoom state limits
                setMinZoom(capabilities.zoom.min || 1);
                setMaxZoom(capabilities.zoom.max || 1);
            }

            // Bonus: Push resolution higher if supported
            if (capabilities.width && capabilities.width.max >= 3840) {
                try {
                    await track.applyConstraints({
                        width: { ideal: capabilities.width.max },
                        height: { ideal: capabilities.height.max }
                    });
                    console.log('[CameraCapture] Pushed to max resolution:', capabilities.width.max);
                } catch (e) {
                    console.warn('[CameraCapture] Could not push resolution higher', e);
                }
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

    // Apply zoom level to camera
    const applyZoom = async (level: number) => {
        if (!streamRef.current) return;

        const videoTrack = streamRef.current.getVideoTracks()[0];
        const capabilities = videoTrack.getCapabilities() as any;

        if (!capabilities.zoom) {
            console.log('[CameraCapture] Zoom not supported');
            return;
        }

        try {
            await videoTrack.applyConstraints({
                // @ts-ignore
                advanced: [{ zoom: level }]
            });
            setZoomLevel(level);
        } catch (error) {
            console.error('[CameraCapture] Failed to apply zoom:', error);
        }
    };

    // Handle zoom in/out buttons
    const handleZoomIn = () => {
        const newZoom = Math.min(zoomLevel + 0.5, maxZoom);
        applyZoom(newZoom);
    };

    const handleZoomOut = () => {
        const newZoom = Math.max(zoomLevel - 0.5, minZoom);
        applyZoom(newZoom);
    };

    // Handle pinch-to-zoom gesture
    const handleTouchStart = (e: React.TouchEvent) => {
        if (e.touches.length === 2) {
            const distance = Math.hypot(
                e.touches[0].pageX - e.touches[1].pageX,
                e.touches[0].pageY - e.touches[1].pageY
            );
            lastTouchDistance.current = distance;
        }
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        if (e.touches.length === 2 && lastTouchDistance.current > 0) {
            const distance = Math.hypot(
                e.touches[0].pageX - e.touches[1].pageX,
                e.touches[0].pageY - e.touches[1].pageY
            );

            const delta = distance - lastTouchDistance.current;
            const zoomDelta = delta * 0.01; // Sensitivity factor

            const newZoom = Math.max(minZoom, Math.min(maxZoom, zoomLevel + zoomDelta));
            applyZoom(newZoom);

            lastTouchDistance.current = distance;
        }
    };

    const handleTouchEnd = () => {
        lastTouchDistance.current = 0;
    };

    // Handle tap-to-focus
    const handleTapToFocus = async (e: React.MouseEvent<HTMLVideoElement> | React.TouchEvent<HTMLVideoElement>) => {
        if (!streamRef.current || !videoRef.current) return;

        // Ignore if this is part of a pinch gesture
        if ('touches' in e && e.touches.length > 1) return;

        const video = videoRef.current;
        const rect = video.getBoundingClientRect();

        // Get tap coordinates
        let clientX: number, clientY: number;
        if ('touches' in e) {
            clientX = e.touches[0].clientX;
            clientY = e.touches[0].clientY;
        } else {
            clientX = e.clientX;
            clientY = e.clientY;
        }

        // Calculate relative coordinates (0-1 range)
        const x = (clientX - rect.left) / rect.width;
        const y = (clientY - rect.top) / rect.height;

        // Show focus indicator
        setFocusPoint({ x: clientX - rect.left, y: clientY - rect.top });

        // Hide focus indicator after animation
        setTimeout(() => setFocusPoint(null), 1000);

        // Apply focus at tap point
        const videoTrack = streamRef.current.getVideoTracks()[0];
        const capabilities = videoTrack.getCapabilities() as any;

        try {
            // Build constraints object dynamically to avoid TypeScript errors
            const constraintsObj: any = {};

            // Check if device supports focus modes
            if (capabilities.focusMode && Array.isArray(capabilities.focusMode)) {
                const advancedConstraints: any = {};

                if (capabilities.focusMode.includes('manual')) {
                    // Android: manual tap-to-focus
                    advancedConstraints.focusMode = 'manual';
                    advancedConstraints.pointsOfInterest = [{ x, y }];
                    console.log('[CameraCapture] Android: manual focus at', x, y);
                } else if (capabilities.focusMode.includes('continuous')) {
                    // iOS: continuous autofocus  
                    advancedConstraints.focusMode = 'continuous';
                    console.log('[CameraCapture] iOS: continuous autofocus');
                }

                if (Object.keys(advancedConstraints).length > 0) {
                    constraintsObj.advanced = [advancedConstraints];
                    await videoTrack.applyConstraints(constraintsObj);
                }
            }
        } catch (error) {
            console.log('[CameraCapture] Using device default focus');
        }
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
                            className="w-full h-full object-cover cursor-pointer"
                            playsInline
                            autoPlay
                            muted
                            onTouchStart={(e) => {
                                handleTouchStart(e);
                                // Single tap for focus
                                // Tap-to-focus disabled - autofocus works better
                            }}
                            // onClick={handleTapToFocus}  // Disabled - causes blur on some devices
                            onTouchMove={handleTouchMove}
                            onTouchEnd={handleTouchEnd}
                        />

                        {/* Focus Indicator */}
                        {focusPoint && (
                            <div
                                className="absolute pointer-events-none"
                                style={{
                                    left: focusPoint.x,
                                    top: focusPoint.y,
                                    transform: 'translate(-50%, -50%)'
                                }}
                            >
                                <div className="w-16 h-16 border-2 border-yellow-400 rounded-full animate-ping" />
                                <div className="absolute inset-0 w-16 h-16 border-2 border-yellow-400 rounded-full" />
                            </div>
                        )}

                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            <div className="border-2 border-white/50 rounded-lg w-4/5 h-2/3 shadow-lg">
                                <div className="absolute -top-8 left-1/2 -translate-x-1/2 text-white text-sm bg-black/50 px-3 py-1 rounded-full">
                                    Align price tag within frame
                                </div>
                            </div>
                        </div>

                        {/* Zoom Controls */}
                        {maxZoom > 1 && (
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 flex flex-col gap-3 pointer-events-auto">
                                <button
                                    onClick={handleZoomIn}
                                    disabled={zoomLevel >= maxZoom}
                                    className="p-3 rounded-full bg-black/50 hover:bg-black/70 transition-colors disabled:opacity-30"
                                >
                                    <ZoomIn className="h-6 w-6 text-white" />
                                </button>

                                <div className="flex flex-col items-center gap-2 py-2 px-2 rounded-full bg-black/50">
                                    <div className="text-white text-xs font-medium">
                                        {zoomLevel.toFixed(1)}x
                                    </div>
                                </div>

                                <button
                                    onClick={handleZoomOut}
                                    disabled={zoomLevel <= minZoom}
                                    className="p-3 rounded-full bg-black/50 hover:bg-black/70 transition-colors disabled:opacity-30"
                                >
                                    <ZoomOut className="h-6 w-6 text-white" />
                                </button>
                            </div>
                        )}
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

