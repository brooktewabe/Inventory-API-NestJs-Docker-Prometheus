import { TypeOrmModuleOptions } from '@nestjs/typeorm';

// for mySQL
// export const config: TypeOrmModuleOptions = {
//   type: 'mysql',
//   username: 'root',
//   password: process.env.DB_PASSWORD,
//   port: 3306,
//   database: 'inventory',
//   host: '127.0.0.1',
//   synchronize: true,
//   // entities: [__dirname + '/../**/*.entity.{ts,js}'],
//   entities: ['dist/**/*.entity{.ts,.js}'],
// };
// for postgreSQL
export const config: TypeOrmModuleOptions = {
  type: 'postgres',
  username: 'postgres',
  password: '1234',
  port: 5432,
  database: 'inventory',
  host: '127.0.0.1',
  // host: 'postgres_db', // for docker prometheus setup uncomment this
  synchronize: true,
  entities: [__dirname + '/../**/*.entity.{ts,js}'],
};
