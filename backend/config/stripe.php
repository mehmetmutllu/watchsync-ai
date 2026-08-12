<?php

return [
    'secret_key'      => env('STRIPE_SECRET_KEY'),
    'publishable_key' => env('STRIPE_PUBLISHABLE_KEY'),
    'webhook_secret'  => env('STRIPE_WEBHOOK_SECRET'),

    'plans' => [
        'starter' => [
            'name'        => 'Starter Plan',
            'price_eur'   => 79,
            'price_id'    => env('STRIPE_PRICE_STARTER', 'price_starter_79eur'),
            'watch_limit' => 50,
            'features'    => ['Up to 50 active watches', '2 marketplace channels', 'SAM 2 AI background matting', 'Double-sale prevention lock'],
        ],
        'pro' => [
            'name'        => 'Pro Dealer Plan',
            'price_eur'   => 199,
            'price_id'    => env('STRIPE_PRICE_PRO', 'price_pro_199eur'),
            'watch_limit' => 500,
            'features'    => ['Up to 500 active watches', 'All marketplace channels (eBay, Chrono24, Shopify)', 'Unlimited SAM 2 AI matting', 'Market Scanner & price intelligence', 'Priority support'],
        ],
        'enterprise' => [
            'name'        => 'Enterprise Fleet Plan',
            'price_eur'   => 399,
            'price_id'    => env('STRIPE_PRICE_ENTERPRISE', 'price_enterprise_399eur'),
            'watch_limit' => 5000,
            'features'    => ['Unlimited watches', 'Multi-user team management & RBAC', 'Custom ERP & API webhooks', 'Dedicated account manager'],
        ],
    ],

    // Commission rules for B2B dealers
    'commission' => [
        'default_rate_percent' => 3.0,
        'max_cap_eur'          => 150.00,
        'direct_link_percent'  => 1.5,
    ],
];
