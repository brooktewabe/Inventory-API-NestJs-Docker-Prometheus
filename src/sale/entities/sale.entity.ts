import { Column, Entity, PrimaryGeneratedColumn, ManyToOne, JoinColumn } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { Stock } from '../../stock/entities/stock.entity';  

@Entity()
export class Sale {
  @PrimaryGeneratedColumn('uuid')
  id: uuidv4;

  @ManyToOne(() => Stock, stock => stock.id, { eager: true })  // Foreign key relationship
  @JoinColumn({ name: 'Product_id' })         // Join on 'Product_id'
  Product: Stock;

  @Column()
  Full_name: string;

  @Column()
  Contact: string;

  // @Column('decimal', { precision: 6, scale: 2 }) for mysql
  @Column('decimal')
  Amount: number;

  @Column()
  Quantity: number;

  @Column()
  Payment_method: string;

  @Column('decimal')
  Total_amount: number;

  @Column({ nullable: true })
  Credit_due: string;

  @Column('decimal',{ nullable: true})
  Credit: number;

  @Column({ nullable: true })
  Receipt: string;

  @Column()
  Transaction_id: string;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  Date: Date;
}
