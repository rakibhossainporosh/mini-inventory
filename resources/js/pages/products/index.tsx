import React, { useState, FormEvent } from 'react';
import { Head, router, useForm, usePage } from '@inertiajs/react';
import FormField from '@/components/inventory/FormField';

interface StockAdjustment {
    id: number;
    type: 'increase' | 'decrease';
    quantity_change: number;
    reason: string;
    created_at: string;
}

interface Product {
    id: number;
    name: string;
    sku: string;
    price: string;
    stock_quantity: number;
    adjustments?: StockAdjustment[];
}

interface PaginationLink {
    url: string | null;
    label: string;
    active: boolean;
}

interface PageProps {
    products: {
        data: Product[];
        links: PaginationLink[];
    };
    filters: {
        search: string;
        status: string;
    };
}

export default function InventoryIndex({ products, filters }: PageProps) {
    const { flash, errors: pageErrors } = usePage<{
        flash?: { success?: string; error?: string };
        errors?: { delete?: string };
    }>().props;

    // Search & Filter states
    const [search, setSearch] = useState(filters.search || '');
    const [status, setStatus] = useState(filters.status || '');

    // Modal states
    const [isProductModalOpen, setIsProductModalOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);
    const [adjustingProduct, setAdjustingProduct] = useState<Product | null>(null);
    const [historyProduct, setHistoryProduct] = useState<Product | null>(null);

    // Product Create/Edit Form
    const productForm = useForm({
        name: '',
        sku: '',
        price: '',
        stock_quantity: '0',
    });

    // Stock Adjustment Form
    const adjustForm = useForm({
        type: 'increase',
        quantity: '1',
        reason: '',
    });

    // Trigger Search & Filter preserving query parameters
    const applyFilters = (newSearch: string, newStatus: string) => {
        router.get(
            '/products',
            { search: newSearch, status: newStatus },
            { preserveState: true, replace: true }
        );
    };

    const openCreateModal = () => {
        setEditingProduct(null);
        productForm.setData({ name: '', sku: '', price: '', stock_quantity: '0' });
        productForm.clearErrors();
        setIsProductModalOpen(true);
    };

    const openEditModal = (product: Product) => {
        setEditingProduct(product);
        productForm.setData({
            name: product.name,
            sku: product.sku,
            price: product.price,
            stock_quantity: String(product.stock_quantity),
        });
        productForm.clearErrors();
        setIsProductModalOpen(true);
    };

    const handleProductSubmit = (e: FormEvent) => {
        e.preventDefault();
        if (editingProduct) {
            productForm.put(`/products/${editingProduct.id}`, {
                onSuccess: () => setIsProductModalOpen(false),
            });
        } else {
            productForm.post('/products', {
                onSuccess: () => setIsProductModalOpen(false),
            });
        }
    };

    const openAdjustModal = (product: Product) => {
        setAdjustingProduct(product);
        adjustForm.setData({ type: 'increase', quantity: '1', reason: '' });
        adjustForm.clearErrors();
    };

    const handleAdjustSubmit = (e: FormEvent) => {
        e.preventDefault();
        if (!adjustingProduct) return;

        adjustForm.post(`/products/${adjustingProduct.id}/adjust-stock`, {
            onSuccess: () => setAdjustingProduct(null),
        });
    };

    const handleDelete = (product: Product) => {
        if (window.confirm(`Are you sure you want to delete "${product.name}"?`)) {
            router.delete(`/products/${product.id}`);
        }
    };

    const renderStockBadge = (qty: number) => {
        if (qty === 0) {
            return (
                <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                    Out of Stock (0)
                </span>
            );
        }
        if (qty < 10) {
            return (
                <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-amber-100 text-amber-800">
                    Low Stock ({qty})
                </span>
            );
        }
        return (
            <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-emerald-100 text-emerald-800">
                In Stock ({qty})
            </span>
        );
    };

    return (
        <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8 text-gray-900">
            <Head title="Inventory Management" />

            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Mini Inventory Management</h1>
                        <p className="text-sm text-gray-500">Manage products, track stock levels, and audit stock adjustments.</p>
                    </div>
                    <button
                        onClick={openCreateModal}
                        className="bg-indigo-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-indigo-700 transition"
                    >
                        + Add Product
                    </button>
                </div>

                {/* Flash & Error Feedback */}
                {flash?.success && (
                    <div className="mb-4 p-4 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm">
                        {flash.success}
                    </div>
                )}
                {pageErrors?.delete && (
                    <div className="mb-4 p-4 rounded-md bg-red-50 border border-red-200 text-red-800 text-sm">
                        {pageErrors.delete}
                    </div>
                )}

                {/* Search & Filter Bar */}
                <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-6 flex flex-col sm:flex-row gap-4">
                    <input
                        type="text"
                        placeholder="Search by product name or SKU..."
                        value={search}
                        onChange={(e) => {
                            setSearch(e.target.value);
                            applyFilters(e.target.value, status);
                        }}
                        className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    <select
                        value={status}
                        onChange={(e) => {
                            setStatus(e.target.value);
                            applyFilters(search, e.target.value);
                        }}
                        className="rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                        <option value="">All Stock Statuses</option>
                        <option value="in_stock">In Stock (10+)</option>
                        <option value="low_stock">Low Stock (Below 10)</option>
                        <option value="out_of_stock">Out of Stock (0)</option>
                    </select>
                </div>

                {/* Responsive Products Table */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Product Name</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">SKU</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Price</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Stock Status</th>
                                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 bg-white">
                            {products.data.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-8 text-center text-gray-500 text-sm">
                                        No products found matching your criteria.
                                    </td>
                                </tr>
                            ) : (
                                products.data.map((product) => (
                                    <tr key={product.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 text-sm font-medium text-gray-900">{product.name}</td>
                                        <td className="px-6 py-4 text-sm text-gray-600 font-mono">{product.sku}</td>
                                        <td className="px-6 py-4 text-sm text-gray-900">${product.price}</td>
                                        <td className="px-6 py-4 text-sm">{renderStockBadge(product.stock_quantity)}</td>
                                        <td className="px-6 py-4 text-right text-sm font-medium space-x-3 whitespace-nowrap">
                                            <button
                                                onClick={() => openAdjustModal(product)}
                                                className="text-emerald-600 hover:text-emerald-900"
                                            >
                                                Adjust Stock
                                            </button>
                                            <button
                                                onClick={() => setHistoryProduct(product)}
                                                className="text-gray-600 hover:text-gray-900"
                                            >
                                                History
                                            </button>
                                            <button
                                                onClick={() => openEditModal(product)}
                                                className="text-indigo-600 hover:text-indigo-900"
                                            >
                                                Edit
                                            </button>
                                            <button
                                                onClick={() => handleDelete(product)}
                                                className="text-red-600 hover:text-red-900"
                                            >
                                                Delete
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>

                    {/* Pagination */}
                    {products.links.length > 3 && (
                        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex flex-wrap gap-1 justify-end">
                            {products.links.map((link, idx) => (
                                <button
                                    key={idx}
                                    disabled={!link.url}
                                    onClick={() => link.url && router.get(link.url, {}, { preserveState: true })}
                                    dangerouslySetInnerHTML={{ __html: link.label }}
                                    className={`px-3 py-1 text-xs rounded border ${
                                        link.active
                                            ? 'bg-indigo-600 text-white border-indigo-600'
                                            : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-100'
                                    } ${!link.url ? 'opacity-50 cursor-not-allowed' : ''}`}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Create / Edit Modal */}
            {isProductModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-lg max-w-md w-full p-6 shadow-xl">
                        <h2 className="text-lg font-bold text-gray-900 mb-4">
                            {editingProduct ? 'Edit Product' : 'Create Product'}
                        </h2>
                        <form onSubmit={handleProductSubmit}>
                            <FormField
                                id="name"
                                label="Product Name"
                                value={productForm.data.name}
                                onChange={(e) => productForm.setData('name', e.target.value)}
                                error={productForm.errors.name}
                                required
                            />
                            <FormField
                                id="sku"
                                label="SKU (Unique Code)"
                                value={productForm.data.sku}
                                onChange={(e) => productForm.setData('sku', e.target.value)}
                                error={productForm.errors.sku}
                                required
                            />
                            <FormField
                                id="price"
                                label="Price ($)"
                                type="number"
                                step="0.01"
                                value={productForm.data.price}
                                onChange={(e) => productForm.setData('price', e.target.value)}
                                error={productForm.errors.price}
                                required
                            />
                            {!editingProduct && (
                                <FormField
                                    id="stock_quantity"
                                    label="Initial Stock Quantity"
                                    type="number"
                                    min="0"
                                    value={productForm.data.stock_quantity}
                                    onChange={(e) => productForm.setData('stock_quantity', e.target.value)}
                                    error={productForm.errors.stock_quantity}
                                    required
                                />
                            )}
                            <div className="flex justify-end gap-2 mt-6">
                                <button
                                    type="button"
                                    onClick={() => setIsProductModalOpen(false)}
                                    className="px-4 py-2 text-sm border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={productForm.processing}
                                    className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
                                >
                                    {editingProduct ? 'Update Product' : 'Save Product'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Stock Adjustment Modal */}
            {adjustingProduct && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-lg max-w-md w-full p-6 shadow-xl">
                        <h2 className="text-lg font-bold text-gray-900 mb-1">
                            Adjust Stock: {adjustingProduct.name}
                        </h2>
                        <p className="text-xs text-gray-500 mb-4">
                            Current Available Stock: <strong className="text-gray-800">{adjustingProduct.stock_quantity}</strong>
                        </p>
                        <form onSubmit={handleAdjustSubmit}>
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Adjustment Type</label>
                                <select
                                    value={adjustForm.data.type}
                                    onChange={(e) => adjustForm.setData('type', e.target.value)}
                                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 bg-white"
                                >
                                    <option value="increase">Increase Stock (+)</option>
                                    <option value="decrease">Decrease Stock (-)</option>
                                </select>
                                {adjustForm.errors.type && (
                                    <p className="mt-1 text-xs text-red-600">{adjustForm.errors.type}</p>
                                )}
                            </div>
                            <FormField
                                id="quantity"
                                label="Quantity to Adjust"
                                type="number"
                                min="1"
                                value={adjustForm.data.quantity}
                                onChange={(e) => adjustForm.setData('quantity', e.target.value)}
                                error={adjustForm.errors.quantity}
                                required
                            />
                            <FormField
                                id="reason"
                                label="Reason (e.g., Restock, Damaged, Sale)"
                                value={adjustForm.data.reason}
                                onChange={(e) => adjustForm.setData('reason', e.target.value)}
                                error={adjustForm.errors.reason}
                                required
                            />
                            <div className="flex justify-end gap-2 mt-6">
                                <button
                                    type="button"
                                    onClick={() => setAdjustingProduct(null)}
                                    className="px-4 py-2 text-sm border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={adjustForm.processing}
                                    className="px-4 py-2 text-sm bg-emerald-600 text-white rounded-md hover:bg-emerald-700 disabled:opacity-50"
                                >
                                    Confirm Adjustment
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Recent Adjustment History Modal */}
            {historyProduct && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-lg max-w-lg w-full p-6 shadow-xl">
                        <h2 className="text-lg font-bold text-gray-900 mb-4">
                            Recent Stock History: {historyProduct.name}
                        </h2>
                        {!historyProduct.adjustments || historyProduct.adjustments.length === 0 ? (
                            <p className="text-sm text-gray-500 py-4">No stock adjustments recorded yet.</p>
                        ) : (
                            <ul className="divide-y divide-gray-200 max-h-64 overflow-y-auto">
                                {historyProduct.adjustments.map((adj) => (
                                    <li key={adj.id} className="py-3 flex justify-between items-center text-sm">
                                        <div>
                                            <span
                                                className={`font-semibold ${
                                                    adj.type === 'increase' ? 'text-emerald-600' : 'text-red-600'
                                                }`}
                                            >
                                                {adj.type === 'increase' ? `+${adj.quantity_change}` : `-${adj.quantity_change}`}
                                            </span>
                                            <span className="ml-2 text-gray-700">{adj.reason}</span>
                                        </div>
                                        <span className="text-xs text-gray-400">
                                            {new Date(adj.created_at).toLocaleString()}
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        )}
                        <div className="flex justify-end mt-6">
                            <button
                                type="button"
                                onClick={() => setHistoryProduct(null)}
                                className="px-4 py-2 text-sm bg-gray-800 text-white rounded-md hover:bg-gray-900"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
InventoryIndex.layout = (page: React.ReactNode) => page;