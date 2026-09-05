<?php

namespace App\Enums;

use App\Traits\BaseEnum;

enum PaymentMethodTypeEnums: string
{
    use BaseEnum;

    case CASH = 'cash';
    case BANK = 'bank';
    case CHECK = 'check';

    public function label(): string
    {
        return match ($this) {
            self::CASH => 'Cash',
            self::BANK => 'Bank',
            self::CHECK => 'Check',
        };
    }
}
