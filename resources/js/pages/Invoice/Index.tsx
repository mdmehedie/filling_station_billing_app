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
import { Download, FileText, Calendar, Building, CheckCircle, Eye, Loader2, ChartColumnIncreasing } from "lucide-react";
import OrganizationSelector from "@/components/OrganizationSelector";
import { Organization, Invoice, PaginatedResponse } from "@/types/response";
import { DataTableWrapper } from "@/components/data-table-wrapper";
import { Column } from "@/components/data-table";
import { currenyFormat } from "@/lib/utils";

interface IndexProps {
    months: number[];
    years: number[];
    organizations: Organization[];
    invoices: PaginatedResponse<Invoice>;
}

export default function Index({ months, years, organizations, invoices }: IndexProps) {
    const [searchTerm, setSearchTerm] = useState('');
    const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const [selectedMonth, setSelectedMonth] = useState<number>(months[0] || 0);
    const [selectedYear, setSelectedYear] = useState<number>(years[0] || 0);
    const [selectedOrganization, setSelectedOrganization] = useState<Organization | null>(null);
    const [includeCover, setIncludeCover] = useState<boolean>(false);
    const [isDownloading, setIsDownloading] = useState<boolean>(false);
    const [downloadProgress, setDownloadProgress] = useState<number>(0);
    const [showGenerateModal, setShowGenerateModal] = useState<boolean>(false);

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

    const handleDownload = async () => {
        setIsDownloading(true);
        setDownloadProgress(0);

        try {
            if (!selectedOrganization) {
                alert('Please select an organization');
                return;
            }

            const resp = await axios.post(`/api/invoices/${selectedOrganization.id}/export`, { 
                month: selectedMonth, 
                year: selectedYear,
                include_cover: includeCover 
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

            // Extract filename from Content-Disposition
            const cd = resp.headers['content-disposition'] || '';
            const match = cd.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]+)/i);
            const filename = match ? decodeURIComponent(match[1].replace(/['"]/g, '')) : 
                `${includeCover ? 'invoice-with-cover' : 'invoice'}-${selectedMonth}-${selectedYear}.${includeCover ? 'zip' : 'pdf'}`;

            const blobUrl = URL.createObjectURL(new Blob([resp.data], { 
                type: includeCover ? 'application/zip' : 'application/pdf' 
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
                alert('No invoice found for the selected month and organization.');
            }
        } finally {
            setIsDownloading(false);
            setDownloadProgress(0);
            // clear the form
            setSelectedOrganization(null);
            setSelectedMonth(months[0] || 0);
            setSelectedYear(years[0] || 0);
            setIncludeCover(false);
        }
    }

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

    const handleRowDownload = async (invoice: Invoice) => {

        try {
            setIsDownloading(true);
            setDownloadProgress(0);
       
            const resp = await axios.post(`/api/invoices/${invoice.organization.id}/export`, { 
                month: new Date(`${invoice.month} 1, ${invoice.year}`).getMonth() + 1, 
                year: +invoice.year,
                include_cover: true 
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

            // Extract filename from Content-Disposition
            const cd = resp.headers['content-disposition'] || '';
            const match = cd.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]+)/i);
            const filename = match ? decodeURIComponent(match[1].replace(/['"]/g, '')) : 
                `${includeCover ? 'invoice-with-cover' : 'invoice'}-${selectedMonth}-${selectedYear}.${includeCover ? 'zip' : 'pdf'}`;

            const blobUrl = URL.createObjectURL(new Blob([resp.data], { 
                type: includeCover ? 'application/zip' : 'application/pdf' 
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
                alert('No invoice found for the selected month and organization.');
            }
        } finally {
            setIsDownloading(false);
            setDownloadProgress(0);
            // clear the form
            setSelectedOrganization(null);
            setSelectedMonth(months[0] || 0);
            setSelectedYear(years[0] || 0);
            setIncludeCover(false);
        }
    }

    // monthly report modal
    const [showMonthlyReportModal, setShowMonthlyReportModal] = useState<boolean>(false);
    const [selectedMonthForReport, setSelectedMonthForReport] = useState<number>(months[0] || 0);
    const [selectedYearForReport, setSelectedYearForReport] = useState<number>(years[0] || 0);
    const [isDownloadingReport, setIsDownloadingReport] = useState<boolean>(false);
    const [downloadReportProgress, setDownloadReportProgress] = useState<number>(0);

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
                alert('No data found for the selected month, year and organization.');
            } else {
                alert('An error occurred while downloading the report.');
            }
        } finally {
            setIsDownloadingReport(false);
            setDownloadReportProgress(0);
            // clear the form
            setSelectedMonthForReport(months[0] || 0);
            setSelectedYearForReport(years[0] || 0);
        }
    }

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
                        onClick={() => handleRowDownload(row)}
                        className="flex items-center gap-1"
                        disabled={isDownloading}
                    >
                        {isDownloading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Download className="h-3 w-3" />}
                        PDF
                    </Button>
                </div>
            )
        }
    ], []);
    
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Download Invoice" />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                {/* Header Section */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Invoice Management</h1>
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
                <Dialog open={showGenerateModal} onOpenChange={setShowGenerateModal}>
                    <DialogContent className="sm:max-w-2xl">
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                                <Calendar className="h-5 w-5" />
                                Generate New Invoice
                            </DialogTitle>
                            <DialogDescription>
                                Choose the month and year for your invoice download
                            </DialogDescription>
                        </DialogHeader>
                        
                        <div className="space-y-6">
                            {/* Organization Selection */}
                            <div className="space-y-2">
                                <Label className="text-base font-medium">Organization</Label>
                                <OrganizationSelector
                                    organizations={organizations}
                                    selectedOrganization={selectedOrganization}
                                    onOrganizationSelect={setSelectedOrganization}
                                    placeholder="Select organization..."
                                />
                            </div>

                            {/* Month and Year Selection */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label className="text-base font-medium">Month</Label>
                                    <Select
                                        value={selectedMonth.toString()}
                                        onValueChange={(value) => setSelectedMonth(Number(value))}
                                    >
                                        <SelectTrigger className="h-12">
                                            <SelectValue placeholder="Select month" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {months.map((month) => (
                                                <SelectItem key={month} value={month.toString()}>
                                                    {new Date(0, month - 1).toLocaleString("default", { month: "long" })}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-base font-medium">Year</Label>
                                    <Select
                                        value={selectedYear.toString()}
                                        onValueChange={(value) => setSelectedYear(Number(value))}
                                    >
                                        <SelectTrigger className="h-12">
                                            <SelectValue placeholder="Select year" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {years.map((year) => (
                                                <SelectItem key={year} value={year.toString()}>
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
                                        onCheckedChange={(checked) => setIncludeCover(checked as boolean)}
                                    />
                                    <Label htmlFor="include-cover" className="text-sm font-medium cursor-pointer">
                                        Include cover page
                                    </Label>
                                </div>
                                <div className="text-xs text-muted-foreground bg-muted/50 p-3 rounded-lg">
                                    <div className="flex items-start gap-2">
                                        <Building className="h-4 w-4 mt-0.5 text-blue-600" />
                                        <div>
                                            <p className="font-medium text-blue-600">Cover Page Option</p>
                                            <p className="mt-1">
                                                {includeCover 
                                                    ? "Download will include a cover page and be packaged as a ZIP file"
                                                    : "Download will be a single PDF file without cover page"
                                                }
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Download Info */}
                            <div className="text-center text-sm text-muted-foreground bg-muted/30 p-4 rounded-lg">
                                <p>
                                    Organization: <span className="font-medium">
                                        {selectedOrganization ? selectedOrganization.name : 'Not selected'}
                                    </span>
                                </p>
                                <p>
                                    Period: <span className="font-medium">
                                        {new Date(0, selectedMonth - 1).toLocaleString("default", { month: "long" })} {selectedYear}
                                    </span>
                                </p>
                                <p className="mt-1">
                                    Format: <span className="font-medium">
                                        {includeCover ? 'ZIP (with cover)' : 'PDF (standard)'}
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
                                    <div className="w-full bg-muted rounded-full h-2">
                                        <div 
                                            className="bg-primary h-2 rounded-full transition-all duration-300"
                                            style={{ width: `${downloadProgress}%` }}
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
                            <Button
                                onClick={handleDownload}
                                disabled={isDownloading || !selectedMonth || !selectedYear || !selectedOrganization}
                                className="flex items-center gap-2"
                            >
                                {isDownloading ? (
                                    <>
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                        <span>Downloading... {downloadProgress}%</span>
                                    </>
                                ) : (
                                    <>
                                        <Download className="h-4 w-4" />
                                        <span>
                                            Download {includeCover ? 'ZIP' : 'PDF'} Invoice
                                        </span>
                                    </>
                                )}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* Monthly Report Modal */}
                <Dialog open={showMonthlyReportModal} onOpenChange={setShowMonthlyReportModal}>
                    <DialogContent className="sm:max-w-2xl">
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                                <ChartColumnIncreasing className="h-5 w-5" />
                                Monthly Report
                            </DialogTitle>
                            <DialogDescription>
                                Generate and download monthly Excel report
                            </DialogDescription>
                        </DialogHeader>
                        
                        <div className="space-y-6">
                            {/* Month and Year Selection */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label className="text-base font-medium">Month</Label>
                                    <Select
                                        value={selectedMonthForReport.toString()}
                                        onValueChange={(value) => setSelectedMonthForReport(Number(value))}
                                    >
                                        <SelectTrigger className="h-12">
                                            <SelectValue placeholder="Select month" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {months.map((month) => (
                                                <SelectItem key={month} value={month.toString()}>
                                                    {new Date(0, month - 1).toLocaleString("default", { month: "long" })}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-base font-medium">Year</Label>
                                    <Select
                                        value={selectedYearForReport.toString()}
                                        onValueChange={(value) => setSelectedYearForReport(Number(value))}
                                    >
                                        <SelectTrigger className="h-12">
                                            <SelectValue placeholder="Select year" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {years.map((year) => (
                                                <SelectItem key={year} value={year.toString()}>
                                                    {year}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            {/* Report Info */}
                            <div className="text-center text-sm text-muted-foreground bg-muted/30 p-4 rounded-lg">
                                <p>
                                    Period: <span className="font-medium">
                                        {new Date(0, selectedMonthForReport - 1).toLocaleString("default", { month: "long" })} {selectedYearForReport}
                                    </span>
                                </p>
                                <p className="mt-1">
                                    Format: <span className="font-medium">Excel (.xlsx)</span>
                                </p>
                            </div>

                            {/* Progress Bar */}
                            {isDownloadingReport && (
                                <div className="space-y-2">
                                    <div className="flex justify-between text-sm text-muted-foreground">
                                        <span>Generating report...</span>
                                        <span>{downloadReportProgress}%</span>
                                    </div>
                                    <div className="w-full bg-muted rounded-full h-2">
                                        <div 
                                            className="bg-primary h-2 rounded-full transition-all duration-300"
                                            style={{ width: `${downloadReportProgress}%` }}
                                        ></div>
                                    </div>
                                </div>
                            )}
                        </div>

                        <DialogFooter className="flex gap-2">
                            <Button
                                variant="outline"
                                onClick={() => setShowMonthlyReportModal(false)}
                                disabled={isDownloadingReport}
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={handleMonthlyReportDownload}
                                disabled={isDownloadingReport || !selectedMonthForReport || !selectedYearForReport}
                                className="flex items-center gap-2"
                            >
                                {isDownloadingReport ? (
                                    <>
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                        <span>Generating... {downloadReportProgress}%</span>
                                    </>
                                ) : (
                                    <>
                                        <Download className="h-4 w-4" />
                                        <span>Download Excel Report</span>
                                    </>
                                )}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </AppLayout>
    )
} 