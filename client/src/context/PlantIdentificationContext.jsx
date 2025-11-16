import React, { createContext, useContext, useState, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from './AuthContext';

const PlantIdentificationContext = createContext();

export const usePlantIdentification = () => {
    const context = useContext(PlantIdentificationContext);
    if (!context) {
        throw new Error('usePlantIdentification must be used within a PlantIdentificationProvider');
    }
    return context;
};

export const PlantIdentificationProvider = ({ children }) => {
    const [history, setHistory] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const { token } = useAuth();

    const fetchHistory = useCallback(async () => {
        setIsLoading(true);
        try {
            const response = await axios.get('/api/identifications/history', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            setHistory(response.data.history);
        } catch (error) {
            console.error('Failed to fetch identification history:', error);
        } finally {
            setIsLoading(false);
        }
    }, [token]);

    const addToHistory = useCallback((identification) => {
        setHistory(prev => [identification, ...prev]);
    }, []);

    return (
        <PlantIdentificationContext.Provider value={{
            history,
            isLoading,
            fetchHistory,
            addToHistory
        }}>
            {children}
        </PlantIdentificationContext.Provider>
    );
};