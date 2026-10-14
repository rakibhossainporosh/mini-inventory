import React, { useState, FormEvent, useMemo } from 'react';
import { Head, router, useForm, usePage } from '@inertiajs/react';
import {
    Boxes,
    CheckCircle2,
    AlertTriangle,
    XCircle,
    Plus,
    Search,
    Filter,
    RotateCcw,
    ArrowUpDown,
    History,
    Pencil,
    Trash2,
    X,
    Package,
    PackagePlus,
    Clock,
    AlertCircle,
    Check,
} from 'lucide-react';
import { toast } from 'sonner';
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

interface Stats {
    total: number;
    in_stock: number;
    low_stock: number;
    out_of_stock: number;
}

interface PageProps {
    products: {
        data: Product[];
        links: PaginationLink[];
        total: number;
        from: number;
        to: number;
    };
    filters: {
        search: string;
        status: string;
    };
    stats?: Stats;
}

const QUICK_REASONS = [
    'Restock shipment received',
    'Customer order fulfillment',
    'Damaged / Defective inventory',
    'Annual inventory audit adjustment',
    'Store floor demo display',
];

export default function InventoryIndex({ products, filters, stats }: PageProps) {
    const { flash, errors: pageErrors } = usePage<{
        flash?: { success?: string; error?: string };
        errors?: { delete?: string };
    }>().props;

    // Search & Filter state
    const [search, setSearch] = useState(filters.search || '');
    const [status, setStatus] = useState(filters.status || '');

    // Modals state
    const [isProductModalOpen, setIsProductModalOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);
    const [adjustingProduct, setAdjustingProduct] = useState<Product | null>(null);
    const [historyProduct, setHistoryProduct] = useState<Product | null>(null);
    const [deletingProduct, setDeletingProduct] = useState<Product | null>(null);

    // Forms
    const productForm = useForm({
        name: '',
        sku: '',
        price: '',
        stock_quantity: '0',
    });

    const adjustForm = useForm({
        type: 'increase' as 'increase' | 'decrease',
        quantity: '1',
        reason: '',
    });

    // Real-time projected stock calculation for the adjustment modal
    const projectedStock = useMemo(() => {
        if (!adjustingProduct) return 0;
        const current = adjustingProduct.stock_quantity;
        const qty = parseInt(adjustForm.data.quantity, 10) || 0;
        return adjustForm.data.type === 'increase' ? current + qty : current - qty;
    }, [adjustingProduct, adjustForm.data.type, adjustForm.data.quantity]);

    // Apply Filters
    const applyFilters = (newSearch: string, newStatus: string) => {
        router.get(
            '/products',
            { search: newSearch, status: newStatus },
            { preserveState: true, replace: true }
        );
    };

    const handleClearFilters = () => {
        setSearch('');
        setStatus('');
        applyFilters('', '');
    };

    // Product Modal Handlers
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
                onSuccess: () => {
                    setIsProductModalOpen(false);
                    toast.success('Product updated successfully.');
                },
                onError: () => {
                    toast.error('Failed to update product. Please check form errors.');
                },
            });
        } else {
            productForm.post('/products', {
                onSuccess: () => {
                    setIsProductModalOpen(false);
                    toast.success('Product created successfully.');
                },
                onError: () => {
                    toast.error('Failed to create product. Please check form errors.');
                },
            });
        }
    };

    // Stock Adjustment Handlers
    const openAdjustModal = (product: Product) => {
        setAdjustingProduct(product);
        adjustForm.setData({ type: 'increase', quantity: '1', reason: '' });
        adjustForm.clearErrors();
    };

    const handleAdjustSubmit = (e: FormEvent) => {
        e.preventDefault();
        if (!adjustingProduct) return;

        adjustForm.post(`/products/${adjustingProduct.id}/adjust-stock`, {
            onSuccess: () => {
                setAdjustingProduct(null);
                toast.success('Stock adjusted successfully.');
            },
            onError: (errs) => {
                toast.error(errs.quantity || errs.reason || 'Failed to adjust stock.');
            },
        });
    };

    // Delete Handlers
    const confirmDelete = (product: Product) => {
        setDeletingProduct(product);
    };

    const executeDelete = () => {
        if (!deletingProduct) return;

        router.delete(`/products/${deletingProduct.id}`, {
            onSuccess: () => {
                setDeletingProduct(null);
                toast.success('Product deleted successfully.');
            },
            onError: (errs) => {
                toast.error(errs.delete || 'Failed to delete product.');
            },
        });
    };

    // Stock Badge Helper
    const renderStockBadge = (qty: number) => {
        if (qty === 0) {
            return (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-800">
                    <span className="size-1.5 rounded-full bg-rose-500" />
                    Out of Stock ({qty})
                </span>
            );
        }
        if (qty < 10) {
            return (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
                    <span className="size-1.5 rounded-full bg-amber-500 animate-pulse" />
                    Low Stock ({qty})
                </span>
            );
        }
        return (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                <span className="size-1.5 rounded-full bg-emerald-500" />
                In Stock ({qty})
            </span>
        );
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 antialiased py-8 px-4 sm:px-6 lg:px-8">
            <Head title="Mini Inventory Management" />

            <div className="max-w-7xl mx-auto space-y-6">
                {/* Top Header Bar */}
                <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-xs border border-slate-200/80 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-start sm:items-center gap-4">
                        <div className="size-12 rounded-xl bg-linear-to-br from-indigo-500 to-indigo-700 flex items-center justify-center text-white shadow-md shadow-indigo-500/20 shrink-0">
                            <Boxes className="size-6" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                                    Mini Inventory Management
                                </h1>
                                <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                                    <span className="size-1.5 rounded-full bg-indigo-500" />
                                    Live
                                </span>
                            </div>
                            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                                Real-time catalog tracking, stock adjustments, and concurrency-safe audit history.
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            onClick={openCreateModal}
                            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-sm font-semibold shadow-sm hover:shadow-md transition-all duration-150 cursor-pointer"
                        >
                            <Plus className="size-4 stroke-[2.5]" />
                            <span>Add Product</span>
                        </button>
                    </div>
                </div>

                {/* KPI Metrics Cards */}
                {stats && (
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        <div
                            onClick={() => {
                                setStatus('');
                                applyFilters(search, '');
                            }}
                            className={`p-4 rounded-xl border bg-white dark:bg-slate-900 shadow-xs transition-all cursor-pointer ${
                                status === ''
                                    ? 'border-indigo-500 ring-2 ring-indigo-500/10'
                                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
                            }`}
                        >
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                    Total Products
                                </span>
                                <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                                    <Package className="size-4" />
                                </div>
                            </div>
                            <div className="mt-3 flex items-baseline gap-2">
                                <span className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                                    {stats.total}
                                </span>
                                <span className="text-xs text-slate-500">items</span>
                            </div>
                        </div>

                        <div
                            onClick={() => {
                                setStatus('in_stock');
                                applyFilters(search, 'in_stock');
                            }}
                            className={`p-4 rounded-xl border bg-white dark:bg-slate-900 shadow-xs transition-all cursor-pointer ${
                                status === 'in_stock'
                                    ? 'border-emerald-500 ring-2 ring-emerald-500/10'
                                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
                            }`}
                        >
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                                    In Stock (10+)
                                </span>
                                <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
                                    <CheckCircle2 className="size-4" />
                                </div>
                            </div>
                            <div className="mt-3 flex items-baseline gap-2">
                                <span className="text-2xl font-bold tracking-tight text-emerald-700 dark:text-emerald-300">
                                    {stats.in_stock}
                                </span>
                                <span className="text-xs text-emerald-600/70">healthy</span>
                            </div>
                        </div>

                        <div
                            onClick={() => {
                                setStatus('low_stock');
                                applyFilters(search, 'low_stock');
                            }}
                            className={`p-4 rounded-xl border bg-white dark:bg-slate-900 shadow-xs transition-all cursor-pointer ${
                                status === 'low_stock'
                                    ? 'border-amber-500 ring-2 ring-amber-500/10'
                                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
                            }`}
                        >
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                                    Low Stock (&lt;10)
                                </span>
                                <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400">
                                    <AlertTriangle className="size-4" />
                                </div>
                            </div>
                            <div className="mt-3 flex items-baseline gap-2">
                                <span className="text-2xl font-bold tracking-tight text-amber-700 dark:text-amber-300">
                                    {stats.low_stock}
                                </span>
                                <span className="text-xs text-amber-600/70">reorder soon</span>
                            </div>
                        </div>

                        <div
                            onClick={() => {
                                setStatus('out_of_stock');
                                applyFilters(search, 'out_of_stock');
                            }}
                            className={`p-4 rounded-xl border bg-white dark:bg-slate-900 shadow-xs transition-all cursor-pointer ${
                                status === 'out_of_stock'
                                    ? 'border-rose-500 ring-2 ring-rose-500/10'
                                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
                            }`}
                        >
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-semibold uppercase tracking-wider text-rose-600 dark:text-rose-400">
                                    Out of Stock (0)
                                </span>
                                <div className="p-2 rounded-lg bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400">
                                    <XCircle className="size-4" />
                                </div>
                            </div>
                            <div className="mt-3 flex items-baseline gap-2">
                                <span className="text-2xl font-bold tracking-tight text-rose-700 dark:text-rose-300">
                                    {stats.out_of_stock}
                                </span>
                                <span className="text-xs text-rose-600/70">critical</span>
                            </div>
                        </div>
                    </div>
                )}

                {/* Flash Messages */}
                {flash?.success && (
                    <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-sm flex items-center gap-3">
                        <Check className="size-5 shrink-0 text-emerald-600" />
                        <span>{flash.success}</span>
                    </div>
                )}
                {pageErrors?.delete && (
                    <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200 text-sm flex items-center gap-3">
                        <AlertCircle className="size-5 shrink-0 text-rose-600" />
                        <span>{pageErrors.delete}</span>
                    </div>
                )}

                {/* Search & Filter Toolbar */}
                <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 shadow-xs border border-slate-200/80 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="relative w-full sm:max-w-md">
                        <Search className="size-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                        <input
                            type="text"
                            placeholder="Search by product name or SKU..."
                            value={search}
                            onChange={(e) => {
                                setSearch(e.target.value);
                                applyFilters(e.target.value, status);
                            }}
                            className="w-full pl-10 pr-9 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-hidden focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-900 focus:ring-3 focus:ring-indigo-500/20 transition-all"
                        />
                        {search && (
                            <button
                                onClick={() => {
                                    setSearch('');
                                    applyFilters('', status);
                                }}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                            >
                                <X className="size-4" />
                            </button>
                        )}
                    </div>

                    <div className="flex items-center gap-3 w-full sm:w-auto">
                        <div className="relative w-full sm:w-56">
                            <Filter className="size-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                            <select
                                value={status}
                                onChange={(e) => {
                                    setStatus(e.target.value);
                                    applyFilters(search, e.target.value);
                                }}
                                className="w-full pl-8 pr-8 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950 text-sm text-slate-900 dark:text-slate-100 font-medium focus:outline-hidden focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-900 focus:ring-3 focus:ring-indigo-500/20 transition-all cursor-pointer"
                            >
                                <option value="">All Stock Statuses</option>
                                <option value="in_stock">In Stock (10+)</option>
                                <option value="low_stock">Low Stock (Below 10)</option>
                                <option value="out_of_stock">Out of Stock (0)</option>
                            </select>
                        </div>

                        {(search || status) && (
                            <button
                                onClick={handleClearFilters}
                                title="Reset filters"
                                className="inline-flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer shrink-0"
                            >
                                <RotateCcw className="size-3.5" />
                                <span className="hidden sm:inline">Reset</span>
                            </button>
                        )}
                    </div>
                </div>

                {/* Data Table Card */}
                <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xs border border-slate-200/80 dark:border-slate-800 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-slate-200/80 dark:border-slate-800 bg-slate-50/75 dark:bg-slate-950/50">
                                    <th className="py-3.5 px-6 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                        Product
                                    </th>
                                    <th className="py-3.5 px-6 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                        SKU
                                    </th>
                                    <th className="py-3.5 px-6 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                        Price
                                    </th>
                                    <th className="py-3.5 px-6 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                        Stock Status
                                    </th>
                                    <th className="py-3.5 px-6 text-right text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                                {products.data.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="py-16 text-center">
                                            <div className="flex flex-col items-center justify-center max-w-sm mx-auto">
                                                <div className="size-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 mb-3">
                                                    <Package className="size-6" />
                                                </div>
                                                <h3 className="text-base font-semibold text-slate-800 dark:text-slate-200">
                                                    No products found
                                                </h3>
                                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                                                    No inventory matches your current search and filter criteria.
                                                </p>
                                                {(search || status) && (
                                                    <button
                                                        onClick={handleClearFilters}
                                                        className="mt-4 px-3 py-1.5 rounded-lg text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 transition cursor-pointer"
                                                    >
                                                        Clear search & filters
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    products.data.map((product) => (
                                        <tr
                                            key={product.id}
                                            className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors group"
                                        >
                                            <td className="py-4 px-6">
                                                <div className="font-semibold text-slate-900 dark:text-slate-100 text-sm">
                                                    {product.name}
                                                </div>
                                            </td>
                                            <td className="py-4 px-6">
                                                <span className="font-mono text-xs font-medium px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                                                    {product.sku}
                                                </span>
                                            </td>
                                            <td className="py-4 px-6 text-sm font-semibold text-slate-900 dark:text-slate-100">
                                                ${parseFloat(product.price).toLocaleString('en-US', {
                                                    minimumFractionDigits: 2,
                                                    maximumFractionDigits: 2,
                                                })}
                                            </td>
                                            <td className="py-4 px-6">
                                                {renderStockBadge(product.stock_quantity)}
                                            </td>
                                            <td className="py-4 px-6 text-right whitespace-nowrap">
                                                <div className="flex items-center justify-end gap-1.5">
                                                    <button
                                                        onClick={() => openAdjustModal(product)}
                                                        title="Adjust Stock Quantity"
                                                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 transition cursor-pointer"
                                                    >
                                                        <ArrowUpDown className="size-3.5" />
                                                        <span>Adjust</span>
                                                    </button>

                                                    <button
                                                        onClick={() => setHistoryProduct(product)}
                                                        title="View Stock Audit History"
                                                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                                                    >
                                                        <History className="size-3.5" />
                                                        <span>History</span>
                                                    </button>

                                                    <button
                                                        onClick={() => openEditModal(product)}
                                                        title="Edit Product Details"
                                                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 transition cursor-pointer"
                                                    >
                                                        <Pencil className="size-3.5" />
                                                        <span>Edit</span>
                                                    </button>

                                                    <button
                                                        onClick={() => confirmDelete(product)}
                                                        title="Delete Product"
                                                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition cursor-pointer"
                                                    >
                                                        <Trash2 className="size-3.5" />
                                                        <span>Delete</span>
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {products.links.length > 3 && (
                        <div className="p-4 bg-slate-50/75 dark:bg-slate-950/50 border-t border-slate-200/80 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
                            <div>
                                Showing <span className="font-semibold text-slate-700 dark:text-slate-300">{products.from || 0}</span> to{' '}
                                <span className="font-semibold text-slate-700 dark:text-slate-300">{products.to || 0}</span> of{' '}
                                <span className="font-semibold text-slate-700 dark:text-slate-300">{products.total}</span> products
                            </div>

                            <div className="flex items-center gap-1">
                                {products.links.map((link, idx) => (
                                    <button
                                        key={idx}
                                        disabled={!link.url}
                                        onClick={() => link.url && router.get(link.url, {}, { preserveState: true })}
                                        dangerouslySetInnerHTML={{ __html: link.label }}
                                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer ${
                                            link.active
                                                ? 'bg-indigo-600 text-white font-semibold shadow-xs'
                                                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200/70 dark:hover:bg-slate-800'
                                        } ${!link.url ? 'opacity-40 cursor-not-allowed hover:bg-transparent' : ''}`}
                                    />
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Create / Edit Product Modal */}
            {isProductModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
                    <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 dark:border-slate-800 p-6 overflow-hidden">
                        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400">
                                    <PackagePlus className="size-5" />
                                </div>
                                <div>
                                    <h2 className="text-base font-bold text-slate-900 dark:text-white">
                                        {editingProduct ? 'Edit Product' : 'Create New Product'}
                                    </h2>
                                    <p className="text-xs text-slate-500">
                                        {editingProduct
                                            ? 'Update product details and pricing.'
                                            : 'Add a new product to your inventory catalog.'}
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => setIsProductModalOpen(false)}
                                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition cursor-pointer"
                            >
                                <X className="size-5" />
                            </button>
                        </div>

                        <form onSubmit={handleProductSubmit} className="mt-4 space-y-4">
                            <FormField
                                id="name"
                                label="Product Name"
                                placeholder="e.g., Apple MacBook Pro 16 inch"
                                value={productForm.data.name}
                                onChange={(e) => productForm.setData('name', e.target.value)}
                                error={productForm.errors.name}
                                required
                            />

                            <FormField
                                id="sku"
                                label="SKU (Stock Keeping Unit)"
                                placeholder="e.g., LAP-MBP-16M3"
                                value={productForm.data.sku}
                                onChange={(e) => productForm.setData('sku', e.target.value)}
                                error={productForm.errors.sku}
                                helperText="Must be unique across all products"
                                required
                            />

                            <FormField
                                id="price"
                                label="Price ($ USD)"
                                type="number"
                                step="0.01"
                                placeholder="0.00"
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
                                    placeholder="0"
                                    value={productForm.data.stock_quantity}
                                    onChange={(e) => productForm.setData('stock_quantity', e.target.value)}
                                    error={productForm.errors.stock_quantity}
                                    helperText="Initial inventory on hand (minimum 0)"
                                    required
                                />
                            )}

                            <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100 dark:border-slate-800">
                                <button
                                    type="button"
                                    onClick={() => setIsProductModalOpen(false)}
                                    className="px-4 py-2 text-xs font-semibold rounded-xl text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={productForm.processing}
                                    className="px-4 py-2 text-xs font-semibold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs transition disabled:opacity-50 cursor-pointer"
                                >
                                    {productForm.processing ? 'Saving...' : editingProduct ? 'Save Changes' : 'Create Product'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Stock Adjustment Modal */}
            {adjustingProduct && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
                    <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 dark:border-slate-800 p-6 overflow-hidden">
                        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400">
                                    <ArrowUpDown className="size-5" />
                                </div>
                                <div>
                                    <h2 className="text-base font-bold text-slate-900 dark:text-white">
                                        Adjust Stock Level
                                    </h2>
                                    <p className="text-xs text-slate-500 truncate max-w-[240px]">
                                        {adjustingProduct.name}
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => setAdjustingProduct(null)}
                                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition cursor-pointer"
                            >
                                <X className="size-5" />
                            </button>
                        </div>

                        {/* Visual Stock Calculation Preview Card */}
                        <div className="mt-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                            <div className="text-center">
                                <span className="text-[11px] font-medium uppercase tracking-wider text-slate-400">
                                    Current
                                </span>
                                <div className="text-lg font-bold text-slate-700 dark:text-slate-300">
                                    {adjustingProduct.stock_quantity}
                                </div>
                            </div>

                            <span className="text-base font-bold text-slate-400">
                                {adjustForm.data.type === 'increase' ? '+' : '−'}
                            </span>

                            <div className="text-center">
                                <span className="text-[11px] font-medium uppercase tracking-wider text-slate-400">
                                    Change
                                </span>
                                <div className="text-lg font-bold text-indigo-600 dark:text-indigo-400">
                                    {adjustForm.data.quantity || 0}
                                </div>
                            </div>

                            <span className="text-base font-bold text-slate-400">=</span>

                            <div className="text-center">
                                <span className="text-[11px] font-medium uppercase tracking-wider text-slate-400">
                                    Projected
                                </span>
                                <div
                                    className={`text-lg font-bold ${
                                        projectedStock < 0
                                            ? 'text-rose-600 animate-pulse'
                                            : 'text-emerald-600 dark:text-emerald-400'
                                    }`}
                                >
                                    {projectedStock}
                                </div>
                            </div>
                        </div>

                        {projectedStock < 0 && (
                            <p className="mt-2 text-xs font-semibold text-rose-600 dark:text-rose-400 flex items-center gap-1">
                                <AlertTriangle className="size-3.5 shrink-0" />
                                Stock quantity cannot be decreased below zero!
                            </p>
                        )}

                        <form onSubmit={handleAdjustSubmit} className="mt-4 space-y-4">
                            <div className="space-y-1.5">
                                <label className="block text-xs font-semibold tracking-wide text-slate-700 dark:text-slate-300 uppercase">
                                    Adjustment Type <span className="text-rose-500">*</span>
                                </label>
                                <div className="grid grid-cols-2 gap-2">
                                    <button
                                        type="button"
                                        onClick={() => adjustForm.setData('type', 'increase')}
                                        className={`py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer ${
                                            adjustForm.data.type === 'increase'
                                                ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-500 text-emerald-700 dark:text-emerald-300 ring-2 ring-emerald-500/20'
                                                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 hover:bg-slate-50'
                                        }`}
                                    >
                                        <span>Increase (+)</span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => adjustForm.setData('type', 'decrease')}
                                        className={`py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer ${
                                            adjustForm.data.type === 'decrease'
                                                ? 'bg-rose-50 dark:bg-rose-950/60 border-rose-500 text-rose-700 dark:text-rose-300 ring-2 ring-rose-500/20'
                                                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 hover:bg-slate-50'
                                        }`}
                                    >
                                        <span>Decrease (−)</span>
                                    </button>
                                </div>
                            </div>

                            <FormField
                                id="adjust_quantity"
                                label="Quantity to Adjust"
                                type="number"
                                min="1"
                                placeholder="1"
                                value={adjustForm.data.quantity}
                                onChange={(e) => adjustForm.setData('quantity', e.target.value)}
                                error={adjustForm.errors.quantity}
                                required
                            />

                            <FormField
                                id="reason"
                                label="Reason / Notes"
                                placeholder="e.g., Vendor restock, Customer order"
                                value={adjustForm.data.reason}
                                onChange={(e) => adjustForm.setData('reason', e.target.value)}
                                error={adjustForm.errors.reason}
                                required
                            />

                            {/* Quick suggested reason chips */}
                            <div className="space-y-1">
                                <span className="text-[11px] font-medium text-slate-400">Quick reasons:</span>
                                <div className="flex flex-wrap gap-1.5">
                                    {QUICK_REASONS.map((r, i) => (
                                        <button
                                            key={i}
                                            type="button"
                                            onClick={() => adjustForm.setData('reason', r)}
                                            className="px-2 py-0.5 rounded-md text-[11px] bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition cursor-pointer"
                                        >
                                            {r}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100 dark:border-slate-800">
                                <button
                                    type="button"
                                    onClick={() => setAdjustingProduct(null)}
                                    className="px-4 py-2 text-xs font-semibold rounded-xl text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={adjustForm.processing || projectedStock < 0}
                                    className="px-4 py-2 text-xs font-semibold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition disabled:opacity-50 cursor-pointer"
                                >
                                    {adjustForm.processing ? 'Adjusting...' : 'Confirm Adjustment'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Audit History Modal */}
            {historyProduct && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
                    <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 dark:border-slate-800 p-6 overflow-hidden">
                        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                                    <Clock className="size-5" />
                                </div>
                                <div>
                                    <h2 className="text-base font-bold text-slate-900 dark:text-white">
                                        Stock Audit History
                                    </h2>
                                    <p className="text-xs text-slate-500 truncate max-w-[280px]">
                                        {historyProduct.name} ({historyProduct.sku})
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => setHistoryProduct(null)}
                                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition cursor-pointer"
                            >
                                <X className="size-5" />
                            </button>
                        </div>

                        <div className="mt-4">
                            {!historyProduct.adjustments || historyProduct.adjustments.length === 0 ? (
                                <div className="py-12 text-center text-slate-400">
                                    <History className="size-8 mx-auto mb-2 opacity-40" />
                                    <p className="text-xs">No stock adjustment history recorded yet.</p>
                                </div>
                            ) : (
                                <div className="max-h-72 overflow-y-auto space-y-2.5 pr-1">
                                    {historyProduct.adjustments.map((adj) => (
                                        <div
                                            key={adj.id}
                                            className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200/70 dark:border-slate-800 flex items-center justify-between gap-3 text-xs"
                                        >
                                            <div className="flex items-center gap-3">
                                                <span
                                                    className={`px-2 py-0.5 rounded-md font-bold font-mono text-[11px] ${
                                                        adj.type === 'increase'
                                                            ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                                                            : 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300'
                                                    }`}
                                                >
                                                    {adj.type === 'increase' ? `+${adj.quantity_change}` : `−${adj.quantity_change}`}
                                                </span>
                                                <span className="font-medium text-slate-800 dark:text-slate-200">
                                                    {adj.reason}
                                                </span>
                                            </div>
                                            <span className="text-[11px] text-slate-400 whitespace-nowrap">
                                                {new Date(adj.created_at).toLocaleDateString('en-US', {
                                                    month: 'short',
                                                    day: 'numeric',
                                                    hour: '2-digit',
                                                    minute: '2-digit',
                                                })}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="flex justify-end pt-4 mt-4 border-t border-slate-100 dark:border-slate-800">
                            <button
                                type="button"
                                onClick={() => setHistoryProduct(null)}
                                className="px-4 py-2 text-xs font-semibold rounded-xl bg-slate-800 hover:bg-slate-900 text-white transition cursor-pointer"
                            >
                                Close History
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Custom Delete Confirmation Dialog */}
            {deletingProduct && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
                    <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-sm w-full shadow-2xl border border-slate-200 dark:border-slate-800 p-6 overflow-hidden">
                        <div className="size-11 rounded-xl bg-rose-50 dark:bg-rose-950 text-rose-600 dark:text-rose-400 flex items-center justify-center mb-4">
                            <AlertTriangle className="size-6" />
                        </div>

                        <h3 className="text-base font-bold text-slate-900 dark:text-white">
                            Delete Product?
                        </h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                            Are you sure you want to delete <strong className="text-slate-800 dark:text-slate-200">{deletingProduct.name}</strong> ({deletingProduct.sku})?
                        </p>

                        {deletingProduct.stock_quantity > 0 && (
                            <div className="mt-3 p-3 rounded-xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300 text-xs flex items-start gap-2">
                                <AlertCircle className="size-4 shrink-0 mt-0.5" />
                                <span>
                                    This product currently has <strong>{deletingProduct.stock_quantity} items in stock</strong>. You must adjust stock to 0 before deleting.
                                </span>
                            </div>
                        )}

                        <div className="flex items-center justify-end gap-2.5 mt-6">
                            <button
                                type="button"
                                onClick={() => setDeletingProduct(null)}
                                className="px-4 py-2 text-xs font-semibold rounded-xl text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={executeDelete}
                                className="px-4 py-2 text-xs font-semibold rounded-xl bg-rose-600 hover:bg-rose-700 text-white shadow-xs transition cursor-pointer"
                            >
                                Confirm Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

InventoryIndex.layout = (page: React.ReactNode) => page;