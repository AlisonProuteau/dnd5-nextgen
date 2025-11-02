const fs = require('fs');

function msToMinSec(ms) {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}m${seconds}s`;
}

const sep = '\n----------------------------------------\n';

function prettyPrintStats(stats) {
  return (
    `${sep}` +
    ` \n\t   TEST SUMMARY\n` +
    `${sep}` +
    `${'Suites:'}${stats.suites}\n` +
    `${'Tests:'}${stats.tests}\n` +
    `${'Passes:'}${stats.passes}\n` +
    `${'Failures:'}${stats.failures}\n` +
    `${'Skipped:'}${stats.skipped}\n` +
    `${'Pending:'}${stats.pending}\n` +
    `${'Pass %:'}${stats.passPercent.toFixed(2)}\n` +
    `${'Duration:'}${msToMinSec(stats.duration)}\n` +
    `${sep}`
  );
}

function prettyPrintReport(report) {
  let output = prettyPrintStats(report.stats);
  output += '\n\tTEST FILES BREAKDOWN\n';
  output += sep;

  report.results?.forEach((res) => {
    output += `\nFile: ${res.file || '(unknown)'}\n`;
    let output2 = '';

    let passes = 0;
    let failures = 0;
    let skipped = 0;
    let pending = 0;
    let duration = 0;

    // Iterate through suites and tests
    res.suites?.forEach((suite) => {
      const tests = suite.tests?.length ? suite.tests : suite?.suites.flatMap(({ tests }) => tests);
      if (tests.some(({ state }) => state === 'failed')) {
        output2 += `\n\tSuite: ${suite.title || '(no title)'}\n`;
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
          output2 += `\t\tError: ${errMsg
            .replace(/\n\n/g, '\n\t\t')
            .replace('    ', '\t\t    ')}\n`;
        }
      });
    });

    output += `${'-- Passes:'}${passes}`;
    output += `${' ; Failures:'}${failures}`;
    output += `${' ; Skipped:'}${skipped}`;
    output += `${' ; Pending:'}${pending}`;
    output += `${' ; Duration:'}${`${msToMinSec(duration)}`} --\n`;
    output += output2;
    output += sep;
  });

  return output;
}

const report = JSON.parse(fs.readFileSync('./cypress/reports/results.json', 'utf8'));
if (report) fs.writeFileSync('./cypress/reports/results.txt', prettyPrintReport(report), 'utf8');
else throw new Error('No report found');
