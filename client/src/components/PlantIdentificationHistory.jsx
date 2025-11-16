import React, { useEffect } from 'react';
import { usePlantIdentification } from '../context/PlantIdentificationContext';
import { format } from 'date-fns';

const PlantIdentificationHistory = () => {
    const { history, isLoading, fetchHistory } = usePlantIdentification();

    useEffect(() => {
        fetchHistory();
    }, [fetchHistory]);

    if (isLoading) {
        return (
            <div className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
                {[...Array(3)].map((_, i) => (
                    <div key={i} className="mb-4">
                        <div className="h-8 bg-gray-200 rounded mb-2"></div>
                        <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                    </div>
                ))}
            </div>
        );
    }

    if (!history.length) {
        return (
            <div className="text-center py-8">
                <p className="text-gray-500">No identification history yet.</p>
                <p className="text-sm text-gray-400">
                    Your plant identification results will appear here.
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {history.map((item) => (
                <div 
                    key={item._id} 
                    className="bg-white rounded-lg shadow p-4 hover:shadow-md transition-shadow"
                >
                    <div className="flex items-start justify-between">
                        <div>
                            <h3 className="font-medium">
                                {item.identifiedPlant.commonNames[0] || item.identifiedPlant.scientificName}
                            </h3>
                            <p className="text-sm text-gray-600 italic">
                                {item.identifiedPlant.scientificName}
                            </p>
                        </div>
                        <span className="text-sm text-gray-500">
                            {format(new Date(item.createdAt), 'MMM d, yyyy')}
                        </span>
                    </div>
                    
                    <div className="mt-2 flex gap-2">
                        <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                            {Math.round(item.confidence * 100)}% Match
                        </span>
                        {item.organs.map((organ) => (
                            <span 
                                key={organ}
                                className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full"
                            >
                                {organ}
                            </span>
                        ))}
                    </div>

                    {item.image && (
                        <img 
                            src={`/uploads/${item.image}`}
                            alt="Identified plant"
                            className="mt-2 w-full h-32 object-cover rounded"
                        />
                    )}
                </div>
            ))}
        </div>
    );
};

export default PlantIdentificationHistory;