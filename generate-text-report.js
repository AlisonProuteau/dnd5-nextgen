const fs = require('fs');

function msToMinSec(ms) {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}m ${seconds}s`;
}

function prettyPrintStats(stats) {
  const passIcon = stats.failures === 0 ? '✅' : '⚠️';
  const passRate = stats.passPercent.toFixed(2);
  
  // Try to read Cypress Cloud URL if available
  let cypressUrl = '';
  try {
    cypressUrl = fs.readFileSync('./cypress/reports/cypress-url.txt', 'utf8').trim();
  } catch (e) {
    // File doesn't exist, skip
  }
  
  return (
    `## ${passIcon} Cypress Test Results\n\n` +
    `| Metric | Value |\n` +
    `|--------|-------|\n` +
    `| **Suites** | ${stats.suites} |\n` +
    `| **Tests** | ${stats.tests} |\n` +
    `| **✅ Passes** | ${stats.passes} |\n` +
    `| **❌ Failures** | ${stats.failures} |\n` +
    `| **⏭️ Skipped** | ${stats.skipped} |\n` +
    `| **⏸️ Pending** | ${stats.pending} |\n` +
    `| **📊 Pass Rate** | ${passRate}% |\n` +
    `| **⏱️ Duration** | ${msToMinSec(stats.duration)} |\n` +
    (cypressUrl ? `\n[📊 View full results on Cypress Cloud](${cypressUrl})\n` : '') +
    `\n`
  );
}

function prettyPrintReport(report) {
  let output = prettyPrintStats(report.stats);

  if (report.stats.failures > 0) {
    output += '## 📋 Failed Test Files\n\n';

    report.results?.forEach((res) => {
      let output2 = '';

      let passes = 0;
      let failures = 0;
      let skipped = 0;
      let pending = 0;
      let duration = 0;

      // Iterate through suites and tests
      res.suites?.forEach((suite) => {
        const tests = suite.tests?.length
          ? suite.tests
          : suite?.suites.flatMap(({ tests }) => tests);
        if (tests.some(({ state }) => state === 'failed')) {
          output2 += `\n**Suite:** ${suite.title || '(no title)'}\n\n`;
        }

        tests?.forEach((test) => {
          duration += test.duration || suite.duration || 0;
          const status = test.state || '(unknown)';
          switch (status) {
            case 'passed':
              passes++;
              break;
            case 'failed':
              failures++;
              break;
            case 'skipped':
              skipped++;
              break;
            case 'pending':
              pending++;
              break;
            default:
              break;
          }
          if (status === 'failed' && test.err) {
            const errMsg =
              test.err.estack ||
              test.err.message ||
              test.err.stack ||
              test.err.toString() ||
              '(no error message)';
            output2 += `\`\`\`\n${errMsg}\n\`\`\`\n\n`;
          }
        });
      });

      // Only print file breakdown if this file has failures
      if (failures > 0) {
        output += `### ❌ \`${res.file || '(unknown)'}\`\n\n`;
        output += `**Stats:** `;
        output += `✅ ${passes} passed`;
        output += ` • ❌ ${failures} failed`;
        if (skipped > 0) output += ` • ⏭️ ${skipped} skipped`;
        if (pending > 0) output += ` • ⏸️ ${pending} pending`;
        output += ` • ⏱️ ${msToMinSec(duration)}\n`;
        output += output2;
        output += '\n---\n\n';
      }
    });
  }
  return output;
}

const report = JSON.parse(fs.readFileSync('./cypress/reports/results.json', 'utf8'));
if (report) fs.writeFileSync('./cypress/reports/results.txt', prettyPrintReport(report), 'utf8');
else throw new Error('No report found');
