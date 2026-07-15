import { z } from 'zod';

const objectId = z.string().min(1, 'ID is required');

export const createAppointmentSchema = z.object({
  body: z.object({
    doctor: objectId.optional(),
    doctorId: objectId.optional(),
    patient: objectId.optional(),
    patientId: objectId.optional(),
    appointmentDate: z.string().min(1, 'Date is required'),
    timeSlot: z.string().min(1, 'Time slot is required'),
    reason: z.string().min(2, 'Reason is required').max(2000),
    status: z.enum(['requested', 'confirmed', 'completed', 'cancelled', 'no-show']).optional(),
  }),
});

export const updateAppointmentStatusSchema = z.object({
  body: z
    .object({
      status: z
        .enum(['requested', 'confirmed', 'completed', 'cancelled', 'no-show'])
        .optional(),
      cancellationReason: z.string().max(500).optional(),
      visitSummary: z.string().max(4000).optional(),
      queueStatus: z
        .enum(['not_arrived', 'waiting', 'in_room', 'done'])
        .optional(),
    })
    .refine((b) => b.status || b.queueStatus, {
      message: 'status or queueStatus is required',
    }),
});

export const rescheduleAppointmentSchema = z.object({
  body: z.object({
    appointmentDate: z.string().min(1, 'Date is required'),
    timeSlot: z.string().min(1, 'Time slot is required'),
  }),
});

export const createPrescriptionSchema = z.object({
  body: z.object({
    patientId: objectId,
    medicines: z
      .array(
        z.object({
          medicineName: z.string().min(1).optional(),
          name: z.string().min(1).optional(), // accept alias from clients
          dosage: z.string().min(1),
          frequency: z.string().min(1),
          duration: z.string().min(1),
          route: z.string().optional(),
          instructions: z.string().optional(),
        }).refine((m) => !!(m.medicineName || m.name), {
          message: 'Medicine name is required',
        })
      )
      .min(1, 'At least one medicine is required'),
    instructions: z.string().max(2000).optional(),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
    medicalRecord: objectId.optional(),
  }),
});

export const orderLabSchema = z.object({
  body: z.object({
    patientId: objectId,
    testName: z.string().min(1).max(200),
    testType: z.string().max(100).optional(),
    referenceRange: z.string().max(200).optional(),
    priority: z.enum(['Normal', 'Urgent']).optional(),
    notes: z.string().max(2000).optional(),
    appointmentId: objectId.optional(),
  }),
});

export const labResultSchema = z.object({
  body: z.object({
    resultSummary: z.string().min(1).max(5000),
    referenceRange: z.string().max(200).optional(),
    attachments: z.array(z.any()).optional(),
    resultValue: z.string().max(500).optional(),
    unit: z.string().max(50).optional(),
    flag: z.enum(['normal', 'high', 'low', 'critical', 'unknown']).optional(),
  }),
});

export const createPatientSchema = z.object({
  body: z.object({
    name: z.string().min(2).max(120),
    email: z.string().email(),
    phone: z.string().max(40).optional(),
    gender: z.enum(['male', 'female', 'other', 'prefer_not_to_say']).optional(),
  }),
});
