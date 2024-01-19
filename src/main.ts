import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as fs from 'fs';

const httpsOptions =
	process.env.NODE_ENV === 'production'
		? {
				key: fs.readFileSync(process.env.SSL_CERT_PATH),
				cert: fs.readFileSync(process.env.SSL_KEY_PATH),
		  }
		: undefined;

async function bootstrap() {
	const app = await NestFactory.create(AppModule, { httpsOptions });
	app.enableCors({
		origin:
			process.env.NODE_ENV === 'production'
				? `http://${process.env.FRONTEND_URL}`
				: 'http://localhost:8080',
	});
	await app.listen(3000);
	console.log(`Application is running on: ${await app.getUrl()}`);
}
bootstrap();
