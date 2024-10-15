import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';

@Entity()
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: uuidv4;

  @Column()
  fname: string;

  @Column()
  lname: string;

  @Column()
  password: string;

  @Column()
  email: string;

  @Column()
  role: string;

  @Column({ nullable: true }) // Optional: Store refresh tokens
  refreshToken?: string;
}
