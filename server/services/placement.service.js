/**
 * placement.service.js
 *
 * Campus Placement & Internship Management Service for SIH 26044.
 */

const PlacementCycle = require('../models/PlacementCycle');
const PlacementRecord = require('../models/PlacementRecord');
const User = require('../models/User');

async function getPlacementCycles(institutionId) {
  const query = institutionId ? { institutionId } : {};
  return PlacementCycle.find(query).sort({ startDate: -1 }).lean();
}

async function createPlacementCycle(institutionId, data) {
  const cycle = new PlacementCycle({
    institutionId,
    name: data.name,
    academicYear: data.academicYear || '2025-2026',
    startDate: data.startDate || new Date(),
    endDate: data.endDate || new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
    participatingCompanies: data.participatingCompanies || [],
    eligibleDepartments: data.eligibleDepartments || ['Computer Science', 'Information Technology', 'Electronics'],
    minimumCGPA: data.minimumCGPA || 6.5,
    status: data.status || 'ACTIVE',
  });

  await cycle.save();
  return cycle;
}

async function getPlacementRecords(institutionId, query = {}) {
  const filter = {};
  if (institutionId) {
    filter.institutionId = institutionId;
  }
  if (query.status) {
    filter.status = query.status.toUpperCase();
  }
  if (query.type) {
    filter.type = query.type.toUpperCase();
  }

  return PlacementRecord.find(filter)
    .populate('studentId', 'name email collegeName')
    .sort({ createdAt: -1 })
    .lean();
}

async function createPlacementRecord(data) {
  const record = new PlacementRecord({
    studentId: data.studentId,
    studentName: data.studentName || '',
    institutionId: data.institutionId,
    cycleId: data.cycleId || null,
    companyId: data.companyId || null,
    companyName: data.companyName,
    role: data.role,
    type: data.type || 'INTERNSHIP',
    status: data.status || 'APPLIED',
    compensation: data.compensation || 'Competitive',
    offerDate: data.offerDate || null,
    joiningDate: data.joiningDate || null,
  });

  await record.save();
  return record;
}

async function updatePlacementStatus(recordId, status, extra = {}) {
  const update = { status: status.toUpperCase() };
  if (status === 'OFFER' || status === 'PLACED') {
    update.offerDate = extra.offerDate || new Date();
  }
  if (extra.joiningDate) {
    update.joiningDate = extra.joiningDate;
  }

  return PlacementRecord.findByIdAndUpdate(recordId, update, { new: true });
}

module.exports = {
  getPlacementCycles,
  createPlacementCycle,
  getPlacementRecords,
  createPlacementRecord,
  updatePlacementStatus,
};
