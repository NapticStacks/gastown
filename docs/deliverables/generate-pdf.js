#!/usr/bin/env node

/**
 * PDF Generation for Mayday Security Agentic Systems Brief
 *
 * Usage: node generate-pdf.js
 * Output: SECURITY-AGENTIC-SYSTEMS-BRIEF.pdf
 *
 * Follows Mayday PDF generation standards with Puppeteer
 */

const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

const files = [
    {
        input: path.join(__dirname, 'SECURITY-AGENTIC-SYSTEMS-BRIEF.html'),
        output: path.join(__dirname, 'SECURITY-AGENTIC-SYSTEMS-BRIEF.pdf'),
        title: 'Mayday Cybersecurity - Security Agentic Systems Brief'
    }
];

const printCSS = `
@media print {
    * {
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
    }
    nav { display: none !important; }
    .cover {
        page-break-after: always;
        page-break-inside: avoid;
    }
    section {
        page-break-inside: avoid;
        orphans: 3;
        widows: 3;
    }
    .card, .stat, .grid, .highlight, .key-insight, table {
        page-break-inside: avoid;
    }
    a { color: inherit; text-decoration: none; }
}
`;

async function generatePDFs() {
    let browser;
    try {
        console.log('Starting PDF generation...\n');

        browser = await puppeteer.launch({
            headless: 'new',
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });

        for (const file of files) {
            if (!fs.existsSync(file.input)) {
                console.log(`Skip (not found): ${path.basename(file.input)}`);
                continue;
            }

            console.log(`Converting: ${path.basename(file.input)}`);

            const page = await browser.newPage();
            await page.setViewport({ width: 1280, height: 720 });
            await page.goto(`file://${file.input}`, {
                waitUntil: 'networkidle0',
                timeout: 30000
            });
            await page.addStyleTag({ content: printCSS });

            await page.pdf({
                path: file.output,
                format: 'Letter',
                printBackground: true,
                margin: {
                    top: '0.5in',
                    right: '0.5in',
                    bottom: '0.5in',
                    left: '0.5in'
                },
                displayHeaderFooter: true,
                footerTemplate: `
                    <div style="width: 100%; font-size: 9px; padding: 0 48px; text-align: center; color: #6D6E71;">
                        <span>${file.title} | Page <span class="pageNumber"></span> of <span class="totalPages"></span></span>
                    </div>
                `
            });

            const fileSizeKB = (fs.statSync(file.output).size / 1024).toFixed(1);
            console.log(`  Created: ${path.basename(file.output)} (${fileSizeKB} KB)\n`);
            await page.close();
        }

        console.log('PDF generation complete.');
        return 0;

    } catch (err) {
        console.error('Error:', err.message);
        return 1;
    } finally {
        if (browser) {
            await browser.close();
        }
    }
}

generatePDFs().then(code => process.exit(code));
