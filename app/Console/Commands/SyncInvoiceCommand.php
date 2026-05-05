<?php

namespace App\Console\Commands;

use App\Models\Organization;
use App\Services\InvoiceService;
use Illuminate\Console\Command;
use Illuminate\Support\Carbon;

use function Laravel\Prompts\select;
use function Laravel\Prompts\text;

class SyncInvoiceCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'invoice:sync';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Manually regenerate an invoice for a specific organization, month and year';

    /**
     * Execute the console command.
     */
    public function handle(InvoiceService $invoiceService)
    {
        // 1. Get Organizations
        $organizations = Organization::all(['id', 'name', 'ucode']);

        if ($organizations->isEmpty()) {
            $this->error('No organizations found.');

            return 1;
        }

        // 2. Select Organization
        $orgId = \Laravel\Prompts\search(
            label: 'Which organization do you want to sync?',
            options: fn (string $value) => $organizations
                ->filter(fn ($org) => 
                    str_contains(strtolower($org->name), strtolower($value)) || 
                    str_contains(strtolower($org->ucode), strtolower($value))
                )
                ->mapWithKeys(fn ($org) => [$org->id => "{$org->name} ({$org->ucode})"])
                ->toArray(),
            scroll: 10
        );

        // 3. Select Month
        $month = select(
            label: 'Which month?',
            options: [
                1 => 'January', 2 => 'February', 3 => 'March', 4 => 'April',
                5 => 'May', 6 => 'June', 7 => 'July', 8 => 'August',
                9 => 'September', 10 => 'October', 11 => 'November', 12 => 'December',
            ],
            default: now()->month
        );

        // 4. Input Year
        $year = text(
            label: 'Which year?',
            placeholder: 'e.g. 2026',
            default: (string) now()->year,
            validate: fn (string $value) => match (true) {
                ! is_numeric($value) => 'The year must be a number.',
                strlen($value) !== 4 => 'The year must be 4 digits.',
                default => null
            }
        );

        $date = Carbon::createFromDate((int) $year, (int) $month, 1);
        $selectedOrg = $organizations->where('id', $orgId)->first();

        $this->info("Syncing invoice for {$selectedOrg->name} for {$date->format('F Y')}...");

        try {
            // Call the same logic used in the Model boot hooks
            $invoiceService->generateMonthlyInvoice($date, (int) $orgId);
            $this->info('Done! Invoice has been recalculated and synchronized.');
        } catch (\Exception $e) {
            $this->error('Error during sync: '.$e->getMessage());

            return 1;
        }

        return 0;
    }
}
