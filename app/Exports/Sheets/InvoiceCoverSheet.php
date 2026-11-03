<?php

namespace App\Exports\Sheets;

use Maatwebsite\Excel\Concerns\WithEvents;
use Maatwebsite\Excel\Concerns\WithTitle;
use Maatwebsite\Excel\Events\AfterSheet;
use PhpOffice\PhpSpreadsheet\Style\Alignment;
use PhpOffice\PhpSpreadsheet\Style\Border;
use PhpOffice\PhpSpreadsheet\Style\Fill;
use PhpOffice\PhpSpreadsheet\Worksheet\PageSetup;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;

/**
 * Cover letter sheet — same content as resources/views/invoice-cover-pdf.blade.php
 */
class InvoiceCoverSheet implements WithEvents, WithTitle
{
    private const RED = 'E53935';

    private const LETTER_ORDER = ['ক', 'খ', 'গ', 'ঘ', 'ঙ', 'চ', 'ছ', 'জ', 'ঝ', 'ঞ', 'ট', 'ঠ', 'ড', 'ঢ', 'ণ', 'ত', 'থ', 'দ', 'ধ', 'ন', 'প', 'ফ', 'ব', 'ভ', 'ম', 'য', 'র', 'ল', 'শ', 'ষ', 'স', 'হ', 'ড়', 'ঢ়', 'য়'];

    private const BENGALI_MONTHS = [
        1 => 'জানুয়ারি', 2 => 'ফেব্রুয়ারি', 3 => 'মার্চ', 4 => 'এপ্রিল', 5 => 'মে', 6 => 'জুন',
        7 => 'জুলাই', 8 => 'আগস্ট', 9 => 'সেপ্টেম্বর', 10 => 'অক্টোবর', 11 => 'নভেম্বর', 12 => 'ডিসেম্বর',
    ];

    private const FUEL_BN_NAMES = [
        'petrol' => 'পেট্রোল',
        'diesel' => 'ডিজেল',
        'octane' => 'অকটেন',
        'lubricant' => 'লুব্রিকেন্ট',
        'cng' => 'সিএনজি',
        'lpg' => 'এলপিজি',
        'adblue' => 'অ্যাডব্লু',
    ];

    private const AMOUNT_FORMAT = '"৳ "#,##0.00';

    public function __construct(private array $export) {}

