<?php

use App\Http\Controllers\ProductController;
use Illuminate\Support\Facades\Route;

Route::redirect('/', '/products');

Route::resource('products', ProductController::class)->only([
    'index',
    'store',
    'update',
    'destroy',
]);

Route::post('products/{product}/adjust-stock', [ProductController::class, 'adjustStock'])
    ->name('products.adjust-stock');