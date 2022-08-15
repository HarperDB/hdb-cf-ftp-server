'use strict';

const pm2Controller = require('../helpers/pm2Controller');
const FTP_SCRIPT_NAME = 'ftpServer';
const { CUSTOM_FUNCTIONS_PORT } = process.env;
const knownSchema = {};

module.exports = async (server, { hdbCore, logger }) => {
	// server.route({
	//   url: "/p",
	//   method: "GET",
	//   handler: async (request, response) => {
	//     return process.env;
	//   },
	// });
	server.route({
		url: '/r',
		method: 'GET',
		handler: async (request, response) => {
			return hdbCore.requestWithoutAuthentication({
				body: {
					operation: 'restart_service',
					service: 'custom_functions',
				},
			});
		},
	});
	server.route({
		url: '/start',
		method: 'GET',
		handler: async (request, response) => {
			await pm2Controller.start(FTP_SCRIPT_NAME, [CUSTOM_FUNCTIONS_PORT], {
				logger,
			});
			return 'The FTP server has been started.';
		},
	});
	server.route({
		url: '/stop',
		method: 'GET',
		handler: async (request, response) => {
			await pm2Controller.stop(FTP_SCRIPT_NAME, { logger });
			return 'The FTP server has been stopped.';
		},
	});
	server.route({
		url: '/importLocalCsvFile/:filePath',
		method: 'GET',
		handler: async (request, response) => {
			logger.notify('/importLocalCsvFile IP: ' + request.ip);
			const validIps = ['::ffff:127.0.0.1', '127.0.0.1'];
			if (!validIps.includes(request.ip)) {
				return response.code(401).send('Unauthorized');
			}
			const file_path = Buffer.from(request.params.filePath, 'base64').toString();
			logger.notify('Importing CSV File from: ' + file_path);

			const [schema, table] = file_path.split('/').pop().split('.').shift().split('-');

			// schema check
			if (!knownSchema[schema]) {
				logger.info(`Schema ${schema} not in known-schema-cache. Attempting to create.`);
				try {
					await hdbCore.requestWithoutAuthentication({
						body: {
							operation: 'create_schema',
							schema,
						},
					});
					logger.info(`Schema ${schema} created.`);
					await new Promise((r) => setTimeout(r, 500));
				} catch {
					logger.info(`Schema ${schema} already exists.`);
				}
				knownSchema[schema] = {};
			}

			// table check
			if (!knownSchema[schema][table]) {
				logger.info(`Table ${schema}.${table} not in known-schema-cache. Attempting to create.`);
				try {
					await hdbCore.requestWithoutAuthentication({
						body: {
							operation: 'create_table',
							schema,
							table,
							hash_attribute: 'id',
						},
					});
					await new Promise((r) => setTimeout(r, 500));
					logger.info(`Table ${schema}.${table} has been created.`);
				} catch {
					logger.info(`Table ${schema}.${table} already exists.`);
				}
				knownSchema[schema][table] = true;
			}

			// insert CSV data
			await hdbCore.requestWithoutAuthentication({
				body: {
					hdb_user: {
						username: 'Custom Function User',
						role: {
							permission: {
								super_user: true,
							},
						},
					},
					operation: 'csv_file_load',
					action: 'insert',
					schema,
					table,
					file_path,
					transact_to_cluster: true,
				},
			});
			return response.code(200).send();
		},
	});
};
