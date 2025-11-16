import React, { useState, useEffect } from 'react';
import { FaDownload, FaCalendar, FaChartBar, FaTable } from 'react-icons/fa';
import axios from 'axios';
import { Chart as ChartJS } from 'chart.js/auto';
import { Bar, Line, Pie } from 'react-chartjs-2';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const Reports = () => {
    const [reportType, setReportType] = useState('sales');
    const [timeRange, setTimeRange] = useState('week');
    const [viewMode, setViewMode] = useState('chart');
    const [reportData, setReportData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [dateRange, setDateRange] = useState({
        startDate: new Date(new Date().setDate(new Date().getDate() - 7)).toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0]
    });
    const { token } = useAuth();

    useEffect(() => {
        fetchReportData();
    }, [reportType, timeRange, dateRange]);

    const fetchReportData = async () => {
        setLoading(true);
        try {
            const response = await axios.get(`/api/reports/${reportType}`, {
                params: {
                    timeRange,
                    startDate: dateRange.startDate,
                    endDate: dateRange.endDate
                },
                headers: { Authorization: `Bearer ${token}` }
            });
            setReportData(response.data);
        } catch (error) {
            console.error('Error fetching report data:', error);
            toast.error('Failed to fetch report data');
        }
        setLoading(false);
    };

    const exportReport = async (format) => {
        try {
            const response = await axios.get(`/api/reports/${reportType}/export`, {
                params: {
                    timeRange,
                    startDate: dateRange.startDate,
                    endDate: dateRange.endDate,
                    format
                },
                headers: { Authorization: `Bearer ${token}` },
                responseType: 'blob'
            });
            
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute(
                'download',
                `${reportType}_report_${new Date().toISOString()}.${format}`
            );
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (error) {
            console.error('Error exporting report:', error);
            toast.error('Failed to export report');
        }
    };

    const getChartComponent = () => {
        if (!reportData || !reportData.chartData) return null;

        const chartProps = {
            data: reportData.chartData,
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'top',
                    },
                    title: {
                        display: true,
                        text: reportData.title
                    }
                }
            }
        };

        switch (reportType) {
            case 'sales':
                return <Line {...chartProps} />;
            case 'inventory':
                return <Bar {...chartProps} />;
            case 'categories':
                return <Pie {...chartProps} />;
            default:
                return null;
        }
    };

    const renderTableView = () => {
        if (!reportData || !reportData.tableData) return null;

        return (
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            {reportData.tableHeaders.map((header, index) => (
                                <th
                                    key={index}
                                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                                >
                                    {header}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {reportData.tableData.map((row, rowIndex) => (
                            <tr key={rowIndex}>
                                {Object.values(row).map((cell, cellIndex) => (
                                    <td
                                        key={cellIndex}
                                        className="px-6 py-4 whitespace-nowrap text-sm text-gray-900"
                                    >
                                        {cell}
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        );
    };

    return (
        <div className="p-8">
            <div className="mb-6">
                <h1 className="text-2xl font-bold mb-4">Reports & Analytics</h1>
                
                {/* Controls */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 bg-white rounded-lg shadow p-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Report Type
                        </label>
                        <select
                            value={reportType}
                            onChange={(e) => setReportType(e.target.value)}
                            className="form-select block w-full"
                        >
                            <option value="sales">Sales Report</option>
                            <option value="inventory">Inventory Report</option>
                            <option value="categories">Category Analysis</option>
                            <option value="customers">Customer Analytics</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Time Range
                        </label>
                        <select
                            value={timeRange}
                            onChange={(e) => setTimeRange(e.target.value)}
                            className="form-select block w-full"
                        >
                            <option value="today">Today</option>
                            <option value="week">This Week</option>
                            <option value="month">This Month</option>
                            <option value="year">This Year</option>
                            <option value="custom">Custom Range</option>
                        </select>
                    </div>

                    {timeRange === 'custom' && (
                        <div className="lg:col-span-2 grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Start Date
                                </label>
                                <input
                                    type="date"
                                    value={dateRange.startDate}
                                    onChange={(e) => setDateRange({
                                        ...dateRange,
                                        startDate: e.target.value
                                    })}
                                    className="form-input block w-full"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    End Date
                                </label>
                                <input
                                    type="date"
                                    value={dateRange.endDate}
                                    onChange={(e) => setDateRange({
                                        ...dateRange,
                                        endDate: e.target.value
                                    })}
                                    className="form-input block w-full"
                                />
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* View Controls & Export */}
            <div className="flex justify-between items-center mb-6">
                <div className="flex space-x-2">
                    <button
                        className={`btn ${viewMode === 'chart' ? 'btn-primary' : 'btn-secondary'}`}
                        onClick={() => setViewMode('chart')}
                    >
                        <FaChartBar className="mr-2" /> Chart View
                    </button>
                    <button
                        className={`btn ${viewMode === 'table' ? 'btn-primary' : 'btn-secondary'}`}
                        onClick={() => setViewMode('table')}
                    >
                        <FaTable className="mr-2" /> Table View
                    </button>
                </div>
                <div className="flex space-x-2">
                    <button
                        onClick={() => exportReport('xlsx')}
                        className="btn btn-secondary"
                    >
                        <FaDownload className="mr-2" /> Export Excel
                    </button>
                    <button
                        onClick={() => exportReport('pdf')}
                        className="btn btn-secondary"
                    >
                        <FaDownload className="mr-2" /> Export PDF
                    </button>
                </div>
            </div>

            {/* Report Content */}
            {loading ? (
                <div className="flex justify-center items-center h-64">
                    <div className="loading-spinner">Loading...</div>
                </div>
            ) : (
                <div className="bg-white rounded-lg shadow p-6">
                    {/* Summary Cards */}
                    {reportData?.summary && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                            {Object.entries(reportData.summary).map(([key, value]) => (
                                <div
                                    key={key}
                                    className="bg-gray-50 rounded-lg p-4"
                                >
                                    <h3 className="text-sm font-medium text-gray-500">
                                        {key.split('_').map(word => 
                                            word.charAt(0).toUpperCase() + word.slice(1)
                                        ).join(' ')}
                                    </h3>
                                    <p className="mt-1 text-2xl font-semibold text-gray-900">
                                        {typeof value === 'number' && key.includes('amount')
                                            ? `₹${value.toLocaleString()}`
                                            : value}
                                    </p>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Chart/Table View */}
                    <div className="mt-6">
                        {viewMode === 'chart' ? getChartComponent() : renderTableView()}
                    </div>

                    {/* Insights */}
                    {reportData?.insights && (
                        <div className="mt-6">
                            <h3 className="text-lg font-medium text-gray-900 mb-4">Key Insights</h3>
                            <ul className="space-y-2">
                                {reportData.insights.map((insight, index) => (
                                    <li
                                        key={index}
                                        className="flex items-start space-x-2 text-sm text-gray-600"
                                    >
                                        <span className="w-2 h-2 mt-1.5 rounded-full bg-green-500" />
                                        <span>{insight}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default Reports;