import React from 'react';
import { FaLeaf, FaThermometerHalf, FaTint, FaSun, FaRuler } from 'react-icons/fa';

const PlantDetails = ({ plant }) => {
    const {
        scientificName,
        commonNames,
        family,
        genus,
        images,
        confidence,
        additionalInfo
    } = plant;

    return (
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            {/* Image Gallery */}
            <div className="relative h-64 bg-gray-100">
                {images && images.length > 0 ? (
                    <div className="flex overflow-x-auto snap-x">
                        {images.map((image, index) => (
                            <img
                                key={index}
                                src={image.url}
                                alt={`${commonNames[0] || scientificName}`}
                                className="h-64 w-full object-cover snap-center"
                            />
                        ))}
                    </div>
                ) : (
                    <div className="flex items-center justify-center h-full">
                        <FaLeaf className="h-12 w-12 text-gray-400" />
                    </div>
                )}
            </div>

            {/* Plant Information */}
            <div className="p-6">
                <div className="flex justify-between items-start">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900">
                            {commonNames[0] || scientificName}
                        </h2>
                        <p className="text-gray-600 italic">{scientificName}</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium
                        ${confidence >= 0.7 ? 'bg-green-100 text-green-800' :
                          confidence >= 0.4 ? 'bg-yellow-100 text-yellow-800' :
                                            'bg-red-100 text-red-800'}`}>
                        {Math.round(confidence * 100)}% Match
                    </span>
                </div>

                {/* Taxonomy */}
                <div className="mt-6">
                    <h3 className="text-lg font-semibold mb-2">Taxonomy</h3>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <p className="text-sm text-gray-500">Family</p>
                            <p className="font-medium">{family}</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Genus</p>
                            <p className="font-medium">{genus}</p>
                        </div>
                    </div>
                </div>

                {/* Common Names */}
                {commonNames.length > 1 && (
                    <div className="mt-6">
                        <h3 className="text-lg font-semibold mb-2">Also Known As</h3>
                        <div className="flex flex-wrap gap-2">
                            {commonNames.slice(1).map((name, index) => (
                                <span 
                                    key={index}
                                    className="px-2 py-1 bg-gray-100 rounded-full text-sm"
                                >
                                    {name}
                                </span>
                            ))}
                        </div>
                    </div>
                )}

                {/* Growing Conditions */}
                {additionalInfo && (
                    <div className="mt-6">
                        <h3 className="text-lg font-semibold mb-2">Growing Conditions</h3>
                        <div className="grid grid-cols-2 gap-4">
                            {additionalInfo.sunlight && (
                                <div className="flex items-center gap-2">
                                    <FaSun className="text-yellow-500" />
                                    <span>{additionalInfo.sunlight}</span>
                                </div>
                            )}
                            {additionalInfo.watering && (
                                <div className="flex items-center gap-2">
                                    <FaTint className="text-blue-500" />
                                    <span>{additionalInfo.watering}</span>
                                </div>
                            )}
                            {additionalInfo.temperature && (
                                <div className="flex items-center gap-2">
                                    <FaThermometerHalf className="text-red-500" />
                                    <span>{additionalInfo.temperature}</span>
                                </div>
                            )}
                            {additionalInfo.size && (
                                <div className="flex items-center gap-2">
                                    <FaRuler className="text-gray-500" />
                                    <span>{additionalInfo.size}</span>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Care Tips */}
                {additionalInfo?.careTips && (
                    <div className="mt-6">
                        <h3 className="text-lg font-semibold mb-2">Care Tips</h3>
                        <ul className="list-disc list-inside space-y-2 text-gray-600">
                            {additionalInfo.careTips.map((tip, index) => (
                                <li key={index}>{tip}</li>
                            ))}
                        </ul>
                    </div>
                )}
            </div>
        </div>
    );
};

export default PlantDetails;