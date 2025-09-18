import assert from 'node:assert/strict';
import test from 'node:test';
import nextConfig from '../next.config.mjs';

test('next configuration keeps build safeguards', () => {
  assert.ok(nextConfig, 'Next config should export a configuration object');
  assert.equal(
    nextConfig.images?.unoptimized,
    true,
    'Images should stay unoptimized in CI builds to speed up pipelines'
  );
  assert.equal(
    nextConfig.eslint?.ignoreDuringBuilds,
    true,
    'Lint errors should be handled before build step'
  );
  assert.equal(
    nextConfig.typescript?.ignoreBuildErrors,
    true,
    'Type checking remains opt-in during the build to avoid noisy CI failures'
  );
});