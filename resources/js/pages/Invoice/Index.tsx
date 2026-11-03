import AppLayout from "@/layouts/app-layout";
import { Head, router } from "@inertiajs/react";
import { BreadcrumbItem } from "@/types";
import { dashboard } from "@/routes";
import invoiceRoute from "@/routes/invoices";
import axios from "axios";
import { useState, useCallback, useRef, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Download, FileText, Calendar, Building, CheckCircle, Eye, Loader2, ChartColumnIncreasing, RefreshCcw, FileSpreadsheet } from "lucide-react";
import OrganizationSelector from "@/components/OrganizationSelector";
import { Organization, Invoice, PaginatedResponse } from "@/types/response";
import { DataTableWrapper } from "@/components/data-table-wrapper";
import { Column } from "@/components/data-table";
import { currenyFormat } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

interface IndexProps {
    months: number[];
    years: number[];
    organizations: Organization[];
    invoices: PaginatedResponse<Invoice>;
}

type DownloadFormat = 'pdf' | 'excel';

export default function Index({ months, years, organizations, invoices }: IndexProps) {
    const [searchTerm, setSearchTerm] = useState('');
    const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const [selectedMonth, setSelectedMonth] = useState<number>(months[0] || 0);
    const [selectedYear, setSelectedYear] = useState<number>(years[0] || 0);
    const [selectedOrganization, setSelectedOrganization] = useState<Organization | null>(null);
    const [includeCover, setIncludeCover] = useState<boolean>(false);
    const [isDownloading, setIsDownloading] = useState<boolean>(false);
    const [downloadProgress, setDownloadProgress] = useState<number>(0);
    const [downloadingFormat, setDownloadingFormat] = useState<DownloadFormat | null>(null);
    const [showGenerateModal, setShowGenerateModal] = useState<boolean>(false);
    const { toast } = useToast();

    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: 'Dashboard',
            href: dashboard().url,
        },
        {
            title: 'Download Invoice',
            href: invoiceRoute.index().url,
        },
    ];

    const resetForm = () => {
        setSelectedOrganization(null);
        setSelectedMonth(months[0] || 0);
        setSelectedYear(years[0] || 0);
        setIncludeCover(false);
    };

    // Shared PDF / Excel invoice download
    const downloadInvoice = async (
        organization: Pick<Organization, 'id' | 'name'>,
        month: number,
        year: number,
        withCover: boolean,
        format: DownloadFormat,
    ) => {
        setIsDownloading(true);
        setDownloadingFormat(format);
        setDownloadProgress(0);

        try {
            toast({
                title: "Downloading...",
                description: `Preparing ${format === 'excel' ? 'Excel' : 'PDF'} invoice for ${organization.name}...`,
            });

            const endpoint = format === 'excel' ? 'export-excel' : 'export';
            const resp = await axios.post(`/api/invoices/${organization.id}/${endpoint}`, {
                month,
                year,
                include_cover: withCover
            }, {
                responseType: 'blob',
                withCredentials: true,
                onDownloadProgress: (e: any) => {
                    if (e.total) {
                        const pct = Math.round((e.loaded / e.total) * 100);
                        setDownloadProgress(pct);
                    }
                },
            });

            const [extension, mimeType] = format === 'excel'
                ? ['xlsx', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet']
                : withCover ? ['zip', 'application/zip'] : ['pdf', 'application/pdf'];

            // Extract filename from Content-Disposition
            const cd = resp.headers['content-disposition'] || '';
            const match = cd.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]+)/i);
            const filename = match ? decodeURIComponent(match[1].replace(/['"]/g, '')) :
                `${withCover ? 'invoice-with-cover' : 'invoice'}-${month}-${year}.${extension}`;

            const blobUrl = URL.createObjectURL(new Blob([resp.data], { type: mimeType }));
            const a = document.createElement('a');
            a.href = blobUrl;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            a.remove();
            URL.revokeObjectURL(blobUrl);

            toast({
                title: "Success",
                description: "Invoice downloaded successfully",
            });
        } catch (error) {
            if (axios.isAxiosError(error) && error.response?.status === 404) {
                toast({
                    variant: "destructive",
                    title: "Not Found",
                    description: "No invoice found for the selected month and organization.",
                });
            } else {
                toast({
                    variant: "destructive",
                    title: "Error",
                    description: "Failed to download invoice. Please try again.",
                });
            }
        } finally {
            setIsDownloading(false);
            setDownloadingFormat(null);
            setDownloadProgress(0);
            resetForm();
        }
    };

    const handleDownload = async (format: DownloadFormat) => {
        if (!selectedOrganization) {
            toast({
                variant: "destructive",
                title: "Error",
                description: "Please select an organization",
            });
            return;
        }

        await downloadInvoice(selectedOrganization, selectedMonth, selectedYear, includeCover, format);
    };

    // Custom debounced search function
    const debouncedSearch = useCallback((term: string) => {
        if (searchTimeoutRef.current) {
            clearTimeout(searchTimeoutRef.current);
        }

        searchTimeoutRef.current = setTimeout(() => {
            router.get('/invoices', {
                "filter[search]": term,
                page: 1 // Reset to first page when searching
            }, {
                preserveState: true,
                preserveScroll: true,
            });
        }, 500);
    }, []);

    const handleSearchChange = (search: string) => {
        setSearchTerm(search);
        debouncedSearch(search);
    };

    const handlePageChange = (page: number) => {
        router.get('/invoices', {
            page,
            "filter[search]": searchTerm // Preserve search term when changing pages
        }, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const handleRowDownload = (invoice: Invoice, format: DownloadFormat) =>
        downloadInvoice(
            invoice.organization,
            new Date(`${invoice.month} 1, ${invoice.year}`).getMonth() + 1,
            +invoice.year,
            true,
            format,
        );

    const [isSyncing, setIsSyncing] = useState<number | null>(null);

    const handleSync = async (invoice: Invoice) => {
        setIsSyncing(invoice.id);
        try {
            await router.post(`/invoices/${invoice.organization.id}/sync`, {
                month: new Date(`${invoice.month} 1, ${invoice.year}`).getMonth() + 1,
                year: +invoice.year,
            }, {
                onSuccess: () => {
                    toast({
                        title: "Success",
                        description: "Invoice synchronized successfully",
                    });
                },
                onError: () => {
                    toast({
                        variant: "destructive",
                        title: "Error",
                        description: "An error occurred while syncing the invoice",
                    });
                },
                preserveScroll: true,
            });
        } finally {
            setIsSyncing(null);
        }
    };

    // monthly report modal
    const [showMonthlyReportModal, setShowMonthlyReportModal] = useState<boolean>(false);
    const [selectedMonthForReport, setSelectedMonthForReport] = useState<number>(months[0] || 0);
    const [selectedYearForReport, setSelectedYearForReport] = useState<number>(years[0] || 0);
    const [isDownloadingReport, setIsDownloadingReport] = useState<boolean>(false);
    const [downloadReportProgress, setDownloadReportProgress] = useState<number>(0);
    const [isDownloadingMonthlyPdf, setIsDownloadingMonthlyPdf] = useState<boolean>(false);
    const [downloadMonthlyPdfProgress, setDownloadMonthlyPdfProgress] = useState<number>(0);

    const handleMonthlyReportDownload = async () => {
        setIsDownloadingReport(true);
        setDownloadReportProgress(0);

        try {

            const resp = await axios.post(`/api/reports/monthly-export`, {
                month: selectedMonthForReport,
                year: selectedYearForReport,
            }, {
                responseType: 'blob',
                withCredentials: true,
                onDownloadProgress: (e: any) => {
                    if (e.total) {
                        const pct = Math.round((e.loaded / e.total) * 100);
                        setDownloadReportProgress(pct);
                    }
                },
            });

            toast({
                title: "Downloading...",
                description: "Preparing monthly report...",
            });

            // Extract filename from Content-Disposition
            const cd = resp.headers['content-disposition'] || '';
            const match = cd.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]+)/i);
            const filename = match ? decodeURIComponent(match[1].replace(/['"]/g, '')) :
                `monthly-report-${selectedMonthForReport}-${selectedYearForReport}.xlsx`;

            const blobUrl = URL.createObjectURL(new Blob([resp.data], {
                type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            }));
            const a = document.createElement('a');
            a.href = blobUrl;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            a.remove();
            URL.revokeObjectURL(blobUrl);
        } catch (error) {
            if (axios.isAxiosError(error) && error.response?.status === 404) {
                toast({
                    variant: "destructive",
                    title: "Not Found",
                    description: "No data found for the selected month and year.",
                });
            } else {
                toast({
                    variant: "destructive",
                    title: "Error",
                    description: "An error occurred while downloading the report.",
                });
            }
        } finally {
            setIsDownloadingReport(false);
            setDownloadReportProgress(0);
            // clear the form
            setSelectedMonthForReport(months[0] || 0);
            setSelectedYearForReport(years[0] || 0);
        }
    }

    const handleMonthlyReportPdfDownload = async () => {
        setIsDownloadingMonthlyPdf(true);
        setDownloadMonthlyPdfProgress(0);

        try {
            toast({
                title: "Downloading...",
                description: "Preparing monthly PDF report...",
            });

            const resp = await axios.post(`/api/reports/monthly-report-pdf`, {
                month: selectedMonthForReport,
                year: selectedYearForReport,
            }, {
                responseType: 'blob',
                withCredentials: true,
                onDownloadProgress: (e: any) => {
                    if (e.total) {
                        const pct = Math.round((e.loaded / e.total) * 100);
                        setDownloadMonthlyPdfProgress(pct);
                    }
                },
            });

            const cd = resp.headers['content-disposition'] || '';
            const match = cd.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]+)/i);
            const filename = match ? decodeURIComponent(match[1].replace(/['"]/g, '')) :
                `monthly-report-${selectedMonthForReport}-${selectedYearForReport}.pdf`;

            const blobUrl = URL.createObjectURL(new Blob([resp.data], {
                type: 'application/pdf'
            }));
            const a = document.createElement('a');
            a.href = blobUrl;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            a.remove();
            URL.revokeObjectURL(blobUrl);

            toast({
                title: "Success",
                description: "Monthly PDF report downloaded successfully",
            });
        } catch (error) {
            if (axios.isAxiosError(error) && error.response?.status === 404) {
                toast({
                    variant: "destructive",
                    title: "Not Found",
                    description: "No data found for the selected month and year.",
                });
            } else {
                toast({
                    variant: "destructive",
                    title: "Error",
                    description: "An error occurred while downloading the PDF report.",
                });
            }
        } finally {
            setIsDownloadingMonthlyPdf(false);
            setDownloadMonthlyPdfProgress(0);
            setSelectedMonthForReport(months[0] || 0);
            setSelectedYearForReport(years[0] || 0);
        }
    }

    const isReportDownloading = isDownloadingReport || isDownloadingMonthlyPdf;
    const activeReportProgress = isDownloadingMonthlyPdf ? downloadMonthlyPdfProgress : downloadReportProgress;
    const activeReportLabel = isDownloadingMonthlyPdf ? 'Generating PDF report...' : 'Generating Excel report...';

    const columns: Column<Invoice>[] = useMemo(() => [
        {
            key: 'month',
            header: 'Month',
            sortable: true,
            render: (value, row) => (
                <Badge variant="outline">
                    {row.month}
                </Badge>
            )
        },
        {
            key: 'year',
            header: 'Year',
            sortable: true,
            render: (value) => (
                <div className="font-medium">{value}</div>
            )
        },
        {
            key: 'organization',
            header: 'Organization',
            sortable: true,
            render: (value, row) => (
                <div>
                    <div className="font-medium">{row.organization.name}</div>
                    <div className="text-sm text-muted-foreground">{row.organization.ucode}</div>
                </div>
            )
        },
        {
            key: 'totalCoupon',
            header: 'Total Coupon',
            sortable: true,
            render: (value) => (
                <Badge variant="secondary">{value}</Badge>
            )
        },
        {
            key: 'totalQuantity',
            header: 'Total Quantity',
            sortable: true,
            render: (value) => (
                <div>{value} Ltr.</div>
            )
        },
        {
            key: 'totalBill',
            header: 'Total Bill',
            sortable: true,
            render: (value) => (
                <div className="font-medium">
                    {currenyFormat(value)}
                </div>
            )
        },
        {
            key: 'updated_at',
            header: 'Last Update',
            sortable: true,
            render: (value) => (
                <div className="font-medium">
                    {value}
                </div>
            )
        },
        {
            key: 'actions',
            header: 'Actions',
            render: (value, row) => (
                <div className="flex items-center space-x-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRowDownload(row, 'pdf')}
                        className="flex items-center gap-1"
                        disabled={isDownloading}
                    >
                        {downloadingFormat === 'pdf' ? <Loader2 className="h-3 w-3 animate-spin" /> : <Download className="h-3 w-3" />}
                        PDF
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRowDownload(row, 'excel')}
                        className="flex items-center gap-1 text-green-700 hover:text-green-800"
                        disabled={isDownloading}
                    >
                        {downloadingFormat === 'excel' ? <Loader2 className="h-3 w-3 animate-spin" /> : <FileSpreadsheet className="h-3 w-3" />}
                        Excel
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleSync(row)}
                        className="flex items-center gap-1 text-blue-600 hover:text-blue-700"
                        disabled={isSyncing === row.id}
                    >
                        {isSyncing === row.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCcw className="h-3 w-3" />}
                        Sync
                    </Button>
                </div>
            )
        }
    ], [isDownloading, downloadingFormat, isSyncing]);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Download Invoice" />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                {/* Header Section */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">
                            Invoice Management
                        </h1>
                        <p className="text-muted-foreground">
                            View, generate and download invoices
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <Button
                            onClick={() => setShowGenerateModal(true)}
                            className="flex items-center gap-2"
                        >
                            <FileText className="h-4 w-4" />
                            Generate New Invoice
                        </Button>
                        <Button
                            onClick={() => setShowMonthlyReportModal(true)}
                            className="flex items-center gap-2"
                        >
                            <ChartColumnIncreasing className="h-4 w-4" />
                            Monthly Report
                        </Button>
                    </div>
                </div>

                {/* Main Content - Full Screen Table */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <FileText className="h-5 w-5" />
                            Invoice History
                        </CardTitle>
                        <CardDescription>
                            View and download previous invoices
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <DataTableWrapper
                            response={invoices}
                            columns={columns}
                            searchable={true}
                            searchPlaceholder="Search invoices..."
                            onPageChange={handlePageChange}
                            onSearchChange={handleSearchChange}
                            searchValue={searchTerm}
                            statusText={`Showing ${invoices.meta.from} to ${invoices.meta.to} of ${invoices.meta.total} invoices`}
                        />
                    </CardContent>
                </Card>

                {/* Generate New Invoice Modal */}
                <Dialog
                    open={showGenerateModal}
                    onOpenChange={setShowGenerateModal}
                >
                    <DialogContent className="sm:max-w-2xl">
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                                <Calendar className="h-5 w-5" />
                                Generate New Invoice
                            </DialogTitle>
                            <DialogDescription>
                                Choose the month and year for your invoice
                                download
                            </DialogDescription>
                        </DialogHeader>

                        <div className="space-y-6">
                            {/* Organization Selection */}
                            <div className="space-y-2">
                                <Label className="text-base font-medium">
                                    Organization
                                </Label>
                                <OrganizationSelector
                                    organizations={organizations}
                                    selectedOrganization={selectedOrganization}
                                    onOrganizationSelect={
                                        setSelectedOrganization
                                    }
                                    placeholder="Select organization..."
                                />
                            </div>

                            {/* Month and Year Selection */}
                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label className="text-base font-medium">
                                        Month
                                    </Label>
                                    <Select
                                        value={selectedMonth.toString()}
                                        onValueChange={(value) =>
                                            setSelectedMonth(Number(value))
                                        }
                                    >
                                        <SelectTrigger className="h-12">
                                            <SelectValue placeholder="Select month" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {months.map((month) => (
                                                <SelectItem
                                                    key={month}
                                                    value={month.toString()}
                                                >
                                                    {new Date(
                                                        0,
                                                        month - 1,
                                                    ).toLocaleString(
                                                        'default',
                                                        { month: 'long' },
                                                    )}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-base font-medium">
                                        Year
                                    </Label>
                                    <Select
                                        value={selectedYear.toString()}
                                        onValueChange={(value) =>
                                            setSelectedYear(Number(value))
                                        }
                                    >
                                        <SelectTrigger className="h-12">
                                            <SelectValue placeholder="Select year" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {years.map((year) => (
                                                <SelectItem
                                                    key={year}
                                                    value={year.toString()}
                                                >
                                                    {year}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            {/* Cover Option */}
                            <div className="space-y-4">
                                <div className="flex items-center space-x-2">
                                    <Checkbox
                                        id="include-cover"
                                        checked={includeCover}
                                        onCheckedChange={(checked) =>
                                            setIncludeCover(checked as boolean)
                                        }
                                    />
                                    <Label
                                        htmlFor="include-cover"
                                        className="cursor-pointer text-sm font-medium"
                                    >
                                        Include cover page
                                    </Label>
                                </div>
                                <div className="rounded-lg bg-muted/50 p-3 text-xs text-muted-foreground">
                                    <div className="flex items-start gap-2">
                                        <Building className="mt-0.5 h-4 w-4 text-blue-600" />
                                        <div>
                                            <p className="font-medium text-blue-600">
                                                Cover Page Option
                                            </p>
                                            <p className="mt-1">
                                                {includeCover
                                                    ? 'PDF: cover + invoice packaged as a ZIP file. Excel: one workbook with Cover and Invoice sheets'
                                                    : 'PDF: a single invoice file. Excel: one workbook with the Invoice sheet'}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Download Info */}
                            <div className="rounded-lg bg-muted/30 p-4 text-center text-sm text-muted-foreground">
                                <p>
                                    Organization:{' '}
                                    <span className="font-medium">
                                        {selectedOrganization
                                            ? selectedOrganization.name
                                            : 'Not selected'}
                                    </span>
                                </p>
                                <p>
                                    Period:{' '}
                                    <span className="font-medium">
                                        {new Date(
                                            0,
                                            selectedMonth - 1,
                                        ).toLocaleString('default', {
                                            month: 'long',
                                        })}{' '}
                                        {selectedYear}
                                    </span>
                                </p>
                                <p className="mt-1">
                                    Format:{' '}
                                    <span className="font-medium">
                                        {includeCover
                                            ? 'ZIP (with cover) or Excel (2 sheets)'
                                            : 'PDF (standard) or Excel'}
                                    </span>
                                </p>
                            </div>

                            {/* Progress Bar */}
                            {isDownloading && (
                                <div className="space-y-2">
                                    <div className="flex justify-between text-sm text-muted-foreground">
                                        <span>Downloading...</span>
                                        <span>{downloadProgress}%</span>
                                    </div>
                                    <div className="h-2 w-full rounded-full bg-muted">
                                        <div
                                            className="h-2 rounded-full bg-primary transition-all duration-300"
                                            style={{
                                                width: `${downloadProgress}%`,
                                            }}
                                        ></div>
                                    </div>
                                </div>
                            )}
                        </div>

                        <DialogFooter className="flex gap-2">
                            <Button
                                variant="outline"
                                onClick={() => setShowGenerateModal(false)}
                                disabled={isDownloading}
                            >
                                Cancel
                            </Button>
                            {(['pdf', 'excel'] as const).map((format) => (
                                <Button
                                    key={format}
                                    variant={format === 'excel' ? 'secondary' : 'default'}
                                    onClick={() => handleDownload(format)}
                                    disabled={
                                        isDownloading ||
                                        !selectedMonth ||
                                        !selectedYear ||
                                        !selectedOrganization
                                    }
                                    className="flex items-center gap-2"
                                >
                                    {downloadingFormat === format ? (
                                        <>
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                            <span>
                                                Downloading... {downloadProgress}%
                                            </span>
                                        </>
                                    ) : format === 'excel' ? (
                                        <>
                                            <FileSpreadsheet className="h-4 w-4" />
                                            <span>Download Excel</span>
                                        </>
                                    ) : (
                                        <>
                                            <Download className="h-4 w-4" />
                                            <span>
                                                Download{' '}
                                                {includeCover ? 'ZIP' : 'PDF'}
                                            </span>
                                        </>
                                    )}
                                </Button>
                            ))}
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* Monthly Report Modal */}
                <Dialog
                    open={showMonthlyReportModal}
                    onOpenChange={setShowMonthlyReportModal}
                >
                    <DialogContent className="sm:max-w-2xl">
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                                <ChartColumnIncreasing className="h-5 w-5" />
                                Monthly Report
                            </DialogTitle>
                            <DialogDescription>
                                Generate and download monthly Excel or PDF
                                report
                            </DialogDescription>
                        </DialogHeader>

                        <div className="space-y-6">
                            {/* Month and Year Selection */}
                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label className="text-base font-medium">
                                        Month
                                    </Label>
                                    <Select
                                        value={selectedMonthForReport.toString()}
                                        onValueChange={(value) =>
                                            setSelectedMonthForReport(
                                                Number(value),
                                            )
                                        }
                                    >
                                        <SelectTrigger className="h-12">
                                            <SelectValue placeholder="Select month" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {months.map((month) => (
                                                <SelectItem
                                                    key={month}
                                                    value={month.toString()}
                                                >
                                                    {new Date(
                                                        0,
                                                        month - 1,
                                                    ).toLocaleString(
                                                        'default',
                                                        { month: 'long' },
                                                    )}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-base font-medium">
                                        Year
                                    </Label>
                                    <Select
                                        value={selectedYearForReport.toString()}
                                        onValueChange={(value) =>
                                            setSelectedYearForReport(
                                                Number(value),
                                            )
                                        }
                                    >
                                        <SelectTrigger className="h-12">
                                            <SelectValue placeholder="Select year" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {years.map((year) => (
                                                <SelectItem
                                                    key={year}
                                                    value={year.toString()}
                                                >
                                                    {year}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            {/* Report Info */}
                            <div className="rounded-lg bg-muted/30 p-4 text-center text-sm text-muted-foreground">
                                <p>
                                    Period:{' '}
                                    <span className="font-medium">
                                        {new Date(
                                            0,
                                            selectedMonthForReport - 1,
                                        ).toLocaleString('default', {
                                            month: 'long',
                                        })}{' '}
                                        {selectedYearForReport}
                                    </span>
                                </p>
                                <p className="mt-1">
                                    Format:{' '}
                                    <span className="font-medium">
                                        Excel (.xlsx) / PDF (.pdf)
                                    </span>
                                </p>
                            </div>

                            {/* Progress Bar */}
                            {isReportDownloading && (
                                <div className="space-y-2">
                                    <div className="flex justify-between text-sm text-muted-foreground">
                                        <span>{activeReportLabel}</span>
                                        <span>{activeReportProgress}%</span>
                                    </div>
                                    <div className="h-2 w-full rounded-full bg-muted">
                                        <div
                                            className="h-2 rounded-full bg-primary transition-all duration-300"
                                            style={{
                                                width: `${activeReportProgress}%`,
                                            }}
                                        ></div>
                                    </div>
                                </div>
                            )}
                        </div>

                        <DialogFooter className="flex gap-2">
                            <Button
                                variant="outline"
                                onClick={() => setShowMonthlyReportModal(false)}
                                disabled={isReportDownloading}
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={handleMonthlyReportDownload}
                                disabled={
                                    isReportDownloading ||
                                    !selectedMonthForReport ||
                                    !selectedYearForReport
                                }
                                className="flex items-center gap-2"
                            >
                                {isDownloadingReport ? (
                                    <>
                                        <div className="h-4 w-4 animate-spin rounded-full border-b-2 border-white"></div>
                                        <span>
                                            Generating...{' '}
                                            {downloadReportProgress}%
                                        </span>
                                    </>
                                ) : (
                                    <>
                                        <Download className="h-4 w-4" />
                                        <span>Download Excel Report</span>
                                    </>
                                )}
                            </Button>

                            <Button
                                variant="warningOutline"
                                onClick={handleMonthlyReportPdfDownload}
                                disabled={
                                    isReportDownloading ||
                                    !selectedMonthForReport ||
                                    !selectedYearForReport
                                }
                                className="flex items-center gap-2"
                            >
                                {isDownloadingMonthlyPdf ? (
                                    <>
                                        <div className="h-4 w-4 animate-spin rounded-full border-b-2 border-white"></div>
                                        <span>
                                            Generating...{' '}
                                            {downloadMonthlyPdfProgress}%
                                        </span>
                                    </>
                                ) : (
                                    <>
                                        <Download className="h-4 w-4" />
                                        <span>Download Monthly Summary</span>
                                    </>
                                )}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </AppLayout>
    );
}
