import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { User } from "./user.entity";

@Entity({ name: "products" })
export class Product {
  @PrimaryGeneratedColumn()
  id!: number;

  @Index()
  @Column()
  user_id!: number;

  @ManyToOne(() => User, (u) => u.products, { onDelete: "CASCADE" })
  @JoinColumn({ name: "user_id" })
  user!: User;

  @Column({ type: "text" })
  name!: string;

  @Column({ type: "int", default: 0 })
  quantity!: number;

  @Column({ type: "date" })
  expiry_date!: string; // guardás "YYYY-MM-DD"

  @Index()
  @Column({ type: "timestamptz" })
  notify_at!: Date;

  @Index()
  @Column({ type: "timestamptz", nullable: true })
  notified_at!: Date | null;

}
