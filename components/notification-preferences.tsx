'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Bell, BellOff, Send, Loader2 } from 'lucide-react';
import { usePushNotifications } from '@/hooks/use-push-notifications';
import { useAuth } from '@/contexts/auth-context';
import { useTranslations } from 'next-intl';
import { useState } from 'react';

export function NotificationPreferences() {
  const tCommon = useTranslations('common')
  const { user, tenant } = useAuth();
  const [isTesting, setIsTesting] = useState(false);
  
  const {
    isSupported,
    permission,
    isSubscribed,
    isLoading,
    subscribe,
    unsubscribe,
    sendTest,
  } = usePushNotifications();

  const handleSubscribe = async () => {
    if (!user?.id || !tenant?.id) {
      alert(tCommon('couldNotGetUserInfo'));
      return;
    }
    await subscribe(user.id, tenant.id);
  };

  const handleUnsubscribe = async () => {
    if (!user?.id) {
      alert(tCommon('couldNotGetUserInfo'));
      return;
    }
    await unsubscribe(user.id);
  };

  const handleTest = async () => {
    setIsTesting(true);
    const success = await sendTest();
    setIsTesting(false);
    if (!success) {
      alert(tCommon('couldNotSendTestNotification'));
    }
  };

  if (!isSupported) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BellOff className="h-5 w-5" />
            {tCommon('notificationsNotAvailable')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertDescription>
              {tCommon('browserNotSupported')}
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            {tCommon('notificationStatus')}
          </CardTitle>
          <CardDescription>
            {tCommon('manageNotifications')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between rounded-lg border p-4">
            <div>
              <p className="font-medium">{tCommon('currentStatus')}</p>
              <p className="text-sm text-muted-foreground">
                {permission === 'denied' && tCommon('blockedByBrowser')}
                {permission === 'default' && tCommon('notActivated')}
                {permission === 'granted' && isSubscribed && `✅ ${tCommon('active')}`}
                {permission === 'granted' && !isSubscribed && tCommon('permissionsGranted')}
              </p>
            </div>
            <div className="flex gap-2">
              {!isSubscribed ? (
                <Button
                  onClick={handleSubscribe}
                  disabled={isLoading || permission === 'denied'}
                >
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {tCommon('activateNotifications')}
                </Button>
              ) : (
                <>
                  <Button variant="outline" onClick={handleTest} disabled={isTesting}>
                    {isTesting ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="mr-2 h-4 w-4" />
                    )}
                    {tCommon('test')}
                  </Button>
                  <Button variant="destructive" onClick={handleUnsubscribe} disabled={isLoading}>
                    {tCommon('deactivate')}
                  </Button>
                </>
              )}
            </div>
          </div>

          {permission === 'denied' && (
            <Alert variant="destructive">
              <AlertDescription>
                {tCommon('notificationsBlocked')}
                <ol className="mt-2 ml-4 list-decimal space-y-1 text-sm">
                  <li>{tCommon('notificationStep1')}</li>
                  <li>{tCommon('notificationStep2')}</li>
                  <li>{tCommon('notificationStep3')}</li>
                  <li>{tCommon('notificationStep4')}</li>
                </ol>
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {isSubscribed && (
        <Card>
          <CardHeader>
            <CardTitle>{tCommon('notificationTypes')}</CardTitle>
            <CardDescription>
              {tCommon('willReceiveNotifications')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center gap-2">
                <Bell className="h-4 w-4 text-green-500" />
                {tCommon('newOrders')}
              </li>
              <li className="flex items-center gap-2">
                <Bell className="h-4 w-4 text-blue-500" />
                {tCommon('orderStatusChanges')}
              </li>
              <li className="flex items-center gap-2">
                <Bell className="h-4 w-4 text-yellow-500" />
                {tCommon('kitchenAlerts')}
              </li>
              <li className="flex items-center gap-2">
                <Bell className="h-4 w-4 text-purple-500" />
                {tCommon('tableChanges')}
              </li>
              <li className="flex items-center gap-2">
                <Bell className="h-4 w-4 text-orange-500" />
                {tCommon('completedPayments')}
              </li>
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
