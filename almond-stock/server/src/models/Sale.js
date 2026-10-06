import mongoose from 'mongoose';
import { GRADES } from '../config/constants.js';
import { isValidDate } from '../utils/dates.js';
import { cleanTransform } from './_json.js';

const saleSchema = new mongoose.Schema(
  {
    date: {
      type: String,
      required: true,
      validate: { validator: isValidDate, message: 'Date must be a valid date (YYYY-MM-DD).' },
    },
    customer: { type: String, required: [true, 'Customer is required.'], trim: true, maxlength: 120 },
    grade: { type: String, enum: GRADES, required: true },
    quantityKg: { type: Number, required: true, min: [0.1, 'Quantity must be at least 0.1 kg.'] },
    ratePerKg: { type: Number, required: true, min: [0, 'Rate cannot be negative.'] },
    notes: { type: String, trim: true, maxlength: 300, default: '' },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  {
    timestamps: true,
    toJSON: {
      transform(doc, ret) {
        cleanTransform(doc, ret);
        ret.amount = Math.round(ret.quantityKg * ret.ratePerKg * 100) / 100;
        return ret;
      },
    },
  }
);

saleSchema.index({ date: -1 });
saleSchema.index({ grade: 1, date: 1 });

export default mongoose.model('Sale', saleSchema);
