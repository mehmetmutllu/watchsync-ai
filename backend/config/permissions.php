<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Kanonik İzin Taksonomisi
    |--------------------------------------------------------------------------
    |
    | Sistemdeki tüm atanabilir izinler. UI'da izin matrisi bu listeden
    | üretilir; bir davet/override yalnızca bu anahtarları içerebilir.
    | 'label' ve 'group' UI gruplaması ve etiketleme içindir.
    |
    */

    'permissions' => [
        // Envanter
        'inventory.view'      => ['group' => 'inventory', 'label' => 'Envanteri görüntüle'],
        'inventory.create'    => ['group' => 'inventory', 'label' => 'Saat ekle'],
        'inventory.edit'      => ['group' => 'inventory', 'label' => 'Saat düzenle'],
        'inventory.delete'    => ['group' => 'inventory', 'label' => 'Saat sil'],
        'inventory.publish'   => ['group' => 'inventory', 'label' => 'Platformlarda yayınla'],

        // Alan düzeyi (fiyat gizleme)
        'inventory.view_cost'  => ['group' => 'inventory', 'label' => 'Maliyet fiyatını gör'],
        'inventory.view_price' => ['group' => 'inventory', 'label' => 'Satış fiyatını gör'],

        // CRM
        'crm.view'   => ['group' => 'crm', 'label' => 'Müşterileri görüntüle'],
        'crm.manage' => ['group' => 'crm', 'label' => 'Müşterileri yönet'],

        // Faturalar
        'invoices.view'   => ['group' => 'invoices', 'label' => 'Faturaları görüntüle'],
        'invoices.manage' => ['group' => 'invoices', 'label' => 'Faturaları yönet'],

        // Pazar tarayıcı
        'market.view' => ['group' => 'market', 'label' => 'Pazar tarayıcıyı görüntüle'],

        // Platform entegrasyonları
        'platforms.manage' => ['group' => 'platforms', 'label' => 'Platform bağlantılarını yönet'],

        // AI araçları
        'ai.use' => ['group' => 'ai', 'label' => 'AI araçlarını kullan'],

        // Ayarlar
        'settings.manage' => ['group' => 'settings', 'label' => 'Ayarları yönet'],

        // Ekip yönetimi
        'team.manage' => ['group' => 'team', 'label' => 'Ekibi yönet'],
    ],

    /*
    |--------------------------------------------------------------------------
    | Rol Preset'leri
    |--------------------------------------------------------------------------
    |
    | Kullanıcının 'permissions' JSON alanı null ise etkin izinler bu
    | preset'ten türetilir. owner özeldir: her zaman TÜM izinlere sahiptir
    | (aşağıdaki liste yalnızca referans/tamlık içindir, kodda implicit '*').
    | staff = dar başlangıç seti; owner çalışan bazında override ile genişletir.
    |
    */

    'presets' => [

        'owner' => [
            'inventory.view', 'inventory.create', 'inventory.edit', 'inventory.delete', 'inventory.publish',
            'inventory.view_cost', 'inventory.view_price',
            'crm.view', 'crm.manage',
            'invoices.view', 'invoices.manage',
            'market.view',
            'platforms.manage',
            'ai.use',
            'settings.manage',
            'team.manage',
        ],

        // manager: team.manage HARİÇ geniş set
        'manager' => [
            'inventory.view', 'inventory.create', 'inventory.edit', 'inventory.delete', 'inventory.publish',
            'inventory.view_cost', 'inventory.view_price',
            'crm.view', 'crm.manage',
            'invoices.view', 'invoices.manage',
            'market.view',
            'platforms.manage',
            'ai.use',
            'settings.manage',
        ],

        // staff: dar başlangıç seti
        'staff' => [
            'inventory.view',
            'ai.use',
        ],
    ],

    /*
    |--------------------------------------------------------------------------
    | Davet Edilebilir Roller
    |--------------------------------------------------------------------------
    |
    | 'owner' asla davet edilemez (bkz. TeamController güvenlik kuralları).
    |
    */

    'invitable_roles' => ['manager', 'staff'],

    /*
    |--------------------------------------------------------------------------
    | Davet Geçerlilik Süresi (gün)
    |--------------------------------------------------------------------------
    |
    | Bayi varsayılanı; davet başına 'expires_in_days' ile override edilir.
    |
    */

    'default_invitation_expiry_days' => 7,
];
