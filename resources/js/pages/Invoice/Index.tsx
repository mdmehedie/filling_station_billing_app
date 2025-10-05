import AppLayout from "@/layouts/app-layout";
import { Head, router } from "@inertiajs/react";
import { BreadcrumbItem } from "@/types";
import { dashboard } from "@/routes";
import invoices from "@/routes/invoices";
import axios from "axios";
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Download, FileText, Calendar, Building, CheckCircle } from "lucide-react";
import OrganizationSelector from "@/components/OrganizationSelector";
import { Organization } from "@/types/response";

export default function Index({ months, years, organizations }: { months: number[], years: number[], organizations: Organization[] }) {
    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: 'Dashboard',
            href: dashboard().url,
        },
        {
            title: 'Download Invoice',
            href: invoices.index().url,
        },
    ];
    const [selectedMonth, setSelectedMonth] = useState<number>(months[0] || 0);
    const [selectedYear, setSelectedYear] = useState<number>(years[0] || 0);
    const [selectedOrganization, setSelectedOrganization] = useState<Organization | null>(null);
    const [includeCover, setIncludeCover] = useState<boolean>(false);
    const [isDownloading, setIsDownloading] = useState<boolean>(false);
    const [downloadProgress, setDownloadProgress] = useState<number>(0);

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
            console.error('Download failed:', error);
            alert('Download failed. Please try again.');
        } finally {
            setIsDownloading(false);
            setDownloadProgress(0);
        }
    }
    
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Download Invoice" />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                {/* Header Section */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Download Invoice</h1>
                        <p className="text-muted-foreground">
                            Generate and download invoices for specific months
                        </p>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <FileText className="h-4 w-4" />
                        <span>Invoice Generator</span>
                    </div>
                </div>

                {/* Main Content */}
                <div className="max-w-2xl mx-auto space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Calendar className="h-5 w-5" />
                                Select Period
                            </CardTitle>
                            <CardDescription>
                                Choose the month and year for your invoice download
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
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

                            {/* Download Button */}
                            <div className="space-y-4">
                                <Button
                                    onClick={handleDownload}
                                    disabled={isDownloading || !selectedMonth || !selectedYear || !selectedOrganization}
                                    className="w-full h-12 text-base"
                                >
                                    {isDownloading ? (
                                        <div className="flex items-center gap-2">
                                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                            <span>Downloading... {downloadProgress}%</span>
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-2">
                                            <Download className="h-4 w-4" />
                                            <span>
                                                Download {includeCover ? 'ZIP' : 'PDF'} Invoice
                                            </span>
                                        </div>
                                    )}
                                </Button>

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

                                {/* Download Info */}
                                <div className="text-center text-sm text-muted-foreground">
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
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AppLayout>
    )
} 