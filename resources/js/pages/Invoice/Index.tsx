import AppLayout from "@/layouts/app-layout";
import { Head, router } from "@inertiajs/react";
import { BreadcrumbItem } from "@/types";
import { dashboard } from "@/routes";
import invoices from "@/routes/invoices";
import axios from "axios";
import { useState } from "react";

export default function Index({ months, years }: { months: number[], years: number[] }) {
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

    const handleDownload = async () => {
        const resp = await axios.post(`/api/invoices/1/export`, { month: selectedMonth, year: selectedYear }, {
            responseType: 'blob',
            withCredentials: true, // important for Sanctum/session
            onDownloadProgress: (e: any) => {
                if (e.total) {
                    const pct = Math.round((e.loaded / e.total) * 100);
                    console.log(`Downloading… ${pct}%`);
                } else {
                    console.log(`Downloading… ${e.loaded} bytes`);
                }
            },
        });

        console.log('Response status:', resp.data); // Debug log
        // console.log('Response data size:', resp.data.size); // Debug log

        // Extract filename from Content-Disposition (fallback if missing)
        const cd = resp.headers['content-disposition'] || '';
        const match = cd.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]+)/i);
        const filename = match ? decodeURIComponent(match[1].replace(/['"]/g, '')) : `report-${1}.pdf`;

        const blobUrl = URL.createObjectURL(new Blob([resp.data], { type: 'application/pdf' }));
        const a = document.createElement('a');
        a.href = blobUrl;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(blobUrl);
    }
    
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Download Invoice" />
            <div>
                <h1 className="text-3xl font-bold underline">
                    Download Invoice Page
                </h1>

                <div>
                    <select className="mr-4" defaultValue="" onChange={(e) => setSelectedMonth(Number(e.target.value))}>
                        {months.map((month) => (
                            <option key={month} value={month}>
                                {new Date(0, month - 1).toLocaleString("default", { month: "long" })}
                            </option>
                        ))}
                    </select>

                    <select className="mr-4" defaultValue="" onChange={(e) => setSelectedYear(Number(e.target.value))}>
                        {years.map((year) => (
                            <option key={year} value={year}>
                                {year}
                            </option>
                        ))}
                    </select>
                </div>

                <button onClick={handleDownload} className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
                    Download Invoice
                </button>
            </div>
        </AppLayout>
    )
} 