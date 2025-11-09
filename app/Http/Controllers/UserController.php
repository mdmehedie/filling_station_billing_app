<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\User;
use App\Http\Resources\UserResource;
use Illuminate\Http\Requests;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Auth;

class UserController extends Controller
{
    public function index()
    {
        $users = User::paginate(intval(request()->get('per_page', 15)));
        return Inertia::render('Users/Index', [
            'users' => UserResource::collection($users)
        ]);
    }

    public function create()
    {
        return inertia('Users/Create');
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users',
            'password' => 'required|string|min:8',
            'phone' => 'required|string|max:15',
            'role' => 'required|string|in:admin,user',
            'status' => 'required|string|in:active,inactive',
        ]);

        if (isset($validated['password'])) {
            $validated['password'] = Hash::make($validated['password']);
        }

        $user = User::create($validated);
        return redirect()->route('users.index')->with('success', 'User created successfully');
    }

    public function edit(User $user)
    {
        return inertia('Users/Edit', [
            'user' => UserResource::make($user)
        ]);
    }

    public function update(Request $request, User $user)
    {
        if ($user->id === auth()->user()->id) {
            return redirect()->route('users.index')->with('error', 'You cannot update your own account status');
        }

        if ($user->id === auth()->user()->id) {
            return redirect()->route('users.index')->with('error', 'You cannot update your own account');
        }

        if ($user->id === 1 && ($user->isDirty('role') || $user->isDirty('status'))) {    
            return redirect()->route('users.index')->with('error', 'You cannot update admin role or status');
        }

        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'email' => 'sometimes|email|unique:users,email,' . $user->id,
            'password' => 'sometimes|string|min:8|confirmed',
            'phone' => 'sometimes|string|max:15|unique:users,phone,' . $user->id,
            'role' => 'sometimes|string|in:admin,user',
            'status' => 'sometimes|string|in:active,inactive',
        ]);


        if (isset($validated['password'])) {
            $validated['password'] = Hash::make($validated['password']);
        }

        $user->update($validated);
        return redirect()->route('users.index')->with('success', 'User updated successfully');
    }

    public function destroy(User $user)
    {
        $user->delete();
        return redirect()->route('users.index')->with('success', 'User deleted successfully');
    }
}
