import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
	const app = await NestFactory.create(AppModule);
	app.enableCors({ origin: process.env.NODE_ENV === 'production' ? `http://${process.env.FRONTEND_URL}` : 'http://localhost:8080' });
	await app.listen(3000);
	console.log(`Application is running on: ${await app.getUrl()}`);
}
bootstrap();
