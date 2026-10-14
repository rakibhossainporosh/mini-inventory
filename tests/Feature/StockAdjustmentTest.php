<?php

use App\Models\Product;
use App\Models\StockAdjustment;
use App\Services\InventoryService;
use App\Strategies\StockAdjustment\DecreaseStockStrategy;
use App\Strategies\StockAdjustment\IncreaseStockStrategy;
use Illuminate\Validation\ValidationException;

test('can increase product stock and records adjustment history', function () {
    $product = Product::factory()->create([
        'stock_quantity' => 10,
    ]);

    $response = $this->post(route('products.adjust-stock', $product), [
        'type' => 'increase',
        'quantity' => 15,
        'reason' => 'Vendor restock shipment received',
    ]);

    $response->assertRedirect();
    $response->assertSessionHas('success', 'Stock adjusted successfully.');

    expect($product->fresh()->stock_quantity)->toBe(25);

    $this->assertDatabaseHas('stock_adjustments', [
        'product_id' => $product->id,
        'type' => 'increase',
        'quantity_change' => 15,
        'reason' => 'Vendor restock shipment received',
    ]);
});

test('can decrease product stock and records adjustment history', function () {
    $product = Product::factory()->create([
        'stock_quantity' => 20,
    ]);

    $response = $this->post(route('products.adjust-stock', $product), [
        'type' => 'decrease',
        'quantity' => 8,
        'reason' => 'Bulk sales order fulfillment',
    ]);

    $response->assertRedirect();
    $response->assertSessionHas('success', 'Stock adjusted successfully.');

    expect($product->fresh()->stock_quantity)->toBe(12);

    $this->assertDatabaseHas('stock_adjustments', [
        'product_id' => $product->id,
        'type' => 'decrease',
        'quantity_change' => 8,
        'reason' => 'Bulk sales order fulfillment',
    ]);
});

test('prevents decreasing stock when requested quantity exceeds available stock', function () {
    $product = Product::factory()->create([
        'stock_quantity' => 5,
    ]);

    $response = $this->post(route('products.adjust-stock', $product), [
        'type' => 'decrease',
        'quantity' => 10,
        'reason' => 'Attempt to oversell',
    ]);

    $response->assertSessionHasErrors(['quantity']);

    // Stock must remain unchanged
    expect($product->fresh()->stock_quantity)->toBe(5);

    // No adjustment should be recorded
    $this->assertDatabaseMissing('stock_adjustments', [
        'product_id' => $product->id,
        'reason' => 'Attempt to oversell',
    ]);
});

test('validates adjustment request fields', function () {
    $product = Product::factory()->create(['stock_quantity' => 10]);

    $response = $this->post(route('products.adjust-stock', $product), [
        'type' => 'invalid_type',
        'quantity' => 0,
        'reason' => '',
    ]);

    $response->assertSessionHasErrors(['type', 'quantity', 'reason']);
});

test('inventory service executes adjustment atomically within transaction', function () {
    $service = app(InventoryService::class);
    $product = Product::factory()->create(['stock_quantity' => 50]);

    $updatedProduct = $service->adjustStock(
        product: $product,
        type: 'decrease',
        quantity: 20,
        reason: 'Order #1001'
    );

    expect($updatedProduct->stock_quantity)->toBe(30);

    $adjustment = StockAdjustment::where('product_id', $product->id)->first();
    expect($adjustment)->not->toBeNull();
    expect($adjustment->type)->toBe('decrease');
    expect($adjustment->quantity_change)->toBe(20);
    expect($adjustment->reason)->toBe('Order #1001');
});

test('increase stock strategy calculates correctly', function () {
    $strategy = new IncreaseStockStrategy;
    expect($strategy->calculateNewStock(15, 10))->toBe(25);
    expect($strategy->calculateNewStock(0, 5))->toBe(5);
});

test('decrease stock strategy throws validation exception when quantity exceeds stock', function () {
    $strategy = new DecreaseStockStrategy;
    expect($strategy->calculateNewStock(10, 4))->toBe(6);
    expect($strategy->calculateNewStock(10, 10))->toBe(0);

    $strategy->calculateNewStock(5, 6);
})->throws(ValidationException::class);
