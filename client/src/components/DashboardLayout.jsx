import React from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import LanguageSelector from './LanguageSelector'; // <--- The new component

const DashboardLayout = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLanguageChange = (lang) => {
        // Save preference to local storage so it persists
        localStorage.setItem('treetag-language', lang);
        
        // In a real app, you might trigger a context update here
        // For now, we just log it. The Receipt generator will read this preference.
        console.log("Language switched to:", lang);
        
        // Optional: Reload to apply UI translations if you have them
        // window.location.reload(); 
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
            {/* Top Navigation Bar */}
            <header className="bg-white shadow-sm z-20 sticky top-0">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex justify-between items-center">
                    
                    {/* Logo & Brand */}
                    <div 
                        className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity" 
                        onClick={() => navigate('/user')}
                    >
                        <span className="text-2xl">🌿</span>
                        <span className="text-xl font-bold text-green-800 tracking-tight">Hortus</span>
                    </div>
                    
                    {/* Right Side Controls */}
                    <div className="flex items-center gap-4">
                        
                        {/* --- NEW: Language Selector --- */}
                        <div className="hidden sm:block w-32">
                            <LanguageSelector onLanguageChange={handleLanguageChange} />
                        </div>
                        
                        {/* User Info */}
                        <div className="flex items-center gap-3 pl-4 border-l border-gray-200">
                            <div className="text-right hidden md:block">
                                <div className="text-sm font-medium text-gray-900">
                                    {user?.fullName || user?.name || 'Farmer'}
                                </div>
                                <div className="text-xs text-gray-500 capitalize">
                                    {user?.role || 'User'}
                                </div>
                            </div>
                            
                            <button 
                                onClick={logout}
                                className="bg-red-50 text-red-600 hover:bg-red-100 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
                            >
                                Logout
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content Area */}
            <main className="flex-1 relative">
                <Outlet />
            </main>
        </div>
    );
};

export default DashboardLayout;