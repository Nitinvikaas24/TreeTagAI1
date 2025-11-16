import React, { useState, useEffect } from 'react';
import { Chart as ChartJS } from 'chart.js/auto';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import { FaLeaf, FaShoppingCart, FaExclamationTriangle, FaArrowUp, FaArrowDown } from 'react-icons/fa';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const OfficerDashboard = () => {
    const [salesData, setSalesData] = useState(null);
    const [inventoryData, setInventoryData] = useState(null);
    const [popularPlants, setPopularPlants] = useState([]);
    const [lowStockAlerts, setLowStockAlerts] = useState([]);
    const [selectedTimeRange, setSelectedTimeRange] = useState('week');
    const [loading, setLoading] = useState(true);
    const { token } = useAuth();

    useEffect(() => {
        fetchDashboardData();
    }, [selectedTimeRange]);

    const fetchDashboardData = async () => {
        try {
            const [salesRes, inventoryRes, popularRes, alertsRes] = await Promise.all([
                axios.get(`/api/analytics/sales/${selectedTimeRange}`, {
                    headers: { Authorization: `Bearer ${token}` }
                }),
                axios.get('/api/analytics/inventory', {
                    headers: { Authorization: `Bearer ${token}` }
                }),
                axios.get('/api/analytics/popular-plants', {
                    headers: { Authorization: `Bearer ${token}` }
                }),
                axios.get('/api/analytics/low-stock', {
                    headers: { Authorization: `Bearer ${token}` }
                })
            ]);

            setSalesData(salesRes.data);
            setInventoryData(inventoryRes.data);
            setPopularPlants(popularRes.data);
            setLowStockAlerts(alertsRes.data);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching dashboard data:', error);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-100 p-8">
                <div className="animate-pulse space-y-4">
                    <div className="h-48 bg-white rounded-lg"></div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {[1, 2, 3, 4].map(i => (
                            <div key={i} className="h-32 bg-white rounded-lg"></div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-100 p-8">
            {/* Time Range Selector */}
            <div className="mb-6 flex justify-between items-center">
                <h1 className="text-2xl font-bold text-gray-800">Officer Dashboard</h1>
                <select
                    value={selectedTimeRange}
                    onChange={(e) => setSelectedTimeRange(e.target.value)}
                    className="form-select rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                >
                    <option value="today">Today</option>
                    <option value="week">This Week</option>
                    <option value="month">This Month</option>
                    <option value="year">This Year</option>
                </select>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <QuickStatCard
                    title="Total Sales"
                    value={`₹${salesData?.total || 0}`}
                    change={salesData?.change}
                    icon={<FaShoppingCart className="text-green-600" />}
                />
                <QuickStatCard
                    title="Plants Sold"
                    value={salesData?.quantity || 0}
                    change={salesData?.quantityChange}
                    icon={<FaLeaf className="text-green-600" />}
                />
                <QuickStatCard
                    title="Low Stock Items"
                    value={lowStockAlerts?.length || 0}
                    isWarning={true}
                    icon={<FaExclamationTriangle className="text-yellow-600" />}
                />
                <QuickStatCard
                    title="Inventory Value"
                    value={`₹${inventoryData?.totalValue || 0}`}
                    change={inventoryData?.valueChange}
                    icon={<FaLeaf className="text-green-600" />}
                />
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                <div className="bg-white rounded-lg shadow p-6">
                    <h2 className="text-lg font-semibold mb-4">Sales Trend</h2>
                    {salesData?.chartData && (
                        <Line
                            data={salesData.chartData}
                            options={{
                                responsive: true,
                                scales: {
                                    y: { beginAtZero: true }
                                }
                            }}
                        />
                    )}
                </div>
                <div className="bg-white rounded-lg shadow p-6">
                    <h2 className="text-lg font-semibold mb-4">Category Distribution</h2>
                    {inventoryData?.categoryData && (
                        <Doughnut
                            data={inventoryData.categoryData}
                            options={{ responsive: true }}
                        />
                    )}
                </div>
            </div>

            {/* Popular Plants & Low Stock Alerts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-white rounded-lg shadow p-6">
                    <h2 className="text-lg font-semibold mb-4">Popular Plants</h2>
                    <div className="space-y-4">
                        {popularPlants.map((plant) => (
                            <PopularPlantCard key={plant._id} plant={plant} />
                        ))}
                    </div>
                </div>
                <div className="bg-white rounded-lg shadow p-6">
                    <h2 className="text-lg font-semibold mb-4">Low Stock Alerts</h2>
                    <div className="space-y-4">
                        {lowStockAlerts.map((alert) => (
                            <LowStockAlert key={alert._id} alert={alert} />
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

const QuickStatCard = ({ title, value, change, icon, isWarning }) => (
    <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-start">
            <div>
                <p className="text-sm text-gray-600">{title}</p>
                <p className="text-2xl font-bold mt-1">{value}</p>
                {change !== undefined && (
                    <p className={`text-sm mt-1 ${change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {change >= 0 ? <FaArrowUp className="inline" /> : <FaArrowDown className="inline" />}
                        {Math.abs(change)}%
                    </p>
                )}
            </div>
            <div className={`p-3 rounded-full ${isWarning ? 'bg-yellow-100' : 'bg-green-100'}`}>
                {icon}
            </div>
        </div>
    </div>
);

const PopularPlantCard = ({ plant }) => (
    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
        <div className="flex items-center space-x-4">
            {plant.image ? (
                <img src={plant.image} alt={plant.name} className="w-12 h-12 rounded-full object-cover" />
            ) : (
                <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                    <FaLeaf className="text-green-600" />
                </div>
            )}
            <div>
                <p className="font-medium">{plant.name}</p>
                <p className="text-sm text-gray-600">{plant.salesCount} sold</p>
            </div>
        </div>
        <p className="text-lg font-semibold">₹{plant.revenue}</p>
    </div>
);

const LowStockAlert = ({ alert }) => (
    <div className="flex items-center justify-between p-4 bg-yellow-50 rounded-lg">
        <div>
            <p className="font-medium">{alert.plantName}</p>
            <p className="text-sm text-gray-600">
                Current Stock: {alert.currentStock} | Minimum: {alert.minimumStock}
            </p>
        </div>
        <button className="btn btn-secondary text-sm">
            Restock
        </button>
    </div>
);

export default OfficerDashboard;