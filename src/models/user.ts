import { DataTypes, Model } from 'sequelize';
import bcrypt from 'bcrypt';
import {sequelize} from '../config/database';

class User extends Model {
  public id!: number;
  public name!: string;
  public email!: string;
  public phone!: string;
  public password!: string;
  public isEmailVerified!: boolean;
  public emailVerificationToken!: string;
  public emailVerificationExpires!: Date;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  public static async comparePassword(storedPassword: string, inputPassword: string): Promise<boolean> {
    return await bcrypt.compare(inputPassword, storedPassword);
  }
}

User.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: true,
      unique: true,
      validate: {
        isEmail: true,
      },
    },
    phone: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    password: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    isEmailVerified: {
        type:DataTypes.BOOLEAN,
        defaultValue: false,
        allowNull:false
    },
    emailVerificationToken: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    emailVerificationExpires: {
        type: DataTypes.DATE,
        allowNull: true,
    }
    
  },
  {
    sequelize,
    tableName: 'users',
    
  }
);

export default User;
