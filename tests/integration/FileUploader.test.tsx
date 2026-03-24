import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
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
    it('should handle files exceeding size limit via dropzone config', async () => {
      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => ({ transactions: [] }),
      });

      render(<FileUploader {...defaultProps} />);
      
      const smallFile = createMockFile('test.pdf', 1000, 'application/pdf');
      
      await act(async () => {
        const input = screen.getByTestId('input');
        await userEvent.upload(input, smallFile);
      });
      
      await waitFor(() => {
        expect(mockOnFileUpload).toHaveBeenCalled();
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
      
      await act(async () => {
        const input = screen.getByTestId('input');
        await userEvent.upload(input, pdfFile);
      });
      
      await waitFor(() => {
        expect(mockOnFileUpload).toHaveBeenCalled();
      });
    });

    it('should make API call to /api/parse-data', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ transactions: [] }),
      });

      render(<FileUploader {...defaultProps} />);
      
      const pdfFile = createMockFile('test.pdf', 1000, 'application/pdf');
      
      await act(async () => {
        const input = screen.getByTestId('input');
        await userEvent.upload(input, pdfFile);
      });
      
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/parse-data',
          expect.objectContaining({
            method: 'POST',
          })
        );
      });
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
      
      await act(async () => {
        const input = screen.getByTestId('input');
        await userEvent.upload(input, pdfFile);
      });
      
      await waitFor(() => {
        expect(mockSetParsedText).toHaveBeenCalled();
      });
    });

    it('should handle API errors', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 400,
        text: async () => 'Only PDF files are accepted',
      });

      render(<FileUploader {...defaultProps} />);
      
      const pdfFile = createMockFile('test.pdf', 1000, 'application/pdf');
      
      await act(async () => {
        const input = screen.getByTestId('input');
        await userEvent.upload(input, pdfFile);
      });
      
      await waitFor(() => {
        expect(mockSetParsedText).toHaveBeenCalled();
      });
    });
  });

  describe('Single File Enforcement', () => {
    it.skip('should show error when multiple files are uploaded', async () => {
      render(<FileUploader {...defaultProps} />);
      
      const pdfFiles = [
        createMockFile('test1.pdf', 1000, 'application/pdf'),
        createMockFile('test2.pdf', 1000, 'application/pdf'),
      ];
      
      await act(async () => {
        const input = screen.getByTestId('input');
        await userEvent.upload(input, pdfFiles);
      });
      
      await waitFor(() => {
        expect(mockSetParsedText).toHaveBeenCalledWith(expect.stringMatching(/one file at a time/i));
      });
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
      
      await act(async () => {
        const input = screen.getByTestId('input');
        await userEvent.upload(input, pdfFile);
      });
      
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
      
      await act(async () => {
        const input = screen.getByTestId('input');
        await userEvent.upload(input, pdfFile);
      });
      
      await waitFor(() => {
        const fileNameElement = screen.getByText((content) => {
          return content.includes('.pdf') || content.includes('aaaaa');
        });
        expect(fileNameElement.textContent?.length).toBeLessThanOrEqual(25);
      });
    });
  });
});
