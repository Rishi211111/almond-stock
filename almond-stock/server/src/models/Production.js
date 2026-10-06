import mongoose from 'mongoose';
import { GRADES } from '../config/constants.js';
import { isValidDate } from '../utils/dates.js';
import { cleanTransform } from './_json.js';

const productionSchema = new mongoose.Schema(
  {
    date: {
      type: String,
      required: true,
      validate: { validator: isValidDate, message: 'Date must be a valid date (YYYY-MM-DD).' },
    },
    batchNo: { type: String, required: true, trim: true, maxlength: 40, unique: true },
    grade: { type: String, enum: GRADES, required: true },
    quantityKg: { type: Number, required: true, min: [0.1, 'Quantity must be at least 0.1 kg.'] },
    rawInputKg: { type: Number, min: 0.1, default: null },
    notes: { type: String, trim: true, maxlength: 300, default: '' },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true, toJSON: { transform: cleanTransform } }
);

productionSchema.index({ date: -1 });
productionSchema.index({ grade: 1, date: 1 });

export default mongoose.model('Production', productionSchema);
