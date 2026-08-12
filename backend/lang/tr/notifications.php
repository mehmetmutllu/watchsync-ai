<?php

return [
    'greeting'         => 'Merhaba :name,',
    'greeting_generic' => 'Merhaba,',
    'thanks'           => 'Teşekkür ederiz!',
    'salutation'       => 'Saygılarımızla, :app',

    'invitation' => [
        'subject'   => ':dealer sizi ekibine davet etti',
        'intro'     => ':dealer, WatchSync AI ekibine katılmanız için sizi davet etti.',
        'role'      => 'Rolünüz: :role',
        'action'    => 'Daveti kabul et',
        'expires'   => 'Bu davet :date tarihine kadar geçerlidir.',
        'ignore'    => 'Bu daveti beklemiyorsanız e-postayı yok sayabilirsiniz.',
    ],

    'invoice' => [
        'subject'  => ':number numaralı fatura',
        'intro'    => ':number numaralı faturanız ektedir.',
        'amount'   => 'Ödenecek tutar: :amount',
        'due_date' => 'Son ödeme tarihi: :date',
        'thanks'   => 'İş birliğiniz için teşekkür ederiz!',
    ],

    'order' => [
        'subject'     => 'Sipariş onayı — :number',
        'intro'       => 'Siparişiniz başarıyla oluşturuldu.',
        'number'      => '**Fatura No:** :number',
        'total'       => '**Toplam:** :amount',
        'issue_date'  => '**Düzenlenme tarihi:** :date',
        'action'      => 'Faturayı görüntüle',
    ],

    'low_stock' => [
        'subject'   => '⚠️ Düşük stok uyarısı — WatchSync AI',
        'intro'     => 'Aktif envanteriniz :count adede düştü.',
        'threshold' => 'Stok seviyeniz belirlediğiniz :threshold eşiğinin altına indi.',
        'action'    => 'Envanteri görüntüle',
        'outro'     => 'Yeni saat ekleyerek stok seviyenizi yükseltebilirsiniz.',
    ],

    'roles' => [
        'owner'   => 'Sahip',
        'manager' => 'Yönetici',
        'staff'   => 'Personel',
    ],
];
