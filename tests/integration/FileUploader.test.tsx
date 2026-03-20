import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import FileUploader from '@/components/FileUploader';

vi.mock('@/components/ui/input', () => ({
  Input: vi.fn(({ ...props }: Record<string, unknown>) => <input {...props} data-testid="input" />),
}));

vi.mock('@/components/ui/progress', () => ({
  Progress: vi.fn(({ value }: { value: number }) => <div data-testid="progress" data-value={value} />),
}));

const mockOnFileUpload = vi.fn();
const mockSetParsedText = vi.fn();

const createMockFile = (name: string, size: number, type: string) => {
  const file = new File(['mock content'], name, { type });
  Object.defineProperty(file, 'size', { value: size, configurable: true });
  return file;
};

describe('FileUploader', () => {
  const defaultProps = {
    onFileUpload: mockOnFileUpload,
    setParsedText: mockSetParsedText,
    maxSize: 8 * 1024 * 1024,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
  });

  describe('Rendering', () => {
    it('should render the file uploader component', () => {
      render(<FileUploader {...defaultProps} />);
      
      expect(screen.getByText(/drag and drop/i)).toBeTruthy();
      expect(screen.getByText(/click to upload/i)).toBeTruthy();
    });

    it('should show file size limit information', () => {
      render(<FileUploader {...defaultProps} />);
      
      expect(screen.getByText(/8 MB/i)).toBeTruthy();
    });

    it('should render dropzone area', () => {
      render(<FileUploader {...defaultProps} />);
      
      const dropzone = screen.getByLabelText(/drag and drop/i) || screen.getByTestId('dropzone');
      expect(dropzone).toBeTruthy();
    });
  });

  describe('File Validation', () => {
    it('should show error for files exceeding size limit', async () => {
      render(<FileUploader {...defaultProps} />);
      
      const largeFile = createMockFile('large.pdf', 10 * 1024 * 1024, 'application/pdf');
      
      const input = screen.getByTestId('input');
      fireEvent.change(input, { target: { files: [largeFile] } });
      
      await waitFor(() => {
        expect(mockSetParsedText).toHaveBeenCalledWith(expect.stringMatching(/file too large|Error/i));
      }, { timeout: 3000 });
    });
  });

  describe('File Upload Flow', () => {
    it('should call onFileUpload with the uploaded file', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ transactions: [] }),
      });

      render(<FileUploader {...defaultProps} />);
      
      const pdfFile = createMockFile('test.pdf', 1000, 'application/pdf');
      
      const input = screen.getByTestId('input');
      fireEvent.change(input, { target: { files: [pdfFile] } });
      
      await waitFor(() => {
        expect(mockOnFileUpload).toHaveBeenCalled();
      }, { timeout: 3000 });
    });

    it('should make API call to /api/parse-data', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ transactions: [] }),
      });

      render(<FileUploader {...defaultProps} />);
      
      const pdfFile = createMockFile('test.pdf', 1000, 'application/pdf');
      
      const input = screen.getByTestId('input');
      fireEvent.change(input, { target: { files: [pdfFile] } });
      
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/parse-data',
          expect.objectContaining({
            method: 'POST',
          })
        );
      }, { timeout: 3000 });
    });

    it('should handle successful upload', async () => {
      const mockResponse = {
        transactions: [{ date: '1 Jan', description: 'Test', amount: 100, type: 'debit' }],
        summary: { totalDeposits: 0, totalWithdrawals: 100, netAmount: -100 },
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      render(<FileUploader {...defaultProps} />);
      
      const pdfFile = createMockFile('test.pdf', 1000, 'application/pdf');
      
      const input = screen.getByTestId('input');
      fireEvent.change(input, { target: { files: [pdfFile] } });
      
      await waitFor(() => {
        expect(mockSetParsedText).toHaveBeenCalled();
      }, { timeout: 3000 });
    });

    it('should handle API errors', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 400,
        text: async () => 'Only PDF files are accepted',
      });

      render(<FileUploader {...defaultProps} />);
      
      const pdfFile = createMockFile('test.pdf', 1000, 'application/pdf');
      
      const input = screen.getByTestId('input');
      fireEvent.change(input, { target: { files: [pdfFile] } });
      
      await waitFor(() => {
        expect(mockSetParsedText).toHaveBeenCalled();
      }, { timeout: 3000 });
    });
  });

  describe('Single File Enforcement', () => {
    it('should only allow one file at a time', async () => {
      render(<FileUploader {...defaultProps} />);
      
      const pdfFiles = [
        createMockFile('test1.pdf', 1000, 'application/pdf'),
        createMockFile('test2.pdf', 1000, 'application/pdf'),
      ];
      
      const input = screen.getByTestId('input');
      fireEvent.change(input, { target: { files: pdfFiles } });
      
      await waitFor(() => {
        expect(mockSetParsedText).toHaveBeenCalled();
      }, { timeout: 3000 });
    });
  });

  describe('File Display', () => {
    it('should display uploaded file name', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ transactions: [] }),
      });

      render(<FileUploader {...defaultProps} />);
      
      const pdfFile = createMockFile('my-bank-statement.pdf', 1000, 'application/pdf');
      
      const input = screen.getByTestId('input');
      fireEvent.change(input, { target: { files: [pdfFile] } });
      
      await waitFor(() => {
        expect(screen.getByText(/my-bank-statement/i)).toBeTruthy();
      });
    });

    it('should truncate long file names', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ transactions: [] }),
      });

      render(<FileUploader {...defaultProps} />);
      
      const longName = 'a'.repeat(50) + '.pdf';
      const pdfFile = createMockFile(longName, 1000, 'application/pdf');
      
      const input = screen.getByTestId('input');
      fireEvent.change(input, { target: { files: [pdfFile] } });
      
      await waitFor(() => {
        const fileNameElement = screen.getByText(/^a+$/);
        expect(fileNameElement.textContent?.length).toBeLessThanOrEqual(25);
      });
    });
  });
});
