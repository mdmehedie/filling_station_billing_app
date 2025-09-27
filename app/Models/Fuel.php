<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Fuel extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'name',
        'price'
    ];
}
