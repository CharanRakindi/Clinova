import LabReport from '../models/LabReport.js';
import User from '../models/User.js';
import { logAction } from '../utils/auditLogger.js';
import { sendToRole } from '../services/socketService.js';
import { assertClinicalAccess, ensureDoctorPatientLink } from '../utils/careAccess.js';
import { parsePagination } from '../utils/pagination.js';

// @desc    Order a lab test
// @route   POST /api/v1/lab-reports
// @access  Private/Doctor
export const orderLabTest = async (req, res, next) => {
  try {
    const { patientId, testName, testType, referenceRange, priority, notes, appointmentId } = req.body;

    if (!patientId || !testName) {
      return res.status(400).json({ success: false, message: 'Patient ID and test name are required' });
    }

    const denied = await assertClinicalAccess(req.user, patientId);
    if (denied) {
      return res.status(denied.status).json({ success: false, message: denied.message });
    }

    const patientExists = await User.findById(patientId);
    if (!patientExists || patientExists.role !== 'patient') {
      return res.status(404).json({ success: false, message: 'Patient not found' });
    }

    const labReport = await LabReport.create({
      patient: patientId,
      doctor: req.user._id,
      testName,
      testType: testType || 'Diagnostic',
      referenceRange,
      priority: priority || 'Normal',
      notes,
      appointment: appointmentId,
      status: 'ordered',
    });

    await ensureDoctorPatientLink(req.user._id, patientId);

    // Note: do NOT create a synthetic MedicalRecord for lab orders (keeps chart clean).
    // Labs appear under lab-reports; clinical notes remain doctor-authored encounters.

    // Notify assigned Lab Technicians using Socket.io
    sendToRole('lab_technician', 'notification', {
      message: `Dr. ${req.user.name} ordered a new ${priority || 'Normal'} priority test: ${testName} for ${patientExists.name}`,
      timestamp: new Date()
    });

    const populated = await LabReport.findById(labReport._id)
      .populate('patient', 'name email')
      .populate('doctor', 'name email');

    // Audit log
    await logAction(
      req.user._id,
      req.user.role,
      'CREATE',
      'LabReport',
      labReport._id,
      req.ip,
      req.headers['user-agent'],
      { testName, patientName: patientExists.name }
    );

    res.status(201).json({ success: true, data: populated });
  } catch (error) {
    next(error);
  }
};

// @desc    Upload/Complete a lab report result
// @route   PATCH /api/v1/lab-reports/:id/results
// @access  Private/LabTechnician
export const uploadLabResult = async (req, res, next) => {
  try {
    const { resultSummary, referenceRange, attachments } = req.body;
    const labReport = await LabReport.findById(req.params.id);

    if (!labReport) {
      return res.status(404).json({ success: false, message: 'Lab report not found' });
    }

    labReport.resultSummary = resultSummary;
    if (referenceRange) labReport.referenceRange = referenceRange;
    if (attachments) labReport.attachments = attachments;
    labReport.status = 'completed';
    labReport.resultDate = new Date();
    labReport.reviewedBy = req.user._id;

    await labReport.save();

    const populated = await LabReport.findById(labReport._id)
      .populate('patient', 'name email')
      .populate('doctor', 'name email')
      .populate('reviewedBy', 'name email');

    // Audit log
    await logAction(
      req.user._id,
      req.user.role,
      'UPDATE',
      'LabReport',
      labReport._id,
      req.ip,
      req.headers['user-agent'],
      { action: 'COMPLETE_LAB_REPORT', testName: labReport.testName }
    );

    res.status(200).json({ success: true, data: populated });
  } catch (error) {
    next(error);
  }
};

