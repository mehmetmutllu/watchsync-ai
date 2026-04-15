<?php

return array_filter([
    App\Providers\AppServiceProvider::class,
    \Illuminate\View\ViewServiceProvider::class,
    class_exists(\Laravel\Horizon\HorizonApplicationServiceProvider::class) && extension_loaded('redis')
        ? App\Providers\HorizonServiceProvider::class
        : null,
    class_exists(\Laravel\Telescope\TelescopeApplicationServiceProvider::class) && extension_loaded('redis')
        ? App\Providers\TelescopeServiceProvider::class
        : null,
]);
