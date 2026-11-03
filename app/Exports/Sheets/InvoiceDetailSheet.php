<?php

namespace App\Exports\Sheets;

use Illuminate\Support\Carbon;
use Maatwebsite\Excel\Concerns\WithEvents;
use Maatwebsite\Excel\Concerns\WithTitle;
use Maatwebsite\Excel\Events\AfterSheet;
use PhpOffice\PhpSpreadsheet\Cell\Coordinate;
use PhpOffice\PhpSpreadsheet\Style\Alignment;
use PhpOffice\PhpSpreadsheet\Style\Border;
use PhpOffice\PhpSpreadsheet\Style\Fill;
use PhpOffice\PhpSpreadsheet\Worksheet\Drawing;
use PhpOffice\PhpSpreadsheet\Worksheet\PageSetup;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;

/**
 * Daily credit sale statement sheet — same content as resources/views/invoice-pdf.blade.php
 */
class InvoiceDetailSheet implements WithEvents, WithTitle
{
    private const QTY_FORMAT = 'General';

    private const AMOUNT_FORMAT = '"BDT "#,##0.00';

    public function __construct(private array $export) {}

    public function title(): string
    {
        return 'Invoice';
    }

    public function registerEvents(): array
    {
        return [
            AfterSheet::class => function (AfterSheet $event) {
                $this->build($event->sheet->getDelegate());
            },
        ];
    }

