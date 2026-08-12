<?php

return [
    'greeting'         => 'Hello :name,',
    'greeting_generic' => 'Hello,',
    'thanks'           => 'Thank you!',
    'salutation'       => 'Regards, :app',

    'invitation' => [
        'subject'   => ':dealer has invited you to their team',
        'intro'     => ':dealer has invited you to join their team on WatchSync AI.',
        'role'      => 'Your role: :role',
        'action'    => 'Accept invitation',
        'expires'   => 'This invitation is valid until :date.',
        'ignore'    => 'If you were not expecting this invitation, you can safely ignore this email.',
    ],

    'invoice' => [
        'subject'  => 'Invoice :number',
        'intro'    => 'Please find invoice #:number attached.',
        'amount'   => 'Amount due: :amount',
        'due_date' => 'Due date: :date',
        'thanks'   => 'Thank you for your business!',
    ],

    'order' => [
        'subject'     => 'Order confirmation — :number',
        'intro'       => 'Your order has been created successfully.',
        'number'      => '**Invoice no.:** :number',
        'total'       => '**Total:** :amount',
        'issue_date'  => '**Issue date:** :date',
        'action'      => 'View invoice',
    ],

    'low_stock' => [
        'subject'   => '⚠️ Low stock alert — WatchSync AI',
        'intro'     => 'Your active inventory has dropped to :count items.',
        'threshold' => 'Stock has fallen below your configured threshold of :threshold.',
        'action'    => 'View inventory',
        'outro'     => 'Add new watches to bring your stock back up.',
    ],

    'roles' => [
        'owner'   => 'Owner',
        'manager' => 'Manager',
        'staff'   => 'Staff',
    ],
];
