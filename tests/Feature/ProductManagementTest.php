<?php

use App\Models\Product;
use Inertia\Testing\AssertableInertia as Assert;

test('displays paginated products on the index page', function () {
    Product::factory()->count(15)->create();

    $response = $this->get(route('products.index'));

    $response->assertOk();
    $response->assertInertia(fn (Assert $page) => $page
        ->component('products/index')
        ->has('products.data', 10)
        ->has('filters')
    );
});

test('can search products by name or sku', function () {
    Product::factory()->create(['name' => 'Mechanical Keyboard', 'sku' => 'KEY-001']);
    Product::factory()->create(['name' => 'Wireless Mouse', 'sku' => 'MOU-002']);

    $response = $this->get(route('products.index', ['search' => 'Keyboard']));
    $response->assertOk();
    $response->assertInertia(fn (Assert $page) => $page
        ->component('products/index')
        ->has('products.data', 1)
        ->where('products.data.0.sku', 'KEY-001')
    );

    $responseSku = $this->get(route('products.index', ['search' => 'MOU-002']));
    $responseSku->assertOk();
    $responseSku->assertInertia(fn (Assert $page) => $page
        ->component('products/index')
        ->has('products.data', 1)
        ->where('products.data.0.name', 'Wireless Mouse')
    );
});

test('can filter products by stock status', function () {
    Product::factory()->inStock(20)->create(['name' => 'In Stock Item']);
    Product::factory()->lowStock(5)->create(['name' => 'Low Stock Item']);
    Product::factory()->outOfStock()->create(['name' => 'Out Of Stock Item']);

    // In Stock filter (>= 10)
    $inStockResponse = $this->get(route('products.index', ['status' => 'in_stock']));
    $inStockResponse->assertOk();
    $inStockResponse->assertInertia(fn (Assert $page) => $page
        ->has('products.data', 1)
        ->where('products.data.0.name', 'In Stock Item')
    );

    // Low Stock filter (1-9)
    $lowStockResponse = $this->get(route('products.index', ['status' => 'low_stock']));
    $lowStockResponse->assertOk();
    $lowStockResponse->assertInertia(fn (Assert $page) => $page
        ->has('products.data', 1)
        ->where('products.data.0.name', 'Low Stock Item')
    );

    // Out Of Stock filter (0)
    $outOfStockResponse = $this->get(route('products.index', ['status' => 'out_of_stock']));
    $outOfStockResponse->assertOk();
    $outOfStockResponse->assertInertia(fn (Assert $page) => $page
        ->has('products.data', 1)
        ->where('products.data.0.name', 'Out Of Stock Item')
    );
});

test('can create a product with valid data', function () {
    $payload = [
        'name' => 'Gaming Monitor',
        'sku' => 'MON-GAME-144',
        'price' => '299.99',
        'stock_quantity' => 15,
    ];

    $response = $this->post(route('products.store'), $payload);

    $response->assertRedirect();
    $response->assertSessionHas('success', 'Product created successfully.');

    $this->assertDatabaseHas('products', [
        'name' => 'Gaming Monitor',
        'sku' => 'MON-GAME-144',
        'price' => '299.99',
        'stock_quantity' => 15,
    ]);
});

test('prevents creating product with duplicate sku', function () {
    Product::factory()->create(['sku' => 'DUP-SKU-100']);

    $response = $this->post(route('products.store'), [
        'name' => 'Another Product',
        'sku' => 'DUP-SKU-100',
        'price' => '49.99',
        'stock_quantity' => 5,
    ]);

    $response->assertSessionHasErrors(['sku']);
});

test('validates required fields and price and stock rules when creating product', function () {
    $response = $this->post(route('products.store'), [
        'name' => '',
        'sku' => '',
        'price' => 0,
        'stock_quantity' => -5,
    ]);

    $response->assertSessionHasErrors(['name', 'sku', 'price', 'stock_quantity']);
});

test('can update an existing product', function () {
    $product = Product::factory()->create([
        'name' => 'Old Name',
        'sku' => 'SKU-OLD-01',
        'price' => '50.00',
    ]);

    $response = $this->put(route('products.update', $product), [
        'name' => 'New Name',
        'sku' => 'SKU-NEW-01',
        'price' => '75.50',
    ]);

    $response->assertRedirect();
    $response->assertSessionHas('success', 'Product updated successfully.');

    $this->assertDatabaseHas('products', [
        'id' => $product->id,
        'name' => 'New Name',
        'sku' => 'SKU-NEW-01',
        'price' => '75.50',
    ]);
});

test('can update a product keeping its existing sku', function () {
    $product = Product::factory()->create([
        'name' => 'Original Name',
        'sku' => 'SAME-SKU-01',
        'price' => '100.00',
    ]);

    $response = $this->put(route('products.update', $product), [
        'name' => 'Updated Name',
        'sku' => 'SAME-SKU-01',
        'price' => '120.00',
    ]);

    $response->assertRedirect();
    $response->assertSessionHasNoErrors();
    $this->assertDatabaseHas('products', [
        'id' => $product->id,
        'name' => 'Updated Name',
    ]);
});

test('prevents updating a product with another products sku', function () {
    $product1 = Product::factory()->create(['sku' => 'FIRST-SKU']);
    $product2 = Product::factory()->create(['sku' => 'SECOND-SKU']);

    $response = $this->put(route('products.update', $product2), [
        'name' => 'Product 2 Updated',
        'sku' => 'FIRST-SKU',
        'price' => '80.00',
    ]);

    $response->assertSessionHasErrors(['sku']);
});

test('can delete a product when stock quantity is zero', function () {
    $product = Product::factory()->outOfStock()->create();

    $response = $this->delete(route('products.destroy', $product));

    $response->assertRedirect();
    $response->assertSessionHas('success', 'Product deleted successfully.');
    $this->assertDatabaseMissing('products', ['id' => $product->id]);
});

test('prevents deleting a product when stock quantity is greater than zero', function () {
    $product = Product::factory()->inStock(10)->create();

    $response = $this->delete(route('products.destroy', $product));

    $response->assertRedirect();
    $response->assertSessionHasErrors(['delete']);
    $this->assertDatabaseHas('products', ['id' => $product->id]);
});
