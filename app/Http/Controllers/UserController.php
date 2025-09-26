<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\User;
use App\Http\Resources\UserResource;

class UserController extends Controller
{
    public function index()
    {
        $users = User::paginate(15);
        return Inertia::render('Users/Index', [
            'users' => UserResource::collection($users)
        ]);
    }
}
