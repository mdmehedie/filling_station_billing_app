<?php

namespace App\Exports;

use App\Models\Order;
use Illuminate\Support\Facades\Auth;
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

class OrderExport implements FromCollection, WithStyles, WithColumnWidths, WithEvents, WithTitle
{
    protected $filters;

    public function __construct($filters = [])
    {
        $this->filters = $filters;
    }

    /**
     * @return \Illuminate\Support\Collection
     */
    public function collection()
    {
        $query = Order::with(['organization', 'vehicle', 'fuel', 'creator']);

        // Apply filters
        if (!empty($this->filters['search'])) {
            $search = $this->filters['search'];
            $query->where(function ($q) use ($search) {
                $q
                    ->where('id', 'like', "%{$search}%")
                    ->orWhereHas('organization', function ($query) use ($search) {
                        $query
                            ->where('name', 'like', "%{$search}%")
                            ->orWhere('name_bn', 'like', "%{$search}%");
                    })
                    ->orWhereHas('vehicle', function ($query) use ($search) {
                        $query->where('name', 'like', "%{$search}%");
                    });
            });
        }

        if (!empty($this->filters['start_date'])) {
            $query->whereDate('sold_date', '>=', $this->filters['start_date']);
        }

        if (!empty($this->filters['end_date'])) {
            $query->whereDate('sold_date', '<=', $this->filters['end_date']);
        }

        if (!empty($this->filters['organization_id'])) {
            $query->where('organization_id', $this->filters['organization_id']);
        }

        if (!empty($this->filters['vehicle_id'])) {
            $query->where('vehicle_id', $this->filters['vehicle_id']);
        }

        if (!empty($this->filters['fuel_id'])) {
            $query->where('fuel_id', $this->filters['fuel_id']);
        }

        // Apply user role filter
        if (Auth::user()->role === 'user') {
            $query->where('user_id', Auth::id());
        }

        $orders = $query->orderBy('id', 'desc')->get();

        $data = collect();

        foreach ($orders as $index => $order) {
            $rowData = [
                'order_no' => $order->order_no ?? '',
                'organization_code' => $order->organization->ucode ?? '',
                'org_name_en' => $order->organization->name ?? '',
                'org_name_bn' => $order->organization->name_bn ?? '',
                'vehicle_name' => $order->vehicle->name ?? '',
                'vehicle_ucode' => $order->vehicle->ucode ?? '',
                'vehicle_model' => $order->vehicle->model ?? '',
                'fuel_name' => $order->fuel->name ?? '',
                'fuel_type' => $order->fuel->type ?? '',
                'fuel_qty' => $order->fuel_qty ?? 0,
                'per_ltr_price' => $order->per_ltr_price ?? 0,
                'total_price' => $order->total_price ?? 0,
                'sold_date' => $order->sold_date ? $order->sold_date->format('d/m/Y') : '',
                'creator_name' => $order->creator->name ?? '',
                'creator_email' => $order->creator->email ?? '',
                'created_at' => $order->created_at ? $order->created_at->format('d/m/Y H:i:s') : '',
                'updated_at' => $order->updated_at ? $order->updated_at->format('d/m/Y H:i:s') : '',
            ];

            $data->push($rowData);
        }

        return $data;
    }

    public function columnWidths(): array
    {
        return [
            'A' => 12,  // Order No
            'B' => 12,  // Organization Code
            'C' => 30,  // Organization Name (EN)
            'D' => 30,  // Organization Name (BN)
            'E' => 20,  // Vehicle Name
            'F' => 12,  // Vehicle UCode
            'G' => 15,  // Vehicle Model
            'H' => 15,  // Fuel Name
            'I' => 12,  // Fuel Type
            'J' => 12,  // Fuel Quantity
            'K' => 12,  // Per Liter Price
            'L' => 15,  // Total Price
            'M' => 12,  // Sold Date
            'N' => 20,  // Creator Name
            'O' => 25,  // Creator Email
            'P' => 20,  // Created At
            'Q' => 20,  // Updated At
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
        $sheet->mergeCells('A1:Q1');
        $sheet->getStyle('A1')->getFont()->setSize(16)->setBold(true);
        $sheet->getStyle('A1')->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);

        $sheet->setCellValue('A2', 'Cantonment, Dhaka-1206');
        $sheet->mergeCells('A2:Q2');
        $sheet->getStyle('A2')->getFont()->setSize(12);
        $sheet->getStyle('A2')->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);

