if(!self.define){let e,s={};const c=(c,a)=>(c=new URL(c+".js",a).href,s[c]||new Promise(s=>{if("document"in self){const e=document.createElement("script");e.src=c,e.onload=s,document.head.appendChild(e)}else e=c,importScripts(c),s()}).then(()=>{let e=s[c];if(!e)throw new Error(`Module ${c} didn’t register its module`);return e}));self.define=(a,i)=>{const n=e||("document"in self?document.currentScript.src:"")||location.href;if(s[n])return;let t={};const u=e=>c(e,n),r={module:{uri:n},exports:t,require:u};s[n]=Promise.all(a.map(e=>r[e]||u(e))).then(e=>(i(...e),t))}}define(["./workbox-f1770938"],function(e){"use strict";importScripts(),self.skipWaiting(),e.clientsClaim(),e.precacheAndRoute([{url:"/_next/static/2cIOcDsGHKv5hiYmulj5z/_buildManifest.js",revision:"6310079bf1ae7bebeb6a2135896e4564"},{url:"/_next/static/2cIOcDsGHKv5hiYmulj5z/_ssgManifest.js",revision:"b6652df95db52feb4daf4eca35380933"},{url:"/_next/static/chunks/1235.ae43ecc6fad8ddd4.js",revision:"ae43ecc6fad8ddd4"},{url:"/_next/static/chunks/128.74f47a137745468c.js",revision:"74f47a137745468c"},{url:"/_next/static/chunks/1430-da2e728502c6ae47.js",revision:"2cIOcDsGHKv5hiYmulj5z"},{url:"/_next/static/chunks/1678.a3448852d03142be.js",revision:"a3448852d03142be"},{url:"/_next/static/chunks/176-6e74f2a3db966dfd.js",revision:"2cIOcDsGHKv5hiYmulj5z"},{url:"/_next/static/chunks/1874.61cec4fa26e7bdee.js",revision:"61cec4fa26e7bdee"},{url:"/_next/static/chunks/2191-051a931b79cba852.js",revision:"2cIOcDsGHKv5hiYmulj5z"},{url:"/_next/static/chunks/2611.d9991b28986f321e.js",revision:"d9991b28986f321e"},{url:"/_next/static/chunks/2696-6433b50150c21ed8.js",revision:"2cIOcDsGHKv5hiYmulj5z"},{url:"/_next/static/chunks/2972-02945a280f172505.js",revision:"2cIOcDsGHKv5hiYmulj5z"},{url:"/_next/static/chunks/3213.3fd5335318dc6f70.js",revision:"3fd5335318dc6f70"},{url:"/_next/static/chunks/3404.b26533488c167650.js",revision:"b26533488c167650"},{url:"/_next/static/chunks/3590-a1beea6ccf8278a1.js",revision:"2cIOcDsGHKv5hiYmulj5z"},{url:"/_next/static/chunks/3651.7d5a441b304d2f11.js",revision:"7d5a441b304d2f11"},{url:"/_next/static/chunks/4099-18e12442b4b200ee.js",revision:"2cIOcDsGHKv5hiYmulj5z"},{url:"/_next/static/chunks/4209-72d1fc01a2d44c31.js",revision:"2cIOcDsGHKv5hiYmulj5z"},{url:"/_next/static/chunks/4240-12ec19ab9c1555b3.js",revision:"2cIOcDsGHKv5hiYmulj5z"},{url:"/_next/static/chunks/4253.ae0f734983e3ff64.js",revision:"ae0f734983e3ff64"},{url:"/_next/static/chunks/4672-1222af47aae5b28e.js",revision:"2cIOcDsGHKv5hiYmulj5z"},{url:"/_next/static/chunks/4685-521edb5e51899081.js",revision:"2cIOcDsGHKv5hiYmulj5z"},{url:"/_next/static/chunks/4854.ed638f8c7c80a1d1.js",revision:"ed638f8c7c80a1d1"},{url:"/_next/static/chunks/5348.8f1abb2dbbe5a905.js",revision:"8f1abb2dbbe5a905"},{url:"/_next/static/chunks/5429.c0ca42677233e489.js",revision:"c0ca42677233e489"},{url:"/_next/static/chunks/5580-9e98d004b101889c.js",revision:"2cIOcDsGHKv5hiYmulj5z"},{url:"/_next/static/chunks/5733.6c64c414db6a3b9e.js",revision:"6c64c414db6a3b9e"},{url:"/_next/static/chunks/5763-f18974e35fc1a652.js",revision:"2cIOcDsGHKv5hiYmulj5z"},{url:"/_next/static/chunks/6391.30b8dd0fc5fea9eb.js",revision:"30b8dd0fc5fea9eb"},{url:"/_next/static/chunks/6509.2c90bde1ceeb3a34.js",revision:"2c90bde1ceeb3a34"},{url:"/_next/static/chunks/661.77a1e86fb72653bd.js",revision:"77a1e86fb72653bd"},{url:"/_next/static/chunks/6877.e186481eace74c2c.js",revision:"e186481eace74c2c"},{url:"/_next/static/chunks/6901.45b8e74eddc3fde4.js",revision:"45b8e74eddc3fde4"},{url:"/_next/static/chunks/7007.04cd3e840f29416b.js",revision:"04cd3e840f29416b"},{url:"/_next/static/chunks/7039-1696561acf7102c9.js",revision:"2cIOcDsGHKv5hiYmulj5z"},{url:"/_next/static/chunks/7126-90e5c5ad9e0197fc.js",revision:"2cIOcDsGHKv5hiYmulj5z"},{url:"/_next/static/chunks/7250-ad26e091a0bb0293.js",revision:"2cIOcDsGHKv5hiYmulj5z"},{url:"/_next/static/chunks/7317-97872cbfe9e27d22.js",revision:"2cIOcDsGHKv5hiYmulj5z"},{url:"/_next/static/chunks/732.c5b14711f667d7b7.js",revision:"c5b14711f667d7b7"},{url:"/_next/static/chunks/7399.d3bab0b45f82d9b0.js",revision:"d3bab0b45f82d9b0"},{url:"/_next/static/chunks/8142.5f3dbda07004af0c.js",revision:"5f3dbda07004af0c"},{url:"/_next/static/chunks/82-d97fa474016f3578.js",revision:"2cIOcDsGHKv5hiYmulj5z"},{url:"/_next/static/chunks/8485.b93c88d41acb9979.js",revision:"b93c88d41acb9979"},{url:"/_next/static/chunks/8775-d83a49d540a09f8a.js",revision:"2cIOcDsGHKv5hiYmulj5z"},{url:"/_next/static/chunks/8828.3061ee76ed75b8d6.js",revision:"3061ee76ed75b8d6"},{url:"/_next/static/chunks/9057.ddc6212f92d9e42b.js",revision:"ddc6212f92d9e42b"},{url:"/_next/static/chunks/9134.9efc5bb72a04beba.js",revision:"9efc5bb72a04beba"},{url:"/_next/static/chunks/9474-369fe2df59b59fc3.js",revision:"2cIOcDsGHKv5hiYmulj5z"},{url:"/_next/static/chunks/9512.d9c681da4a380acd.js",revision:"d9c681da4a380acd"},{url:"/_next/static/chunks/9764-a84d29a9be63df6d.js",revision:"2cIOcDsGHKv5hiYmulj5z"},{url:"/_next/static/chunks/9964-535839e5805ab94c.js",revision:"2cIOcDsGHKv5hiYmulj5z"},{url:"/_next/static/chunks/app/(public)/layout-4ba6dc148c4597e9.js",revision:"2cIOcDsGHKv5hiYmulj5z"},{url:"/_next/static/chunks/app/(public)/payment/failure/page-622ea8adb2efa7d3.js",revision:"2cIOcDsGHKv5hiYmulj5z"},{url:"/_next/static/chunks/app/(public)/payment/pending/page-98b68443bc5ce9da.js",revision:"2cIOcDsGHKv5hiYmulj5z"},{url:"/_next/static/chunks/app/(public)/payment/success/page-dda92d230a733a48.js",revision:"2cIOcDsGHKv5hiYmulj5z"},{url:"/_next/static/chunks/app/(public)/qr/%5BtableId%5D/page-797c8a68ba04a0ef.js",revision:"2cIOcDsGHKv5hiYmulj5z"},{url:"/_next/static/chunks/app/(public)/qr/%5BtableId%5D/payment/failure/page-468b9d5e3d08bb50.js",revision:"2cIOcDsGHKv5hiYmulj5z"},{url:"/_next/static/chunks/app/(public)/qr/%5BtableId%5D/payment/pending/page-3a8ebe779e6487dc.js",revision:"2cIOcDsGHKv5hiYmulj5z"},{url:"/_next/static/chunks/app/(public)/qr/%5BtableId%5D/payment/success/page-1222ff1e5cfa1fcd.js",revision:"2cIOcDsGHKv5hiYmulj5z"},{url:"/_next/static/chunks/app/(public)/qr/validate/page-b908ecdeecdb853b.js",revision:"2cIOcDsGHKv5hiYmulj5z"},{url:"/_next/static/chunks/app/_not-found/page-315011681f7ef874.js",revision:"2cIOcDsGHKv5hiYmulj5z"},{url:"/_next/static/chunks/app/alertas/page-d1d8eaed6f4226e1.js",revision:"2cIOcDsGHKv5hiYmulj5z"},{url:"/_next/static/chunks/app/analitica/loading-481b1d937af24e68.js",revision:"2cIOcDsGHKv5hiYmulj5z"},{url:"/_next/static/chunks/app/analitica/page-e616d48560903c7a.js",revision:"2cIOcDsGHKv5hiYmulj5z"},{url:"/_next/static/chunks/app/configuracion/notificaciones/page-d9fa195b821e9fe1.js",revision:"2cIOcDsGHKv5hiYmulj5z"},{url:"/_next/static/chunks/app/configuracion/page-a8d32141d49c3d49.js",revision:"2cIOcDsGHKv5hiYmulj5z"},{url:"/_next/static/chunks/app/configuracion/zonas/page-45b7ec132964a662.js",revision:"2cIOcDsGHKv5hiYmulj5z"},{url:"/_next/static/chunks/app/dashboard/page-34903b9d7d47e2ff.js",revision:"2cIOcDsGHKv5hiYmulj5z"},{url:"/_next/static/chunks/app/diagnostic/page-cb0e6d3f576c5a72.js",revision:"2cIOcDsGHKv5hiYmulj5z"},{url:"/_next/static/chunks/app/integraciones/page-c00bcd05b6caabec.js",revision:"2cIOcDsGHKv5hiYmulj5z"},{url:"/_next/static/chunks/app/layout-00973085254ad0ec.js",revision:"2cIOcDsGHKv5hiYmulj5z"},{url:"/_next/static/chunks/app/login/page-fb9d710f909f69c2.js",revision:"2cIOcDsGHKv5hiYmulj5z"},{url:"/_next/static/chunks/app/menu/page-8693b19892c1db18.js",revision:"2cIOcDsGHKv5hiYmulj5z"},{url:"/_next/static/chunks/app/mesas/%5Bid%5D/page-1894ac4f5ed4c1d5.js",revision:"2cIOcDsGHKv5hiYmulj5z"},{url:"/_next/static/chunks/app/mesas/editor/page-1218b7a6d2e4a98b.js",revision:"2cIOcDsGHKv5hiYmulj5z"},{url:"/_next/static/chunks/app/mesas/page-0db01992f1ff2520.js",revision:"2cIOcDsGHKv5hiYmulj5z"},{url:"/_next/static/chunks/app/offline/page-dbfae4d37bad10a8.js",revision:"2cIOcDsGHKv5hiYmulj5z"},{url:"/_next/static/chunks/app/page-668ca4768537714b.js",revision:"2cIOcDsGHKv5hiYmulj5z"},{url:"/_next/static/chunks/app/pedidos/page-0424cd2061a4a6da.js",revision:"2cIOcDsGHKv5hiYmulj5z"},{url:"/_next/static/chunks/app/qr-management/page-69be39a50d507eb8.js",revision:"2cIOcDsGHKv5hiYmulj5z"},{url:"/_next/static/chunks/app/salon/page-56fa34a75b7464b4.js",revision:"2cIOcDsGHKv5hiYmulj5z"},{url:"/_next/static/chunks/app/test-error/page-9e589d2cd055dec4.js",revision:"2cIOcDsGHKv5hiYmulj5z"},{url:"/_next/static/chunks/app/usuarios/page-50f6bb61532e5537.js",revision:"2cIOcDsGHKv5hiYmulj5z"},{url:"/_next/static/chunks/fd9d1056-2f1a30624a00edfc.js",revision:"2cIOcDsGHKv5hiYmulj5z"},{url:"/_next/static/chunks/framework-8e0e0f4a6b83a956.js",revision:"2cIOcDsGHKv5hiYmulj5z"},{url:"/_next/static/chunks/main-app-b05a58a93e7fa508.js",revision:"2cIOcDsGHKv5hiYmulj5z"},{url:"/_next/static/chunks/main-f279bc046b05f133.js",revision:"2cIOcDsGHKv5hiYmulj5z"},{url:"/_next/static/chunks/pages/_app-3c9ca398d360b709.js",revision:"2cIOcDsGHKv5hiYmulj5z"},{url:"/_next/static/chunks/pages/_error-cf5ca766ac8f493f.js",revision:"2cIOcDsGHKv5hiYmulj5z"},{url:"/_next/static/chunks/polyfills-42372ed130431b0a.js",revision:"846118c33b2c0e922d7b3a7676f81f6f"},{url:"/_next/static/chunks/webpack-008a519d60b34623.js",revision:"2cIOcDsGHKv5hiYmulj5z"},{url:"/_next/static/css/5a36f9923d34e0fa.css",revision:"5a36f9923d34e0fa"},{url:"/_next/static/css/d2597528c49cae70.css",revision:"d2597528c49cae70"},{url:"/_next/static/css/e869f1200f6946fb.css",revision:"e869f1200f6946fb"},{url:"/_next/static/media/0aa834ed78bf6d07-s.woff2",revision:"324703f03c390d2e2a4f387de85fe63d"},{url:"/_next/static/media/19cfc7226ec3afaa-s.woff2",revision:"9dda5cfc9a46f256d0e131bb535e46f8"},{url:"/_next/static/media/21350d82a1f187e9-s.woff2",revision:"4e2553027f1d60eff32898367dd4d541"},{url:"/_next/static/media/67957d42bae0796d-s.woff2",revision:"54f02056e07c55023315568c637e3a96"},{url:"/_next/static/media/886030b0b59bc5a7-s.woff2",revision:"c94e6e6c23e789fcb0fc60d790c9d2c1"},{url:"/_next/static/media/8e9860b6e62d6359-s.p.woff2",revision:"01ba6c2a184b8cba08b0d57167664d75"},{url:"/_next/static/media/939c4f875ee75fbb-s.p.woff2",revision:"4a4e74bed5809194e4bc6538eb1a1e30"},{url:"/_next/static/media/ba9851c3c22cd980-s.woff2",revision:"9e494903d6b0ffec1a1e14d34427d44d"},{url:"/_next/static/media/bb3ef058b751a6ad-s.p.woff2",revision:"782150e6836b9b074d1a798807adcb18"},{url:"/_next/static/media/c5fe6dc8356a8c31-s.woff2",revision:"027a89e9ab733a145db70f09b8a18b42"},{url:"/_next/static/media/df0a9ae256c0569c-s.woff2",revision:"d54db44de5ccb18886ece2fda72bdfe0"},{url:"/_next/static/media/e4af272ccee01ff0-s.p.woff2",revision:"65850a373e258f1c897a2b3d75eb74de"},{url:"/_next/static/media/f911b923c6adde36-s.woff2",revision:"0f8d347d49960d05c9430d83e49edeb7"},{url:"/apple-splash-1125-2436.png",revision:"8823a23eb8ce44241647bb96aa0c01e3"},{url:"/apple-splash-1242-2208.png",revision:"2b0b8079fb08ce5dba39ac7e7719713a"},{url:"/apple-splash-1242-2688.png",revision:"27651c910816449e4d2b00eb517c218f"},{url:"/apple-splash-1536-2048.png",revision:"29baaa70525abb2d3de10d2fddc52864"},{url:"/apple-splash-1668-2388.png",revision:"ca92ad319d08905b693bdd364dc3e11d"},{url:"/apple-splash-2048-2732.png",revision:"beee80c6be9e2febc8aa3f6762433b14"},{url:"/apple-splash-640-1136.png",revision:"021359db9c3412420253bd49a0c0f619"},{url:"/apple-splash-750-1334.png",revision:"3380153738ef5e8517c2bf9661b91391"},{url:"/apple-splash-828-1792.png",revision:"3e41abf3e668e6c1e42f3cc89c59d2d5"},{url:"/apple-touch-icon-120x120.png",revision:"44546adf52d9c9511afcf1754332fae0"},{url:"/apple-touch-icon-152x152.png",revision:"7ad0667cf5a8e831b5eb02742600b6fc"},{url:"/apple-touch-icon-167x167.png",revision:"2f1cc074f8aa62a26d6ef6a78120a050"},{url:"/apple-touch-icon.png",revision:"a27d8e22d16d993128b80ae98e2235a0"},{url:"/manifest.json",revision:"b76a81c8e90a109f8e2f4817e77022b3"},{url:"/placeholder-logo.png",revision:"95d8d1a4a9bbcccc875e2c381e74064a"},{url:"/placeholder-logo.svg",revision:"1e16dc7df824652c5906a2ab44aef78c"},{url:"/placeholder-user.jpg",revision:"7ee6562646feae6d6d77e2c72e204591"},{url:"/placeholder.jpg",revision:"1e533b7b4545d1d605144ce893afc601"},{url:"/placeholder.svg",revision:"35707bd9960ba5281c72af927b79291f"},{url:"/sw-custom.js",revision:"b32ed104b47f2fc4da59c617d5b89f8e"}],{ignoreURLParametersMatching:[/^utm_/,/^fbclid$/]}),e.cleanupOutdatedCaches(),e.registerRoute("/",new e.NetworkFirst({cacheName:"start-url",plugins:[{cacheWillUpdate:async({response:e})=>e&&"opaqueredirect"===e.type?new Response(e.body,{status:200,statusText:"OK",headers:e.headers}):e}]}),"GET"),e.registerRoute(/^https:\/\/fonts\.(?:gstatic)\.com\/.*/i,new e.CacheFirst({cacheName:"google-fonts-webfonts",plugins:[new e.ExpirationPlugin({maxEntries:4,maxAgeSeconds:31536e3})]}),"GET"),e.registerRoute(/^https:\/\/fonts\.(?:googleapis)\.com\/.*/i,new e.StaleWhileRevalidate({cacheName:"google-fonts-stylesheets",plugins:[new e.ExpirationPlugin({maxEntries:4,maxAgeSeconds:604800})]}),"GET"),e.registerRoute(/\.(?:eot|otf|ttc|ttf|woff|woff2|font.css)$/i,new e.StaleWhileRevalidate({cacheName:"static-font-assets",plugins:[new e.ExpirationPlugin({maxEntries:4,maxAgeSeconds:604800})]}),"GET"),e.registerRoute(/\.(?:jpg|jpeg|gif|png|svg|ico|webp)$/i,new e.StaleWhileRevalidate({cacheName:"static-image-assets",plugins:[new e.ExpirationPlugin({maxEntries:64,maxAgeSeconds:2592e3})]}),"GET"),e.registerRoute(/\/_next\/static.+\.js$/i,new e.CacheFirst({cacheName:"next-static-js-assets",plugins:[new e.ExpirationPlugin({maxEntries:64,maxAgeSeconds:86400})]}),"GET"),e.registerRoute(/\/_next\/image\?url=.+$/i,new e.StaleWhileRevalidate({cacheName:"next-image",plugins:[new e.ExpirationPlugin({maxEntries:64,maxAgeSeconds:86400})]}),"GET"),e.registerRoute(/\.(?:mp3|wav|ogg)$/i,new e.CacheFirst({cacheName:"static-audio-assets",plugins:[new e.RangeRequestsPlugin,new e.ExpirationPlugin({maxEntries:32,maxAgeSeconds:86400})]}),"GET"),e.registerRoute(/\.(?:mp4|webm)$/i,new e.CacheFirst({cacheName:"static-video-assets",plugins:[new e.RangeRequestsPlugin,new e.ExpirationPlugin({maxEntries:32,maxAgeSeconds:86400})]}),"GET"),e.registerRoute(/\.(?:js)$/i,new e.StaleWhileRevalidate({cacheName:"static-js-assets",plugins:[new e.ExpirationPlugin({maxEntries:48,maxAgeSeconds:86400})]}),"GET"),e.registerRoute(/\.(?:css|less)$/i,new e.StaleWhileRevalidate({cacheName:"static-style-assets",plugins:[new e.ExpirationPlugin({maxEntries:32,maxAgeSeconds:86400})]}),"GET"),e.registerRoute(/\/_next\/data\/.+\/.+\.json$/i,new e.StaleWhileRevalidate({cacheName:"next-data",plugins:[new e.ExpirationPlugin({maxEntries:32,maxAgeSeconds:86400})]}),"GET"),e.registerRoute(/\.(?:json|xml|csv)$/i,new e.NetworkFirst({cacheName:"static-data-assets",plugins:[new e.ExpirationPlugin({maxEntries:32,maxAgeSeconds:86400})]}),"GET"),e.registerRoute(({sameOrigin:e,url:{pathname:s}})=>!(!e||s.startsWith("/api/auth/callback")||!s.startsWith("/api/")),new e.NetworkFirst({cacheName:"apis",networkTimeoutSeconds:10,plugins:[new e.ExpirationPlugin({maxEntries:16,maxAgeSeconds:86400})]}),"GET"),e.registerRoute(({request:e,url:{pathname:s},sameOrigin:c})=>"1"===e.headers.get("RSC")&&"1"===e.headers.get("Next-Router-Prefetch")&&c&&!s.startsWith("/api/"),new e.NetworkFirst({cacheName:"pages-rsc-prefetch",plugins:[new e.ExpirationPlugin({maxEntries:32,maxAgeSeconds:86400})]}),"GET"),e.registerRoute(({request:e,url:{pathname:s},sameOrigin:c})=>"1"===e.headers.get("RSC")&&c&&!s.startsWith("/api/"),new e.NetworkFirst({cacheName:"pages-rsc",plugins:[new e.ExpirationPlugin({maxEntries:32,maxAgeSeconds:86400})]}),"GET"),e.registerRoute(({url:{pathname:e},sameOrigin:s})=>s&&!e.startsWith("/api/"),new e.NetworkFirst({cacheName:"pages",plugins:[new e.ExpirationPlugin({maxEntries:32,maxAgeSeconds:86400})]}),"GET"),e.registerRoute(({sameOrigin:e})=>!e,new e.NetworkFirst({cacheName:"cross-origin",networkTimeoutSeconds:10,plugins:[new e.ExpirationPlugin({maxEntries:32,maxAgeSeconds:3600})]}),"GET")});


