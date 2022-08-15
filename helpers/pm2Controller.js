/* PM2 Controller
This enables starting, stopping, and restarting a service via pm2
*/

const pm2 = require('pm2');
const path = require('path');

async function start(scriptName, args = [], { logger }) {
	await new Promise((r) => pm2.connect(r));
	const list = await new Promise((r) => pm2.list((error, list) => r(list)));
	const isRunning = list.some((a) => a.name === scriptName);
	if (isRunning) {
		logger.notify(`PM2 Process ${scriptName} is already running. Stopping.`);
		await new Promise((r) => pm2.delete(scriptName, r));
		logger.notify(`PM2 Process ${scriptName} has been stopped.`);
	}
	logger.notify(`PM2 Process ${scriptName} is starting.`);
	const appObject = {
		script: path.join(__dirname, '..', 'scripts', `${scriptName}.js`),
		name: scriptName,
		exec_mode: 'fork',
		args,
		instances: 1,
	};
	await new Promise((r) => pm2.start(appObject, r));
	logger.notify(`PM2 Process ${scriptName} has been started.`);
	return true;
}

async function stop(scriptName, { logger }) {
	await new Promise((r) => pm2.connect(r));
	const list = await new Promise((r) => pm2.list((error, list) => r(list)));
	const isRunning = list.some((a) => a.name === scriptName);
	if (isRunning) {
		logger.notify(`PM2 Process ${scriptName} is stopping.`);
		await new Promise((r) => pm2.delete(scriptName, r));
		logger.notify(`PM2 Process ${scriptName} has been stopped.`);
		return true;
	}
	logger.notify(`PM2 Process ${scriptName} is not running.`);
	return false;
}

module.exports = {
	start,
	stop,
};
