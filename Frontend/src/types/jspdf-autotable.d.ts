declare module 'jspdf-autotable' {
    import { jsPDF as jsPDFType } from 'jspdf';

    interface UserOptions {
        startY?: number;
        margin?: number | { top?: number; right?: number; bottom?: number; left?: number };
        head?: any[][];
        body?: any[][];
        foot?: any[][];
        theme?: string;
        styles?: {
            fontSize?: number;
            cellPadding?: number;
            lineColor?: number[];
            lineWidth?: number;
            font?: string;
            textColor?: number[];
            halign?: 'left' | 'center' | 'right';
            valign?: 'top' | 'middle' | 'bottom';
            fillColor?: number[];
            textColor?: number[];
            fontStyle?: 'normal' | 'bold' | 'italic' | 'bolditalic';
            overflow?: 'linebreak' | 'ellipsize' | 'visible' | 'hidden';
            cellWidth?: 'auto' | 'wrap' | number;
            minCellHeight?: number;
            halign?: 'left' | 'center' | 'right';
            valign?: 'top' | 'middle' | 'bottom';
        };
        headStyles?: {
            fillColor?: number[];
            textColor?: number[];
            fontStyle?: 'normal' | 'bold' | 'italic' | 'bolditalic';
            halign?: 'left' | 'center' | 'right';
            valign?: 'top' | 'middle' | 'bottom';
        };
        bodyStyles?: {
            fillColor?: number[];
            textColor?: number[];
            fontStyle?: 'normal' | 'bold' | 'italic' | 'bolditalic';
            halign?: 'left' | 'center' | 'right';
            valign?: 'top' | 'middle' | 'bottom';
        };
        footStyles?: {
            fillColor?: number[];
            textColor?: number[];
            fontStyle?: 'normal' | 'bold' | 'italic' | 'bolditalic';
            halign?: 'left' | 'center' | 'right';
            valign?: 'top' | 'middle' | 'bottom';
        };
        alternateRowStyles?: {
            fillColor?: number[];
            textColor?: number[];
            fontStyle?: 'normal' | 'bold' | 'italic' | 'bolditalic';
        };
        columnStyles?: {
            [key: string]: {
                cellWidth?: number | 'auto' | 'wrap';
                fillColor?: number[];
                textColor?: number[];
                fontStyle?: 'normal' | 'bold' | 'italic' | 'bolditalic';
                halign?: 'left' | 'center' | 'right';
                valign?: 'top' | 'middle' | 'bottom';
            };
        };
        didDrawPage?: (data: any) => void;
        willDrawCell?: (data: any) => void;
        didDrawCell?: (data: any) => void;
        didParseCell?: (data: any) => void;
    }

    function autoTable(doc: any, options?: UserOptions): any;
    export = autoTable;
} 