// ============================================
// PUSH NOTIFICATIONS HANDLERS (Auto-injected)
// ============================================

self.addEventListener('push', (event) => {
  console.log('📩 Push notification received');

  if (!event.data) {
    console.log('⚠️ Push event has no data');
    return;
  }

  try {
    const data = event.data.json();
    console.log('📦 Push data:', data);

    const {
      title = 'Nueva notificación',
      body = '',
      icon = '/icon-192x192.png',
      badge = '/badge-72x72.png',
      image,
      tag,
      data: notificationData = {},
      actions = [],
    } = data;

    const options = {
      body,
      icon,
      badge,
      image,
      tag,
      data: notificationData,
      vibrate: [200, 100, 200],
      requireInteraction: false,
      actions,
    };

    event.waitUntil(
      self.registration.showNotification(title, options)
    );
  } catch (error) {
    console.error('❌ Error parsing push notification:', error);
    event.waitUntil(
      self.registration.showNotification('Nueva notificación', {
        body: 'Ha llegado una nueva notificación',
        icon: '/icon-192x192.png',
      })
    );
  }
});

self.addEventListener('notificationclick', (event) => {
  console.log('🖱️ Notification clicked:', event);

  event.notification.close();

  const data = event.notification.data || {};
  const action = event.action;

  let urlToOpen = '/dashboard';

  if (action === 'view') {
    if (data.orderId) {
      urlToOpen = `/pedidos/${data.orderId}`;
    } else if (data.tableId) {
      urlToOpen = `/mesas/${data.tableId}`;
    } else if (data.url) {
      urlToOpen = data.url;
    }
  } else if (action === 'dismiss') {
    return;
  } else {
    if (data.url) {
      urlToOpen = data.url;
    } else if (data.orderId) {
      urlToOpen = `/pedidos/${data.orderId}`;
    } else if (data.tableId) {
      urlToOpen = `/mesas/${data.tableId}`;
    }
  }

  event.waitUntil(
    (async () => {
      const allClients = await self.clients.matchAll({
        type: 'window',
        includeUncontrolled: true,
      });

      for (const client of allClients) {
        try {
          const clientUrl = new URL(client.url);
          if (clientUrl.origin === self.location.origin) {
            if ('focus' in client) {
              await client.focus();
            }
            if ('navigate' in client) {
              await client.navigate(urlToOpen);
            }
            return;
          }
        } catch (e) {
          // Ignore invalid URLs
        }
      }

      if (self.clients.openWindow) {
        await self.clients.openWindow(urlToOpen);
      }
    })()
  );
});

self.addEventListener('notificationclose', (event) => {
  console.log('🔕 Notification closed:', event.notification.tag);
});

console.log('✅ Push notification handlers registered');

