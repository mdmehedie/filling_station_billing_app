<?php

namespace App\Exports;

use App\Models\Invoice;
use App\Models\Order;
use Illuminate\Support\Facades\Log;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithColumnWidths;
use Maatwebsite\Excel\Concerns\WithEvents;
use Maatwebsite\Excel\Concerns\WithStyles;
use Maatwebsite\Excel\Concerns\WithTitle;
use Maatwebsite\Excel\Events\AfterSheet;
use PhpOffice\PhpSpreadsheet\Style\Alignment;
use PhpOffice\PhpSpreadsheet\Style\Border;
use PhpOffice\PhpSpreadsheet\Style\Fill;
use PhpOffice\PhpSpreadsheet\Worksheet\Drawing;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;

class InvoiceExport implements FromCollection, WithStyles, WithColumnWidths, WithEvents, WithTitle
{
    protected $month;
    protected $year;

    public function __construct($month = null, $year = null)
    {
        $this->month = $month ?? date('m');
        $this->year = $year ?? date('Y');
    }

    /**
     * @return \Illuminate\Support\Collection
     */
    public function collection()
    {
        // Convert numeric month to month name for database comparison
        $monthName = date('F', mktime(0, 0, 0, $this->month, 1));

        // Get all invoices for the specified month and year
        $invoices = Invoice::with(['organization'])
            ->join('organizations', 'invoices.organization_id', '=', 'organizations.id')
            ->where('month', $monthName)
            ->where('year', $this->year)
            ->orderBy('organizations.ucode')
            ->select('invoices.*')
            ->get();

        $data = collect();

        // Debug: Log invoice processing
        Log::info('Processing invoices for export', [
            'invoices_count' => $invoices->count(),
            'month_name' => $monthName,
            'year' => $this->year
        ]);

        foreach ($invoices as $index => $invoice) {
            // Initialize fuel breakdown values
            $dieselBill = 0;
            $octaneBill = 0;
            $dieselCoupons = 0;
            $octaneCoupons = 0;

            // Use fuel_breakdown data if available
            if ($invoice->fuel_breakdown && is_array($invoice->fuel_breakdown)) {
                foreach ($invoice->fuel_breakdown as $fuel) {
                    $fuelName = strtolower($fuel['fuel_name'] ?? '');
                    $totalPrice = $fuel['total_price'] ?? 0;
                    $totalCoupon = $fuel['total_coupon'] ?? 0;

                    if ($fuelName === 'diesel') {
                        $dieselBill = $totalPrice;
                        $dieselCoupons = $totalCoupon;
                    } elseif ($fuelName === 'octane') {
                        $octaneBill = $totalPrice;
                        $octaneCoupons = $totalCoupon;
                    }
                }
            } else {
                // Fallback to calculating from orders if fuel_breakdown is not available
                $orders = Order::whereIn('id', $invoice->order_ids ?? [])
                    ->with(['fuel'])
                    ->get();

                foreach ($orders as $order) {
                    if ($order->fuel) {
                        if (strtolower($order->fuel->name) === 'diesel') {
                            $dieselBill += $order->total_price;
                            $dieselCoupons += 1;
                        } elseif (strtolower($order->fuel->name) === 'octane') {
                            $octaneBill += $order->total_price;
                            $octaneCoupons += 1;
                        }
                    }
                }
            }

            $totalBill = $dieselBill + $octaneBill;
            $totalCoupons = $dieselCoupons + $octaneCoupons;

            $rowData = [
                'serial_no' => $index + 1,
                'org_name_en' => $invoice->organization->name ?? '',
                'org_name_bn' => $invoice->organization->name_bn ?? '',
                'diesel_bill' => $dieselBill,
                'octane_bill' => $octaneBill,
                'total_bill' => $totalBill,
                'diesel_coupons' => $dieselCoupons,
                'octane_coupons' => $octaneCoupons,
                'total_coupons' => $totalCoupons,
                'tax_percentage' => $invoice->organization->vat_rate ?? 0,
                'previous_due' => '',  // This would need to be calculated based on business logic
                'total_due' => $totalBill,
                'paid' => '',  // This would need to be tracked separately
                'balance' => '',
                'check_no' => '',  // This would need to be tracked separately
                'remarks' => '',  // This would need to be tracked separately
            ];

            $data->push($rowData);
        }

        return $data;
    }

