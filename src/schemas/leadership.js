// ==================== schemas/leadership.js ====================
import { Schema, Types, model } from 'mongoose';

const LocalizedField = {
  uz: { type: String, required: false },
  ru: { type: String, required: false },
  en: { type: String, required: false }
};

const LeadershipSchema = new Schema({
  // Localized name
  name: {
    type: new Schema(LocalizedField, { _id: false }),
    required: true
  },

  // Role/Position
  position: {
    type: new Schema(LocalizedField, { _id: false }),
    required: true
  },

  // ===== YANGI: Role turi (rahbariyat yoki oddiy xodim) =====
  role: {
    type: String,
    enum: ['leadership', 'employee'],  // rahbariyat yoki oddiy xodim
    required: true,
    default: 'employee'
  },

  // ===== O'ZGARTIRILDI: Department faqat oddiy xodimlar uchun majburiy =====
  departmentId: {
    type: Types.ObjectId,
    ref: 'Department',
    required: function() {
      return this.role === 'employee';  // Faqat xodimlar uchun majburiy
    }
  },

  // Profile image
  img: {
    type: String,
    required: true
  },

  // Biography (localized)
  bio: {
    type: new Schema(LocalizedField, { _id: false }),
    required: false
  },

  // Contact info
  email: {
    type: String,
    trim: true,
    lowercase: true
  },
  phone: {
    type: String,
    trim: true
  },
  workPhone: {
    type: String,
    trim: true
  },

  // Academic info
  academicDegree: {
    type: String,
    trim: true
  },
  scientificInterests: [{
    type: String
  }],

  // Reception schedule
  schedule: {
    days: [{
      type: String,
      enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
    }],
    start: {
      type: String,
      match: /^([01]\d|2[0-3]):([0-5]\d)$/  // HH:MM format
    },
    end: {
      type: String,
      match: /^([01]\d|2[0-3]):([0-5]\d)$/
    }
  },

  // Display order
  order: {
    type: Number,
    default: 0
  },

  // Status
  isActive: {
    type: Boolean,
    default: true
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
LeadershipSchema.index({ role: 1, departmentId: 1, order: 1 });
LeadershipSchema.index({ role: 1, isActive: 1 });
LeadershipSchema.index({ 'name.uz': 'text', 'name.ru': 'text', 'name.en': 'text' });

// Virtual for department
LeadershipSchema.virtual('department', {
  ref: 'Department',
  localField: 'departmentId',
  foreignField: '_id',
  justOne: true
});

// ===== YANGI: Validation - Rahbariyatda departmentId bo'lmasligi kerak =====
LeadershipSchema.pre('save', function(next) {
  if (this.role === 'leadership' && this.departmentId) {
    return next(new Error('Rahbariyat uchun departmentId berilmasligi kerak'));
  }
  if (this.role === 'employee' && !this.departmentId) {
    return next(new Error('Xodim uchun departmentId majburiy'));
  }
  next();
});

export default model('Leadership', LeadershipSchema);