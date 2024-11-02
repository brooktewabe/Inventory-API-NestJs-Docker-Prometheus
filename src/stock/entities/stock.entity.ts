import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';

@Entity()
export class Stock {
  @PrimaryGeneratedColumn('uuid')
  id: uuidv4;

  @Column()
  Name: string;

  @Column()
  Category: string;

  @Column()
  Curent_stock: number;

  @Column('decimal', { precision: 6, scale: 2 })
  Price: number

  @Column()
  Reorder_level: number;

  @Column()
  Location: string;

  @Column({default: 'Finished Product'})
  Type: string;

  @Column({ nullable: true })
  Product_image: string;
}
