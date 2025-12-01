/**
 * Tests for InstallPrompt Component
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { InstallPrompt, InstallBanner } from '@/components/install-prompt';
import * as installPromptHook from '@/hooks/use-install-prompt';

vi.mock('@/hooks/use-install-prompt');

describe('InstallPrompt', () => {
  let localStorageMock: { [key: string]: string };
  let sessionStorageMock: { [key: string]: string };

  beforeEach(() => {
    localStorageMock = {};
    sessionStorageMock = {};

    // Mock localStorage
    global.localStorage = {
      getItem: vi.fn((key) => localStorageMock[key] || null),
      setItem: vi.fn((key, value) => {
        localStorageMock[key] = value;
      }),
      removeItem: vi.fn((key) => {
        delete localStorageMock[key];
      }),
      clear: vi.fn(() => {
        localStorageMock = {};
      }),
      length: 0,
      key: vi.fn(),
    } as any;

    // Mock sessionStorage
    global.sessionStorage = {
      getItem: vi.fn((key) => sessionStorageMock[key] || null),
      setItem: vi.fn((key, value) => {
        sessionStorageMock[key] = value;
      }),
      removeItem: vi.fn((key) => {
        delete sessionStorageMock[key];
      }),
      clear: vi.fn(() => {
        sessionStorageMock = {};
      }),
      length: 0,
      key: vi.fn(),
    } as any;

    // Mock timers
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.useRealTimers();
  });

  describe('Visibility Logic', () => {
    it('should not render if not installable', () => {
      vi.mocked(installPromptHook.useInstallPrompt).mockReturnValue({
        isInstallable: false,
        isInstalled: false,
        promptInstall: vi.fn(),
        dismissPrompt: vi.fn(),
        platform: 'android',
      });

      const { container } = render(<InstallPrompt />);
      expect(container.firstChild).toBeNull();
    });

    it('should not render if already installed', () => {
      vi.mocked(installPromptHook.useInstallPrompt).mockReturnValue({
        isInstallable: true,
        isInstalled: true,
        promptInstall: vi.fn(),
        dismissPrompt: vi.fn(),
        platform: 'android',
      });

      const { container } = render(<InstallPrompt />);
      expect(container.firstChild).toBeNull();
    });

    it('should not render immediately even if installable', () => {
      vi.mocked(installPromptHook.useInstallPrompt).mockReturnValue({
        isInstallable: true,
        isInstalled: false,
        promptInstall: vi.fn(),
        dismissPrompt: vi.fn(),
        platform: 'android',
      });

      const { container } = render(<InstallPrompt />);
      expect(container.firstChild).toBeNull();
    });

    it('should show prompt after 30 seconds', async () => {
      vi.mocked(installPromptHook.useInstallPrompt).mockReturnValue({
        isInstallable: true,
        isInstalled: false,
        promptInstall: vi.fn(),
        dismissPrompt: vi.fn(),
        platform: 'android',
      });

      render(<InstallPrompt />);
      
      // Fast-forward 30 seconds
      vi.advanceTimersByTime(30000);

      await waitFor(() => {
        expect(screen.getByText('Instalar App')).toBeInTheDocument();
      });
    });

    it('should not show if previously dismissed', async () => {
      localStorageMock['pwa-prompt-dismissed'] = Date.now().toString();

      vi.mocked(installPromptHook.useInstallPrompt).mockReturnValue({
        isInstallable: true,
        isInstalled: false,
        promptInstall: vi.fn(),
        dismissPrompt: vi.fn(),
        platform: 'android',
      });

      const { container } = render(<InstallPrompt />);
      
      vi.advanceTimersByTime(30000);

      await waitFor(() => {
        expect(container.firstChild).toBeNull();
      });
    });
  });

  describe('Android/Desktop Prompt', () => {
    beforeEach(() => {
      vi.mocked(installPromptHook.useInstallPrompt).mockReturnValue({
        isInstallable: true,
        isInstalled: false,
        promptInstall: vi.fn().mockResolvedValue(true),
        dismissPrompt: vi.fn(),
        platform: 'android',
      });
    });

    it('should render Android prompt with install button', async () => {
      render(<InstallPrompt />);
      vi.advanceTimersByTime(30000);

      await waitFor(() => {
        expect(screen.getByText('Instalar App')).toBeInTheDocument();
        expect(screen.getByText('Instalar')).toBeInTheDocument();
        expect(screen.getByText('Ahora no')).toBeInTheDocument();
      });
    });

    it('should show app benefits', async () => {
      render(<InstallPrompt />);
      vi.advanceTimersByTime(30000);

      await waitFor(() => {
        expect(screen.getByText(/Acceso desde tu pantalla de inicio/i)).toBeInTheDocument();
        expect(screen.getByText(/Funciona sin conexión a internet/i)).toBeInTheDocument();
        expect(screen.getByText(/Notificaciones push en tiempo real/i)).toBeInTheDocument();
      });
    });

    it('should call promptInstall on install button click', async () => {
      const promptInstall = vi.fn().mockResolvedValue(true);
      
      vi.mocked(installPromptHook.useInstallPrompt).mockReturnValue({
        isInstallable: true,
        isInstalled: false,
        promptInstall,
        dismissPrompt: vi.fn(),
        platform: 'android',
      });

      render(<InstallPrompt />);
      vi.advanceTimersByTime(30000);

      await waitFor(() => {
        expect(screen.getByText('Instalar')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Instalar'));

      await waitFor(() => {
        expect(promptInstall).toHaveBeenCalled();
      });
    });

    it('should hide prompt on dismiss', async () => {
      const dismissPrompt = vi.fn();
      
      vi.mocked(installPromptHook.useInstallPrompt).mockReturnValue({
        isInstallable: true,
        isInstalled: false,
        promptInstall: vi.fn(),
        dismissPrompt,
        platform: 'android',
      });

      const { container } = render(<InstallPrompt />);
      vi.advanceTimersByTime(30000);

      await waitFor(() => {
        expect(screen.getByText('Ahora no')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Ahora no'));

      await waitFor(() => {
        expect(dismissPrompt).toHaveBeenCalled();
        expect(localStorage.setItem).toHaveBeenCalledWith(
          'pwa-prompt-dismissed',
          expect.any(String)
        );
      });
    });

    it('should hide prompt on X button click', async () => {
      render(<InstallPrompt />);
      vi.advanceTimersByTime(30000);

      await waitFor(() => {
        expect(screen.getByText('Instalar App')).toBeInTheDocument();
      });

      // Find X button by role
      const closeButton = screen.getAllByRole('button').find(
        btn => btn.querySelector('svg')
      );
      
      if (closeButton) {
        fireEvent.click(closeButton);
        
        await waitFor(() => {
          expect(localStorage.setItem).toHaveBeenCalledWith(
            'pwa-prompt-dismissed',
            expect.any(String)
          );
        });
      }
    });

    it('should work on desktop platform', async () => {
      vi.mocked(installPromptHook.useInstallPrompt).mockReturnValue({
        isInstallable: true,
        isInstalled: false,
        promptInstall: vi.fn().mockResolvedValue(true),
        dismissPrompt: vi.fn(),
        platform: 'desktop',
      });

      render(<InstallPrompt />);
      vi.advanceTimersByTime(30000);

      await waitFor(() => {
        expect(screen.getByText('Instalar App')).toBeInTheDocument();
        expect(screen.getByText('Instalar')).toBeInTheDocument();
      });
    });
  });

  describe('iOS Prompt', () => {
    beforeEach(() => {
      vi.mocked(installPromptHook.useInstallPrompt).mockReturnValue({
        isInstallable: true,
        isInstalled: false,
        promptInstall: vi.fn(),
        dismissPrompt: vi.fn(),
        platform: 'ios',
      });
    });

    it('should render iOS prompt with instructions', async () => {
      render(<InstallPrompt />);
      vi.advanceTimersByTime(30000);

      await waitFor(() => {
        expect(screen.getByText('Instalar en iOS')).toBeInTheDocument();
        expect(screen.getByText(/Sigue estos pasos/i)).toBeInTheDocument();
      });
    });

    it('should show step-by-step instructions', async () => {
      render(<InstallPrompt />);
      vi.advanceTimersByTime(30000);

      await waitFor(() => {
        expect(screen.getByText(/Toca el botón de compartir/i)).toBeInTheDocument();
        expect(screen.getByText(/Agregar a pantalla de inicio/i)).toBeInTheDocument();
        expect(screen.getByText(/Confirma tocando "Agregar"/i)).toBeInTheDocument();
      });
    });

    it('should not have install button on iOS', async () => {
      render(<InstallPrompt />);
      vi.advanceTimersByTime(30000);

      await waitFor(() => {
        expect(screen.getByText('Instalar en iOS')).toBeInTheDocument();
      });

      expect(screen.queryByText('Instalar')).not.toBeInTheDocument();
      expect(screen.getByText('Entendido')).toBeInTheDocument();
    });

    it('should dismiss on Entendido button', async () => {
      const dismissPrompt = vi.fn();
      
      vi.mocked(installPromptHook.useInstallPrompt).mockReturnValue({
        isInstallable: true,
        isInstalled: false,
        promptInstall: vi.fn(),
        dismissPrompt,
        platform: 'ios',
      });

      render(<InstallPrompt />);
      vi.advanceTimersByTime(30000);

      await waitFor(() => {
        expect(screen.getByText('Entendido')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Entendido'));

      await waitFor(() => {
        expect(dismissPrompt).toHaveBeenCalled();
      });
    });
  });
});

describe('InstallBanner', () => {
  let sessionStorageMock: { [key: string]: string };

  beforeEach(() => {
    sessionStorageMock = {};

    global.sessionStorage = {
      getItem: vi.fn((key) => sessionStorageMock[key] || null),
      setItem: vi.fn((key, value) => {
        sessionStorageMock[key] = value;
      }),
      removeItem: vi.fn(),
      clear: vi.fn(),
      length: 0,
      key: vi.fn(),
    } as any;
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should render banner when installable', () => {
    vi.mocked(installPromptHook.useInstallPrompt).mockReturnValue({
      isInstallable: true,
      isInstalled: false,
      promptInstall: vi.fn(),
      dismissPrompt: vi.fn(),
      platform: 'android',
    });

    render(<InstallBanner />);

    expect(screen.getByText('Instala la aplicación')).toBeInTheDocument();
    expect(screen.getByText(/Acceso rápido y funciones offline/i)).toBeInTheDocument();
  });

  it('should not render if already installed', () => {
    vi.mocked(installPromptHook.useInstallPrompt).mockReturnValue({
      isInstallable: true,
      isInstalled: true,
      promptInstall: vi.fn(),
      dismissPrompt: vi.fn(),
      platform: 'android',
    });

    const { container } = render(<InstallBanner />);
    expect(container.firstChild).toBeNull();
  });

  it('should show install button on Android/Desktop', () => {
    vi.mocked(installPromptHook.useInstallPrompt).mockReturnValue({
      isInstallable: true,
      isInstalled: false,
      promptInstall: vi.fn(),
      dismissPrompt: vi.fn(),
      platform: 'android',
    });

    render(<InstallBanner />);

    expect(screen.getByText('Instalar')).toBeInTheDocument();
  });

  it('should not show install button on iOS', () => {
    vi.mocked(installPromptHook.useInstallPrompt).mockReturnValue({
      isInstallable: true,
      isInstalled: false,
      promptInstall: vi.fn(),
      dismissPrompt: vi.fn(),
      platform: 'ios',
    });

    render(<InstallBanner />);

    expect(screen.queryByText('Instalar')).not.toBeInTheDocument();
  });

  it('should dismiss banner and store in sessionStorage', async () => {
    vi.mocked(installPromptHook.useInstallPrompt).mockReturnValue({
      isInstallable: true,
      isInstalled: false,
      promptInstall: vi.fn(),
      dismissPrompt: vi.fn(),
      platform: 'android',
    });

    const { container } = render(<InstallBanner />);

    const closeButtons = screen.getAllByRole('button');
    const closeButton = closeButtons.find(btn => btn.querySelector('svg'));

    if (closeButton) {
      fireEvent.click(closeButton);

      await waitFor(() => {
        expect(sessionStorage.setItem).toHaveBeenCalledWith(
          'pwa-banner-dismissed',
          'true'
        );
        expect(container.firstChild).toBeNull();
      });
    }
  });

  it('should call promptInstall on install button click', async () => {
    const promptInstall = vi.fn().mockResolvedValue(true);
    
    vi.mocked(installPromptHook.useInstallPrompt).mockReturnValue({
      isInstallable: true,
      isInstalled: false,
      promptInstall,
      dismissPrompt: vi.fn(),
      platform: 'android',
    });

    render(<InstallBanner />);

    fireEvent.click(screen.getByText('Instalar'));

    await waitFor(() => {
      expect(promptInstall).toHaveBeenCalled();
    });
  });

  it('should not render if dismissed in session', () => {
    sessionStorageMock['pwa-banner-dismissed'] = 'true';

    vi.mocked(installPromptHook.useInstallPrompt).mockReturnValue({
      isInstallable: true,
      isInstalled: false,
      promptInstall: vi.fn(),
      dismissPrompt: vi.fn(),
      platform: 'android',
    });

    const { container } = render(<InstallBanner />);
    expect(container.firstChild).toBeNull();
  });
});
