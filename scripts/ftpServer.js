const axios = require('axios');
const FtpSrv = require('ftp-srv');

const { ftpErrors: errors } = FtpSrv;

const PORT = process.env.FTP_PORT || 9921;
const USERNAME = process.env.FTP_USERNAME || 'anonymous';
const PASSWORD = process.env.FTP_PASSWORD || '@anonymous';

const CUSTOM_FUNCTIONS_PORT = process.argv[2];
const url = `ftp://0.0.0.0:${PORT}`;
const pasv_url = `ftp://0.0.0.0:${PORT}`;

const ftpServer = new FtpSrv({
	url,
	pasv_url,
	pasv_min: 9400,
	pasv_max: 9500,
	anonymous: true,
});

ftpServer.on('login', ({ connection, username, password }, resolve, reject) => {
	if (username === USERNAME && password === PASSWORD) {
		connection.on('STOR', (error, filename) => {
			const fnbs64 = Buffer.from(filename).toString('base64');
			console.log('filename', filename);
			axios(`http://localhost:${CUSTOM_FUNCTIONS_PORT}/ftp-server/importLocalCsvFile/${fnbs64}`);
		});
		return resolve({ root: process.env.HOME });
	}
	return reject(new errors.GeneralError('Invalid username or password', 401));
});

ftpServer.listen().then(() => {
	console.log(`Ftp server is starting on ${url}`);
});
