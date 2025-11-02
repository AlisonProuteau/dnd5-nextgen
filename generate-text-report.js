const { merge } = require('mochawesome-merge');

function pad(str, len) {
  return String(str).padEnd(len, ' ');
}

function msToMinSec(ms) {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}m${seconds}s`;
}

function prettyPrintStats(stats) {
  const sep = '\n========================================\n';
  return (
    `${sep}` +
    ` \n\t   TEST SUMMARY\n` +
    `${sep}` +
    `${pad('Suites:', 15)}${pad(stats.suites, 8)}\n` +
    `${pad('Tests:', 15)}${pad(stats.tests, 8)}\n` +
    `${pad('Passes:', 15)}${pad(stats.passes, 8)}\n` +
    `${pad('Failures:', 15)}${pad(stats.failures, 8)}\n` +
    `${pad('Skipped:', 15)}${pad(stats.skipped, 8)}\n` +
    `${pad('Pending:', 15)}${pad(stats.pending, 8)}\n` +
    `${pad('Pass %:', 15)}${pad(stats.passPercent.toFixed(2), 8)}\n` +
    `${pad('Duration:', 15)}${pad(msToMinSec(stats.duration), 8)}\n` +
    `${sep}`
  );
}

function prettyPrintReport(report) {
  let output = prettyPrintStats(report.stats);
  output += '\n\tTEST FILES BREAKDOWN\n';
  output += '\n----------------------------------------\n';

  report.results?.forEach((res) => {
    output += `File: ${res.file || '(unknown)'}\n`;
    let output2 = '';

    let passes = 0;
    let failures = 0;
    let skipped = 0;
    let pending = 0;
    let duration = 0;

    // Iterate through suites and tests
    res.suites?.forEach((suite) => {
      const tests = suite.tests?.length ? suite.tests : suite.suites.flatMap(({ tests }) => tests);
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

    output += `${pad('   Passes:', 12)}${pad(passes, 6)}`;
    output += `${pad('Failures:', 12)}${pad(failures, 6)}`;
    output += `${pad('Skipped:', 12)}${pad(skipped, 6)}`;
    output += `${pad('Pending:', 12)}${pad(pending, 6)}`;
    output += `${pad('Duration:', 12)}${pad(`${msToMinSec(duration)}`, 8)}\n`;
    output += output2;
    output += '----------------------------------------\n';
  });

  return output;
}

merge({ files: ['./cypress/reports/*.json'] }).then((report) => {
  console.log(prettyPrintReport(report));
});
