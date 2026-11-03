<?php

namespace App\Exports;

use App\Exports\Sheets\InvoiceCoverSheet;
use App\Exports\Sheets\InvoiceDetailSheet;
use Maatwebsite\Excel\Concerns\WithMultipleSheets;

/**
 * Excel version of the organization invoice PDF export.
 * Sheet "Cover" mirrors invoice-cover-pdf, sheet "Invoice" mirrors invoice-pdf.
 */
class OrganizationInvoiceExport implements WithMultipleSheets
{
    public function __construct(
        private array $export,
        private bool $includeCover = true
    ) {}

    public function sheets(): array
    {
        $sheets = [];

        if ($this->includeCover) {
            $sheets[] = new InvoiceCoverSheet($this->export);
        }

        $sheets[] = new InvoiceDetailSheet($this->export);

        return $sheets;
    }
}
