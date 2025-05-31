import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { User } from './users/user.entity';
import { MailerModule } from '@nestjs-modules/mailer';
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true, // Hace que ConfigModule esté disponible globalmente
      envFilePath: '.env',
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get<string>('PGHOST'),
        port: configService.get<number>('PGPORT'),
        username: configService.get<string>('PGUSER'),
        password: configService.get<string>('PGPASSWORD'),
        database: configService.get<string>('PGDATABASE'),
        entities: [User], // Puedes usar [__dirname + '/../**/*.entity{.ts,.js}'] para auto-detectar
        synchronize: true, // true para desarrollo (crea tablas automáticamente), false para producción (usa migraciones)
        ssl: true, // Cambia a true si usas SSL
      }),
      inject: [ConfigService],
    }),
    MailerModule.forRoot({
      transport: {
        service: 'gmail',
        auth: {
          user: 'pulidojj174@gmail.com',
          pass: 'ozpz bwwo ltsb zwxn',
        },
      },
      defaults: {
        from: '"No Reply" <no-reply@tudominio.com>',
      },
    }),
    UsersModule,
    AuthModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
