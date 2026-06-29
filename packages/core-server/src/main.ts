import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const config = app.get(ConfigService);

  // 安全防護
  app.use(helmet({ crossOriginResourcePolicy: false }));
  app.use(cookieParser());

  // CORS
  app.enableCors({
    origin: config.get('CORS_ORIGIN', '*'),
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  // 全域驗證
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: false,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  // API 前綴
  app.setGlobalPrefix('api');

  // Health check 端點（不依賴資料庫，放在 SPA 中間件之前）
  const httpAdapter = app.getHttpAdapter();
  httpAdapter.get('/health', (req: any, res: any) => {
    res.status(200).json({ status: 'ok', uptime: process.uptime() });
  });

  // 生產環境：服務前端靜態檔案
  const isProd = process.env.NODE_ENV === 'production';
  if (isProd) {
    const frontendDist = join(__dirname, '..', '..', 'core-web', 'dist');
    app.useStaticAssets(frontendDist);
    app.setViewEngine('html');
    // 所有非 API 非 health 路由導向前端 index.html（SPA 支援）
    app.use((req: any, res: any, next: any) => {
      if (req.path.startsWith('/api') || req.path === '/health') return next();
      res.sendFile(join(frontendDist, 'index.html'));
    });
  }

  // Railway 會透過 PORT 環境變數動態分配 port
  const port = parseInt(process.env.PORT || config.get('SERVER_PORT', '3000'), 10);
  await app.listen(port, '0.0.0.0');
  console.log(`伺服器已啟動: port ${port}`);
}
bootstrap();
