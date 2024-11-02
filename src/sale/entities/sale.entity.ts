import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';

@Entity()
export class Sale {
  @PrimaryGeneratedColumn('uuid')
  id: uuidv4;

  @Column()
  Product_id: string;

  @Column()
  Full_name: string;

  @Column()
  Contact: string;
  
  @Column('decimal', { precision: 6, scale: 2 })
  Amount: number;
  
  @Column()
  Quantity: number;
  
  @Column()
  Payment_method: string;

  @Column({default :"Single"})
  Sale_type: string;
  
  @Column('decimal', { precision: 6, scale: 2 })
  Total_amount: number;
  
  @Column()
  Credit_due: string;

  @Column('decimal', { precision: 6, scale: 2 })
  Credit: number;

  @Column({ nullable: true })
  Receipt: string;

  @Column({ nullable: true })
  Return_reason: string;

  @Column()
  Transaction_id: string;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  Date: Date;
}
