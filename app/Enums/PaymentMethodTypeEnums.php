<?php

namespace App\Enums;

use App\Traits\BaseEnum;

enum PaymentMethodTypeEnums: string
{
    use BaseEnum;

    case CASH = 'cash';
    case CARD = 'card';
    case BANK_TRANSFER = 'bank_transfer';
    case MOBILE_BANKING = 'mobile_banking';
    case CHECK = 'check';
    case ONLINE_PAYMENT = 'online_payment';
    case OTHER = 'other';

    public function label(): string
    {
        return match ($this) {
            self::CASH => 'Cash',
            self::CARD => 'Card',
            self::BANK_TRANSFER => 'Bank Transfer',
            self::MOBILE_BANKING => 'Mobile Banking',
            self::CHECK => 'Check',
            self::ONLINE_PAYMENT => 'Online Payment',
            self::OTHER => 'Other',
        };
    }
}
