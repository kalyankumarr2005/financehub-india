const C = { reset:'\x1b[0m', green:'\x1b[32m', red:'\x1b[31m', cyan:'\x1b[36m', bold:'\x1b[1m' };
const ts = () => new Date().toLocaleTimeString('en-IN', { hour12:false });
export const log        = m => console.log('  ' + ts() + '  ' + m);
export const logSuccess = m => console.log('  OK ' + ts() + '  ' + m);
export const logError   = m => console.error('  ERR ' + ts() + '  ' + m);
export const logStep    = (n,l) => console.log('\n-- Step ' + n + ': ' + l);
