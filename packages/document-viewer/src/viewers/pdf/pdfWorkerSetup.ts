import { pdfjs } from 'react-pdf';

// Stable PDF.js worker setup using matching version CDN worker
pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

export { pdfjs };
