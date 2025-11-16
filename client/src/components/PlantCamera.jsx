import React, { useRef, useState, useCallback } from 'react';
import Webcam from 'react-webcam';
import { FaCamera, FaSync, FaLeaf } from 'react-icons/fa';
import imageCompression from 'browser-image-compression';
import '../styles/PlantIdentification.css';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

const PlantCamera = () => {
    const webcamRef = useRef(null);
    const [capturedImage, setCapturedImage] = useState(null);
    const [facingMode, setFacingMode] = useState('environment');
    const [results, setResults] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const { token } = useAuth();

    const videoConstraints = {
        width: 1280,
        height: 720,
        facingMode: facingMode,
    };

    const switchCamera = useCallback(() => {
        setFacingMode(prev => prev === 'user' ? 'environment' : 'user');
    }, []);

    const captureImage = useCallback(async () => {
        try {
            const imageSrc = webcamRef.current.getScreenshot();
            if (!imageSrc) return;

            // Convert base64 to blob
            const blob = await fetch(imageSrc).then(r => r.blob());
            
            // Compress image
            const compressedFile = await imageCompression(blob, {
                maxSizeMB: 1,
                maxWidthOrHeight: 800,
                useWebWorker: true
            });
            
            setCapturedImage(URL.createObjectURL(compressedFile));
            await identifyPlant(compressedFile);
        } catch (err) {
            setError('Failed to capture image. Please try again.');
            console.error('Capture error:', err);
        }
    }, []);

    const identifyPlant = async (imageFile) => {
        setIsLoading(true);
        setError(null);
        
        try {
            const formData = new FormData();
            formData.append('image', imageFile);
            formData.append('organs', JSON.stringify(['leaf', 'flower', 'fruit', 'bark']));

            const response = await axios.post('/api/identifications/identify', 
                formData,
                {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'multipart/form-data'
                    }
                }
            );
            
            setResults(response.data.results);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to identify plant. Please try again.');
            console.error('Identification error:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const getConfidenceBadgeClass = (confidence) => {
        if (confidence >= 0.7) return 'confidence-badge confidence-high';
        if (confidence >= 0.4) return 'confidence-badge confidence-medium';
        return 'confidence-badge confidence-low';
    };

    return (
        <div className="camera-container">
            <div className="camera-view">
                <Webcam
                    audio={false}
                    ref={webcamRef}
                    screenshotFormat="image/jpeg"
                    videoConstraints={videoConstraints}
                    className="w-full h-full"
                />
            </div>
            
            <div className="camera-controls">
                <button 
                    onClick={switchCamera}
                    className="switch-camera-btn"
                >
                    <FaSync /> Switch Camera
                </button>
                <button 
                    onClick={captureImage}
                    className="capture-btn"
                    disabled={isLoading}
                >
                    <FaCamera /> {isLoading ? 'Processing...' : 'Capture'}
                </button>
            </div>

            {error && (
                <div className="p-4 bg-red-100 text-red-700 rounded mt-4">
                    {error}
                </div>
            )}

            {results && (
                <div className="result-container">
                    <h3 className="text-lg font-semibold mb-4">Identification Results</h3>
                    {results.map((result, index) => (
                        <div key={index} className="plant-result-card">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h4 className="text-lg font-medium">
                                        {result.commonNames[0] || result.scientificName}
                                    </h4>
                                    <p className="text-sm text-gray-600 italic">
                                        {result.scientificName}
                                    </p>
                                    <p className="text-sm text-gray-500">
                                        Family: {result.family}
                                    </p>
                                </div>
                                <span className={getConfidenceBadgeClass(result.confidence)}>
                                    {Math.round(result.confidence * 100)}% Match
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {capturedImage && (
                <div className="mt-4 p-4 border-t">
                    <h4 className="text-sm font-medium mb-2">Captured Image</h4>
                    <img 
                        src={capturedImage} 
                        alt="Captured plant" 
                        className="w-full max-w-md mx-auto rounded"
                    />
                </div>
            )}
        </div>
    );
};

export default PlantCamera;