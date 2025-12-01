// ==================== schemas/departments.js ====================
import { model, Schema, Types } from 'mongoose';

const LocalizedField = {
  uz: { type: String, required: true },
  ru: { type: String, required: true },
  en: { type: String, required: true }
};

const ContactSchema = new Schema({
  type: {
    type: String,
    enum: ['phone', 'email', 'address', 'fax'],
    required: true
  },
  value: {
    type: String,
    required: true
  },
  label: {
    uz: String,
    ru: String,
    en: String
  }
}, { _id: false });

const DepartmentSchema = new Schema({
  // Slug for URL
  slug: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  
  // Localized title
  title: {
    type: new Schema(LocalizedField, { _id: false }),
    required: true
  },
  
  // Localized description
  description: {
    type: new Schema(LocalizedField, { _id: false })
  },
  
  // Department image/logo
  img: {
    type: String
  },
  
  // Department type
  kind: {
    type: String,
    enum: ['unesco', 'madaniyatshunoslik', 'other'],
    default: 'other'
  },
  
  // Head of department
  headId: {
    type: Types.ObjectId,
    ref: 'Leadership'
  },
  
  // Deputy heads
  deputyIds: [{
    type: Types.ObjectId,
    ref: 'Leadership'
  }],
  
  // ⭐ MUHIM: Employees array (Virtual emas, real field!)
  employees: [{
    type: Types.ObjectId,
    ref: 'Leadership'
  }],
  
  // Contact information
  contacts: [ContactSchema],
  
  // Display order
  order: {
    type: Number,
    default: 0
  },
  
  // Status
  status: {
    type: String,
    enum: ['active', 'archived'],
    default: 'active'
  },
  
  // Metadata
  createdBy: {
    type: Types.ObjectId,
    ref: 'User'
  },
  updatedBy: {
    type: Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
DepartmentSchema.index({ slug: 1 }, { unique: true });
DepartmentSchema.index({ kind: 1, status: 1 });
DepartmentSchema.index({ order: 1 });
DepartmentSchema.index({ 'title.uz': 'text', 'title.ru': 'text', 'title.en': 'text' });

// Virtuals (qo'shimcha ma'lumotlar uchun - optional)
DepartmentSchema.virtual('head', {
  ref: 'Leadership',
  localField: 'headId',
  foreignField: '_id',
  justOne: true
});

DepartmentSchema.virtual('deputies', {
  ref: 'Leadership',
  localField: 'deputyIds',
  foreignField: '_id'
});

// Generate slug from title if not provided
DepartmentSchema.pre('save', function(next) {
  if (this.isModified('title') && !this.slug) {
    this.slug = this.title.en
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }
  next();
});

export default model('Department', DepartmentSchema);