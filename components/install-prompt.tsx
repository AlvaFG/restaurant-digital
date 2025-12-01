/**
 * InstallPrompt Component
 * Custom UI for PWA installation prompt
 */

'use client';

import { useTranslations } from 'next-intl';
import { useState, useEffect } from 'react';
import { X, Download, Smartphone, Share, MoreVertical, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useInstallPrompt } from '@/hooks/use-install-prompt';

export function InstallPrompt() {
  const tCommon = useTranslations('common');
  const { isInstallable, isInstalled, promptInstall, dismissPrompt, platform } = useInstallPrompt();
  const [showPrompt, setShowPrompt] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);

  // Show prompt after some time if installable
  useEffect(() => {
    if (isInstallable && !hasInteracted) {
      // Check if user has dismissed before
      const dismissed = localStorage.getItem('pwa-prompt-dismissed');
      if (!dismissed) {
        // Show after 30 seconds
        const timer = setTimeout(() => {
          setShowPrompt(true);
        }, 30000);

        return () => clearTimeout(timer);
      }
    }
  }, [isInstallable, hasInteracted]);

  const handleInstall = async () => {
    setHasInteracted(true);
    const success = await promptInstall();
    
    if (success) {
      setShowPrompt(false);
    }
  };

  const handleDismiss = () => {
    setHasInteracted(true);
    setShowPrompt(false);
    dismissPrompt();
    localStorage.setItem('pwa-prompt-dismissed', Date.now().toString());
  };

  // Don't show if already installed or not installable
  if (isInstalled || !isInstallable || !showPrompt) {
    return null;
  }

  // Android/Desktop prompt (uses native prompt)
  if (platform === 'android' || platform === 'desktop') {
    return (
      <div className="fixed bottom-4 right-4 left-4 sm:left-auto sm:w-96 z-50 animate-in slide-in-from-bottom-5">
        <Card className="shadow-lg border-2 border-primary/20">
          <CardHeader className="relative pb-3">
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-2 top-2 h-6 w-6"
              onClick={handleDismiss}
            >
              <X className="h-4 w-4" />
            </Button>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Download className="h-5 w-5 text-primary" />
              Instalar App
            </CardTitle>
            <CardDescription>
              Instala la aplicación para acceso rápido y funciones offline
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-start gap-3 text-sm text-muted-foreground">
              <div className="flex-shrink-0 w-1 h-1 mt-2 rounded-full bg-primary"></div>
              <span>Acceso desde tu pantalla de inicio</span>
            </div>
            <div className="flex items-start gap-3 text-sm text-muted-foreground">
              <div className="flex-shrink-0 w-1 h-1 mt-2 rounded-full bg-primary"></div>
              <span>Funciona sin conexión a internet</span>
            </div>
            <div className="flex items-start gap-3 text-sm text-muted-foreground">
              <div className="flex-shrink-0 w-1 h-1 mt-2 rounded-full bg-primary"></div>
              <span>Notificaciones push en tiempo real</span>
            </div>
            
            <div className="flex gap-2 pt-2">
              <Button onClick={handleInstall} className="flex-1">
                <Download className="mr-2 h-4 w-4" />
                Instalar
              </Button>
              <Button onClick={handleDismiss} variant="outline">
                Ahora no
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // iOS prompt (manual instructions)
  if (platform === 'ios') {
    return (
      <div className="fixed bottom-4 right-4 left-4 sm:left-auto sm:w-96 z-50 animate-in slide-in-from-bottom-5">
        <Card className="shadow-lg border-2 border-primary/20">
          <CardHeader className="relative pb-3">
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-2 top-2 h-6 w-6"
              onClick={handleDismiss}
            >
              <X className="h-4 w-4" />
            </Button>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Smartphone className="h-5 w-5 text-primary" />
              Instalar en iOS
            </CardTitle>
            <CardDescription>
              Agrega esta app a tu pantalla de inicio
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <AlertDescription>
                <div className="space-y-3 text-sm">
                  <p className="font-medium">Sigue estos pasos:</p>
                  
                  <div className="flex items-start gap-2">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold">1</span>
                    <div className="flex items-center gap-2">
                      <span>Toca el botón de compartir</span>
                      <Share className="h-4 w-4 text-primary" />
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-2">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold">2</span>
                    <div className="flex items-center gap-2">
                      <span>Selecciona "Agregar a pantalla de inicio"</span>
                      <Plus className="h-4 w-4 text-primary" />
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-2">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold">3</span>
                    <span>Confirma tocando "{tCommon('add')}"</span>
                  </div>
                </div>
              </AlertDescription>
            </Alert>
            
            <Button onClick={handleDismiss} variant="outline" className="w-full">
              Entendido
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return null;
}

/**
 * Install Banner (Top banner alternative)
 */
export function InstallBanner() {
  const { isInstallable, isInstalled, promptInstall, platform } = useInstallPrompt();
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    if (isInstallable && !isInstalled) {
      const dismissed = sessionStorage.getItem('pwa-banner-dismissed');
      if (!dismissed) {
        setShowBanner(true);
      }
    }
  }, [isInstallable, isInstalled]);

  const handleInstall = async () => {
    const success = await promptInstall();
    if (success) {
      setShowBanner(false);
    }
  };

  const handleDismiss = () => {
    setShowBanner(false);
    sessionStorage.setItem('pwa-banner-dismissed', 'true');
  };

  if (!showBanner || isInstalled) {
    return null;
  }

  return (
    <div className="bg-primary text-primary-foreground px-4 py-3 shadow-lg">
      <div className="container mx-auto flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <Download className="h-5 w-5 flex-shrink-0" />
          <div className="min-w-0 flex-1">
            <p className="font-medium text-sm sm:text-base truncate">
              Instala la aplicación
            </p>
            <p className="text-xs sm:text-sm opacity-90 truncate">
              Acceso rápido y funciones offline
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2 flex-shrink-0">
          {(platform === 'android' || platform === 'desktop') && (
            <Button
              onClick={handleInstall}
              size="sm"
              variant="secondary"
              className="text-xs sm:text-sm"
            >
              Instalar
            </Button>
          )}
          <Button
            onClick={handleDismiss}
            size="icon"
            variant="ghost"
            className="h-8 w-8 hover:bg-primary-foreground/10"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