    public function columnWidths(): array
    {
        return [
            'A' => 8,  // S/No
            'B' => 35,  // Name of the Organization
            'C' => 35,  // সংস্থার নাম
            'D' => 12,  // Diesel Bill
            'E' => 12,  // Octane Bill
            'F' => 12,  // Total Bill
            'G' => 10,  // Diesel Coupons
            'H' => 10,  // Octane Coupons
            'I' => 10,  // Total Coupons
            'J' => 8,  // Tax %
            'K' => 12,  // Previous Due
            'L' => 12,  // Total Due
            'M' => 12,  // Paid
            'N' => 12,  // Balance
            'O' => 12,  // Check No
            'P' => 15,  // Remarks
        ];
    }

    public function styles(Worksheet $sheet)
    {
        return [
            // Style the first row as bold text.
            1 => ['font' => ['bold' => true]],
        ];
    }

    public function registerEvents(): array
    {
        return [
            AfterSheet::class => function (AfterSheet $event) {
                $sheet = $event->sheet->getDelegate();

                // Add header section
                $this->addHeaderSection($sheet);

                // Write data to the sheet
                $this->writeDataToSheet($sheet);

                // Style the data table
                $this->styleDataTable($sheet);
            },
        ];
    }

    private function addHeaderSection($sheet)
    {
        // Add logos
        $this->addLogos($sheet);

        // Add CSD Filling Station header
        $sheet->setCellValue('A1', 'CSD Filling Station');
        $sheet->mergeCells('A1:P1');
        $sheet->getStyle('A1')->getFont()->setSize(16)->setBold(true);
        $sheet->getStyle('A1')->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);

