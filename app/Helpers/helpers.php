<?php

function removeLeadingZeros($number)
{
    if (!is_numeric($number)) {
        return $number;
    }

    if ($number == 0) {
        return "";
    }

    if (gettype($number) === 'string' && str_contains($number, '.')) {
        $number = rtrim(rtrim($number, '0'), '.');
    }

    $result = fmod($number, 1) === 0.0 ? (int) $number : $number;
    return $result; // 323
}