        // Add Orders Report title
        $sheet->setCellValue('A3', 'Orders Report');
        $sheet->mergeCells('A3:Q3');
        $sheet->getStyle('A3')->getFont()->setSize(18)->setBold(true);
        $sheet->getStyle('A3')->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);

        // Add filter info if available
        $filterInfo = $this->getFilterInfo();
        if ($filterInfo) {
            $sheet->setCellValue('A4', $filterInfo);
            $sheet->mergeCells('A4:Q4');
            $sheet->getStyle('A4')->getFont()->setSize(12);
            $sheet->getStyle('A4')->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
        }

        // Always insert empty row before creating headers
        // If filterInfo exists, insert after row 4 (before row 5), making row 5 empty
        // If no filterInfo, insert after row 3 (before row 4), making row 4 empty
        $insertRow = $filterInfo ? 5 : 4;
        $sheet->insertNewRowBefore($insertRow, 1);

        // Create headers
        $this->createHeaders($sheet);
    }

    private function getFilterInfo()
    {
        $info = [];

        if (!empty($this->filters['start_date']) && !empty($this->filters['end_date'])) {
            $info[] = 'Date Range: ' . date('d/m/Y', strtotime($this->filters['start_date'])) . ' to ' . date('d/m/Y', strtotime($this->filters['end_date']));
        } elseif (!empty($this->filters['start_date'])) {
            $info[] = 'From: ' . date('d/m/Y', strtotime($this->filters['start_date']));
        } elseif (!empty($this->filters['end_date'])) {
            $info[] = 'To: ' . date('d/m/Y', strtotime($this->filters['end_date']));
        }

        if (!empty($this->filters['search'])) {
            $info[] = 'Search: ' . $this->filters['search'];
        }

        return !empty($info) ? implode(' | ', $info) : null;
    }

    private function writeDataToSheet($sheet)
    {
        $data = $this->collection();
        $filterInfo = $this->getFilterInfo();
        // Headers are at row 6 if filterInfo exists, row 5 if not
        $headerRow = $filterInfo ? 6 : 5;
        $startRow = $headerRow + 1;  // Data starts after headers

        foreach ($data as $index => $row) {
            $currentRow = $startRow + $index;

            $sheet->setCellValue('A' . $currentRow, $row['order_no']);
            $sheet->setCellValue('B' . $currentRow, $row['organization_code']);
            $sheet->setCellValue('C' . $currentRow, $row['org_name_en']);
            $sheet->setCellValue('D' . $currentRow, $row['org_name_bn']);
            $sheet->setCellValue('E' . $currentRow, $row['vehicle_name']);
            $sheet->setCellValue('F' . $currentRow, $row['vehicle_ucode']);
            $sheet->setCellValue('G' . $currentRow, $row['vehicle_model']);
            $sheet->setCellValue('H' . $currentRow, $row['fuel_name']);
            $sheet->setCellValue('I' . $currentRow, $row['fuel_type']);
            $sheet->setCellValue('J' . $currentRow, $row['fuel_qty']);
            $sheet->setCellValue('K' . $currentRow, $row['per_ltr_price']);
            $sheet->setCellValue('L' . $currentRow, $row['total_price']);
            $sheet->setCellValue('M' . $currentRow, $row['sold_date']);
            $sheet->setCellValue('N' . $currentRow, $row['creator_name']);
            $sheet->setCellValue('O' . $currentRow, $row['creator_email']);
            $sheet->setCellValue('P' . $currentRow, $row['created_at']);
            $sheet->setCellValue('Q' . $currentRow, $row['updated_at']);
        }

        // Add summary row
        if ($data->count() > 0) {
            $summaryRow = $startRow + $data->count() + 1;
            $sheet->setCellValue('I' . $summaryRow, 'Total:');
            $sheet->setCellValue('J' . $summaryRow, '=SUM(J' . $startRow . ':J' . ($startRow + $data->count() - 1) . ')');
            $sheet->setCellValue('L' . $summaryRow, '=SUM(L' . $startRow . ':L' . ($startRow + $data->count() - 1) . ')');
            $sheet->getStyle('I' . $summaryRow . ':L' . $summaryRow)->getFont()->setBold(true);
            $sheet->getStyle('I' . $summaryRow . ':L' . $summaryRow)->getAlignment()->setHorizontal(Alignment::HORIZONTAL_RIGHT);
        }
    }

    private function styleDataTable($sheet)
    {
        $data = $this->collection();
        $filterInfo = $this->getFilterInfo();
        // Headers are at row 6 if filterInfo exists, row 5 if not
        $headerRow = $filterInfo ? 6 : 5;
        $dataRowCount = $data->count();
        $lastRow = $headerRow + $dataRowCount;

        // Include summary row if data exists
        if ($dataRowCount > 0) {
            $lastRow += 1;  // Add one for summary row
        }

        // Style all rows from header to data (including summary)
        $fullRange = 'A' . $headerRow . ':Q' . $lastRow;
        $sheet
            ->getStyle($fullRange)
            ->getBorders()
            ->getAllBorders()
            ->setBorderStyle(Border::BORDER_THIN);

        // Ensure bottom borders are visible for all rows
        for ($row = $headerRow; $row <= $lastRow; $row++) {
            $rowRange = 'A' . $row . ':Q' . $row;
            $sheet
                ->getStyle($rowRange)
                ->getBorders()
                ->getBottom()
                ->setBorderStyle(Border::BORDER_THIN);
        }

        // Align numeric columns (data rows only, not summary)
        $numericColumns = ['J', 'K', 'L'];
        $dataEndRow = $headerRow + $dataRowCount;
        foreach ($numericColumns as $col) {
            if ($dataRowCount > 0) {
                $sheet
                    ->getStyle($col . ($headerRow + 1) . ':' . $col . $dataEndRow)
                    ->getAlignment()
                    ->setHorizontal(Alignment::HORIZONTAL_RIGHT);
            }
        }

        // Format currency columns (data rows only, not summary)
        $currencyColumns = ['K', 'L'];
        foreach ($currencyColumns as $col) {
            if ($dataRowCount > 0) {
                $sheet
                    ->getStyle($col . ($headerRow + 1) . ':' . $col . $dataEndRow)
                    ->getNumberFormat()
                    ->setFormatCode('#,##0.00');
            }
        }
    }

    private function createHeaders($sheet)
    {
        $filterInfo = $this->getFilterInfo();
        // After insertNewRowBefore, if filterInfo exists: row 5 is empty, row 6 is headers
        // If no filterInfo: row 4 is empty, row 5 is headers
        $headerRow = $filterInfo ? 6 : 5;

        // Set row height for header
        $sheet->getRowDimension($headerRow)->setRowHeight(25);

        // Headers
        $headers = [
            'A' => 'Order No',
            'B' => 'Org Code',
            'C' => 'Organization Name (EN)',
            'D' => 'Organization Name (BN)',
            'E' => 'Vehicle Name',
            'F' => 'Vehicle Code',
            'G' => 'Vehicle Model',
            'H' => 'Fuel Name',
            'I' => 'Fuel Type',
            'J' => 'Quantity (L)',
            'K' => 'Price/Liter',
            'L' => 'Total Price',
            'M' => 'Sold Date',
            'N' => 'Creator Name',
            'O' => 'Creator Email',
            'P' => 'Created At',
            'Q' => 'Updated At',
        ];

        foreach ($headers as $col => $header) {
            $sheet->setCellValue($col . $headerRow, $header);
        }

        // Style headers
        $headerRange = 'A' . $headerRow . ':Q' . $headerRow;
        $sheet->getStyle($headerRange)->getFont()->setBold(true);
        $sheet->getStyle($headerRange)->getFont()->setColor(new \PhpOffice\PhpSpreadsheet\Style\Color('000000'));
        $sheet->getStyle($headerRange)->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
        $sheet->getStyle($headerRange)->getAlignment()->setVertical(Alignment::VERTICAL_CENTER);
        $sheet
            ->getStyle($headerRange)
            ->getFill()
            ->setFillType(Fill::FILL_SOLID)
            ->getStartColor()
            ->setRGB('D0D0D0');
        $sheet
            ->getStyle($headerRange)
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
            $rightLogo->setCoordinates('Q1');
            $rightLogo->setOffsetX(-60);  // Negative offset to position from right
            $rightLogo->setOffsetY(5);
            $rightLogo->setWorksheet($sheet);
        }
    }

    public function title(): string
    {
        $title = 'Orders Report';
        if (!empty($this->filters['start_date']) && !empty($this->filters['end_date'])) {
            $title .= ' - ' . date('d/m/Y', strtotime($this->filters['start_date'])) . ' to ' . date('d/m/Y', strtotime($this->filters['end_date']));
        }
        return $title;
    }
}
