// utils/printUtils.ts

export const handlePrintContent = (contentNode: HTMLElement | null, documentTitle: string) => {
    if (!contentNode) {
        console.error("Print failed: Content node is not available.");
        return;
    }

    const iframe = document.createElement('iframe');
    iframe.style.position = 'absolute';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    iframe.title = `${documentTitle} Print Frame`;
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document;
    if (!doc) {
        console.error("Print failed: Could not access iframe document.");
        document.body.removeChild(iframe);
        return;
    }

    // Prepare styles and links to be injected into the iframe
    const tailwindScript = `<script src="https://cdn.tailwindcss.com"></script>`;
    const interFontLink = `<link rel="stylesheet" href="https://rsms.me/inter/inter.css">`;
    const printStyles = `
        <style>
            @page {
                size: A4;
                margin: 0;
            }
            body {
                font-family: 'Inter', sans-serif;
                -webkit-font-smoothing: antialiased;
                -moz-osx-font-smoothing: grayscale;
                color: #1e293b; /* Replicate dark text for printing */
            }
            /* Add any other essential print-specific styles here */
            .text-brand-secondary { color: #1e293b !important; }
            .text-brand-primary { color: #2563eb !important; }
            .text-slate-800 { color: #1e293b !important; }
            .text-slate-900 { color: #0f172a !important; }
            .text-slate-600 { color: #475569 !important; }
            .text-slate-700 { color: #334155 !important; }
            .text-slate-500 { color: #64748b !important; }
            .bg-slate-50 { background-color: #f8fafc !important; }
            .bg-slate-100 { background-color: #f1f5f9 !important; }
        </style>
    `;

    doc.open();
    doc.write(`
        <html>
            <head>
                <title>${documentTitle}</title>
                ${tailwindScript}
                ${interFontLink}
                ${printStyles}
            </head>
            <body>
                ${contentNode.innerHTML}
            </body>
        </html>
    `);
    doc.close();

    // Wait for content to load before printing
    iframe.onload = () => {
        setTimeout(() => {
            if (iframe.contentWindow) {
                iframe.contentWindow.focus();
                iframe.contentWindow.print();
            }
            // Cleanup the iframe after a delay
            setTimeout(() => {
                if (document.body.contains(iframe)) {
                    document.body.removeChild(iframe);
                }
            }, 1000);
        }, 250); // A short delay to ensure rendering
    };
};
