<?php

namespace Database\Factories;

use App\Models\Product;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Product>
 */
class ProductFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'name' => fake()->words(3, true),
            'sku' => strtoupper(fake()->unique()->bothify('PROD-????-####')),
            'price' => fake()->randomFloat(2, 5, 2000),
            'stock_quantity' => fake()->numberBetween(0, 50),
        ];
    }

    /**
     * Indicate that the product is in stock (>= 10).
     */
    public function inStock(int $quantity = 25): static
    {
        return $this->state(fn (array $attributes) => [
            'stock_quantity' => $quantity,
        ]);
    }

    /**
     * Indicate that the product has low stock (1-9).
     */
    public function lowStock(int $quantity = 5): static
    {
        return $this->state(fn (array $attributes) => [
            'stock_quantity' => $quantity,
        ]);
    }

    /**
     * Indicate that the product is out of stock (0).
     */
    public function outOfStock(): static
    {
        return $this->state(fn (array $attributes) => [
            'stock_quantity' => 0,
        ]);
    }
}
