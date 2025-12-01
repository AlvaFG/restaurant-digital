/**
 * Generate VAPID Keys for Web Push
 * Run: node scripts/generate-vapid-keys.js
 */

const webpush = require('web-push');

console.log('🔐 Generating VAPID keys for Web Push...\n');

const vapidKeys = webpush.generateVAPIDKeys();

console.log('✅ VAPID Keys generated successfully!\n');
console.log('📋 Add these to your .env.local file:\n');
console.log(`NEXT_PUBLIC_VAPID_PUBLIC_KEY="${vapidKeys.publicKey}"`);
console.log(`VAPID_PRIVATE_KEY="${vapidKeys.privateKey}"`);

console.log('\n📋 Add these to Supabase Edge Function Secrets:\n');
console.log('Go to: Supabase Dashboard > Edge Functions > Secrets');
console.log(`VAPID_PUBLIC_KEY="${vapidKeys.publicKey}"`);
console.log(`VAPID_PRIVATE_KEY="${vapidKeys.privateKey}"`);
console.log(`VAPID_SUBJECT="mailto:your-email@restaurant.com"`);

console.log('\n📝 Keys saved to vapid-keys.json');

const fs = require('fs');
fs.writeFileSync(
  'vapid-keys.json',
  JSON.stringify({
    publicKey: vapidKeys.publicKey,
    privateKey: vapidKeys.privateKey,
    subject: 'mailto:your-email@restaurant.com',
    generatedAt: new Date().toISOString(),
  }, null, 2)
);

console.log('\n⚠️  IMPORTANT: Keep vapid-keys.json secure and DO NOT commit to git!');
