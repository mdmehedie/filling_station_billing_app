<?php

namespace App\Traits;


trait BaseEnum
{
    static function getNameToLowercase(int $value): string
    {
        return strtolower(self::from($value)->name);
    }

    static function getNameToUcFirst(int $value): string
    {
        return ucfirst(strtolower(self::from($value)->name));
    }

    static function getValueByName(string $nameToLowerOrUppercase): string | null | int
    {
        $name = strtoupper($nameToLowerOrUppercase);
        return optional(array_values(array_filter(self::cases(), function ($item) use ($name) {
            return $item->name == $name;
        })))[0]?->value;
    }

    /**
     * @return array|string[]
     */
    static function getValues(): array
    {
        return array_map(function ($value) {
            return $value->value;
        }, self::cases());
    }

    static function getValuesWithNames(): array
    {
        return array_map(function ($value) {
            return [
                'name' => $value->name,
                'value' => $value->value
            ];
        }, self::cases());
    }

    static function getValueAsArray(): array
    {
        $arr = [];

        foreach (self::cases() as $key => $value) {
            $arr[strtolower($value->name)] = $value->value;
        }

        return $arr;
    }
}