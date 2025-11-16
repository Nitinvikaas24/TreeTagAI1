import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

export default function PlantIdentificationPage() {
    const [file, setFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(null);
    const [loading, setLoading] = useState(false);
    const fileInputRef = useRef(null);
    const navigate = useNavigate();

    function onSelectFile(e) {
        const f = e.target.files && e.target.files[0];
        if (!f) return;
        setFile(f);
        setPreviewUrl(URL.createObjectURL(f));
    }

    function onClickUpload() {
        fileInputRef.current?.click();
    }

    async function onScanPlant() {
        if (!file) return;
        setLoading(true);
        toast.loading('Identifying plant...');

        // --- THIS IS THE FIX ---
        // 1. Create FormData to send the file
        const formData = new FormData();
        formData.append('image', file); // 'image' must match your multer middleware

        try {
            // 2. Call your REAL backend API
            const response = await fetch('/api/v1/identify', {
                method: 'POST',
                body: formData,
            });

            const result = await response.json();
            toast.dismiss();

            if (!response.ok) {
                throw new Error(result.message || 'Identification failed');
            }

            console.log('REAL Identification result:', result);
            
            // 3. Navigate to results page with the REAL data
            navigate('/user/results', { 
                state: { 
                    // Pass the real PlantNet results
                    identification: result 
                }
            });

        } catch (err) {
            toast.dismiss();
            console.error('Identification failed:', err);
            toast.error(err.message || 'Could not identify plant.');
        } finally {
            setLoading(false);
        }
    }
    
    // This is the old camera function, it's fine
    async function onUseCamera() {
        const cameraInput = document.createElement('input');
        cameraInput.type = 'file';
        cameraInput.accept = 'image/*';
        cameraInput.capture = 'environment';
        cameraInput.onchange = onSelectFile;
        cameraInput.click();
    }

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
            <div className="w-full max-w-2xl bg-white rounded-lg shadow-md p-8">
                <h1 className="text-2xl font-semibold mb-4">Identify a Plant</h1>

                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={onSelectFile}
                />

                <div className="flex gap-3 mb-6">
                    <button
                        onClick={onClickUpload}
                        className="flex-1 py-3 px-4 bg-green-600 hover:bg-green-700 text-white font-medium rounded-md shadow"
                    >
                        Upload Image
                    </button>

                    <button
                        onClick={onUseCamera}
                        className="py-3 px-4 bg-white border border-gray-300 text-gray-700 rounded-md shadow-sm"
                    >
                        Use Camera
                    </button>
                </div>

                {previewUrl ? (
                    <div className="mb-6">
                        <div className="border rounded-md overflow-hidden">
                            <img src={previewUrl} alt="preview" className="w-full h-96 object-contain bg-gray-100" />
                        </div>
                    </div>
                ) : (
                    <div className="mb-6 h-96 flex items-center justify-center rounded-md border border-dashed border-gray-300 bg-gray-50">
                        <span className="text-gray-400">No image selected</span>
                    </div>
                )}

                <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-500">Supported formats: JPG, PNG</div>

                    <div>
                        <button
                            onClick={onScanPlant}
                            disabled={!file || loading}
                            className={`py-2 px-4 rounded-md font-medium ${file && !loading ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}
                        >
                            {loading ? 'Scanning...' : 'Scan Plant'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}