        $sheet->setCellValue('A2', 'Cantonment, Dhaka-1206');
        $sheet->mergeCells('A2:P2');
        $sheet->getStyle('A2')->getFont()->setSize(12);
        $sheet->getStyle('A2')->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);

        // Add Bill Summary title
        $sheet->setCellValue('A3', 'Bill Summary');
        $sheet->mergeCells('A3:P3');
        $sheet->getStyle('A3')->getFont()->setSize(18)->setBold(true);
        $sheet->getStyle('A3')->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);

        // Add month/year
        $monthName = date('F', mktime(0, 0, 0, $this->month, 1));
        $sheet->setCellValue('A4', "the Month of {$monthName} {$this->year}");
        $sheet->mergeCells('A4:P4');
        $sheet->getStyle('A4')->getFont()->setSize(12);
        $sheet->getStyle('A4')->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);

        // Add empty row
        $sheet->insertNewRowBefore(5, 1);

        // Create grouped headers
        $this->createGroupedHeaders($sheet);
    }

    private function writeDataToSheet($sheet)
    {
        $data = $this->collection();
        $startRow = 9;  // Data starts at row 9 (after the three-tier headers)

        foreach ($data as $index => $row) {
            $currentRow = $startRow + $index;

            $sheet->setCellValue('A' . $currentRow, $row['serial_no']);
            $sheet->setCellValue('B' . $currentRow, $row['org_name_en']);
            $sheet->setCellValue('C' . $currentRow, $row['org_name_bn']);
            $sheet->setCellValue('D' . $currentRow, $row['diesel_bill']);
            $sheet->setCellValue('E' . $currentRow, $row['octane_bill']);
            $sheet->setCellValue('F' . $currentRow, $row['total_bill']);
            $sheet->setCellValue('G' . $currentRow, $row['diesel_coupons']);
            $sheet->setCellValue('H' . $currentRow, $row['octane_coupons']);
            $sheet->setCellValue('I' . $currentRow, $row['total_coupons']);
            $sheet->setCellValue('J' . $currentRow, $row['tax_percentage']);
            $sheet->setCellValue('K' . $currentRow, $row['previous_due']);
            $sheet->setCellValue('L' . $currentRow, $row['total_due']);
            $sheet->setCellValue('M' . $currentRow, $row['paid']);
            $sheet->setCellValue('N' . $currentRow, $row['balance']);
            $sheet->setCellValue('O' . $currentRow, $row['check_no']);
            $sheet->setCellValue('P' . $currentRow, $row['remarks']);
        }

        // Debug: Log data writing
        Log::info('Data written to Excel sheet', [
            'total_rows_written' => $data->count(),
            'start_row' => $startRow,
            'end_row' => $startRow + $data->count() - 1
        ]);
    }

    private function styleDataTable($sheet)
    {
        $data = $this->collection();
        $lastRow = 8 + $data->count();  // Data starts at row 9 (after headers)

        // Style all rows from header to data (rows 6 to lastRow)
        $fullRange = 'A6:P' . $lastRow;
        $sheet
            ->getStyle($fullRange)
            ->getBorders()
            ->getAllBorders()
            ->setBorderStyle(Border::BORDER_THIN);

        // Ensure bottom borders are visible for all rows
        for ($row = 6; $row <= $lastRow; $row++) {
            $rowRange = 'A' . $row . ':P' . $row;
            $sheet
                ->getStyle($rowRange)
                ->getBorders()
                ->getBottom()
                ->setBorderStyle(Border::BORDER_THIN);
        }

        // Align numeric columns
        $numericColumns = ['D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N'];
        foreach ($numericColumns as $col) {
            $sheet
                ->getStyle($col . '9:' . $col . $lastRow)
                ->getAlignment()
                ->setHorizontal(Alignment::HORIZONTAL_RIGHT);
        }

        // Format currency columns
        $currencyColumns = ['D', 'E', 'F', 'K', 'L', 'M', 'N'];
        foreach ($currencyColumns as $col) {
            $sheet
                ->getStyle($col . '9:' . $col . $lastRow)
                ->getNumberFormat()
                ->setFormatCode('#,##0.00');
        }
    }

    private function createGroupedHeaders($sheet)
    {
        // Set row heights for header area
        $sheet->getRowDimension(6)->setRowHeight(25);  // Group headers
        $sheet->getRowDimension(7)->setRowHeight(25);  // Fuel name headers
        $sheet->getRowDimension(8)->setRowHeight(25);  // Column indicators

        // Row 6: Group headers
        $sheet->setCellValue('A6', 'S/No');
        $sheet->mergeCells('A6:A8');  // Merge with rows below

        $sheet->setCellValue('B6', 'Name of the Organization');
        $sheet->mergeCells('B6:B8');  // Merge with rows below

        $sheet->setCellValue('C6', 'সংস্থার নাম');
        $sheet->mergeCells('C6:C8');  // Merge with rows below

        // Bill group header
        $sheet->setCellValue('D6', 'Bill');
        $sheet->mergeCells('D6:F6');  // Merge across Diesel Bill, Octane Bill, Total Bill

        // No of Coupon group header
        $sheet->setCellValue('G6', 'No of Coupon');
        $sheet->mergeCells('G6:I6');  // Merge across Diesel, Octane, Total

        $sheet->setCellValue('J6', 'Tax %');
        $sheet->mergeCells('J6:J8');  // Merge with rows below

        $sheet->setCellValue('K6', 'Previous Due');
        $sheet->mergeCells('K6:K8');  // Merge with rows below

        $sheet->setCellValue('L6', 'Total Due');
        $sheet->mergeCells('L6:L8');  // Merge with rows below

        $sheet->setCellValue('M6', 'Paid');
        $sheet->mergeCells('M6:M8');  // Merge with rows below

        $sheet->setCellValue('N6', 'Balance');
        $sheet->mergeCells('N6:N8');  // Merge with rows below

        $sheet->setCellValue('O6', 'Check No');
        $sheet->mergeCells('O6:O8');  // Merge with rows below

        $sheet->setCellValue('P6', 'Remarks');
        $sheet->mergeCells('P6:P8');  // Merge with rows below

        // Row 7: Fuel name headers
        $sheet->setCellValue('D7', 'Diesel Bill');
        $sheet->setCellValue('E7', 'Octane Bill');
        $sheet->setCellValue('F7', 'Total Bill');
        $sheet->setCellValue('G7', 'Diesel');
        $sheet->setCellValue('H7', 'Octane');
        $sheet->setCellValue('I7', 'Total');

        // Row 8: Column indicators as per screenshot
        $sheet->setCellValue('A8', 'A');
        $sheet->setCellValue('B8', 'B-1');
        $sheet->setCellValue('C8', 'B-2');
        $sheet->setCellValue('D8', 'C');  // Under Bill -> Diesel Bill
        $sheet->setCellValue('E8', 'D');  // Under Bill -> Octane Bill
        $sheet->setCellValue('F8', 'E=C+D');  // Under Bill -> Total Bill
        $sheet->setCellValue('G8', 'F');  // Under No of Coupon -> Diesel
        $sheet->setCellValue('H8', 'G');  // Under No of Coupon -> Octane
        $sheet->setCellValue('I8', 'H=F+G');  // Under No of Coupon -> Total
        $sheet->setCellValue('J8', 'I');
        $sheet->setCellValue('K8', 'J');
        $sheet->setCellValue('L8', 'K=H+J');
        $sheet->setCellValue('M8', 'L');
        $sheet->setCellValue('N8', 'M=K-L');
        $sheet->setCellValue('O8', 'N');
        $sheet->setCellValue('P8', 'O');

        // Style group headers (Row 6)
        $groupHeaderRange = 'A6:P6';
        $sheet->getStyle($groupHeaderRange)->getFont()->setBold(true);
        $sheet->getStyle($groupHeaderRange)->getFont()->setColor(new \PhpOffice\PhpSpreadsheet\Style\Color('000000'));  // Black text
        $sheet->getStyle($groupHeaderRange)->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
        $sheet->getStyle($groupHeaderRange)->getAlignment()->setVertical(Alignment::VERTICAL_CENTER);
        $sheet
            ->getStyle($groupHeaderRange)
            ->getFill()
            ->setFillType(Fill::FILL_SOLID)
            ->getStartColor()
            ->setRGB('D0D0D0');  // Slightly darker for group headers
        $sheet
            ->getStyle($groupHeaderRange)
            ->getBorders()
            ->getAllBorders()
            ->setBorderStyle(Border::BORDER_THIN);

        // Re-set header values after styling to ensure they're not overwritten
        $sheet->setCellValue('J6', 'Tax %');
        $sheet->setCellValue('K6', 'Previous Due');
        $sheet->setCellValue('L6', 'Total Due');
        $sheet->setCellValue('M6', 'Paid');
        $sheet->setCellValue('N6', 'Balance');
        $sheet->setCellValue('O6', 'Check No');
        $sheet->setCellValue('P6', 'Remarks');

        // Style fuel name headers (Row 7)
        $fuelHeaderRange = 'A7:P7';
        $sheet->getStyle($fuelHeaderRange)->getFont()->setBold(true);
        $sheet->getStyle($fuelHeaderRange)->getFont()->setColor(new \PhpOffice\PhpSpreadsheet\Style\Color('000000'));  // Black text
        $sheet->getStyle($fuelHeaderRange)->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
        $sheet->getStyle($fuelHeaderRange)->getAlignment()->setVertical(Alignment::VERTICAL_CENTER);
        $sheet
            ->getStyle($fuelHeaderRange)
            ->getFill()
            ->setFillType(Fill::FILL_SOLID)
            ->getStartColor()
            ->setRGB('E0E0E0');  // Lighter for fuel name headers
        $sheet
            ->getStyle($fuelHeaderRange)
            ->getBorders()
            ->getAllBorders()
            ->setBorderStyle(Border::BORDER_THIN);

        // Style column indicators (Row 8)
        $indicatorHeaderRange = 'A8:P8';
        $sheet->getStyle($indicatorHeaderRange)->getFont()->setBold(true);
        $sheet->getStyle($indicatorHeaderRange)->getFont()->setColor(new \PhpOffice\PhpSpreadsheet\Style\Color('000000'));  // Black text
        $sheet->getStyle($indicatorHeaderRange)->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
        $sheet->getStyle($indicatorHeaderRange)->getAlignment()->setVertical(Alignment::VERTICAL_CENTER);
        $sheet
            ->getStyle($indicatorHeaderRange)
            ->getFill()
            ->setFillType(Fill::FILL_SOLID)
            ->getStartColor()
            ->setRGB('F0F0F0');  // Lightest for column indicators
        $sheet
            ->getStyle($indicatorHeaderRange)
            ->getBorders()
            ->getAllBorders()
            ->setBorderStyle(Border::BORDER_THIN);
    }

    private function addLogos($sheet)
    {
        // Set row height for logo area
        $sheet->getRowDimension(1)->setRowHeight(60);
        $sheet->getRowDimension(2)->setRowHeight(20);
        $sheet->getRowDimension(3)->setRowHeight(30);
        $sheet->getRowDimension(4)->setRowHeight(20);

        // Left logo (CSD Logo)
        $leftLogoPath = public_path('default/csd-logo.png');
        if (file_exists($leftLogoPath)) {
            $leftLogo = new Drawing();
            $leftLogo->setName('CSD Logo');
            $leftLogo->setDescription('CSD Filling Station Logo');
            $leftLogo->setPath($leftLogoPath);
            $leftLogo->setHeight(50);
            $leftLogo->setWidth(50);
            $leftLogo->setCoordinates('A1');
            $leftLogo->setOffsetX(10);
            $leftLogo->setOffsetY(5);
            $leftLogo->setWorksheet($sheet);
        }

        // Right logo (Government/Organization Logo)
        $rightLogoPath = public_path('default/logo.jpeg');
        if (file_exists($rightLogoPath)) {
            $rightLogo = new Drawing();
            $rightLogo->setName('Government Logo');
            $rightLogo->setDescription('Government/Organization Logo');
            $rightLogo->setPath($rightLogoPath);
            $rightLogo->setHeight(50);
            $rightLogo->setWidth(50);
            $rightLogo->setCoordinates('P1');
            $rightLogo->setOffsetX(-60);  // Negative offset to position from right
            $rightLogo->setOffsetY(5);
            $rightLogo->setWorksheet($sheet);
        }
    }

    public function title(): string
    {
        $monthName = date('F', mktime(0, 0, 0, $this->month, 1));
        return "Bill Summary {$monthName} {$this->year}";
    }
}
