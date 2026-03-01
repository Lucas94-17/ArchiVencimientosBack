import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  OneToMany,
  PrimaryGeneratedColumn,
} from "typeorm";
import { Product } from "./product.entity";

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Index({ unique: true })
  @Column({ type: "text" })
  device_id: string;

  @Column({ type: "text", nullable: true })
  expo_push_token!: string | null;
  @Column({ type: "text", nullable: true })
  email: string | null;
  @Column({ type: "text", nullable: true })
  password_hash: string | null;
  @CreateDateColumn({ type: "timestamptz" })
  created_at: Date;
   @OneToMany(() => Product, (p) => p.user)
  products!: Product[];
}
