import LabReport from '../models/LabReport.js';
import User from '../models/User.js';
import { logAction } from '../utils/auditLogger.js';

// @desc    Order a lab test
// @route   POST /api/v1/lab-reports
// @access  Private/Doctor
export const orderLabTest = async (req, res, next) => {
  try {
    const { patientId, testName, testType, referenceRange } = req.body;

    if (!patientId || !testName) {
      return res.status(400).json({ success: false, message: 'Patient ID and test name are required' });
    }

    const patientExists = await User.findById(patientId);
    if (!patientExists || patientExists.role !== 'patient') {
      return res.status(404).json({ success: false, message: 'Patient not found' });
    }

    const labReport = await LabReport.create({
      patient: patientId,
      doctor: req.user._id,
      testName,
      testType,
      referenceRange,
      status: 'pending',
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
    const { patientId } = req.query;

    let query = {};

    if (role === 'patient') {
      query.patient = _id;
    } else if (patientId) {
      query.patient = patientId;
    }

    const labReports = await LabReport.find(query)
      .populate('patient', 'name email')
      .populate('doctor', 'name email')
      .populate('reviewedBy', 'name email')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, data: labReports });
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

    // Check authorization: Patient can only view their own lab reports
    if (req.user.role === 'patient' && labReport.patient._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Forbidden: Cannot view this lab report' });
    }

    res.status(200).json({ success: true, data: labReport });
  } catch (error) {
    next(error);
  }
};
