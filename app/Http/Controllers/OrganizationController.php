<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreOrganizationRequest;
use App\Http\Requests\UpdateOrganizationRequest;
use App\Models\Organization;
use App\Http\Resources\OrganizationResource;
use Spatie\QueryBuilder\QueryBuilder;
use Spatie\QueryBuilder\AllowedFilter;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;

class OrganizationController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        return inertia('Organizations/Index', [
            'organizations' => OrganizationResource::collection(
                QueryBuilder::for(Organization::class)
                ->with('user')
                ->orderBy('id', 'desc')
                ->allowedFilters([
                    AllowedFilter::callback('search', function ($query, $value) {
                        $query->where('ucode', 'like', "%{$value}%")
                            ->orWhere('name', 'like', "%{$value}%")
                            ->orWhere('name_bn', 'like', "%{$value}%");
                    })
                ])
            ->paginate(15))
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        return inertia('Organizations/Create');
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(StoreOrganizationRequest $request)
    {
        $data = $request->validated();
        $data['user_id'] = auth()->id();

        $organization = Organization::create($data);
        return redirect()->route('organizations.index')->with('success', 'Organization created successfully');
    }

    /**
     * Display the specified resource.
     */
    public function show(Organization $organization)
    {
        return inertia('Organizations/Show', [
            'organization' => OrganizationResource::make($organization)
        ]);
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(Organization $organization)
    {
        return inertia('Organizations/Edit', [
            'organization' => OrganizationResource::make($organization)
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(UpdateOrganizationRequest $request, Organization $organization)
    {
        $data = $request->validated();

        $organization->update($data);

        return redirect()->route('organizations.show', $organization)
            ->with('success', 'Organization updated successfully');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Organization $organization)
    {
        if($organization->logo){
            Storage::delete('organizations/' . $organization->logo);
        }

        if($organization->vehicles_count > 0){
            throw ValidationException::withMessages(['error' => "Organization has {$organization->vehicles_count} vehicles"]);
        }

        if($organization->orders_count > 0){
            throw ValidationException::withMessages(['error' => "Organization has {$organization->orders_count} orders"]);
        }

        $organization->delete();
        return redirect()->route('organizations.index')->with('success', 'Organization deleted successfully');
    }
}
