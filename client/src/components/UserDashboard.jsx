import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaFileInvoiceDollar, FaDownload } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';

const formatCurrency = (value, currency = 'USD') =>
	new Intl.NumberFormat(undefined, { style: 'currency', currency }).format(Number(value) || 0);

export default function UserDashboard() {
	const { user, token } = useAuth();
	const navigate = useNavigate();
	const [receipts, setReceipts] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);

	useEffect(() => {
		const controller = new AbortController();

		const loadReceipts = async () => {
			try {
				setLoading(true);
				setError(null);
				const response = await fetch('/api/user/purchases/recent', {
					method: 'GET',
					headers: {
						'Content-Type': 'application/json',
						...(token ? { Authorization: `Bearer ${token}` } : {}),
					},
					signal: controller.signal,
				});
				if (!response.ok) throw new Error('Failed to fetch recent invoices.');
				const payload = await response.json();
				const items = Array.isArray(payload) ? payload : payload?.receipts ?? payload?.data ?? [];
				setReceipts(items);
			} catch (err) {
				if (err.name !== 'AbortError') setError(err.message || 'Unable to fetch invoices.');
			} finally {
				setLoading(false);
			}
		};

		loadReceipts();
		return () => controller.abort();
	}, [token]);

	const { totalRevenue, invoiceCount } = useMemo(() => {
		const sum = receipts.reduce((acc, receipt) => acc + (Number(receipt.totalAmount) || 0), 0);
		return { totalRevenue: sum, invoiceCount: receipts.length };
	}, [receipts]);

	return (
		<div className="space-y-8 p-6">
			<div className="flex justify-between items-center">
				<h1 className="text-3xl font-bold">Hortus Dashboard</h1>
				<button onClick={() => navigate('/user/cart')} className="bg-green-600 text-white px-6 py-2 rounded shadow">
					<FaFileInvoiceDollar className="inline mr-2"/> New Sale
				</button>
			</div>

			<section className="grid gap-6 lg:grid-cols-2">
				<div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-200">
					<h2 className="text-lg font-medium text-gray-800">Stats</h2>
					<div className="mt-4 grid gap-4 sm:grid-cols-2">
						<div className="rounded-lg border border-gray-100 p-4">
							<p className="text-sm text-gray-500">Total Revenue</p>
							<p className="mt-1 text-xl font-semibold text-gray-900">
								{formatCurrency(totalRevenue, receipts[0]?.currency || 'USD')}
							</p>
						</div>
						<div className="rounded-lg border border-gray-100 p-4">
							<p className="text-sm text-gray-500">Invoice Count</p>
							<p className="mt-1 text-xl font-semibold text-gray-900">{invoiceCount}</p>
						</div>
					</div>
				</div>

				<div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-200">
					<h2 className="text-lg font-medium text-gray-800">Status</h2>
					{loading && <p className="mt-4 text-sm text-gray-600">Loading recent invoices…</p>}
					{!loading && error && <p className="mt-4 text-sm text-red-600">{error}</p>}
					{!loading && !error && invoiceCount === 0 && (
						<p className="mt-4 text-sm text-gray-600">No recent invoices found.</p>
					)}
					{!loading && !error && invoiceCount > 0 && (
						<p className="mt-4 text-sm text-gray-600">Latest invoices synced from the blockchain.</p>
					)}
				</div>
			</section>

			<section className="rounded-xl bg-white shadow-sm ring-1 ring-gray-200">
				<div className="border-b border-gray-200 px-6 py-4">
					<h2 className="text-lg font-medium text-gray-800">Recent Blockchain Invoices</h2>
				</div>
				<div className="overflow-x-auto">
					<table className="min-w-full divide-y divide-gray-200">
						<thead className="bg-gray-50">
							<tr className="text-left text-xs font-medium uppercase tracking-wider text-gray-500">
								<th className="px-6 py-3">Receipt Number</th>
								<th className="px-6 py-3">Date</th>
								<th className="px-6 py-3">Customer Name</th>
								<th className="px-6 py-3">Total Amount</th>
								<th className="px-6 py-3 text-right">Actions</th>
							</tr>
						</thead>
						<tbody className="divide-y divide-gray-100 bg-white">
							{loading && (
								<tr>
									<td colSpan={5} className="px-6 py-4 text-sm text-gray-600">
										Loading recent invoices…
									</td>
								</tr>
							)}
							{!loading && !error && receipts.length === 0 && (
								<tr>
									<td colSpan={5} className="px-6 py-4 text-sm text-gray-600">
										No receipts to display.
									</td>
								</tr>
							)}
							{!loading &&
								!error &&
								receipts.map((receipt) => (
									<tr key={receipt.id || receipt.receiptNumber}>
										<td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
											{receipt.receiptNumber || '—'}
										</td>
										<td className="whitespace-nowrap px-6 py-4 text-sm text-gray-600">
											{receipt.createdAt
												? new Date(receipt.createdAt).toLocaleString()
												: '—'}
										</td>
										<td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
											{receipt.customerName || '—'}
										</td>
										<td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
											{formatCurrency(receipt.totalAmount, receipt.currency || 'USD')}
										</td>
										<td className="whitespace-nowrap px-6 py-4 text-right">
											<button
												type="button"
												className="inline-flex items-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:bg-gray-300"
												onClick={() =>
													receipt.pdfUrl && window.open(receipt.pdfUrl, '_blank', 'noopener,noreferrer')
												}
												disabled={!receipt.pdfUrl}
											>
												<FaDownload className="mr-1" /> View PDF
											</button>
										</td>
									</tr>
								))}
							{!loading && error && (
								<tr>
									<td colSpan={5} className="px-6 py-4 text-sm text-red-600">
										{error}
									</td>
								</tr>
							)}
						</tbody>
					</table>
				</div>
			</section>
		</div>
	);
}