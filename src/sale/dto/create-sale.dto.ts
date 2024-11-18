export class CreateSaleDto {
  Product_id: string;
  Full_name: string;
  Contact: string;
  Amount: number;
  Quantity: number;
  EachQuantity: string;
  Payment_method: string;
  Total_amount: number;
  Credit_due: string;
  Credit: number;
  Receipt: string;
  Transaction_id: string;
  Return_reason: string;
  Sale_type: string;
  Date: Date;
}