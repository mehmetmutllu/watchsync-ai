<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Third Party Services
    |--------------------------------------------------------------------------
    |
    | This file is for storing the credentials for third party services such
    | as Mailgun, Postmark, AWS and more. This file provides the de facto
    | location for this type of information, allowing packages to have
    | a conventional file to locate the various service credentials.
    |
    */

    'postmark' => [
        'key' => env('POSTMARK_API_KEY'),
    ],

    'resend' => [
        'key' => env('RESEND_API_KEY'),
    ],

    'ses' => [
        'key' => env('AWS_ACCESS_KEY_ID'),
        'secret' => env('AWS_SECRET_ACCESS_KEY'),
        'region' => env('AWS_DEFAULT_REGION', 'us-east-1'),
    ],

    'slack' => [
        'notifications' => [
            'bot_user_oauth_token' => env('SLACK_BOT_USER_OAUTH_TOKEN'),
            'channel' => env('SLACK_BOT_USER_DEFAULT_CHANNEL'),
        ],
    ],

    /*
    |--------------------------------------------------------------------------
    | eBay API Configuration
    |--------------------------------------------------------------------------
    */
    'ebay' => [
        'client_id'     => env('EBAY_CLIENT_ID'),
        'client_secret' => env('EBAY_CLIENT_SECRET'),
        'redirect_uri'  => env('EBAY_REDIRECT_URI'),
        'sandbox'       => env('EBAY_SANDBOX', true),
        'ru_name'       => env('EBAY_RU_NAME'),
        'webhook_verification_token' => env('EBAY_WEBHOOK_VERIFICATION_TOKEN', ''),
        'scopes'        => [
            'https://api.ebay.com/oauth/api_scope',
            'https://api.ebay.com/oauth/api_scope/sell.inventory',
            'https://api.ebay.com/oauth/api_scope/sell.marketing',
            'https://api.ebay.com/oauth/api_scope/sell.account',
            'https://api.ebay.com/oauth/api_scope/sell.fulfillment',
        ],
    ],

    /*
    |--------------------------------------------------------------------------
    | Chrono24 Feed Configuration
    |--------------------------------------------------------------------------
    */
    'chrono24' => [
        'ip_whitelist' => array_filter(explode(',', env('CHRONO24_IP_WHITELIST', ''))),
    ],

    /*
    |--------------------------------------------------------------------------
    | Shopify API Configuration
    |--------------------------------------------------------------------------
    */
    'shopify' => [
        'webhook_secret' => env('SHOPIFY_WEBHOOK_SECRET', ''),
    ],

    /*
    |--------------------------------------------------------------------------
    | AI Service Configuration
    |--------------------------------------------------------------------------
    */
    'ai' => [
        'base_url' => env('AI_SERVICE_URL', 'http://ai-service:8001'),
        'timeout'  => 120,
    ],

];
