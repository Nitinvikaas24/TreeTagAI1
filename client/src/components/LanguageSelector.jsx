import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const LanguageSelector = ({ onLanguageChange, className = '' }) => {
    const [languages, setLanguages] = useState({});
    const [selectedLang, setSelectedLang] = useState('en');
    const [loading, setLoading] = useState(true);
    const { token } = useAuth();

    useEffect(() => {
        const fetchLanguages = async () => {
            try {
                const response = await axios.get('/api/translations/languages');
                setLanguages(response.data.languages);
                setLoading(false);
            } catch (error) {
                console.error('Failed to fetch languages:', error);
                setLoading(false);
            }
        };

        fetchLanguages();
    }, []);

    const handleLanguageChange = (e) => {
        const newLang = e.target.value;
        setSelectedLang(newLang);
        onLanguageChange(newLang);
    };

    if (loading) {
        return (
            <div className={`inline-block ${className}`}>
                <div className="animate-pulse h-10 w-32 bg-gray-200 rounded"></div>
            </div>
        );
    }

    return (
        <div className={className}>
            <select
                value={selectedLang}
                onChange={handleLanguageChange}
                className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm rounded-md"
            >
                {Object.entries(languages).map(([code, { name, nativeName }]) => (
                    <option key={code} value={code}>
                        {nativeName} ({name})
                    </option>
                ))}
            </select>
        </div>
    );
};

export default LanguageSelector;