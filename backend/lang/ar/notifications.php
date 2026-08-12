<?php

return [
    'greeting'         => 'مرحبًا :name،',
    'greeting_generic' => 'مرحبًا،',
    'thanks'           => 'شكرًا لك!',
    'salutation'       => 'مع التحية، :app',

    'invitation' => [
        'subject'   => 'دعاك :dealer للانضمام إلى فريقه',
        'intro'     => 'دعاك :dealer للانضمام إلى فريقه على WatchSync AI.',
        'role'      => 'دورك: :role',
        'action'    => 'قبول الدعوة',
        'expires'   => 'هذه الدعوة صالحة حتى :date.',
        'ignore'    => 'إذا لم تكن تتوقع هذه الدعوة، يمكنك تجاهل هذه الرسالة بأمان.',
    ],

    'invoice' => [
        'subject'  => 'الفاتورة :number',
        'intro'    => 'تجد مرفقًا الفاتورة رقم :number.',
        'amount'   => 'المبلغ المستحق: :amount',
        'due_date' => 'تاريخ الاستحقاق: :date',
        'thanks'   => 'شكرًا لتعاملك معنا!',
    ],

    'order' => [
        'subject'     => 'تأكيد الطلب — :number',
        'intro'       => 'تم إنشاء طلبك بنجاح.',
        'number'      => '**رقم الفاتورة:** :number',
        'total'       => '**الإجمالي:** :amount',
        'issue_date'  => '**تاريخ الإصدار:** :date',
        'action'      => 'عرض الفاتورة',
    ],

    'low_stock' => [
        'subject'   => '⚠️ تنبيه انخفاض المخزون — WatchSync AI',
        'intro'     => 'انخفض مخزونك النشط إلى :count قطعة.',
        'threshold' => 'انخفض المخزون دون الحد الذي حدّدته وهو :threshold.',
        'action'    => 'عرض المخزون',
        'outro'     => 'أضف ساعات جديدة لرفع مستوى مخزونك.',
    ],

    'roles' => [
        'owner'   => 'المالك',
        'manager' => 'مدير',
        'staff'   => 'موظف',
    ],
];