// @desc    Update lab report status
// @route   PATCH /api/v1/lab-reports/:id/status
// @access  Private
export const updateLabReportStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const labReport = await LabReport.findById(req.params.id);

    if (!labReport) {
      return res.status(404).json({ success: false, message: 'Lab report not found' });
    }

    const allowedStatuses = ['ordered', 'sample_collected', 'processing', 'completed', 'reviewed', 'cancelled'];
    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Allowed: ${allowedStatuses.join(', ')}`,
      });
    }

    if (req.user.role === 'doctor' && labReport.doctor?.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }

    const oldStatus = labReport.status;
    labReport.status = status;
    await labReport.save();

    const populated = await LabReport.findById(labReport._id)
      .populate('patient', 'name email')
      .populate('doctor', 'name email');

    await logAction(
      req.user._id,
      req.user.role,
      'UPDATE',
      'LabReport',
      labReport._id,
      req.ip,
      req.headers['user-agent'],
      { action: 'UPDATE_LAB_STATUS', oldStatus, newStatus: status, testName: labReport.testName }
    );

    res.status(200).json({ success: true, data: populated });
  } catch (error) {
    next(error);
  }
};

// @desc    Get lab reports
// @route   GET /api/v1/lab-reports
// @access  Private
export const getLabReports = async (req, res, next) => {
  try {
    const { role, _id } = req.user;
    const { patientId, status } = req.query;
    const { page, limit, skip } = parsePagination(req.query);

    let query = {};

    if (role === 'patient') {
      query.patient = _id;
    } else if (role === 'doctor') {
      query.doctor = _id;
      if (patientId) {
        const denied = await assertClinicalAccess(req.user, patientId);
        if (denied) {
          return res.status(denied.status).json({ success: false, message: denied.message });
        }
        query.patient = patientId;
      }
    } else if (role === 'lab_technician') {
      // Lab board: open queue + recently completed (so "Completed" column works)
      if (patientId) query.patient = patientId;
      if (status) {
        // Support comma-separated statuses: ?status=completed,reviewed
        const parts = String(status)
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean);
        query.status = parts.length > 1 ? { $in: parts } : parts[0] || status;
      } else {
        const recentDays = 30;
        const since = new Date();
        since.setDate(since.getDate() - recentDays);
        query.$or = [
          { status: { $in: ['ordered', 'sample_collected', 'processing'] } },
          {
            status: { $in: ['completed', 'reviewed'] },
            $or: [
              { resultDate: { $gte: since } },
              { updatedAt: { $gte: since } },
            ],
          },
        ];
      }
    } else if (role === 'admin') {
      if (patientId) query.patient = patientId;
      if (status) query.status = status;
    } else {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }

    const [labReports, total] = await Promise.all([
      LabReport.find(query)
        .populate('patient', 'name email')
        .populate('doctor', 'name email')
        .populate('reviewedBy', 'name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      LabReport.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      data: labReports,
      meta: { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit) || 1) },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get lab report by ID
// @route   GET /api/v1/lab-reports/:id
// @access  Private
export const getLabReportById = async (req, res, next) => {
  try {
    const labReport = await LabReport.findById(req.params.id)
      .populate('patient', 'name email')
      .populate('doctor', 'name email')
      .populate('reviewedBy', 'name email');

    if (!labReport) {
      return res.status(404).json({ success: false, message: 'Lab report not found' });
    }

    const role = req.user.role;
    const uid = req.user._id.toString();
    const patientId = labReport.patient?._id?.toString() || labReport.patient?.toString();
    const doctorId = labReport.doctor?._id?.toString() || labReport.doctor?.toString();

    if (role === 'patient' && patientId !== uid) {
      return res.status(403).json({ success: false, message: 'Forbidden: Cannot view this lab report' });
    }
    if (role === 'doctor' && doctorId !== uid) {
      return res.status(403).json({ success: false, message: 'Forbidden: Cannot view this lab report' });
    }
    if (!['patient', 'doctor', 'lab_technician', 'admin'].includes(role)) {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }

    res.status(200).json({ success: true, data: labReport });
  } catch (error) {
    next(error);
  }
};
