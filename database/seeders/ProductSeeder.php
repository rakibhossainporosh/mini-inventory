<?php

namespace Database\Seeders;

use App\Models\Product;
use Illuminate\Database\Seeder;

class ProductSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $products = [
            [
                'name' => 'Apple MacBook Pro 16" M3 Max',
                'sku' => 'LAP-MBP-16M3',
                'price' => 3499.00,
                'stock_quantity' => 25,
                'adjustments' => [
                    ['type' => 'increase', 'quantity_change' => 30, 'reason' => 'Initial inventory delivery'],
                    ['type' => 'decrease', 'quantity_change' => 5, 'reason' => 'Corporate order fulfilled'],
                ],
            ],
            [
                'name' => 'Dell XPS 15 OLED (32GB / 1TB)',
                'sku' => 'LAP-XPS-1590',
                'price' => 2199.99,
                'stock_quantity' => 14,
                'adjustments' => [
                    ['type' => 'increase', 'quantity_change' => 15, 'reason' => 'Vendor restock'],
                    ['type' => 'decrease', 'quantity_change' => 1, 'reason' => 'Defective unit returned to supplier'],
                ],
            ],
            [
                'name' => 'Logitech MX Master 3S Wireless Mouse',
                'sku' => 'ACC-LOGI-MX3S',
                'price' => 99.99,
                'stock_quantity' => 45,
                'adjustments' => [
                    ['type' => 'increase', 'quantity_change' => 50, 'reason' => 'Quarterly restock'],
                    ['type' => 'decrease', 'quantity_change' => 5, 'reason' => 'Store floor display units'],
                ],
            ],
            [
                'name' => 'Keychron Q1 Pro Wireless Mechanical Keyboard',
                'sku' => 'KEY-Q1PRO-RGB',
                'price' => 199.00,
                'stock_quantity' => 18,
                'adjustments' => [
                    ['type' => 'increase', 'quantity_change' => 20, 'reason' => 'Initial bulk order'],
                    ['type' => 'decrease', 'quantity_change' => 2, 'reason' => 'Sample sent to reviewer'],
                ],
            ],
            [
                'name' => 'LG 27" UltraFine 4K UHD Monitor',
                'sku' => 'MON-LG-27UN88',
                'price' => 449.50,
                'stock_quantity' => 6, // Low Stock
                'adjustments' => [
                    ['type' => 'increase', 'quantity_change' => 10, 'reason' => 'Received from warehouse'],
                    ['type' => 'decrease', 'quantity_change' => 4, 'reason' => 'Customer orders dispatched'],
                ],
            ],
            [
                'name' => 'CalDigit TS4 Thunderbolt 4 Docking Station',
                'sku' => 'DCK-CD-TS4TB',
                'price' => 399.99,
                'stock_quantity' => 3, // Low Stock
                'adjustments' => [
                    ['type' => 'increase', 'quantity_change' => 8, 'reason' => 'Limited batch import'],
                    ['type' => 'decrease', 'quantity_change' => 5, 'reason' => 'Bulk sales to design agency'],
                ],
            ],
            [
                'name' => 'Sony WH-1000XM5 Noise-Canceling Headphones',
                'sku' => 'AUD-SNY-XM5BLK',
                'price' => 379.99,
                'stock_quantity' => 8, // Low Stock
                'adjustments' => [
                    ['type' => 'increase', 'quantity_change' => 12, 'reason' => 'Weekly restock'],
                    ['type' => 'decrease', 'quantity_change' => 4, 'reason' => 'Retail purchases'],
                ],
            ],
            [
                'name' => 'Herman Miller Aeron Ergonomic Office Chair',
                'sku' => 'FURN-HMA-SIZEB',
                'price' => 1295.00,
                'stock_quantity' => 0, // Out of Stock
                'adjustments' => [
                    ['type' => 'increase', 'quantity_change' => 5, 'reason' => 'Special shipment received'],
                    ['type' => 'decrease', 'quantity_change' => 5, 'reason' => 'Sold out during office renovation sale'],
                ],
            ],
            [
                'name' => 'Fully Jarvis Bamboo Standing Desk (60x30)',
                'sku' => 'DSK-JAR-6030B',
                'price' => 749.00,
                'stock_quantity' => 0, // Out of Stock
                'adjustments' => [
                    ['type' => 'increase', 'quantity_change' => 3, 'reason' => 'Floor inventory added'],
                    ['type' => 'decrease', 'quantity_change' => 3, 'reason' => 'All units reserved and collected'],
                ],
            ],
            [
                'name' => 'Anker 737 Power Bank (PowerCore 24K)',
                'sku' => 'PWR-ANK-73724K',
                'price' => 149.99,
                'stock_quantity' => 32,
                'adjustments' => [
                    ['type' => 'increase', 'quantity_change' => 35, 'reason' => 'Supplier batch received'],
                    ['type' => 'decrease', 'quantity_change' => 3, 'reason' => 'Store demo devices'],
                ],
            ],
            [
                'name' => 'Samsung 2TB T7 Shield Portable SSD',
                'sku' => 'STR-SAM-T7S2TB',
                'price' => 179.99,
                'stock_quantity' => 22,
                'adjustments' => [
                    ['type' => 'increase', 'quantity_change' => 25, 'reason' => 'Inventory arrival'],
                    ['type' => 'decrease', 'quantity_change' => 3, 'reason' => 'Express delivery shipments'],
                ],
            ],
            [
                'name' => 'Elgato Stream Deck MK.2 (15 Keys)',
                'sku' => 'STU-ELG-SDMK2B',
                'price' => 149.99,
                'stock_quantity' => 4, // Low Stock
                'adjustments' => [
                    ['type' => 'increase', 'quantity_change' => 10, 'reason' => 'Restock'],
                    ['type' => 'decrease', 'quantity_change' => 6, 'reason' => 'Streamer bundles fulfilled'],
                ],
            ],
        ];

        foreach ($products as $data) {
            $adjustments = $data['adjustments'];
            unset($data['adjustments']);

            $product = Product::updateOrCreate(
                ['sku' => $data['sku']],
                $data
            );

            // Seed sample stock adjustments if product was newly created or has no adjustments
            if ($product->adjustments()->count() === 0) {
                foreach ($adjustments as $adjustment) {
                    $product->adjustments()->create($adjustment);
                }
            }
        }
    }
}
