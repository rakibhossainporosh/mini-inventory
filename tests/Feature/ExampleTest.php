<?php

test('home redirects to products index', function () {
    $response = $this->get(route('home'));

    $response->assertRedirect(route('products.index'));
});

test('products index returns a successful response', function () {
    $response = $this->get(route('products.index'));

    $response->assertOk();
});
