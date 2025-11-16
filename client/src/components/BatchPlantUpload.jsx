import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import imageCompression from 'browser-image-compression';
import { FaUpload, FaSpinner, FaCheck, FaTimes } from 'react-icons/fa';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const BatchPlantUpload = () => {
    const [files, setFiles] = useState([]);
    const [uploading, setUploading] = useState(false);
    const [progress, setProgress] = useState({});
    const { token } = useAuth();

    const onDrop = useCallback(async (acceptedFiles) => {
        // Add new files to the queue
        const newFiles = acceptedFiles.map(file => ({
            file,
            id: Math.random().toString(36).substr(2, 9),
            status: 'pending',
            result: null,
            error: null
        }));
        setFiles(prev => [...prev, ...newFiles]);
    }, []);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            'image/jpeg': ['.jpg', '.jpeg'],
            'image/png': ['.png']
        },
        multiple: true
    });

    const processFile = async (fileData) => {
        try {
            // Compress image
            const compressedFile = await imageCompression(fileData.file, {
                maxSizeMB: 1,
                maxWidthOrHeight: 800,
                useWebWorker: true
            });

            // Create form data
            const formData = new FormData();
            formData.append('image', compressedFile);
            formData.append('organs', JSON.stringify(['leaf', 'flower', 'fruit', 'bark']));

            // Send to server
            const response = await axios.post('/api/identifications/identify', 
                formData,
                {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'multipart/form-data'
                    }
                }
            );

            return {
                status: 'completed',
                result: response.data.results
            };
        } catch (error) {
            return {
                status: 'failed',
                error: error.response?.data?.message || 'Failed to process image'
            };
        }
    };

    const processAllFiles = async () => {
        setUploading(true);
        
        // Process files in batches of 3
        const batchSize = 3;
        const pendingFiles = files.filter(f => f.status === 'pending');
        
        for (let i = 0; i < pendingFiles.length; i += batchSize) {
            const batch = pendingFiles.slice(i, i + batchSize);
            
            // Process batch concurrently
            const results = await Promise.all(
                batch.map(async (fileData) => {
                    setProgress(prev => ({
                        ...prev,
                        [fileData.id]: 'processing'
                    }));
                    
                    const result = await processFile(fileData);
                    
                    setProgress(prev => ({
                        ...prev,
                        [fileData.id]: result.status
                    }));
                    
                    return {
                        id: fileData.id,
                        ...result
                    };
                })
            );
            
            // Update files with results
            setFiles(prev => prev.map(file => {
                const result = results.find(r => r.id === file.id);
                if (result) {
                    return {
                        ...file,
                        status: result.status,
                        result: result.result,
                        error: result.error
                    };
                }
                return file;
            }));
        }
        
        setUploading(false);
    };

    return (
        <div className="space-y-4">
            <div 
                {...getRootProps()} 
                className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer
                    ${isDragActive ? 'border-green-500 bg-green-50' : 'border-gray-300 hover:border-green-500'}`}
            >
                <input {...getInputProps()} />
                <FaUpload className="mx-auto h-12 w-12 text-gray-400" />
                <p className="mt-2 text-sm text-gray-600">
                    Drag 'n' drop some images here, or click to select files
                </p>
            </div>

            {files.length > 0 && (
                <div className="space-y-4">
                    <div className="flex justify-between items-center">
                        <h3 className="text-lg font-medium">Uploaded Files</h3>
                        <button
                            onClick={processAllFiles}
                            disabled={uploading}
                            className="btn btn-primary"
                        >
                            {uploading ? 'Processing...' : 'Process All Files'}
                        </button>
                    </div>

                    <div className="space-y-2">
                        {files.map((file) => (
                            <div 
                                key={file.id} 
                                className="flex items-center justify-between p-4 bg-white rounded-lg shadow-sm"
                            >
                                <div className="flex items-center space-x-4">
                                    <img
                                        src={URL.createObjectURL(file.file)}
                                        alt="Preview"
                                        className="h-16 w-16 object-cover rounded"
                                    />
                                    <div>
                                        <p className="font-medium">{file.file.name}</p>
                                        <p className="text-sm text-gray-500">
                                            {(file.file.size / 1024 / 1024).toFixed(2)} MB
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center space-x-2">
                                    {progress[file.id] === 'processing' && (
                                        <FaSpinner className="animate-spin text-green-500" />
                                    )}
                                    {progress[file.id] === 'completed' && (
                                        <FaCheck className="text-green-500" />
                                    )}
                                    {progress[file.id] === 'failed' && (
                                        <FaTimes className="text-red-500" />
                                    )}
                                    <span className="text-sm text-gray-500">
                                        {file.status === 'completed' ? 
                                            `Identified: ${file.result[0]?.scientificName}` :
                                            file.error || file.status}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default BatchPlantUpload;