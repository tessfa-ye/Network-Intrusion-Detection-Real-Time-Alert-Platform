export function exportToCSV<T extends Record<string, any>>(
    data: T[],
    filename: string,
    headers: string[],
    keys: (keyof T)[]
) {
    if (data.length === 0) {
        alert('No data to export');
        return;
    }

    const csvHeaders = headers.map(escapeCSVField).join(',');
    const csvRows = data.map(item => {
        return keys.map(key => {
            let value: any = item[key];
            if (value && typeof value === 'object' && 'toLocaleString' in value) {
                value = (value as Date).toLocaleString();
            } else if (value == null) {
                value = '';
            } else {
                value = String(value);
            }
            return escapeCSVField(value);
        }).join(',');
    });

    const csvContent = [csvHeaders, ...csvRows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

function escapeCSVField(field: string): string {
    if (field.includes(',') || field.includes('\n') || field.includes('"')) {
        return `"${field.replace(/"/g, '""')}"`;
    }
    return field;
}

export function generateFilename(prefix: string): string {
    const now = new Date();
    const timestamp = now.toISOString().replace(/[:.]/g, '-').slice(0, -5);
    return `${prefix}_${timestamp}`;
}

function removeEmojis(text: string): string {
    return text.replace(/[\u{1F000}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu, '').trim();
}

export function exportToPDF<T extends Record<string, any>>(
    data: T[],
    filename: string,
    title: string,
    headers: string[],
    keys: (keyof T)[]
) {
    if (data.length === 0) {
        alert('No data to export');
        return;
    }

    import('jspdf').then(({ default: jsPDF }) => {
        const doc = new jsPDF();

        doc.setFontSize(18);
        doc.setFont('helvetica', 'bold');
        doc.text(title, 105, 15, { align: 'center' } as any);

        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text(`Exported: ${new Date().toLocaleString()}`, 105, 23, { align: 'center' } as any);

        let startY = 35;
        const rowHeight = 8;
        const colWidth = 190 / headers.length;
        const startX = 10;

        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        doc.setFillColor(59, 130, 246);
        doc.rect(startX, startY, 190, rowHeight, 'F');

        doc.setTextColor(255, 255, 255);
        headers.forEach((header, i) => {
            doc.text(removeEmojis(header), startX + (i * colWidth) + 2, startY + 5.5, { maxWidth: colWidth - 4 });
        });

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        startY += rowHeight;

        data.forEach((item, rowIndex) => {
            if (rowIndex % 2 === 0) {
                doc.setFillColor(245, 245, 245);
                doc.rect(startX, startY, 190, rowHeight, 'F');
            }

            doc.setTextColor(0, 0, 0);

            keys.forEach((key, colIndex) => {
                const value = item[key];
                let text = '';
                if (value && typeof value === 'object' && 'toLocaleString' in value) {
                    text = (value as Date).toLocaleString();
                } else if (value == null) {
                    text = '';
                } else if (typeof value === 'boolean') {
                    text = value ? 'Yes' : 'No';
                } else {
                    text = String(value);
                }

                text = removeEmojis(text);
                doc.text(text, startX + (colIndex * colWidth) + 2, startY + 5.5, { maxWidth: colWidth - 4 });
            });

            startY += rowHeight;

            if (startY > 270) {
                doc.addPage();
                startY = 15;
            }
        });

        doc.save(`${filename}.pdf`);
    }).catch(error => {
        console.error('PDF export error:', error);
        alert('Failed to export PDF');
    });
}

export function exportToDOC<T extends Record<string, any>>(
    data: T[],
    filename: string,
    title: string,
    headers: string[],
    keys: (keyof T)[]
) {
    if (data.length === 0) {
        alert('No data to export');
        return;
    }

    Promise.all([import('docx'), import('file-saver')]).then(([docx, FileSaver]) => {
        const { Document, Paragraph, Table, TableCell, TableRow, WidthType, AlignmentType, TextRun } = docx;

        const headerRow = new TableRow({
            children: headers.map(header =>
                new TableCell({
                    children: [new Paragraph({
                        children: [new TextRun({ text: header, bold: true })],
                        alignment: AlignmentType.CENTER
                    })],
                    shading: { fill: '3B82F6' },
                })
            ),
        });

        const dataRows = data.map(item =>
            new TableRow({
                children: keys.map(key => {
                    const value = item[key];
                    let text = '';
                    if (value && typeof value === 'object' && 'toLocaleString' in value) {
                        text = (value as Date).toLocaleString();
                    } else if (value == null) {
                        text = '';
                    } else if (typeof value === 'boolean') {
                        text = value ? 'Yes' : 'No';
                    } else {
                        text = String(value);
                    }

                    return new TableCell({ children: [new Paragraph(text)] });
                })
            })
        );

        const table = new Table({
            rows: [headerRow, ...dataRows],
            width: { size: 100, type: WidthType.PERCENTAGE },
        });

        const doc = new Document({
            sections: [{
                children: [
                    new Paragraph({ text: title, heading: 'Heading1', alignment: AlignmentType.CENTER }),
                    new Paragraph({ text: `Exported: ${new Date().toLocaleString()}`, alignment: AlignmentType.CENTER }),
                    new Paragraph(''),
                    table,
                ],
            }],
        });

        docx.Packer.toBlob(doc).then(blob => {
            FileSaver.saveAs(blob, `${filename}.docx`);
        });
    }).catch(error => {
        console.error('DOC export error:', error);
        alert('Failed to export DOC');
    });
}
