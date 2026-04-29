<?php

namespace App\Enums;

enum UserRole: string
{
    case Admin = 'admin';
    case Technician = 'technician';
    case Manager = 'manager';

    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
}
