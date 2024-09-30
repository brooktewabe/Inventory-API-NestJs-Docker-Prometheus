import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';

@Entity()
export class Movement {
  @PrimaryGeneratedColumn('uuid')
  id: uuidv4;

  @Column({nullable: true})
  Product_id: string;

  @Column()
  Name: string;

  @Column()
  Type: string;

  @Column()
  Adjustment: number;
  
  @CreateDateColumn()
  Date: Date;
  
  @Column()
  User: string;

}