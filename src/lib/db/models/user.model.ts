import mongoose, { Schema, Document } from 'mongoose';
import bcrypt from 'bcrypt';

interface UserPreferences {
  defaultLanguage: 'en' | 'ar';
  theme: 'light' | 'dark' | 'system';
}

export interface IUser extends Document {
  email: string;
  password: string;
  name: string;
  role: 'admin' | 'user';
  createdAt: Date;
  lastLogin?: Date;
  preferences: UserPreferences;
  isActive: boolean;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const userSchema = new Schema<IUser>({
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    validate: {
      validator: function(v: string) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
      },
      message: props => `${props.value} is not a valid email address!`
    }
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [8, 'Password must be at least 8 characters long'],
  },
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    minlength: [2, 'Name must be at least 2 characters long'],
  },
  role: {
    type: String,
    enum: ['admin', 'user'],
    default: 'user',
  },
  createdAt: {
    type: Date,
    default: Date.now,
    immutable: true,
  },
  lastLogin: {
    type: Date,
  },
  preferences: {
    defaultLanguage: {
      type: String,
      enum: ['en', 'ar'],
      default: 'en',
    },
    theme: {
      type: String,
      enum: ['light', 'dark', 'system'],
      default: 'system',
    }
  },
  isActive: {
    type: Boolean,
    default: true,
  },
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error as Error);
  }
});

// Update lastLogin
userSchema.methods.updateLastLogin = async function(): Promise<void> {
  this.lastLogin = new Date();
  await this.save();
};

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword: string): Promise<boolean> {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch {
    throw new Error('Password comparison failed');
  }
};

// Email validation
userSchema.path('email').validate(async function(email: string) {
  const emailCount = await mongoose
    .models.User
    .countDocuments({ email: email, _id: { $ne: this._id } });
  return !emailCount;
}, 'Email already exists');

// Indexes
userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ role: 1 });

export const User = mongoose.models.User || mongoose.model<IUser>('User', userSchema);