    public function title(): string
    {
        return 'Cover';
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
        $month = (int) $this->export['month'];
        $year = (int) $this->export['year'];
        $vatRate = $this->export['vatRate'];
        $itRate = $this->export['itRate'];
        $hasTax = $vatRate > 0 || $itRate > 0;
        $monthYearBn = self::BENGALI_MONTHS[$month].' '.$this->bn($year);

        $sheet->getPageSetup()->setPaperSize(PageSetup::PAPERSIZE_A4)->setFitToWidth(1)->setFitToHeight(0);
        $sheet->getParent()->getDefaultStyle()->getFont()->setSize(11);
        foreach (['A' => 9, 'B' => 20, 'C' => 18, 'D' => 18, 'E' => 20, 'F' => 12] as $col => $width) {
            $sheet->getColumnDimension($col)->setWidth($width);
        }

        // Letterhead (right side)
        $row = 1;
        foreach (['সি এস ডি ফিলিং স্টেশন', 'সি এস ডি বাংলাদেশ', 'ঢাকা সেনানিবাস'] as $line) {
            $sheet->setCellValue("E{$row}", $line);
            $sheet->mergeCells("E{$row}:F{$row}");
            $row++;
        }

        // Reference no. and date
        $row++;
        $sheet->setCellValue("A{$row}", 'নথি নং- সি এস ডি/ফিলিং স্টেশন/ক্রেডিট/'.$this->bn(sprintf('%02d', $month)).$this->bn($year % 200).'/'.$this->bn($organization->ucode));
        $sheet->mergeCells("A{$row}:D{$row}");
        $sheet->setCellValue("E{$row}", self::BENGALI_MONTHS[now()->month].' '.$this->bn(now()->year));
        $sheet->mergeCells("E{$row}:F{$row}");

        // Subject
        $row += 2;
        $this->paragraph($sheet, $row, 'বিষয়ঃ সি এস ডি ফিলিং স্টেশন হতে '.$monthYearBn.' মাসে ক্রেডিট ভাউচারের মাধ্যমে প্রদত্ত পেট্রোলিয়াম পণ্যের বিল পরিশোধ প্রসঙ্গে।');
        $sheet->getStyle("A{$row}")->getFont()->setUnderline(true);

        // 1. Intro + table
        $row += 2;
        $this->paragraph($sheet, $row, '১। আপনাদের চাহিদা অনুযায়ী সি এস ডি ফিলিং স্টেশন হতে '.$monthYearBn.' মাসে ক্রেডিট ভাউচারের মাধ্যমে প্রদানকৃত পেট্রোলিয়াম পণ্যের বিল পরিশোধের নিমিত্তে নিম্নের্ণিত ছক মোতাবেক প্রেরণ করা হলোঃ');

        $row++;
        $tableStart = $row;
        $sheet->fromArray(['ক্রম নং', 'জ্বালানীর প্রকার', 'পরিমান (লিটার)', 'মূল্য (প্রতি লিটার)', 'মোট মূল্য', 'মন্তব্য'], null, "A{$row}");
        $sheet->getStyle("A{$row}:F{$row}")->applyFromArray([
            'font' => ['bold' => true],
            'fill' => ['fillType' => Fill::FILL_SOLID, 'startColor' => ['rgb' => 'F5F5F5']],
            'alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER, 'vertical' => Alignment::VERTICAL_CENTER, 'wrapText' => true],
        ]);

        $serial = 0;
        foreach ($this->export['data'] as $item) {
            foreach ($item['per_ltr_price_ranges'] as $rangeData) {
                $row++;
                $sheet->setCellValue("A{$row}", (self::LETTER_ORDER[$serial] ?? $this->bn($serial + 1)).'।');
                $sheet->setCellValue("B{$row}", self::FUEL_BN_NAMES[strtolower($item['fuel_name'])] ?? $item['fuel_name']);
                $sheet->setCellValue("C{$row}", (float) $rangeData['total_qty']);
                $sheet->setCellValue("D{$row}", (float) $rangeData['price']);
                $sheet->setCellValue("E{$row}", (float) $rangeData['total_bill']);
                $sheet->setCellValue("F{$row}", '—');
                $sheet->getStyle("C{$row}")->getNumberFormat()->setFormatCode('#,##0.00');
                $sheet->getStyle("D{$row}:E{$row}")->getNumberFormat()->setFormatCode(self::AMOUNT_FORMAT);
                $sheet->getStyle("C{$row}")->getFont()->getColor()->setRGB(self::RED);
                $sheet->getStyle("E{$row}")->getFont()->getColor()->setRGB(self::RED);
                $sheet->getStyle("A{$row}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
                $sheet->getStyle("F{$row}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
                $serial++;
            }
        }

        // Totals
        $totals = [];
        if ($hasTax) {
            $totals[] = ['উপ-মোট', $this->export['totalBill'], false];
            if ($vatRate > 0) {
                $totals[] = ['ভ্যাট ('.$this->bn($this->rate($vatRate)).'%)', $this->export['vatAmount'], false];
            }
            if ($itRate > 0) {
                $totals[] = ['আয়কর ('.$this->bn($this->rate($itRate)).'%)', $this->export['itAmount'], false];
            }
            $label = match (true) {
                $vatRate > 0 && $itRate > 0 => 'সর্বমোট টাকা (ভ্যাট ও আয়করসহ)',
                $vatRate > 0 => 'সর্বমোট টাকা (ভ্যাটসহ)',
                default => 'সর্বমোট টাকা (আয়করসহ)',
            };
            $totals[] = [$label, $this->export['grandTotal'], true];
        } else {
            $totals[] = ['মোট টাকা', $this->export['totalBill'], true];
        }

        foreach ($totals as [$label, $amount, $highlight]) {
            $row++;
            $sheet->setCellValue("A{$row}", $label);
            $sheet->mergeCells("A{$row}:D{$row}");
            $sheet->setCellValue("E{$row}", (float) $amount);
            $sheet->getStyle("A{$row}:F{$row}")->getFont()->setBold(true);
            $sheet->getStyle("A{$row}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_RIGHT);
            $sheet->getStyle("E{$row}")->getNumberFormat()->setFormatCode(self::AMOUNT_FORMAT);
            if ($highlight) {
                $sheet->getStyle("E{$row}")->getFont()->getColor()->setRGB(self::RED);
            }
        }

        $sheet->getStyle("A{$tableStart}:F{$row}")->getBorders()->getAllBorders()
            ->setBorderStyle(Border::BORDER_THIN)->getColor()->setRGB('D9D9D9');
        $sheet->getStyle("A{$tableStart}:F{$row}")->getAlignment()->setVertical(Alignment::VERTICAL_CENTER);

        // 2. Payment request
        $taxNote = match (true) {
            $vatRate > 0 && $itRate > 0 => '( '.$this->bn($this->rate($vatRate)).'% ভ্যাট ও '.$this->bn($this->rate($itRate)).'% আয়করসহ ) ',
            $vatRate > 0 => '( '.$this->bn($this->rate($vatRate)).'% ভ্যাটসহ ) ',
            $itRate > 0 => '( '.$this->bn($this->rate($itRate)).'% আয়করসহ ) ',
            default => '',
        };
        $payable = $hasTax ? $this->export['grandTotal'] : $this->export['totalBill'];

        $row += 2;
        $this->paragraph($sheet, $row, '২। উপরোক্ত জ্বালানীর মূল্য বাবদ '.$taxNote.'৳ '.$this->bn(number_format($payable, 2)).' টাকা জরুরী ভিত্তিতে “সি এস ডি ফিলিং স্টেশন” হিসাব নং ০০০২-০২১০০৩৯৯৭৩ ট্রাস্ট ব্যাংক পিএলসি ক্যান্টনমেন্ট শাখা, ঢাকার অনুকূলে অফিসিয়াল চেক বা ব্যাংক ট্রান্সফার দ্বারা প্রদান করার জন্য অনুরোধ করা হলো।');

        // 3. Due date
        $dueDate = now()->addDays(15);
        $row++;
        $this->paragraph($sheet, $row, '৩। বিল প্রাপ্তি সাপেক্ষে আগামী '.$this->bn($dueDate->day).' '.self::BENGALI_MONTHS[$dueDate->month].' '.$this->bn($dueDate->year).' তারিখের মধ্যে পরিশোধ করার জন্য অনুরোধ করা হলো। উল্লেখ্য যে, অবিনিমেয় চেক অবশ্যই আবরণী পত্রের মাধ্যমে প্রদান করতে হবে। অন লাইনে বিল পরিশোধের ক্ষেত্রে পত্রের মাধ্যমে সি এস ডি ফিলিং স্টেশন\'কে (চিঠি বা ইমেইলের মাধ্যমে) অবগত করার জন্য অনুরোধ করা হলো।');

        // 4. Acknowledgement
        $row++;
        $this->paragraph($sheet, $row, '৪। অনুগ্রহ পূর্বক প্রাপ্তি স্বীকার করবেন।');

        // Signature
        $row += 3;
        $sheet->setCellValue("D{$row}", 'লেঃ কর্নেল মোঃ আখতারুজ্জামান (অবঃ)');
        $sheet->mergeCells("D{$row}:F{$row}");
        $sheet->getStyle("D{$row}")->getFont()->setBold(true);
        $row++;
        $sheet->setCellValue("D{$row}", 'হেড অব সি এস ডি ফিলিং স্টেশন');
        $sheet->mergeCells("D{$row}:F{$row}");

        // Attachments / distribution
        $row += 2;
        $sheet->setCellValue("A{$row}", 'সংযুক্তঃ');
        $row++;
        $sheet->setCellValue("A{$row}", '• জ্বালানী সংগ্রহের কুপন - '.$this->bn($this->export['totalCoupon']).' টি।');
        $sheet->mergeCells("A{$row}:F{$row}");
        $row++;
        $sheet->setCellValue("A{$row}", '• বিল সামারী - '.$this->bn($this->export['pageCount']).' কপি।');
        $sheet->mergeCells("A{$row}:F{$row}");

        foreach (['বিতরণঃ', 'বহির্গমনঃ', 'কার্যক্রমঃ'] as $label) {
            $row += 2;
            $sheet->setCellValue("A{$row}", $label);
        }
        $row++;
        $sheet->setCellValue("A{$row}", $organization->name_bn);
        $sheet->mergeCells("A{$row}:F{$row}");
        $sheet->getStyle("A{$row}")->getFont()->getColor()->setRGB(self::RED);

        $row += 2;
        $sheet->setCellValue("A{$row}", 'ইমেইল: csdfillingstation@gmail.com | ফোন: ০১৭৬৯০৪০৯৪৯');
        $sheet->mergeCells("A{$row}:F{$row}");

        $sheet->setSelectedCell('A1');
    }

    /**
     * Write a wrapped paragraph merged across the full sheet width
     */
    private function paragraph(Worksheet $sheet, int $row, string $text): void
    {
        $sheet->setCellValue("A{$row}", $text);
        $sheet->mergeCells("A{$row}:F{$row}");
        $sheet->getStyle("A{$row}")->getAlignment()
            ->setWrapText(true)
            ->setVertical(Alignment::VERTICAL_TOP)
            ->setHorizontal(Alignment::HORIZONTAL_JUSTIFY);

        // Excel does not auto-fit merged cells, so estimate the height
        $lines = max(1, (int) ceil(mb_strlen($text) / 75));
        $sheet->getRowDimension($row)->setRowHeight($lines * 18);
    }

    private function bn(int|string $value): string
    {
        return str_replace(range(0, 9), ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'], (string) $value);
    }

    private function rate(float $rate): string
    {
        return rtrim(rtrim(number_format($rate, 2), '0'), '.');
    }
}
