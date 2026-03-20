global.fetch = global.fetch || vi.fn();

class MockFile extends File {
  constructor(parts: (string | Blob | ArrayBuffer)[], name: string, options?: FilePropertyBag) {
    super(parts, name, options);
  }
}

global.File = MockFile as any;

beforeEach(() => {
  vi.clearAllMocks();
});