    private function build(Worksheet $sheet): void
    {
        $organization = $this->export['organization'];
        $tableHeaders = $this->export['tableHeaders'];
        $period = Carbon::create((int) $this->export['year'], (int) $this->export['month'], 1);

        // Veh. No | Count | one column per day | Total
        $dayCount = count($tableHeaders);
        $lastColIndex = $dayCount + 3;
        $lastCol = Coordinate::stringFromColumnIndex($lastColIndex);
        $col = fn (int $index) => Coordinate::stringFromColumnIndex($index);

        $sheet->getPageSetup()
            ->setPaperSize(PageSetup::PAPERSIZE_LEGAL)
            ->setOrientation(PageSetup::ORIENTATION_LANDSCAPE)
            ->setFitToWidth(1)
            ->setFitToHeight(0);
        $sheet->getColumnDimension('A')->setWidth(12);
        $sheet->getColumnDimension('B')->setWidth(7);
        for ($i = 3; $i < $lastColIndex; $i++) {
            $sheet->getColumnDimension($col($i))->setWidth(6.5);
        }
        $sheet->getColumnDimension($lastCol)->setWidth(10);

        // Header
        $headerLines = [
            ['CSD Filling Station', 16],
            ['Dhaka Cantonment, Dhaka -1206', 12],
            ['Credit Sale Statement ('.$period->format('F').' '.$period->year.')', 12],
        ];
        foreach ($headerLines as $i => [$text, $size]) {
            $row = $i + 1;
            $sheet->setCellValue("A{$row}", $text);
            $sheet->mergeCells("A{$row}:{$lastCol}{$row}");
            $sheet->getStyle("A{$row}")->getFont()->setBold(true)->setSize($size);
            $sheet->getStyle("A{$row}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
            $sheet->getRowDimension($row)->setRowHeight(22);
        }
        $this->addLogo($sheet, public_path('default/csd-logo.png'), 'A1', 5);
        $this->addLogo($sheet, public_path('default/logo.jpeg'), $col($lastColIndex - 1).'1', 0);

        $row = 5;
        $sheet->setCellValue("A{$row}", 'Client: ('.$organization->ucode.') '.$organization->name);
        $sheet->mergeCells("A{$row}:{$lastCol}{$row}");
        $sheet->getStyle("A{$row}")->getFont()->setBold(true);

        $fuelNames = [];
        foreach ($this->export['data'] as $fuel) {
            $fuelNames[] = $fuel['fuel_name'];

            // Fuel title
            $row += 2;
            $sheet->setCellValue("A{$row}", $fuel['fuel_name']);
            $sheet->mergeCells("A{$row}:{$lastCol}{$row}");
            $sheet->getStyle("A{$row}")->getFont()->setBold(true)->setSize(12);
            $sheet->getStyle("A{$row}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);

            // Table header
            $row++;
            $tableStart = $row;
            $headings = ['Veh. No', 'Count'];
            foreach ($tableHeaders as $header) {
                $headings[] = $header['day'].' '.$header['month'];
            }
            $headings[] = 'Total';
            $sheet->fromArray($headings, null, "A{$row}");
            $sheet->getStyle("A{$row}:{$lastCol}{$row}")->applyFromArray([
                'font' => ['bold' => true, 'size' => 9],
                'fill' => ['fillType' => Fill::FILL_SOLID, 'startColor' => ['rgb' => 'E0E0E0']],
                'alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER, 'wrapText' => true],
            ]);
            $sheet->getRowDimension($row)->setRowHeight(26);

            // Vehicle rows
            foreach ($fuel['vehicles'] as $index => $vehicle) {
                $row++;
                $values = [$vehicle['ucode'], $this->blankIfZero($vehicle['order_count'])];
                foreach ($vehicle['quantities'] as $qty) {
                    $values[] = $this->blankIfZero($qty);
                }
                $values[] = $this->blankIfZero($vehicle['total_qty']);
                $sheet->fromArray($values, null, "A{$row}", true);

                if ($index % 2 === 1) {
                    $sheet->getStyle("A{$row}:{$lastCol}{$row}")->getFill()
                        ->setFillType(Fill::FILL_SOLID)->getStartColor()->setRGB('F7F7F7');
                }
            }
            if (! empty($fuel['vehicles'])) {
                $sheet->getStyle('B'.($tableStart + 1).":{$lastCol}{$row}")->getNumberFormat()->setFormatCode(self::QTY_FORMAT);
                $sheet->getStyle('A'.($tableStart + 1).":A{$row}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
                $sheet->getStyle("{$lastCol}".($tableStart + 1).":{$lastCol}{$row}")->getFont()->setBold(true);
            }

            // Rate row: each price range spans its own day columns
            $row++;
            $sheet->setCellValue("A{$row}", 'Rate:');
            $sheet->mergeCells("A{$row}:B{$row}");
            foreach ($fuel['per_ltr_price_ranges'] as $range => $rangeData) {
                [$startDay, $endDay] = array_map('intval', explode('-', $range));
                $from = $col($startDay + 2);
                $to = $col($endDay + 2);
                $sheet->setCellValue("{$from}{$row}", (float) $rangeData['price']);
                if ($from !== $to) {
                    $sheet->mergeCells("{$from}{$row}:{$to}{$row}");
                }
                $sheet->getStyle("{$from}{$row}")->getNumberFormat()->setFormatCode('0.00 "Tk"');
                $sheet->getStyle("{$from}{$row}")->getFont()->setBold(true);
                $sheet->getStyle("{$from}{$row}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
            }

            // Total litres / bill
            foreach ([['Total Ltr.', $fuel['total_qty'], self::QTY_FORMAT], ['Total Bill.', $fuel['total_price'], self::AMOUNT_FORMAT]] as [$label, $value, $format]) {
                $row++;
                $sheet->setCellValue("A{$row}", $label);
                $sheet->mergeCells("A{$row}:B{$row}");
                $sheet->setCellValue("C{$row}", (float) $value);
                $sheet->mergeCells("C{$row}:H{$row}");
                $sheet->getStyle("C{$row}")->getNumberFormat()->setFormatCode($format);
                $sheet->getStyle("C{$row}")->getFont()->setBold(true);
                $sheet->getStyle("C{$row}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_LEFT);
            }

            $sheet->getStyle("A{$tableStart}:{$lastCol}{$row}")->getBorders()->getAllBorders()->setBorderStyle(Border::BORDER_THIN);
            $sheet->getStyle("A{$tableStart}:{$lastCol}{$row}")->getFont()->setSize(9);
        }

        // Summary
        $row += 2;
        $sheet->setCellValue("A{$row}", 'Total Coupon: '.$this->export['totalCoupon'].' ('.$this->export['repeatedCouponCount'].' repeated)');
        $sheet->mergeCells("A{$row}:{$lastCol}{$row}");
        $sheet->getStyle("A{$row}")->getFont()->setBold(true);
        $row++;
        $sheet->setCellValue("A{$row}", 'Total Bill ('.implode(' + ', $fuelNames).'):');
        $sheet->mergeCells("A{$row}:H{$row}");
        $sheet->setCellValue("I{$row}", (float) $this->export['totalBill']);
        $sheet->mergeCells("I{$row}:N{$row}");
        $sheet->getStyle("A{$row}:I{$row}")->getFont()->setBold(true);
        $sheet->getStyle("I{$row}")->getNumberFormat()->setFormatCode(self::AMOUNT_FORMAT);
        $sheet->getStyle("I{$row}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_LEFT);

        // Signatures, spread across the sheet width
        $row += 4;
        $signatures = [
            ['Md Mohi Uddin', 'Executive', 'CSD Filling Station'],
            ['WO Md Rafiqul Islam (Retd)', 'Manager', 'CSD Filling Station'],
            ['Lt Col Md. Akhtaruzzaman (Retd)', 'Head of CSD Filling Station', ''],
        ];
        $blockWidth = intdiv($lastColIndex, 3);
        $this->addLogo($sheet, public_path('default/signature.png'), $col(2 * $blockWidth + 1).($row - 3), 0, 45);
        foreach ($signatures as $i => $lines) {
            $from = $col($i * $blockWidth + 1);
            $to = $col($i === 2 ? $lastColIndex : ($i + 1) * $blockWidth);
            foreach ($lines as $offset => $text) {
                $r = $row + $offset;
                $sheet->setCellValue("{$from}{$r}", $text);
                $sheet->mergeCells("{$from}{$r}:{$to}{$r}");
                $sheet->getStyle("{$from}{$r}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
            }
            $sheet->getStyle("{$from}{$row}")->getFont()->setBold(true);
            $sheet->getStyle("{$from}{$row}:{$to}{$row}")->getBorders()->getTop()->setBorderStyle(Border::BORDER_THIN);
        }

        $sheet->setSelectedCell('A1');
    }

    private function addLogo(Worksheet $sheet, string $path, string $coordinates, int $offsetX, int $height = 55): void
    {
        if (! file_exists($path)) {
            return;
        }

        $drawing = new Drawing;
        $drawing->setPath($path);
        $drawing->setHeight($height);
        $drawing->setCoordinates($coordinates);
        $drawing->setOffsetX($offsetX);
        $drawing->setOffsetY(4);
        $drawing->setWorksheet($sheet);
    }

    private function blankIfZero(int|float|string|null $value): int|float|null
    {
        return (float) $value == 0 ? null : $value + 0;
    }
}
