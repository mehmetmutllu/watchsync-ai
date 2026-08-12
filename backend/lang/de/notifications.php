<?php

return [
    'greeting'         => 'Hallo :name,',
    'greeting_generic' => 'Hallo,',
    'thanks'           => 'Vielen Dank!',
    'salutation'       => 'Mit freundlichen Grüßen, :app',

    'invitation' => [
        'subject'   => ':dealer hat Sie in sein Team eingeladen',
        'intro'     => ':dealer hat Sie eingeladen, dem Team bei WatchSync AI beizutreten.',
        'role'      => 'Ihre Rolle: :role',
        'action'    => 'Einladung annehmen',
        'expires'   => 'Diese Einladung ist bis zum :date gültig.',
        'ignore'    => 'Falls Sie diese Einladung nicht erwartet haben, können Sie diese E-Mail ignorieren.',
    ],

    'invoice' => [
        'subject'  => 'Rechnung :number',
        'intro'    => 'Im Anhang finden Sie Ihre Rechnung Nr. :number.',
        'amount'   => 'Fälliger Betrag: :amount',
        'due_date' => 'Fälligkeitsdatum: :date',
        'thanks'   => 'Vielen Dank für Ihr Vertrauen!',
    ],

    'order' => [
        'subject'     => 'Bestellbestätigung — :number',
        'intro'       => 'Ihre Bestellung wurde erfolgreich angelegt.',
        'number'      => '**Rechnungsnr.:** :number',
        'total'       => '**Gesamt:** :amount',
        'issue_date'  => '**Rechnungsdatum:** :date',
        'action'      => 'Rechnung ansehen',
    ],

    'low_stock' => [
        'subject'   => '⚠️ Warnung: niedriger Bestand — WatchSync AI',
        'intro'     => 'Ihr aktiver Bestand ist auf :count Stück gesunken.',
        'threshold' => 'Der Bestand liegt unter dem festgelegten Schwellenwert von :threshold.',
        'action'    => 'Bestand ansehen',
        'outro'     => 'Fügen Sie neue Uhren hinzu, um Ihren Bestand aufzufüllen.',
    ],

    'roles' => [
        'owner'   => 'Inhaber',
        'manager' => 'Manager',
        'staff'   => 'Mitarbeiter',
    ],
];
