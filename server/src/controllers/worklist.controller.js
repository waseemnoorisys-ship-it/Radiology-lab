import { ExaminationOrder } from '../models/ExaminationOrder.js';
import { AuditEvent } from '../models/AuditEvent.js';

export async function getWorklist(req, res, next) {
  try {
    const {
      search,
      modality,
      workflowStatus,
      imageAvailability,
      dateRange,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      page = 1,
      limit = 50,
    } = req.query;

    const filter = {};

    // 1. Modality Filter
    if (modality && modality !== 'ALL') {
      filter.modality = modality.toUpperCase();
    }

    // 2. Workflow Status Filter
    if (workflowStatus && workflowStatus !== 'ALL') {
      if (workflowStatus.includes(',')) {
        filter.workflowStatus = { $in: workflowStatus.split(',') };
      } else {
        filter.workflowStatus = workflowStatus;
      }
    }

    // 3. Image Availability Filter
    if (imageAvailability && imageAvailability !== 'ALL') {
      filter.imageAvailability = imageAvailability;
    }

    // 4. Date Range Filter
    if (dateRange && dateRange !== 'all') {
      const now = new Date();
      let start = new Date();
      if (dateRange === 'today') {
        start.setHours(0, 0, 0, 0);
        filter.createdAt = { $gte: start };
      } else if (dateRange === 'yesterday') {
        start.setDate(start.getDate() - 1);
        start.setHours(0, 0, 0, 0);
        const end = new Date(start);
        end.setHours(23, 59, 59, 999);
        filter.createdAt = { $gte: start, $lte: end };
      } else if (dateRange === 'week') {
        start.setDate(start.getDate() - 7);
        filter.createdAt = { $gte: start };
      } else if (dateRange === 'month') {
        start.setMonth(start.getMonth() - 1);
        filter.createdAt = { $gte: start };
      }
    }

    // 5. Text Search (Matches patient MRN, Name, Order ID, Accession #, Procedure, Doctor)
    if (search && typeof search === 'string' && search.trim().length > 0) {
      const regex = new RegExp(search.trim(), 'i');
      filter.$or = [
        { orderId: regex },
        { accessionNumber: regex },
        { patientId: regex },
        { patientName: regex },
        { examinationName: regex },
        { referringDoctor: regex },
      ];
    }

    // 6. Sorting
    const sortField = typeof sortBy === 'string' ? sortBy : 'createdAt';
    const direction = sortOrder === 'asc' ? 1 : -1;
    const sortObj = { [sortField]: direction };

    // 7. Pagination
    const pageNum = Math.max(1, Number(page));
    const limitNum = Math.min(100, Math.max(1, Number(limit)));
    const skipNum = (pageNum - 1) * limitNum;

    // 8. Execute queries: filtered items + overall dashboard metrics
    const [orders, totalMatching, allCounts] = await Promise.all([
      ExaminationOrder.find(filter)
        .sort(sortObj)
        .skip(skipNum)
        .limit(limitNum)
        .populate('patient', 'age gender dateOfBirth contactPhone'),
      ExaminationOrder.countDocuments(filter),
      ExaminationOrder.aggregate([
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            pendingUpload: {
              $sum: { $cond: [{ $eq: ['$workflowStatus', 'PENDING_UPLOAD'] }, 1, 0] },
            },
            pendingReport: {
              $sum: { $cond: [{ $eq: ['$workflowStatus', 'PENDING_REPORT'] }, 1, 0] },
            },
            inProgress: {
              $sum: {
                $cond: [
                  { $in: ['$workflowStatus', ['IN_PROGRESS', 'DRAFT_SAVED']] },
                  1,
                  0,
                ],
              },
            },
            finalized: {
              $sum: { $cond: [{ $eq: ['$workflowStatus', 'FINALIZED'] }, 1, 0] },
            },
            imagesAvailable: {
              $sum: { $cond: [{ $eq: ['$imageAvailability', 'AVAILABLE'] }, 1, 0] },
            },
          },
        },
      ]),
    ]);

    const stats = allCounts[0] || {
      total: 0,
      pendingUpload: 0,
      pendingReport: 0,
      inProgress: 0,
      finalized: 0,
      imagesAvailable: 0,
    };
    delete stats._id;

    res.json({
      success: true,
      stats,
      pagination: {
        total: totalMatching,
        page: pageNum,
        limit: limitNum,
        pages: Math.ceil(totalMatching / limitNum),
      },
      data: orders,
    });
  } catch (error) {
    next(error);
  }
}

export async function getWorklistStats(req, res, next) {
  try {
    const [byStatus, byModality] = await Promise.all([
      ExaminationOrder.aggregate([
        { $group: { _id: '$workflowStatus', count: { $sum: 1 } } },
      ]),
      ExaminationOrder.aggregate([
        { $group: { _id: '$modality', count: { $sum: 1 } } },
      ]),
    ]);

    res.json({
      success: true,
      data: {
        byStatus: byStatus.reduce((acc, curr) => ({ ...acc, [curr._id]: curr.count }), {}),
        byModality: byModality.reduce((acc, curr) => ({ ...acc, [curr._id]: curr.count }), {}),
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function updateStudyWorkflowStatus(req, res, next) {
  try {
    const { id } = req.params;
    const { workflowStatus, actor = 'Radiologist' } = req.body;

    const validStatuses = ['PENDING_UPLOAD', 'PENDING_REPORT', 'IN_PROGRESS', 'DRAFT_SAVED', 'FINALIZED', 'CANCELLED'];
    if (!validStatuses.includes(workflowStatus)) {
      res.status(400).json({
        success: false,
        error: `Invalid workflowStatus '${workflowStatus}'. Must be one of: ${validStatuses.join(', ')}`,
      });
      return;
    }

    const order = await ExaminationOrder.findOne({
      $or: [
        { _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null },
        { orderId: id },
        { accessionNumber: id },
      ],
    });

    if (!order) {
      res.status(404).json({ success: false, error: 'Examination order not found' });
      return;
    }

    const previousStatus = order.workflowStatus;
    order.workflowStatus = workflowStatus;
    await order.save();

    await AuditEvent.create({
      eventType: 'WORKFLOW_STATUS_CHANGED',
      entityType: 'EXAMINATION_ORDER',
      entityId: order.orderId,
      actor,
      details: {
        previousStatus,
        newStatus: workflowStatus,
        accessionNumber: order.accessionNumber,
      },
    });

    res.json({
      success: true,
      message: `Workflow status updated from ${previousStatus} to ${workflowStatus}`,
      data: order,
    });
  } catch (error) {
    next(error);
  }
}
