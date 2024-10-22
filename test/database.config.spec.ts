import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { config } from '../src/typeorm.config'; 

describe('TypeORM Configuration', () => {
  let module: TestingModule;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot(config),
      ],
    }).compile();
  });

  afterAll(async () => {
    await module.close();
  });

  it('should connect to the database', async () => {
    const connection = module.get('Connection');
    expect(connection).toBeDefined();
    
    // Optionally, check the connection state
    const isConnected = await connection.isConnected;
    expect(isConnected).toBe(true);
  });

  it('should have the correct database settings', () => {
    const connectionOptions = module.get('ConnectionOptions');
    expect(connectionOptions).toMatchObject({
      type: 'postgres',
      username: 'postgres',
      password: '1234',
      port: 5432,
      database: 'inventory',
      host: '127.0.0.1',
    });
  });
});
