/**
 * Test Script for Threshold Logic
 * Validates PDF Step 2: Check if delay exceeds threshold
 */

import { CheckDelayThresholdUseCase } from '../src/core/engine/delivery/CheckDelayThreshold';
import type { TrafficData } from '../src/types/shared/traffic.types';

async function testThresholdLogic() {
  console.log('🧪 Testing Threshold Logic (PDF Step 2)\n');
  console.log('═'.repeat(60));

  const useCase = new CheckDelayThresholdUseCase();

  // Test cases covering all scenarios
  const testCases = [
    {
      name: 'Well within threshold',
      delayMinutes: 15,
      threshold: 30,
      expectedProceed: false,
    },
    {
      name: 'Exactly at threshold',
      delayMinutes: 30,
      threshold: 30,
      expectedProceed: false,
    },
    {
      name: 'Just over threshold',
      delayMinutes: 31,
      threshold: 30,
      expectedProceed: true,
    },
    {
      name: 'Significantly over threshold',
      delayMinutes: 45,
      threshold: 30,
      expectedProceed: true,
    },
    {
      name: 'Severe delay',
      delayMinutes: 90,
      threshold: 30,
      expectedProceed: true,
    },
    {
      name: 'Custom threshold (higher)',
      delayMinutes: 20,
      threshold: 45,
      expectedProceed: false,
    },
    {
      name: 'Custom threshold (lower)',
      delayMinutes: 20,
      threshold: 15,
      expectedProceed: true,
    },
    {
      name: 'No delay',
      delayMinutes: 0,
      threshold: 30,
      expectedProceed: false,
    },
  ];

  let passed = 0;
  let failed = 0;

  for (const testCase of testCases) {
    console.log(`\n📝 Test: ${testCase.name}`);
    console.log(`   Input: Delay ${testCase.delayMinutes}min, Threshold ${testCase.threshold}min`);

    const trafficData: TrafficData = {
      provider: 'google',
      delayMinutes: testCase.delayMinutes,
      trafficCondition: 'moderate',
      estimatedDuration: 3600,
      normalDuration: 3000,
      fetchedAt: new Date(),
    };

    const result = useCase.execute(trafficData, testCase.threshold);

    if (result.success) {
      const actualProceed = result.value.shouldProceed;
      const testPassed = actualProceed === testCase.expectedProceed;

      if (testPassed) {
        console.log(`   ✅ PASS`);
        console.log(`   Expected: ${testCase.expectedProceed ? 'PROCEED' : 'SKIP'}`);
        console.log(`   Got: ${actualProceed ? 'PROCEED' : 'SKIP'}`);
        console.log(`   Reason: ${result.value.reason}`);
        passed++;
      } else {
        console.log(`   ❌ FAIL`);
        console.log(`   Expected: ${testCase.expectedProceed ? 'PROCEED' : 'SKIP'}`);
        console.log(`   Got: ${actualProceed ? 'PROCEED' : 'SKIP'}`);
        console.log(`   Reason: ${result.value.reason}`);
        failed++;
      }
    } else {
      console.log(`   ❌ ERROR: ${result.error.message}`);
      failed++;
    }
  }

  console.log('\n' + '═'.repeat(60));
  console.log(`\n📊 Test Results:`);
  console.log(`   ✅ Passed: ${passed}/${testCases.length}`);
  console.log(`   ❌ Failed: ${failed}/${testCases.length}`);
  console.log(`   Success Rate: ${Math.round((passed / testCases.length) * 100)}%\n`);

  if (failed === 0) {
    console.log('🎉 All tests passed! Threshold logic working correctly.\n');
  } else {
    console.log('⚠️  Some tests failed. Please review the implementation.\n');
    process.exit(1);
  }
}

// Run tests
testThresholdLogic().catch((error) => {
  console.error('❌ Test execution failed:', error);
  process.exit(1);
});