<?php

namespace App\Enums;

enum UserRole: string
{
    case SuperAdmin = 'super_admin';
    case Admin = 'admin';
    case Manager = 'manager';
    case Operator = 'operator';
    case Viewer = 'viewer';
    case Developer = 'developer';

    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }

    public static function productionValues(): array
    {
        return array_values(array_filter(
            self::values(),
            fn (string $role): bool => $role !== self::Developer->value,
        ));
    }
}
